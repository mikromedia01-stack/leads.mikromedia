const Task = require('../models/Task');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        let query = {};
        const { status, priority, assignedTo } = req.query;

        // Sales: view OWN tasks only
        if (req.user.role === 'sales') {
            query.assignedTo = req.user._id;
        } else if (req.user.role === 'manager') {
            // Manager: View Team Tasks (Currently all tasks, or specific implementation needed for teams)
            // For now, let's assume Manager sees all tasks, or we can filter if they request
            if (assignedTo) query.assignedTo = assignedTo;
        } else if (req.user.role === 'admin') {
            if (assignedTo) query.assignedTo = assignedTo;
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email role')
            .populate('leadId', 'name phone')
            .populate('createdBy', 'name')
            .sort({ dueDate: 1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const { title, description, leadId, assignedTo, dueDate, status } = req.body;

        const task = await Task.create({
            title,
            description,
            leadId,
            assignedTo: assignedTo || req.user._id,
            createdBy: req.user._id,
            dueDate,
            status: status || 'Pending'
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Sales: Can only update status and add comments
        if (req.user.role === 'sales') {
            if (task.assignedTo.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this task' });
            }
            if (req.body.status) task.status = req.body.status;
            if (req.body.comment) {
                task.comments.push({ text: req.body.comment, user: req.user._id });
            }
            // Sales cannot change other fields like dueDate, title, or reassignment
        } else {
            // Admin/Manager: Can update everything
            if (req.body.title) task.title = req.body.title;
            if (req.body.description) task.description = req.body.description;
            if (req.body.status) task.status = req.body.status;
            if (req.body.dueDate) task.dueDate = req.body.dueDate;
            if (req.body.priority) task.priority = req.body.priority;
            if (req.body.assignedTo) task.assignedTo = req.body.assignedTo;
            if (req.body.comment) {
                task.comments.push({ text: req.body.comment, user: req.user._id });
            }
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin/Manager
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task) {
            await task.deleteOne();
            res.json({ message: 'Task removed' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
