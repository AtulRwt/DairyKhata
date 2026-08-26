const express = require('express');
const router = express.Router();
const {
  getWindows,
  createWindow,
  updateWindow,
  deleteWindow,
} = require('../controllers/windowController');
const { protect, ownerOnly, staffOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', staffOnly, getWindows);
router.post('/', ownerOnly, createWindow);
router.put('/:id', ownerOnly, updateWindow);
router.delete('/:id', ownerOnly, deleteWindow);

module.exports = router;
