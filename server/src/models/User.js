const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
    },
    role: {
      type: String,
      enum: ['owner', 'employee'],
      required: true,
    },
    // For employees: which owner they belong to
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for owners (they ARE the seller)
    },
    active: {
      type: Boolean,
      default: true,
    },
    permissions: {
      canEditMilk: { type: Boolean, default: true },
      canDeleteMilk: { type: Boolean, default: false },
      canViewAllCustomers: { type: Boolean, default: false },
      canChangeRate: { type: Boolean, default: false },
      canManageBilling: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1, sellerId: 1 }, { sparse: true });
userSchema.index({ sellerId: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
