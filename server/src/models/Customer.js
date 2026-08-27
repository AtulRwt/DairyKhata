const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address too long'],
    },
    milkRate: {
      type: Number,
      required: [true, 'Milk rate is required'],
      min: [0, 'Rate cannot be negative'],
    },
    windowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Window',
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes too long'],
    },
  },
  { timestamps: true }
);

// Unique phone per seller
customerSchema.index({ sellerId: 1, phone: 1 }, { unique: true });
customerSchema.index({ sellerId: 1, windowId: 1 });
customerSchema.index({ sellerId: 1, active: 1 });

module.exports = mongoose.model('Customer', customerSchema);
