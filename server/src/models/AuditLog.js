const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'MILK_ENTRY_CREATED',
        'MILK_ENTRY_UPDATED',
        'MILK_ENTRY_DELETED',
        'CUSTOMER_CREATED',
        'CUSTOMER_UPDATED',
        'CUSTOMER_DEACTIVATED',
        'PAYMENT_STATUS_UPDATED',
        'SETTINGS_UPDATED',
        'EMPLOYEE_CREATED',
        'EMPLOYEE_UPDATED',
        'EMPLOYEE_REMOVED',
      ],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    milkEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MilkEntry',
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByRole: {
      type: String,
      enum: ['owner', 'employee'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ sellerId: 1, createdAt: -1 });
auditLogSchema.index({ sellerId: 1, customerId: 1, createdAt: -1 });
auditLogSchema.index({ sellerId: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
