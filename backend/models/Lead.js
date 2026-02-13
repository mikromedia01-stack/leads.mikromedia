const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    source: { type: String, default: 'Manual' },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Follow-Up', 'Interested', 'Converted', 'Lost', 'Prospect', 'Customer', 'WhatsApp'],
        default: 'New',
        index: true
    },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

// Add compound index for common filters
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Lead', leadSchema);
