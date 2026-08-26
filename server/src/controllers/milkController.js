const MilkEntry = require('../models/MilkEntry');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');

// GET /api/milk/monthly?month=8&year=2026&windowId=xxx
const getMonthlyEntries = asyncHandler(async (req, res) => {
  const { month, year, windowId, customerId } = req.query;
  const sellerId = req.sellerId;

  if (!month || !year) {
    return error(res, 'Month and year are required.', 400);
  }

  const m = parseInt(month);
  const y = parseInt(year);

  // Date range for the month
  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999); // last day of month

  // Build customer filter
  const customerQuery = { sellerId };
  if (windowId) customerQuery.windowId = windowId;
  if (customerId) customerQuery._id = customerId;
  // Active filter — show all for owner, active only for employees
  if (req.role === 'employee' && !req.user?.permissions?.canViewAllCustomers) {
    customerQuery.active = true;
    const Window = require('../models/Window');
    const assignedWindow = await Window.findOne({ sellerId, employeeId: req.user._id });
    if (assignedWindow) customerQuery.windowId = assignedWindow._id;
  }

  const customers = await Customer.find(customerQuery)
    .populate('windowId', 'name')
    .sort({ name: 1 })
    .lean();

  const customerIds = customers.map((c) => c._id);

  // Get all entries for this month
  const entries = await MilkEntry.find({
    sellerId,
    customerId: { $in: customerIds },
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  // Build lookup map: { customerId: { day: entry } }
  const entriesMap = {};
  for (const entry of entries) {
    const cId = entry.customerId.toString();
    const day = new Date(entry.date).getDate();
    if (!entriesMap[cId]) entriesMap[cId] = {};
    entriesMap[cId][day] = entry;
  }

  // Calculate totals per customer
  const result = customers.map((customer) => {
    const cId = customer._id.toString();
    const customerEntries = entriesMap[cId] || {};
    let totalMilk = 0;
    let totalAmount = 0;

    for (const day in customerEntries) {
      const entry = customerEntries[day];
      totalMilk += entry.quantity;
      totalAmount += entry.quantity * entry.rateAtTimeOfEntry;
    }

    return {
      customer,
      entries: customerEntries,
      totalMilk: parseFloat(totalMilk.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  });

  const daysInMonth = new Date(y, m, 0).getDate();

  return success(res, {
    month: m,
    year: y,
    daysInMonth,
    data: result,
  });
});

// POST /api/milk — upsert (create or update)
const upsertMilkEntry = asyncHandler(async (req, res) => {
  const { customerId, date, quantity } = req.body;
  const sellerId = req.sellerId;

  if (!customerId || !date || quantity === undefined || quantity === null) {
    return error(res, 'customerId, date, and quantity are required.', 400);
  }

  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty < 0) {
    return error(res, 'Quantity must be a non-negative number.', 400);
  }

  // Verify customer belongs to this seller
  const customer = await Customer.findOne({ _id: customerId, sellerId });
  if (!customer) {
    return error(res, 'Customer not found.', 404);
  }

  const entryDate = new Date(date);
  entryDate.setUTCHours(0, 0, 0, 0);

  // Find existing entry
  const existing = await MilkEntry.findOne({
    sellerId,
    customerId,
    date: entryDate,
  });

  const rate = customer.milkRate;
  const performedById = req.role === 'customer' ? null : req.user._id;

  if (existing) {
    // Update
    const oldQty = existing.quantity;
    existing.quantity = qty;
    existing.rateAtTimeOfEntry = rate;
    existing.updatedBy = performedById;
    await existing.save();

    if (oldQty !== qty) {
      await AuditLog.create({
        sellerId,
        action: 'MILK_ENTRY_UPDATED',
        customerId,
        milkEntryId: existing._id,
        date: entryDate,
        oldValue: oldQty,
        newValue: qty,
        performedBy: performedById,
        performedByRole: req.role,
      });
    }

    return success(res, { entry: existing }, 'Milk entry updated.');
  } else {
    // Create
    const entry = await MilkEntry.create({
      sellerId,
      customerId,
      date: entryDate,
      quantity: qty,
      rateAtTimeOfEntry: rate,
      enteredBy: performedById,
    });

    await AuditLog.create({
      sellerId,
      action: 'MILK_ENTRY_CREATED',
      customerId,
      milkEntryId: entry._id,
      date: entryDate,
      newValue: qty,
      performedBy: performedById,
      performedByRole: req.role,
    });

    return created(res, { entry }, 'Milk entry created.');
  }
});

// DELETE /api/milk/:id
const deleteMilkEntry = asyncHandler(async (req, res) => {
  const sellerId = req.sellerId;

  const entry = await MilkEntry.findOne({ _id: req.params.id, sellerId });
  if (!entry) {
    return error(res, 'Milk entry not found.', 404);
  }

  await AuditLog.create({
    sellerId,
    action: 'MILK_ENTRY_DELETED',
    customerId: entry.customerId,
    milkEntryId: entry._id,
    date: entry.date,
    oldValue: entry.quantity,
    performedBy: req.user._id,
    performedByRole: req.role,
  });

  await entry.deleteOne();

  return success(res, {}, 'Milk entry deleted.');
});

module.exports = { getMonthlyEntries, upsertMilkEntry, deleteMilkEntry };
