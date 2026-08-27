const mongoose = require('mongoose');

const sellerSettingsSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: 'My Dairy',
      maxlength: [100, 'Business name too long'],
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
    },
    defaultMilkRate: {
      type: Number,
      default: 60,
      min: [0, 'Rate cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SellerSettings', sellerSettingsSchema);
