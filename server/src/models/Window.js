const mongoose = require('mongoose');

const windowSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Window name is required'],
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description too long'],
    },
  },
  { timestamps: true }
);

windowSchema.index({ sellerId: 1 });
windowSchema.index({ sellerId: 1, active: 1 });

module.exports = mongoose.model('Window', windowSchema);
