const User = require('../models/User');
const Customer = require('../models/Customer');
const SellerSettings = require('../models/SellerSettings');
const {
  generateOwnerToken,
  generateEmployeeToken,
  generateCustomerToken,
} = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');

// POST /api/auth/owner/register
const registerOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, password, businessName } = req.body;

  if (!name || !password) {
    return error(res, 'Name and password are required.', 400);
  }
  if (!email && !phone) {
    return error(res, 'Email or phone number is required.', 400);
  }

  // Check if email/phone already exists
  const existingQuery = [];
  if (email) existingQuery.push({ email });
  if (phone) existingQuery.push({ phone, role: 'owner' });

  const existing = await User.findOne({ $or: existingQuery });
  if (existing) {
    return error(res, 'An account with this email or phone already exists.', 400);
  }

  const owner = await User.create({
    name,
    email: email || undefined,
    phone: phone || undefined,
    passwordHash: password,
    role: 'owner',
    sellerId: null, // owners don't have a seller parent
  });

  // Create default settings for this seller
  await SellerSettings.create({
    sellerId: owner._id,
    businessName: businessName || `${name}'s Dairy`,
    defaultMilkRate: 60,
  });

  const token = generateOwnerToken(owner);

  return created(res, {
    token,
    user: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role,
    },
  }, 'Owner account created successfully.');
});

// POST /api/auth/owner/login
const loginOwner = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if (!password) {
    return error(res, 'Password is required.', 400);
  }
  if (!email && !phone) {
    return error(res, 'Email or phone is required.', 400);
  }

  const query = email ? { email, role: 'owner' } : { phone, role: 'owner' };
  const owner = await User.findOne(query).select('+passwordHash');

  if (!owner) {
    return error(res, 'Invalid credentials.', 401);
  }

  if (!owner.active) {
    return error(res, 'Account is deactivated. Please contact support.', 401);
  }

  const isMatch = await owner.comparePassword(password);
  if (!isMatch) {
    return error(res, 'Invalid credentials.', 401);
  }

  const token = generateOwnerToken(owner);

  return success(res, {
    token,
    user: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role,
    },
  }, 'Login successful.');
});

// POST /api/auth/employee/login
const loginEmployee = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return error(res, 'Phone and password are required.', 400);
  }

  const employee = await User.findOne({ phone, role: 'employee' }).select('+passwordHash');

  if (!employee || !employee.active) {
    return error(res, 'Invalid credentials or account deactivated.', 401);
  }

  const isMatch = await employee.comparePassword(password);
  if (!isMatch) {
    return error(res, 'Invalid credentials.', 401);
  }

  const token = generateEmployeeToken(employee);

  return success(res, {
    token,
    user: {
      _id: employee._id,
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
      sellerId: employee.sellerId,
      permissions: employee.permissions,
    },
  }, 'Login successful.');
});

// POST /api/auth/customer/login
const loginCustomer = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return error(res, 'Phone number is required.', 400);
  }

  // Find any active customer with this phone
  const customer = await Customer.findOne({
    phone: phone.trim(),
    active: true,
  });

  if (!customer) {
    return error(
      res,
      'This number is not registered. Please contact your milk seller.',
      404
    );
  }

  const token = generateCustomerToken(customer, customer.sellerId);

  return success(res, {
    token,
    customer: {
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      sellerId: customer.sellerId,
    },
  }, 'Login successful.');
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  if (req.role === 'customer') {
    return success(res, { customer: req.customer, role: 'customer' });
  }
  return success(res, { user: req.user, role: req.role });
});

module.exports = {
  registerOwner,
  loginOwner,
  loginEmployee,
  loginCustomer,
  getMe,
};
