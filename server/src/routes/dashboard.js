const express = require('express');
const router = express.Router();
const { getDashboard, getAuditLog } = require('../controllers/dashboardController');
const { protect, ownerOnly } = require('../middleware/auth');

router.use(protect, ownerOnly);

router.get('/', getDashboard);
router.get('/audit', getAuditLog);

module.exports = router;
