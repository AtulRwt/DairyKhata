const mongoose = require('mongoose');

const milkEntrySchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    rateAtTimeOfEntry: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Critical: one entry per customer per date per seller
milkEntrySchema.index(
  { sellerId: 1, customerId: 1, date: 1 },
  { unique: true }
);
milkEntrySchema.index({ sellerId: 1, date: 1 });
milkEntrySchema.index({ customerId: 1, date: 1 });

module.exports = mongoose.model('MilkEntry', milkEntrySchema);
