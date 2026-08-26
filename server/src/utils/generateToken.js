const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateOwnerToken = (user) => {
  return generateToken({
    userId: user._id.toString(),
    role: user.role,
    sellerId: user._id.toString(), // owner's sellerId is their own _id
  });
};

const generateEmployeeToken = (user) => {
  return generateToken({
    userId: user._id.toString(),
    role: 'employee',
    sellerId: user.sellerId.toString(),
  });
};

const generateCustomerToken = (customer, sellerId) => {
  return generateToken({
    customerId: customer._id.toString(),
    role: 'customer',
    sellerId: sellerId.toString(),
  });
};

module.exports = {
  generateToken,
  generateOwnerToken,
  generateEmployeeToken,
  generateCustomerToken,
};
