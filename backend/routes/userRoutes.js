const express = require('express');
const router = express.Router();
const { getUsers, createUser, deleteUser, updateUser, getUserProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(protect, authorize('admin', 'manager'), getUsers).post(protect, authorize('admin'), createUser);
router.route('/:id')
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);
router.route('/profile').get(protect, getUserProfile);

module.exports = router;
