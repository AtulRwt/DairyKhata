const Customer = require('../models/Customer');
const SellerSettings = require('../models/SellerSettings');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');

// GET /api/customers
const getCustomers = asyncHandler(async (req, res) => {
  const { search, windowId, active, page = 1, limit = 200 } = req.query;
  const sellerId = req.sellerId;

  const query = { sellerId };

  if (active !== undefined) {
    query.active = active === 'true';
  }

  if (windowId) {
    query.windowId = windowId === 'unassigned' ? null : windowId;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [{ name: searchRegex }, { phone: searchRegex }];
  }

  // For employees, only show assigned window's customers
  if (req.role === 'employee' && !req.user.permissions?.canViewAllCustomers) {
    // Find the window assigned to this employee
    const Window = require('../models/Window');
    const assignedWindow = await Window.findOne({
      sellerId,
      employeeId: req.user._id,
    });
    if (assignedWindow) {
      query.windowId = assignedWindow._id;
    } else {
      return success(res, { customers: [], total: 0 });
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [customers, total] = await Promise.all([
    Customer.find(query)
      .populate('windowId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Customer.countDocuments(query),
  ]);

  return success(res, { customers, total, page: parseInt(page), limit: parseInt(limit) });
});

// POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, address, milkRate, windowId, notes } = req.body;
  const sellerId = req.sellerId;

  if (!name || !phone) {
    return error(res, 'Name and phone number are required.', 400);
  }

  // Get default rate if not provided
  let rate = milkRate;
  if (rate === undefined || rate === null || rate === '') {
    const settings = await SellerSettings.findOne({ sellerId });
    rate = settings?.defaultMilkRate || 60;
  }

  const customer = await Customer.create({
    sellerId,
    name,
    phone: phone.trim(),
    address: address || '',
    milkRate: parseFloat(rate),
    windowId: windowId || null,
    notes: notes || '',
  });

  await AuditLog.create({
    sellerId,
    action: 'CUSTOMER_CREATED',
    customerId: customer._id,
    newValue: { name, phone },
    performedBy: req.user._id,
    performedByRole: req.role,
  });

  return created(res, { customer }, 'Customer created successfully.');
});

// GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    sellerId: req.sellerId,
  }).populate('windowId', 'name');

  if (!customer) {
    return error(res, 'Customer not found.', 404);
  }

  return success(res, { customer });
});

// PUT /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const { name, phone, address, milkRate, windowId, notes } = req.body;
  const sellerId = req.sellerId;

  const customer = await Customer.findOne({ _id: req.params.id, sellerId });
  if (!customer) {
    return error(res, 'Customer not found.', 404);
  }

  const oldData = { name: customer.name, phone: customer.phone, milkRate: customer.milkRate };

  if (name) customer.name = name;
  if (phone) customer.phone = phone.trim();
  if (address !== undefined) customer.address = address;
  if (milkRate !== undefined) customer.milkRate = parseFloat(milkRate);
  if (windowId !== undefined) customer.windowId = windowId || null;
  if (notes !== undefined) customer.notes = notes;

  await customer.save();

  await AuditLog.create({
    sellerId,
    action: 'CUSTOMER_UPDATED',
    customerId: customer._id,
    oldValue: oldData,
    newValue: { name: customer.name, phone: customer.phone, milkRate: customer.milkRate },
    performedBy: req.user._id,
    performedByRole: req.role,
  });

  return success(res, { customer }, 'Customer updated successfully.');
});

// PATCH /api/customers/:id/status
const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { active } = req.body;
  const sellerId = req.sellerId;

  const customer = await Customer.findOne({ _id: req.params.id, sellerId });
  if (!customer) {
    return error(res, 'Customer not found.', 404);
  }

  customer.active = Boolean(active);
  await customer.save();

  await AuditLog.create({
    sellerId,
    action: 'CUSTOMER_DEACTIVATED',
    customerId: customer._id,
    newValue: { active: customer.active },
    performedBy: req.user._id,
    performedByRole: req.role,
  });

  return success(res, { customer }, `Customer ${customer.active ? 'activated' : 'deactivated'} successfully.`);
});

// DELETE /api/customers/:id (soft delete via deactivate)
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, sellerId: req.sellerId });
  if (!customer) {
    return error(res, 'Customer not found.', 404);
  }
  customer.active = false;
  await customer.save();
  return success(res, {}, 'Customer deactivated.');
});

module.exports = {
  getCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
};
