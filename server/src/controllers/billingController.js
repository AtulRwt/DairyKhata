const MilkEntry = require('../models/MilkEntry');
const Customer = require('../models/Customer');
const MonthlyPayment = require('../models/MonthlyPayment');
const SellerSettings = require('../models/SellerSettings');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// GET /api/billing/customer/:customerId?month=8&year=2026
const getCustomerBilling = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const { customerId } = req.params;
  const sellerId = req.sellerId;

  if (!month || !year) {
    return error(res, 'Month and year are required.', 400);
  }

  // For customer role: enforce they can only see their own billing
  if (req.role === 'customer') {
    if (req.customer._id.toString() !== customerId) {
      return error(res, 'Access denied.', 403);
    }
  }

  const m = parseInt(month);
  const y = parseInt(year);

  const customer = await Customer.findOne({ _id: customerId, sellerId }).lean();
  if (!customer) {
    return error(res, 'Customer not found.', 404);
  }

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);

  const entries = await MilkEntry.find({
    sellerId,
    customerId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 }).lean();

  let totalMilk = 0;
  let totalAmount = 0;

  const dailyEntries = entries.map((entry) => {
    totalMilk += entry.quantity;
    totalAmount += entry.quantity * entry.rateAtTimeOfEntry;
    return {
      date: entry.date,
      day: new Date(entry.date).getDate(),
      quantity: entry.quantity,
      rate: entry.rateAtTimeOfEntry,
      amount: parseFloat((entry.quantity * entry.rateAtTimeOfEntry).toFixed(2)),
    };
  });

  totalMilk = parseFloat(totalMilk.toFixed(2));
  totalAmount = parseFloat(totalAmount.toFixed(2));

  // Get payment status
  const payment = await MonthlyPayment.findOne({ sellerId, customerId, month: m, year: y }).lean();

  // Get seller settings for UPI
  const settings = await SellerSettings.findOne({ sellerId }).lean();

  // Generate UPI link
  let upiLink = null;
  if (settings?.upiId && totalAmount > 0) {
    const upiAmount = totalAmount.toFixed(2);
    const businessName = encodeURIComponent(settings.businessName || 'DairyKhata');
    upiLink = `upi://pay?pa=${settings.upiId}&pn=${businessName}&am=${upiAmount}&cu=INR`;
  }

  return success(res, {
    customer: {
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
    },
    month: m,
    year: y,
    daysInMonth: new Date(y, m, 0).getDate(),
    dailyEntries,
    totalMilk,
    totalAmount,
    currentRate: customer.milkRate,
    payment: payment || {
      status: 'UNPAID',
      amountPaid: 0,
    },
    upiLink,
    businessName: settings?.businessName || 'DairyKhata',
  });
});

// GET /api/billing/monthly?month=8&year=2026
const getMonthlyBilling = asyncHandler(async (req, res) => {
  const { month, year, windowId } = req.query;
  const sellerId = req.sellerId;

  if (!month || !year) {
    return error(res, 'Month and year are required.', 400);
  }

  const m = parseInt(month);
  const y = parseInt(year);

  const customerQuery = { sellerId, active: true };
  if (windowId) customerQuery.windowId = windowId;

  const customers = await Customer.find(customerQuery)
    .populate('windowId', 'name')
    .lean();

  const customerIds = customers.map((c) => c._id);

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);

  const [entries, payments] = await Promise.all([
    MilkEntry.find({
      sellerId,
      customerId: { $in: customerIds },
      date: { $gte: startDate, $lte: endDate },
    }).lean(),
    MonthlyPayment.find({
      sellerId,
      customerId: { $in: customerIds },
      month: m,
      year: y,
    }).lean(),
  ]);

  // Build maps
  const entryMap = {};
  for (const e of entries) {
    const cId = e.customerId.toString();
    if (!entryMap[cId]) entryMap[cId] = { milk: 0, amount: 0 };
    entryMap[cId].milk += e.quantity;
    entryMap[cId].amount += e.quantity * e.rateAtTimeOfEntry;
  }

  const paymentMap = {};
  for (const p of payments) {
    paymentMap[p.customerId.toString()] = p;
  }

  const billing = customers.map((c) => {
    const cId = c._id.toString();
    const stats = entryMap[cId] || { milk: 0, amount: 0 };
    const payment = paymentMap[cId];
    return {
      customer: { _id: c._id, name: c.name, phone: c.phone, window: c.windowId },
      totalMilk: parseFloat(stats.milk.toFixed(2)),
      totalAmount: parseFloat(stats.amount.toFixed(2)),
      paymentStatus: payment?.status || 'UNPAID',
      amountPaid: payment?.amountPaid || 0,
    };
  });

  const totals = billing.reduce(
    (acc, b) => {
      acc.totalMilk += b.totalMilk;
      acc.totalAmount += b.totalAmount;
      acc.totalPaid += b.amountPaid;
      if (b.paymentStatus === 'UNPAID') acc.unpaidCount++;
      else if (b.paymentStatus === 'PAID') acc.paidCount++;
      return acc;
    },
    { totalMilk: 0, totalAmount: 0, totalPaid: 0, unpaidCount: 0, paidCount: 0 }
  );

  return success(res, {
    month: m,
    year: y,
    billing,
    totals: {
      totalMilk: parseFloat(totals.totalMilk.toFixed(2)),
      totalAmount: parseFloat(totals.totalAmount.toFixed(2)),
      totalPaid: parseFloat(totals.totalPaid.toFixed(2)),
      pending: parseFloat((totals.totalAmount - totals.totalPaid).toFixed(2)),
      unpaidCount: totals.unpaidCount,
      paidCount: totals.paidCount,
    },
  });
});

module.exports = { getCustomerBilling, getMonthlyBilling };
