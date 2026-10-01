import Order from '../models/Order.js';

export async function getOrder(req, res) {

  const order = await Order.findById(req.params.orderId);

  if (!order) return res.status(404).json({
    message: 'Order not found'
  });

  return res.status(200).json({
    message: `Order is ${order.status}`, order
  });

}
