const express = require('express');
const router = express.Router();
const { getCustomerBilling, getMonthlyBilling } = require('../controllers/billingController');
const { protect, staffOnly, authorize } = require('../middleware/auth');

router.use(protect);

// Customer can access their own billing
router.get('/customer/:customerId', authorize('owner', 'employee', 'customer'), getCustomerBilling);
router.get('/monthly', staffOnly, getMonthlyBilling);

module.exports = router;
