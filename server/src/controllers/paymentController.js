const MonthlyPayment = require('../models/MonthlyPayment');
const Customer = require('../models/Customer');
const MilkEntry = require('../models/MilkEntry');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');

// GET /api/payments?month=8&year=2026
const getPayments = asyncHandler(async (req, res) => {
  const { month, year, status } = req.query;
  const sellerId = req.sellerId;

  const query = { sellerId };
  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);
  if (status) query.status = status;

  const payments = await MonthlyPayment.find(query)
    .populate('customerId', 'name phone windowId')
    .sort({ createdAt: -1 })
    .lean();

  return success(res, { payments });
});

// POST /api/payments — create or find payment record
const createPayment = asyncHandler(async (req, res) => {
  const { customerId, month, year } = req.body;
  const sellerId = req.sellerId;

  const customer = await Customer.findOne({ _id: customerId, sellerId });
  if (!customer) {
    return error(res, 'Customer not found.', 404);
  }

  const m = parseInt(month);
  const y = parseInt(year);

  // Calculate totals from milk entries
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);

  const entries = await MilkEntry.find({
    sellerId,
    customerId,
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  let totalMilk = 0;
  let totalAmount = 0;
  for (const e of entries) {
    totalMilk += e.quantity;
    totalAmount += e.quantity * e.rateAtTimeOfEntry;
  }

  const payment = await MonthlyPayment.findOneAndUpdate(
    { sellerId, customerId, month: m, year: y },
    {
      totalMilk: parseFloat(totalMilk.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    },
    { upsert: true, new: true }
  );

  return created(res, { payment }, 'Payment record created/updated.');
});

// PATCH /api/payments/:id/status
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status, amountPaid, paymentReference, notes } = req.body;
  const sellerId = req.sellerId;

  const payment = await MonthlyPayment.findOne({ _id: req.params.id, sellerId });
  if (!payment) {
    return error(res, 'Payment not found.', 404);
  }

  if (status) payment.status = status;
  if (amountPaid !== undefined) payment.amountPaid = parseFloat(amountPaid);
  if (paymentReference !== undefined) payment.paymentReference = paymentReference;
  if (notes !== undefined) payment.notes = notes;
  if (status === 'PAID' && !payment.paidAt) payment.paidAt = new Date();

  await payment.save();

  return success(res, { payment }, 'Payment status updated.');
});

module.exports = { getPayments, createPayment, updatePaymentStatus };
