const SellerSettings = require('../models/SellerSettings');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const AuditLog = require('../models/AuditLog');

// GET /api/settings
const getSettings = asyncHandler(async (req, res) => {
  const sellerId = req.sellerId;
  let settings = await SellerSettings.findOne({ sellerId }).lean();

  if (!settings) {
    settings = await SellerSettings.create({ sellerId });
  }

  return success(res, { settings });
});

// PUT /api/settings
const updateSettings = asyncHandler(async (req, res) => {
  const { businessName, upiId, defaultMilkRate, currency, timezone } = req.body;
  const sellerId = req.sellerId;

  const settings = await SellerSettings.findOneAndUpdate(
    { sellerId },
    {
      ...(businessName !== undefined && { businessName }),
      ...(upiId !== undefined && { upiId }),
      ...(defaultMilkRate !== undefined && { defaultMilkRate: parseFloat(defaultMilkRate) }),
      ...(currency !== undefined && { currency }),
      ...(timezone !== undefined && { timezone }),
    },
    { new: true, upsert: true }
  );

  await AuditLog.create({
    sellerId,
    action: 'SETTINGS_UPDATED',
    performedBy: req.user._id,
    performedByRole: req.role,
  });

  return success(res, { settings }, 'Settings updated successfully.');
});

module.exports = { getSettings, updateSettings };
