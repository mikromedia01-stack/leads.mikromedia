const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    source: { type: String, default: 'Manual' },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Follow-Up', 'Interested', 'Converted', 'Lost', 'Prospect', 'Customer', 'WhatsApp'],
        default: 'New'
    },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
