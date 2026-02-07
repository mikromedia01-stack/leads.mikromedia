const Lead = require('../models/Lead');
const csv = require('csv-parser');
const axios = require('axios');
const { Readable } = require('stream');

// Helper to get preview data (headers + 5 rows)
const getPreview = (stream) => {
    return new Promise((resolve, reject) => {
        const results = [];
        let headers = [];
        let rowCount = 0;

        stream
            .pipe(csv())
            .on('headers', (headerList) => {
                headers = headerList.map(h => h.trim());
            })
            .on('data', (data) => {
                if (rowCount < 5) {
                    const cleanRow = {};
                    Object.keys(data).forEach(key => cleanRow[key.trim()] = data[key]);
                    results.push(cleanRow);
                    rowCount++;
                }
            })
            .on('end', () => resolve({ headers, preview: results }))
            .on('error', (err) => reject(err));
    });
};

// Helper function to process leads
const processLeads = async (results, req, mapping = null) => {
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    for (const [index, row] of results.entries()) {
        try {
            const cleanRow = {};
            Object.keys(row).forEach(key => {
                cleanRow[key.trim()] = row[key];
            });

            let name, phone, email, source, status, notes;

            if (mapping) {
                // Use mapping to find keys
                // mapping = { name: 'Customer Name', phone: 'Mobile' }
                // cleanRow has keys like 'Customer Name', 'Mobile'
                name = mapping.name ? cleanRow[mapping.name] : undefined;
                phone = mapping.phone ? cleanRow[mapping.phone] : undefined;
                email = mapping.email ? cleanRow[mapping.email] : undefined;
                source = mapping.source ? cleanRow[mapping.source] : undefined;
                status = mapping.status ? cleanRow[mapping.status] : undefined;
                notes = mapping.notes ? cleanRow[mapping.notes] : undefined;
            } else {
                // Auto-detect fallback
                name = cleanRow.name || cleanRow.Name;
                phone = cleanRow.phone || cleanRow.Phone || cleanRow['Phone Number'];
                email = cleanRow.email || cleanRow.Email;
                source = cleanRow.source || cleanRow.Source;
                status = cleanRow.status || cleanRow.Status;
                notes = cleanRow.notes || cleanRow.Notes;
            }

            name = name ? String(name).trim() : undefined;
            phone = phone ? String(phone).trim() : undefined;
            email = email ? String(email).toLowerCase().trim() : undefined;

            if (!name) {
                if (errorDetails.length < 10) errorDetails.push(`Row ${index + 2}: Missing Name (Required)`);
                errors++;
                continue;
            }
            if (!phone) {
                if (errorDetails.length < 10) errorDetails.push(`Row ${index + 2}: Missing Phone (Required)`);
                errors++;
                continue;
            }

            const query = { $or: [{ phone }] };
            if (email) query.$or.push({ email });

            const existing = await Lead.findOne(query);
            if (existing) {
                skipped++;
                continue;
            }

            await Lead.create({
                name,
                phone,
                email,
                source: source || 'Import',
                status: status || 'New',
                notes: notes,
                createdBy: req.user._id,
                assignedTo: []
            });
            imported++;

        } catch (err) {
            console.error('Import Error Row:', err.message);
            if (errorDetails.length < 10) errorDetails.push(`Row ${index + 2}: ${err.message}`);
            errors++;
        }
    }
    return { imported, skipped, errors, total: results.length, errorDetails };
};

