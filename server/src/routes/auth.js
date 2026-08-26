const express = require('express');
const router = express.Router();
const {
  registerOwner,
  loginOwner,
  loginEmployee,
  loginCustomer,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/owner/register', registerOwner);
router.post('/owner/login', loginLimiter, loginOwner);
router.post('/employee/login', loginLimiter, loginEmployee);
router.post('/customer/login', loginLimiter, loginCustomer);
router.get('/me', protect, getMe);

module.exports = router;
