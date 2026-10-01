import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import Sneaker from "./src/models/Sneaker.js";
import User from "./src/models/User.js";
import Order from "./src/models/Order.js";
import Queue from "./src/models/Queue.js";
import startReservationExpiryJob from "./src/jobs/reservationExpiry.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  await Promise.all([User, Sneaker, Order, Queue].map((model) => model.init()));

  // Make sure 20 sneakers exist
  for (let number = 1; number <= 20; number++) {
    await Sneaker.updateOne(
      { number },
      { $setOnInsert: { number } },
      { upsert: true }
    );
  }

  // Start reservation expiry checker
  startReservationExpiryJob();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});