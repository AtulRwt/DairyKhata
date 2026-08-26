const express = require('express');
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect, ownerOnly, staffOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', staffOnly, getCustomers);
router.post('/', ownerOnly, createCustomer);
router.get('/:id', staffOnly, getCustomer);
router.put('/:id', ownerOnly, updateCustomer);
router.patch('/:id/status', ownerOnly, updateCustomerStatus);
router.delete('/:id', ownerOnly, deleteCustomer);

module.exports = router;
