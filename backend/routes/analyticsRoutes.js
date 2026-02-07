const express = require('express');
const router = express.Router();
const { getAdminStats, getManagerStats, getSalesStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/admin', protect, authorize('admin'), getAdminStats);
// Manager can see aggregated stats too
router.get('/manager', protect, authorize('manager', 'admin'), getManagerStats);
// Sales view of their own stats
router.get('/sales', protect, authorize('sales', 'manager', 'admin'), getSalesStats);

module.exports = router;
