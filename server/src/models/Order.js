import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    sneakerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'EXPIRED'],
      default: 'PENDING'
    },
    paymentId: {
      type: String
    },
    expiresAt: {
      type: Date, required: true
    },
    paidAt: {
      type: Date
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { status: 'PENDING' } });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model('Order', orderSchema);
