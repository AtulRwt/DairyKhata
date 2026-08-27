const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');

// GET /api/employees
const getEmployees = asyncHandler(async (req, res) => {
  const sellerId = req.sellerId;
  const employees = await User.find({ sellerId, role: 'employee' })
    .sort({ name: 1 })
    .lean();
  return success(res, { employees });
});

// POST /api/employees
const createEmployee = asyncHandler(async (req, res) => {
  const { name, phone, password, permissions } = req.body;
  const sellerId = req.sellerId;

  if (!name || !phone || !password) {
    return error(res, 'Name, phone, and password are required.', 400);
  }

  // Check uniqueness within this seller
  const existing = await User.findOne({ phone, sellerId, role: 'employee' });
  if (existing) {
    return error(res, 'An employee with this phone number already exists.', 400);
  }

  const employee = await User.create({
    name,
    phone,
    passwordHash: password,
    role: 'employee',
    sellerId,
    permissions: permissions || {},
    active: true,
  });

  await AuditLog.create({
    sellerId,
    action: 'EMPLOYEE_CREATED',
    newValue: { name, phone },
    performedBy: req.user._id,
    performedByRole: req.role,
  });

  return created(res, { employee }, 'Employee created successfully.');
});

// PUT /api/employees/:id
const updateEmployee = asyncHandler(async (req, res) => {
  const { name, phone, password, permissions, active } = req.body;
  const sellerId = req.sellerId;

  const employee = await User.findOne({ _id: req.params.id, sellerId, role: 'employee' });
  if (!employee) {
    return error(res, 'Employee not found.', 404);
  }

  if (name) employee.name = name;
  if (phone) employee.phone = phone;
  if (password) employee.passwordHash = password;
  if (permissions) employee.permissions = { ...employee.permissions, ...permissions };
  if (active !== undefined) employee.active = Boolean(active);

  await employee.save();

  return success(res, { employee }, 'Employee updated successfully.');
});

// DELETE /api/employees/:id
const deleteEmployee = asyncHandler(async (req, res) => {
  const sellerId = req.sellerId;

  const employee = await User.findOne({ _id: req.params.id, sellerId, role: 'employee' });
  if (!employee) {
    return error(res, 'Employee not found.', 404);
  }

  await AuditLog.create({
    sellerId,
    action: 'EMPLOYEE_REMOVED',
    oldValue: { name: employee.name, phone: employee.phone },
    performedBy: req.user._id,
    performedByRole: req.role,
  });

  await employee.deleteOne();

  return success(res, {}, 'Employee removed.');
});

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
