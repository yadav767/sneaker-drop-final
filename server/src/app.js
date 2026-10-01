import "dotenv/config";
import express from "express";

import sneakerRoutes from "./routes/sneaker.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

app.use(express.json());

app.use("/api/sneakers", sneakerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate request",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid id",
    });
  }

  if (!err.status) console.error(err);

  return res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

export default app;