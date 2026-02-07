import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiUpload, FiCheckSquare, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ImportModal from '../components/ImportModal';
import TaskModal from '../components/TaskModal';
import { motion } from 'framer-motion';

const Leads = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [tab, setTab] = useState('All');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [currentLead, setCurrentLead] = useState(null);
    const [users, setUsers] = useState([]);

    // Bulk Selection State
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);
    const [bulkAssignUser, setBulkAssignUser] = useState('');

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const statusFilter = tab !== 'All' ? `&status=${tab}` : '';
            const { data } = await API.get(`/leads?page=${page}&limit=${limit}&search=${search}${statusFilter}`);
            setLeads(data.leads);
            setPages(data.pages);
            setTotal(data.total);
            // Reset selection on page change or filter
            setSelectedLeads([]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (user.role === 'sales') return;
        try {
            const { data } = await API.get('/users');
            setUsers(data);
        } catch (error) { }
    };

    useEffect(() => {
        fetchLeads();
        fetchUsers();
    }, [page, search, limit, tab]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await API.delete(`/leads/${id}`);
            toast.success('Lead deleted');
            fetchLeads();
        } catch (error) {
            toast.error('Failed to delete lead');
        }
    };

    // Bulk Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLeads(leads.map(l => l._id));
        } else {
            setSelectedLeads([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(l => l !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedLeads.length} leads?`)) return;
        try {
            await API.post('/leads/bulk-delete', { leadIds: selectedLeads });
            toast.success('Leads deleted');
            fetchLeads();
        } catch (error) {
            toast.error('Bulk delete failed');
        }
    };

    const handleBulkAssign = async () => {
        if (!bulkAssignUser) return toast.error('Select a user to assign');
        try {
            await API.post('/leads/bulk-assign', { leadIds: selectedLeads, assignedTo: bulkAssignUser });
            toast.success('Leads assigned');
            setIsBulkAssigning(false);
            setBulkAssignUser('');
            fetchLeads();
        } catch (error) {
            toast.error('Bulk assign failed');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        // ... (existing form logic needs no change for single lead, but we must verify input names)
        const data = Object.fromEntries(formData.entries());

        if (user.role === 'admin' || user.role === 'manager') {
            // Fix: formData.getAll returns array for multi-select
            // But we need to handle it carefully if it's single select UI vs multi
            // The current form uses <select multiple> so getAll is correct
            data.assignedTo = formData.getAll('assignedTo');
        }

        try {
            if (currentLead) {
                await API.put(`/leads/${currentLead._id}`, data);
                toast.success('Lead updated');
            } else {
                await API.post('/leads', data);
                toast.success('Lead created');
            }
            setShowModal(false);
            setCurrentLead(null);
            fetchLeads();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save lead');
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem' }}>Leads Management</h1>
                    <p style={{ color: '#64748b' }}>Track and manage your potential customers</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {(user.role === 'admin' || user.role === 'manager') && (
                        <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                            <FiUpload /> Import
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => { setCurrentLead(null); setShowModal(true); }}>
                        <FiPlus /> Add Lead
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                {['All', 'New', 'Prospect', 'Customer', 'WhatsApp'].map((t) => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setPage(1); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '10px 0',
                            fontSize: '1rem',
                            fontWeight: tab === t ? '600' : '500',
                            color: tab === t ? 'var(--primary)' : '#64748b',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t}
                        {tab === t && (
                            <div style={{ position: 'absolute', bottom: '-8px', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '3px' }} />
                        )}
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'center', background: '#ffffff', flexWrap: 'wrap' }}>

                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{
                                paddingLeft: '48px', margin: 0,
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                height: '48px',
                                fontSize: '0.95rem'
                            }}
                            placeholder="Search leads by name, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '6px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '48px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
                        <select
                            style={{
                                border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer', fontSize: '0.95rem'
                            }}
                            value={tab}
                            onChange={(e) => { setTab(e.target.value); setPage(1); }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="New">New</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Prospect">Prospect</option>
                            <option value="Customer">Customer</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Follow-Up">Follow-Up</option>
                            <option value="Interested">Interested</option>
                            <option value="Converted">Converted</option>
                            <option value="Lost">Lost</option>
                        </select>
                    </div>

                    {/* Limit Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '6px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '48px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Rows:</span>
                        <select
                            style={{
                                border: 'none', background: 'transparent', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer', fontSize: '0.95rem'
                            }}
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        >
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                        </select>
                    </div>

                    <button className="btn btn-outline" style={{ height: '48px', width: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Filter">
                        <FiFilter />
                    </button>
                </div>

                {/* Bulk Actions Bar */}
                {selectedLeads.length > 0 && (
                    <div className="animate-fade-in" style={{ padding: '12px 24px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #dbeafe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '24px', height: '24px', background: '#2563eb', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                                <FiCheckSquare />
                            </div>
                            <span style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '0.95rem' }}>{selectedLeads.length} selected</span>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {(user.role === 'admin' || user.role === 'manager') && (
                                <>
                                    {isBulkAssigning ? (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'white', padding: '4px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            <select
                                                className="form-input"
                                                style={{ margin: 0, padding: '6px', fontSize: '0.9rem', border: 'none', background: 'transparent', width: '150px' }}
                                                value={bulkAssignUser}
                                                onChange={e => setBulkAssignUser(e.target.value)}
                                            >
                                                <option value="">Select User...</option>
                                                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                            </select>
                                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', height: '32px' }} onClick={handleBulkAssign}>Apply</button>
                                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', height: '32px' }} onClick={() => setIsBulkAssigning(false)}>Cancel</button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'white', borderColor: '#bfdbfe', color: '#1e40af' }} onClick={() => setIsBulkAssigning(true)}>
                                            Assign To...
                                        </button>
                                    )}
                                    <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleBulkDelete}>
                                        <FiTrash2 /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="table-responsive">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading leads...</div>
                    ) : leads.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No leads found.</div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={leads.length > 0 && leads.every(l => selectedLeads.includes(l._id))}
                                        />
                                    </th>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th>Lead Name</th>
                                    <th>Contact Info</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Assignee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead) => (
                                    <motion.tr
                                        key={lead._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ background: selectedLeads.includes(lead._id) ? '#f0f9ff' : 'transparent' }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.includes(lead._id)}
                                                onChange={() => handleSelectOne(lead._id)}
                                            />
                                        </td>
                                        <td style={{ color: '#94a3b8', fontWeight: 500 }}>
                                            {(page - 1) * limit + (leads.indexOf(lead) + 1)}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{lead.name}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{lead.phone}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{lead.email}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', color: '#475569' }}>
                                                {lead.source}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${lead.status?.toLowerCase().replace(' ', '-') || 'new'}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                                                {lead.assignedTo && lead.assignedTo.length > 0
                                                    ? lead.assignedTo.map(u => (
                                                        <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div title={u.name} style={{ width: '24px', height: '24px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold', flexShrink: 0 }}>
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>{u.name}</span>
                                                        </div>
                                                    ))
                                                    : <span style={{ color: '#ccc', fontSize: '0.9rem' }}>--</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Add Task" onClick={() => { setCurrentLead(lead); setShowTaskModal(true); }}>
                                                    <FiCheckSquare size={16} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => { setCurrentLead(lead); setShowModal(true); }}>
                                                    <FiEdit2 size={16} />
                                                </button>
                                                {(user.role === 'admin' || user.role === 'manager') && (
                                                    <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(lead._id)}>
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {pages > 1 && (
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '10px', borderTop: '1px solid #e2e8f0' }}>
                        <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                        <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>Page {page} of {pages} (Total: {total})</span>
                        <button className="btn btn-secondary" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{currentLead ? 'Edit Lead' : 'Create New Lead'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="form-input" name="name" placeholder="John Doe" defaultValue={currentLead?.name} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Phone</label>
                                    <input className="form-input" name="phone" placeholder="+1234567890" defaultValue={currentLead?.phone} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email</label>
                                    <input className="form-input" name="email" placeholder="john@example.com" defaultValue={currentLead?.email} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Status</label>
                                    <select className="form-input" name="status" defaultValue={currentLead?.status || 'New'}>
                                        <option value="New">New</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Prospect">Prospect</option>
                                        <option value="Customer">Customer</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Follow-Up">Follow-Up</option>
                                        <option value="Interested">Interested</option>
                                        <option value="Converted">Converted</option>
                                        <option value="Lost">Lost</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Source</label>
                                    <select className="form-input" name="source" defaultValue={currentLead?.source || 'Manual'}>
                                        <option value="Manual">Manual</option>
                                        <option value="Ads">Ads</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Website">Website</option>
                                        <option value="Google Sheet">Google Sheet</option>
                                        <option value="CSV Import">CSV Import</option>
                                    </select>
                                </div>
                            </div>

                            {(user.role === 'admin' || user.role === 'manager') && (
                                <div className="input-group">
                                    <label className="input-label">Assign To</label>
                                    <select
                                        className="form-input"
                                        name="assignedTo"
                                        multiple
                                        style={{ height: '100px' }}
                                        defaultValue={currentLead?.assignedTo?.map(u => u._id) || []}
                                    >
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                    <small style={{ color: '#94a3b8' }}>Hold Ctrl/Cmd to select multiple. Current: {
                                        // Quick debug helper or leave empty
                                    }</small>
                                </div>
                            )}

                            <div className="input-group">
                                <label className="input-label">Notes</label>
                                <textarea className="form-input" name="notes" placeholder="Enter notes..." defaultValue={currentLead?.notes} rows="3"></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showImportModal && <ImportModal onClose={() => { setShowImportModal(false); fetchLeads(); }} />}
            {showTaskModal && <TaskModal leadId={currentLead?._id} onClose={() => setShowTaskModal(false)} />}
        </div>
    );
};

export default Leads;
