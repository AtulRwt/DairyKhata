const express = require('express');
const router = express.Router();
const {
  getMonthlyEntries,
  upsertMilkEntry,
  deleteMilkEntry,
} = require('../controllers/milkController');
const { protect, staffOnly, ownerOnly } = require('../middleware/auth');

router.use(protect);

router.get('/monthly', staffOnly, getMonthlyEntries);
router.post('/', staffOnly, upsertMilkEntry);
router.delete('/:id', ownerOnly, deleteMilkEntry);

module.exports = router;
