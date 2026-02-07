const User = require('../models/User');
const Lead = require('../models/Lead');
const Task = require('../models/Task');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/analytics/admin
// @access  Admin
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ /* active logic if any, using total for now */ });

        const totalLeads = await Lead.countDocuments();
        const leadsByStatus = await Lead.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const leadsBySource = await Lead.aggregate([
            { $group: { _id: "$source", count: { $sum: 1 } } }
        ]);

        const totalTasks = await Task.countDocuments();
        const tasksByStatus = await Task.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const overdueTasks = await Task.countDocuments({ status: 'Overdue' });

        // User Performance (Simplified)
        const userPerformance = await User.aggregate([
            { $lookup: { from: 'leads', localField: '_id', foreignField: 'assignedTo', as: 'assignedLeads' } },
            { $lookup: { from: 'tasks', localField: '_id', foreignField: 'assignedTo', as: 'assignedTasks' } },
            {
                $project: {
                    name: 1,
                    role: 1,
                    leadCount: { $size: '$assignedLeads' },
                    taskCount: { $size: '$assignedTasks' },
                    // Calculate conversion rate if possible (e.g., status='Converted')
                    convertedLeads: {
                        $size: {
                            $filter: {
                                input: '$assignedLeads',
                                as: 'lead',
                                cond: { $eq: ['$$lead.status', 'Converted'] }
                            }
                        }
                    }
                }
            }
        ]);

        res.json({
            users: { total: totalUsers, active: activeUsers },
            leads: { total: totalLeads, byStatus: leadsByStatus, bySource: leadsBySource },
            tasks: { total: totalTasks, byStatus: tasksByStatus, overdue: overdueTasks },
            performance: userPerformance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Manager Stats
// @route   GET /api/analytics/manager
// @access  Manager
const getManagerStats = async (req, res) => {
    // For now, Managers see similar stats to Admin but perhaps limited to their team if teams existed.
    // Proceeding with mostly same logic but maybe filtered later.
    // Reusing Admin logic for now as requested features are very similar.
    return getAdminStats(req, res);
};

// @desc    Get Sales Stats
// @route   GET /api/analytics/sales
// @access  Sales
const getSalesStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const myLeads = await Lead.countDocuments({ assignedTo: userId });
        const myLeadsByStatus = await Lead.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const myTasks = await Task.countDocuments({ assignedTo: userId });
        const myTasksByStatus = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const myOverdueTasks = await Task.countDocuments({ assignedTo: userId, status: 'Overdue' });
        const tasksDueToday = await Task.countDocuments({
            assignedTo: userId,
            dueDate: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        // Recent Activity (Leads updated/created recently assigned to user)
        const recentLeads = await Lead.find({ assignedTo: userId })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('name status updatedAt');

        res.json({
            leads: { total: myLeads, byStatus: myLeadsByStatus, recent: recentLeads },
            tasks: { total: myTasks, byStatus: myTasksByStatus, overdue: myOverdueTasks, dueToday: tasksDueToday }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAdminStats,
    getManagerStats,
    getSalesStats
};
