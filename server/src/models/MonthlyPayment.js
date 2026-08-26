const mongoose = require('mongoose');

const monthlyPaymentSchema = new mongoose.Schema(
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
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    totalMilk: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
      default: 'UNPAID',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes too long'],
    },
  },
  { timestamps: true }
);

// One payment record per customer per month per seller
monthlyPaymentSchema.index(
  { sellerId: 1, customerId: 1, month: 1, year: 1 },
  { unique: true }
);
monthlyPaymentSchema.index({ sellerId: 1, month: 1, year: 1 });
monthlyPaymentSchema.index({ sellerId: 1, status: 1 });

module.exports = mongoose.model('MonthlyPayment', monthlyPaymentSchema);
