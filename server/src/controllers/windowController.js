const Window = require('../models/Window');
const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');

// GET /api/windows
const getWindows = asyncHandler(async (req, res) => {
  const sellerId = req.sellerId;
  const windows = await Window.find({ sellerId })
    .populate('employeeId', 'name phone')
    .sort({ name: 1 })
    .lean();

  // Add customer count per window
  const windowsWithCount = await Promise.all(
    windows.map(async (w) => {
      const count = await Customer.countDocuments({ sellerId, windowId: w._id, active: true });
      return { ...w, customerCount: count };
    })
  );

  return success(res, { windows: windowsWithCount });
});

// POST /api/windows
const createWindow = asyncHandler(async (req, res) => {
  const { name, employeeId, description } = req.body;
  const sellerId = req.sellerId;

  if (!name) {
    return error(res, 'Window name is required.', 400);
  }

  const window = await Window.create({
    sellerId,
    name,
    employeeId: employeeId || null,
    description: description || '',
  });

  return created(res, { window }, 'Window created successfully.');
});

// PUT /api/windows/:id
const updateWindow = asyncHandler(async (req, res) => {
  const { name, employeeId, description, active } = req.body;
  const sellerId = req.sellerId;

  const window = await Window.findOne({ _id: req.params.id, sellerId });
  if (!window) {
    return error(res, 'Window not found.', 404);
  }

  if (name) window.name = name;
  if (employeeId !== undefined) window.employeeId = employeeId || null;
  if (description !== undefined) window.description = description;
  if (active !== undefined) window.active = Boolean(active);

  await window.save();

  return success(res, { window }, 'Window updated successfully.');
});

// DELETE /api/windows/:id
const deleteWindow = asyncHandler(async (req, res) => {
  const sellerId = req.sellerId;

  const window = await Window.findOne({ _id: req.params.id, sellerId });
  if (!window) {
    return error(res, 'Window not found.', 404);
  }

  // Move customers to unassigned
  await Customer.updateMany({ sellerId, windowId: window._id }, { $set: { windowId: null } });

  await window.deleteOne();

  return success(res, {}, 'Window deleted. Customers moved to unassigned.');
});

module.exports = { getWindows, createWindow, updateWindow, deleteWindow };
