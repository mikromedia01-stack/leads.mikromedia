const express = require('express');
const router = express.Router();
const {
    getLeads, createLead, updateLead, deleteLead,
    importLeadsCSV, importLeadsGoogleSheet,
    previewCSV, previewGoogleSheet,
    bulkAssignLeads, bulkDeleteLeads, bulkUpdateStatus, clearAllLeads
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.route('/')
    .get(getLeads)
    .post(createLead);

// Bulk Operations
router.post('/bulk-assign', authorize('admin', 'manager'), bulkAssignLeads);
router.post('/bulk-delete', authorize('admin', 'manager'), bulkDeleteLeads);
router.post('/bulk-status-update', authorize('admin', 'manager'), bulkUpdateStatus);
router.post('/clear-all', authorize('admin'), clearAllLeads);

router.route('/:id')
    .put(updateLead)
    .delete(authorize('admin', 'manager'), deleteLead);

// Import Routes
router.post('/import/csv', authorize('admin', 'manager'), upload.single('file'), importLeadsCSV);
router.post('/import/google-sheet', authorize('admin', 'manager'), importLeadsGoogleSheet);

// Preview Routes
router.post('/import/preview-csv', authorize('admin', 'manager'), upload.single('file'), previewCSV);
router.post('/import/preview-sheet', authorize('admin', 'manager'), previewGoogleSheet);

module.exports = router;
