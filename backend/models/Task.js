const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Overdue'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    comments: [{
        text: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

// Add indexes for faster querying
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ leadId: 1 });

module.exports = mongoose.model('Task', taskSchema);
