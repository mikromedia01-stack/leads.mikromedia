import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TaskModal = ({ leadId, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);

    // If no leadId provided, we might want to allow selecting one
    // But for now, let's just allow title/desc/priority

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        if (leadId) {
            data.leadId = leadId;
        }

        try {
            await API.post('/tasks', data);
            toast.success('Task created');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <h2>{leadId ? 'Add Task for Lead' : 'Create New Task'}</h2>
                <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">Task Title</label>
                        <input className="form-input" name="title" placeholder="Follow up call" required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea className="form-input" name="description" placeholder="Details..." rows="3"></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Due Date</label>
                            <input className="form-input" type="date" name="dueDate" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Priority</label>
                            <select className="form-input" name="priority">
                                <option value="Low">Low</option>
                                <option value="Medium" selected>Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
