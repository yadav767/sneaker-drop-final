import { processPayment } from "../services/payment.service.js";

export async function simulatePayment(req, res) {
  const { orderId, paymentId, delaySeconds = 0, twice = false } = req.body;

  if (!orderId) {
    return res.status(400).json({
      message: "orderId is required"
    });
  }

  const copies = twice ? 2 : 1;

  if (!delaySeconds && !twice) {
    const result = await processPayment(orderId, paymentId);

    return res.status(
      result.outcome === "LATE_REJECTED" ? 409 : 200
    ).json(result);
  }

  for (let i = 0; i < copies; i++) {
    setTimeout(async () => {
      try {
        const result = await processPayment(orderId, paymentId);
        console.log("Payment result:", result.outcome);
      } catch (error) {
        console.log("Payment error:", error.message);
      }
    }, delaySeconds * 1000 + i * 500);
  }

  return res.status(202).json({
    message: `Payment scheduled ${copies} time(s)`
  });
}