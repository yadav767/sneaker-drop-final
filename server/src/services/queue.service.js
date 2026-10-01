import Queue from "../models/Queue.js";

// Add a user to the waiting line
export async function joinQueue(userId) {
  try {
    await Queue.create({ userId });
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error("You are already in the waiting line");
      err.status = 409;
      throw err;
    }

    throw error;
  }
}

// Process the queue: check if the first person in line can get a pair
export async function getQueuePosition(userId) {
  const entry = await Queue.findOne({
    userId,
    status: "WAITING"
  });

  if (!entry) return null;

  const ahead = await Queue.countDocuments({
    status: "WAITING",
    createdAt: { $lt: entry.createdAt }
  });

  return ahead + 1;
}

// Count the number of people in the waiting line
export const countWaiting = () => {
  return Queue.countDocuments({ status: "WAITING" });
};

// The sale is over: nobody in the line can ever get a pair, so close the line.
export const closeQueue = () => Queue.updateMany({ status: 'WAITING' }, { status: 'CANCELLED' });