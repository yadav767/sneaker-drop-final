import mongoose from "mongoose";
import Sneaker from "../models/Sneaker.js";
import Order from "../models/Order.js";
import Queue from "../models/Queue.js";
import { joinQueue, getQueuePosition, countWaiting, closeQueue } from './queue.service.js';

const MAX_PURCHASES = 2;

// Get the hold time in milliseconds
function getHoldTime() {
  return (Number(process.env.HOLD_SECONDS) || 300) * 1000;
}

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// A pair that is AVAILABLE or HELD can still be bought. SOLD pairs never come back.
const pairsStillInPlay = () => Sneaker.countDocuments({ status: { $in: ['AVAILABLE', 'HELD'] } });

// Release a sneaker back to available
async function releaseSneaker(sneakerId, orderId) {
  return Sneaker.updateOne(
    {
      _id: sneakerId,
      orderId,
      status: "HELD",
    },
    {
      status: "AVAILABLE",
      orderId: null,
      reservationExpiresAt: null,
    }
  );
}


// Give available sneakers to people in the 
export async function processQueue() {

  while (true) {
    const orderId = new mongoose.Types.ObjectId();
    const expiresAt = new Date(Date.now() + getHoldTime());

    const sneaker = await Sneaker.findOneAndUpdate(
      { status: "AVAILABLE" },
      { status: "HELD", orderId, reservationExpiresAt: expiresAt },
      { new: true }
    );
    if (!sneaker) return;

    const entry = await Queue.findOneAndUpdate(
      { status: "WAITING" },
      { status: "DONE" },
      { sort: { createdAt: 1, _id: 1 } }
    );
    if (!entry) {
      await releaseSneaker(sneaker._id, orderId);
      if (await Queue.exists({ status: "WAITING" })) continue;
      return;
    }

    try {
      await Order.create({ _id: orderId, userId: entry.userId, sneakerId: sneaker._id, expiresAt });
    } catch (error) {
      await releaseSneaker(sneaker._id, orderId);
      if (error.code === 11000) continue;
      throw error;
    }
  }
}


// User clicks Buy
export async function buySneaker(userId) {

  const purchased = await Order.countDocuments({
    userId,
    status: "PAID",
  });

  if (purchased >= MAX_PURCHASES) {
    throw fail(409, "You have already bought the maximum of 2 pairs");
  }

  const pending = await Order.exists({
    userId,
    status: "PENDING",
  });

  if (pending) {
    throw fail(409, "You already have a pair on hold");
  }

  if ((await pairsStillInPlay()) === 0) {
    throw fail(409, 'All sneakers are sold out. Please wait for the next sale.');
  }

  await joinQueue(userId);
  await processQueue();
}


// Release expired reservations
export async function sweepReservations() {

  const now = new Date();

  const expiredOrders = await Order.find({
    status: "PENDING",
    expiresAt: { $lte: now },
  });

  for (const order of expiredOrders) {

    const expired = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "PENDING",
        expiresAt: { $lte: now },
      },
      {
        status: "EXPIRED",
      }
    );

    if (expired) {
      await releaseSneaker(order.sneakerId, order._id);
    }

  }

  if ((await pairsStillInPlay()) === 0) await closeQueue();

  await processQueue();
}


// Sale summary
export async function getSaleSummary() {

  const [available, held, sold, waiting] = await Promise.all([
    Sneaker.countDocuments({ status: "AVAILABLE" }),
    Sneaker.countDocuments({ status: "HELD" }),
    Sneaker.countDocuments({ status: "SOLD" }),
    countWaiting(),
  ]);

  return {
    total: available + held + sold,
    available,
    held,
    sold,
    waiting,
  };
}


// User's current status
export async function getUserStatus(userId) {

  const [purchased, pending, queuePosition] = await Promise.all([
    Order.countDocuments({
      userId,
      status: "PAID",
    }),

    Order.findOne({
      userId,
      status: "PENDING",
    }),

    getQueuePosition(userId),
  ]);

  let reservation = null;

  if (pending) {

    const sneaker = await Sneaker.findById(pending.sneakerId);

    reservation = {
      orderId: pending._id,
      sneakerNumber: sneaker?.number || null,
      expiresAt: pending.expiresAt,
      secondsLeft: Math.max(
        0,
        Math.ceil((pending.expiresAt - Date.now()) / 1000)
      ),
    };
  }

  return {
    purchased,
    maxPurchases: MAX_PURCHASES,
    reservation,
    queuePosition,
  };

}