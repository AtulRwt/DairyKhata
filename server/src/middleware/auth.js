const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

// Protect routes — verifies JWT and attaches user/customer to req
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tokenData = decoded;

    if (decoded.role === 'customer') {
      // Customer auth
      const customer = await Customer.findById(decoded.customerId).lean();
      if (!customer || !customer.active) {
        return res.status(401).json({
          success: false,
          message: 'Customer account not found or deactivated.',
        });
      }
      req.customer = customer;
      req.sellerId = decoded.sellerId;
      req.role = 'customer';
    } else {
      // Owner or Employee auth
      const user = await User.findById(decoded.userId).lean();
      if (!user || !user.active) {
        return res.status(401).json({
          success: false,
          message: 'User account not found or deactivated.',
        });
      }
      req.user = user;
      req.role = user.role;
      // sellerId: owners have their own _id as sellerId, employees have sellerId field
      req.sellerId =
        user.role === 'owner'
          ? user._id.toString()
          : user.sellerId.toString();
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// Owner only
const ownerOnly = authorize('owner');

// Owner or employee
const staffOnly = authorize('owner', 'employee');

module.exports = { protect, authorize, ownerOnly, staffOnly };
