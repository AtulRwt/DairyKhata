const express = require('express');
const router = express.Router();
const { getPayments, createPayment, updatePaymentStatus } = require('../controllers/paymentController');
const { protect, ownerOnly } = require('../middleware/auth');

router.use(protect, ownerOnly);

router.get('/', getPayments);
router.post('/', createPayment);
router.patch('/:id/status', updatePaymentStatus);

module.exports = router;
