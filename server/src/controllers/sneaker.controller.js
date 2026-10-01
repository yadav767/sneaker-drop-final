import User from '../models/User.js';
import { buySneaker, getSaleSummary, getUserStatus } from '../services/reservation.service.js';


export async function createUser(req, res) {

  const { name, email } = req.body;

  if (!name || !email) return res.status(400).json({ 
    message: 'name and email are required' 
  });

  let user = await User.findOne({
    email: email.toLowerCase()
  });

  if (!user) {
    user = await User.create({
      name,
      email: email.toLowerCase()
    });
  }

  return res.status(201).json({ message: 'User ready', user });

}

export async function getSale(req, res) {

  const sale = await getSaleSummary();

  return res.status(200).json({
    message: `${sale.available} of ${sale.total} pairs left`, ...sale
  });

}

export async function buy(req, res) {

  const { userId } = req.body;

  if (!userId) return res.status(400).json({
    message: 'userId is required'
  });

  const user = await User.findOne({ _id: userId });

  if (!user) return res.status(404).json({
    message: 'User not found'
  });

  await buySneaker(userId);

  const status = await getUserStatus(userId);

  if (status.reservation) {
    return res.status(201).json({
      message: `Sneaker #${status.reservation.sneakerNumber} is reserved for you. Pay within ${status.reservation.secondsLeft} seconds.`,
      result: 'reserved',
      ...status,
    });

  }

  if (status.queuePosition) {
    return res.status(202).json({
      message: `Sold out. You joined the waiting line at position #${status.queuePosition}.`,
      result: 'queued',
      ...status,
    });
  }

  return res.status(409).json({
    message: 'Could not reserve a pair. Please try again.'
  });

}

export async function getStatus(req, res) {

  const status = await getUserStatus(req.params.userId);

  return res.status(200).json({ 
    message: 'Status loaded', ...status 
  });
}
