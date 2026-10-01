import Order from "../models/Order.js";
import Sneaker from "../models/Sneaker.js";

export async function processPayment(orderId, paymentId) {
  const now = new Date();

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: "PENDING",
      expiresAt: { $gt: now }
    },
    {
      status: "PAID",
      paidAt: now,
      paymentId: paymentId || `pay_${orderId}`
    },
    { new: true }
  );

  if (order) {
    await Sneaker.updateOne(
      { _id: order.sneakerId },
      { status: "SOLD" }
    );

    return {
      outcome: "PAID",
      message: "Payment successful"
    };
  }

  const currentOrder = await Order.findById(orderId);

  if (!currentOrder) {
    return {
      outcome: "NOT_FOUND",
      message: "Order not found"
    };
  }

  if (currentOrder.status === "PAID") {
    return {
      outcome: "DUPLICATE_IGNORED",
      message: "Payment already processed"
    };
  }

  return {
    outcome: "LATE_REJECTED",
    message: "Payment arrived after the hold expired"
  };
  
}