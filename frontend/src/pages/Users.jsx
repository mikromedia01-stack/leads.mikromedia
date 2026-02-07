import { useState, useEffect } from 'react';
import API from '../api/axios';
import { FiTrash2, FiEdit2, FiPlus, FiUser, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'sales'
    });

    const fetchUsers = async () => {
        try {
            const { data } = await API.get('/users');
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'sales' });
        setEditingUser(null);
        setShowModal(false);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't populate password
            role: user.role
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await API.delete(`/users/${id}`);
            toast.success('User deleted');
            setUsers(users.filter(u => u._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password; // Don't send empty password

                const { data } = await API.put(`/users/${editingUser._id}`, updateData);
                setUsers(users.map(u => u._id === data._id ? data : u));
                toast.success('User updated');
            } else {
                // Create
                const { data } = await API.post('/users', formData);
                setUsers([...users, data]);
                toast.success('User created');
            }
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem' }}>Team Members</h1>
                    <p style={{ color: '#64748b' }}>Manage access and roles for your team</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> Add User
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ position: 'relative', maxWidth: '300px' }}>
                        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '36px', margin: 0 }}
                            placeholder="Search team members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No members found</td></tr>
                            ) : filteredUsers.map((u) => (
                                <motion.tr
                                    key={u._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${u.role === 'admin' ? 'status-lost' : u.role === 'manager' ? 'status-contacted' : 'status-new'}`} style={{ textTransform: 'capitalize' }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b' }}>{u.email}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleEdit(u)}>
                                                <FiEdit2 size={16} />
                                            </button>

                                            {currentUser._id !== u._id && (
                                                <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(u._id)}>
                                                    <FiTrash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>{editingUser ? 'Edit User' : 'Add New Member'}</h2>
                            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><FiX /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Jane Doe"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="jane@company.com"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Role</label>
                                <select
                                    className="form-input"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="sales">Sales (View Assigned Leads)</option>
                                    <option value="manager">Manager (View All Leads)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">
                                    Password {editingUser && <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>(Leave blank to keep current)</span>}
                                </label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingUser ? "••••••••" : "Set password"}
                                    required={!editingUser}
                                    minLength={6}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? 'Save Changes' : 'Create Member'} <FiCheck />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
