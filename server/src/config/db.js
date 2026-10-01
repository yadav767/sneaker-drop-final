import mongoose from 'mongoose';

export default async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sneaker_drop');
  console.log('MongoDB connected');
}