const getLeads = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        let query = {};
        if (req.user.role === 'sales') {
            query = { assignedTo: req.user._id };
        }

        // Advanced Filters
        if (req.query.status) {
            const statuses = req.query.status.split(',');
            if (statuses.length > 1) query.status = { $in: statuses };
            else query.status = statuses[0];
        }
        if (req.query.source) query.source = req.query.source;
        if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        const count = await Lead.countDocuments(query);
        const leads = await Lead.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));
        res.json({ leads, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const bulkAssignLeads = async (req, res) => {
    try {
        const { leadIds, assignedTo } = req.body;
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ message: 'No leads selected' });
        }
        // assignedTo can be array of user IDs or single ID
        const update = { assignedTo: Array.isArray(assignedTo) ? assignedTo : [assignedTo] };

        await Lead.updateMany(
            { _id: { $in: leadIds } },
            { $set: update }
        );
        res.json({ message: `Successfully assigned ${leadIds.length} leads` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const bulkDeleteLeads = async (req, res) => {
    try {
        const { leadIds } = req.body;
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ message: 'No leads selected' });
        }
        await Lead.deleteMany({ _id: { $in: leadIds } });
        res.json({ message: `Successfully deleted ${leadIds.length} leads` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const bulkUpdateStatus = async (req, res) => {
    try {
        const { leadIds, status } = req.body;
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ message: 'No leads selected' });
        }
        if (!status) return res.status(400).json({ message: 'Status is required' });

        await Lead.updateMany(
            { _id: { $in: leadIds } },
            { $set: { status } }
        );
        res.json({ message: `Successfully updated status for ${leadIds.length} leads` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createLead = async (req, res) => {
    try {
        const { name, phone, email, source, status, assignedTo, notes } = req.body;
        const normalizedPhone = phone ? String(phone).trim() : null;
        const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;
        if (!normalizedPhone) return res.status(400).json({ message: 'Phone is required' });

        const query = { $or: [{ phone: normalizedPhone }] };
        if (normalizedEmail) query.$or.push({ email: normalizedEmail });
        const existing = await Lead.findOne(query);
        if (existing) return res.status(400).json({ message: 'Lead exists' });

        const lead = await Lead.create({
            name, phone: normalizedPhone, email: normalizedEmail, source, status, assignedTo, notes, createdBy: req.user._id
        });
        res.status(201).json(lead);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Not found' });

        if (req.user.role === 'sales') {
            const assignedIds = lead.assignedTo.map(id => id.toString());
            if (assignedIds.includes(req.user._id.toString())) {
                lead.status = req.body.status || lead.status;
                lead.notes = req.body.notes || lead.notes;
            } else return res.status(403).json({ message: 'Not authorized' });
        } else {
            const { name, phone, email, source, status, assignedTo, notes } = req.body;
            lead.name = name || lead.name;
            lead.phone = phone || lead.phone;
            lead.email = email || lead.email;
            lead.source = source || lead.source;
            lead.status = status || lead.status;
            lead.assignedTo = assignedTo || lead.assignedTo;
            lead.notes = notes || lead.notes;
        }
        const updated = await lead.save();
        res.json(updated);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) { await lead.deleteOne(); res.json({ message: 'Removed' }); }
        else res.status(404).json({ message: 'Not found' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const previewCSV = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const stream = Readable.from(req.file.buffer.toString());
        const data = await getPreview(stream);
        res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const previewGoogleSheet = async (req, res) => {
    try {
        const { sheetUrl } = req.body;
        if (!sheetUrl) return res.status(400).json({ message: 'No URL' });

        let csvUrl = sheetUrl;
        if (sheetUrl.includes('/edit')) csvUrl = sheetUrl.replace(/\/edit.*/, '/export?format=csv');
        else if (!sheetUrl.includes('/export')) csvUrl += (csvUrl.endsWith('/') ? '' : '/') + 'export?format=csv';

        const response = await axios.get(csvUrl, { responseType: 'stream' });
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) return res.status(400).json({ message: 'Sheet is private' });

        const data = await getPreview(response.data);
        res.json(data);
    } catch (error) { res.status(400).json({ message: 'Failed to fetch sheet' }); }
};

const importLeadsCSV = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file' });
        let mapping = null;
        if (req.body.mapping) {
            try { mapping = JSON.parse(req.body.mapping); } catch (e) { }
        }
        const results = [];
        const stream = Readable.from(req.file.buffer.toString());
        stream.pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const summary = await processLeads(results, req, mapping);
                res.json({ message: 'Done', ...summary });
            });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const importLeadsGoogleSheet = async (req, res) => {
    try {
        const { sheetUrl, mapping } = req.body;
        if (!sheetUrl) return res.status(400).json({ message: 'No URL' });
        let csvUrl = sheetUrl;
        if (sheetUrl.includes('/edit')) csvUrl = sheetUrl.replace(/\/edit.*/, '/export?format=csv');
        else if (!sheetUrl.includes('/export')) csvUrl += (csvUrl.endsWith('/') ? '' : '/') + 'export?format=csv';

        const response = await axios.get(csvUrl, { responseType: 'stream' });
        const results = [];
        response.data.pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const summary = await processLeads(results, req, mapping);
                res.json({ message: 'Done', ...summary });
            });
    } catch (error) { res.status(400).json({ message: 'Failed to import sheet' }); }
};

module.exports = {
    getLeads, createLead, updateLead, deleteLead,
    importLeadsCSV, importLeadsGoogleSheet,
    previewCSV, previewGoogleSheet,
    bulkAssignLeads, bulkDeleteLeads, bulkUpdateStatus
};
