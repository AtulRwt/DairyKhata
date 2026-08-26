const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, ownerOnly } = require('../middleware/auth');

router.use(protect, ownerOnly);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
