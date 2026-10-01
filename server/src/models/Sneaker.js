import mongoose from 'mongoose';

const sneakerSchema = new mongoose.Schema(
  {
    number: { 
      type: Number, 
      required: true, 
      unique: true 
    },

    status: { 
      type: String, 
      enum: ['AVAILABLE', 'HELD', 'SOLD'], 
      default: 'AVAILABLE' 
    },
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      default: null 
    },

    reservationExpiresAt: { 
      type: Date, default: null 
    },
  },
  { timestamps: true }
);

sneakerSchema.index({ status: 1 });

export default mongoose.model('Sneaker', sneakerSchema);
