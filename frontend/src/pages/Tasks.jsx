import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiCheckCircle, FiClock, FiAlertCircle, FiUser, FiPlus, FiFilter, FiSearch, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';

const Tasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    const fetchTasks = async () => {
        try {
            const { data } = await API.get(`/tasks?status=${filterStatus}`);
            setTasks(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [filterStatus]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await API.put(`/tasks/${id}`, { status });
            toast.success('Task updated');
            fetchTasks();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await API.delete(`/tasks/${id}`);
            toast.success('Task deleted');
            setTasks(tasks.filter(t => t._id !== id));
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Completed': return { color: 'var(--success)', icon: <FiCheckCircle /> };
            case 'Overdue': return { color: 'var(--danger)', icon: <FiAlertCircle /> };
            case 'In Progress': return { color: 'var(--primary)', icon: <FiClock /> };
            default: return { color: 'var(--warning)', icon: <FiClock /> };
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return '#ef4444';
            case 'High': return '#f97316';
            case 'Medium': return '#eab308';
            default: return '#10b981';
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem' }}>Tasks & To-Dos</h1>
                    <p style={{ color: '#64748b' }}>Manage your daily activities</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            className="form-input"
                            style={{ paddingLeft: '36px', width: '200px', margin: 0 }}
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="form-input"
                        style={{ width: 'auto', margin: 0 }}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Overdue">Overdue</option>
                    </select>

                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus /> New Task
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No tasks found</h3>
                    <p style={{ color: '#64748b' }}>Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filteredTasks.map((task, index) => {
                        const statusInfo = getStatusInfo(task.status);
                        return (
                            <motion.div
                                key={task._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="card"
                                style={{
                                    borderTop: `4px solid ${statusInfo.color}`,
                                    display: 'flex', flexDirection: 'column', height: '100%',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <span
                                        style={{
                                            padding: '4px 8px', borderRadius: '12px', background: `${statusInfo.color}15`,
                                            color: statusInfo.color, fontSize: '0.75rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase'
                                        }}
                                    >
                                        {statusInfo.icon} {task.status}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {task.priority && (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 700, color: getPriorityColor(task.priority),
                                                border: `1px solid ${getPriorityColor(task.priority)}`, padding: '2px 6px', borderRadius: '4px'
                                            }}>
                                                {task.priority}
                                            </span>
                                        )}
                                        {/* Delete Button */}
                                        {(user.role === 'admin' || user.role === 'manager' || user._id === task.createdBy) && (
                                            <button
                                                onClick={() => handleDelete(task._id)}
                                                style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                                title="Delete Task"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', lineHeight: '1.4', marginBottom: '4px' }}>{task.title}</h3>
                                    {task.dueDate && (
                                        <div style={{ fontSize: '0.8rem', color: task.status === 'Overdue' ? 'var(--danger)' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FiClock size={14} /> {new Date(task.dueDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.6', flex: 1 }}>
                                    {task.description || 'No description provided.'}
                                </p>

                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                                        {task.assignedTo && (
                                            <div title={`Assigned to ${task.assignedTo.name}`} style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                {task.assignedTo.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {task.leadId ? (
                                            <span style={{ color: '#64748b' }}>For: {task.leadId.name}</span>
                                        ) : <span style={{ color: '#94a3b8' }}>General Task</span>}
                                    </div>

                                    {task.status !== 'Completed' && (
                                        <select
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                                            onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                                            value={task.status}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">Working</option>
                                            <option value="Completed">Done</option>
                                        </select>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <TaskModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchTasks(); setShowModal(false); }}
                />
            )}
        </div>
    );
};

export default Tasks;
