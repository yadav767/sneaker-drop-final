import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['WAITING', 'DONE' , 'CANCELLED'], 
      default: 'WAITING' 
    },
  },
  { timestamps: true } 
);

queueSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { status: 'WAITING' } });
queueSchema.index({ status: 1, createdAt: 1, _id: 1 });

export default mongoose.model('Queue', queueSchema);