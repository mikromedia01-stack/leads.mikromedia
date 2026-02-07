import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiUsers, FiTarget, FiCheckCircle, FiClock, FiActivity, FiPieChart, FiTrendingUp } from 'react-icons/fi';

const StatCard = ({ title, value, subtext, icon, color, delay }) => (
    <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay }}
        className="card"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', overflow: 'hidden' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b' }}>{title}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {icon}
            </div>
        </div>
        {subtext && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{subtext}</div>}
    </motion.div>
);

const ProgressBar = ({ label, count, total, color }) => (
    <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
            <span style={{ fontWeight: 500 }}>{label}</span>
            <span style={{ color: '#64748b' }}>{count}</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
        </div>
    </div>
);

const SalesDashboard = ({ stats }) => (
    <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard title="My Leads" value={stats?.leads?.total || 0} icon={<FiTarget />} color="#4f46e5" delay={0.05} />
            <StatCard title="Tasks Due" value={stats?.tasks?.dueToday || 0} subtext="Due Today" icon={<FiClock />} color="#f59e0b" delay={0.1} />
            <StatCard title="Pending Tasks" value={stats?.tasks?.byStatus?.find(s => s._id === 'Pending')?.count || 0} icon={<FiActivity />} color="#3b82f6" delay={0.15} />
            <StatCard title="Completed" value={stats?.tasks?.byStatus?.find(s => s._id === 'Completed')?.count || 0} icon={<FiCheckCircle />} color="#10b981" delay={0.2} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Lead Funnel</h3>
                {(stats?.leads?.byStatus || []).map((status, i) => (
                    <ProgressBar
                        key={status._id}
                        label={status._id}
                        count={status.count}
                        total={stats?.leads?.total}
                        color={['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#ef4444'][i % 5]}
                    />
                ))}
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(stats?.leads?.recent || []).length === 0 ? (
                        <p style={{ color: '#64748b' }}>No recent activity</p>
                    ) : (
                        stats?.leads?.recent.map((lead, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{lead.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Updated {new Date(lead.updatedAt).toLocaleDateString()} • {lead.status}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </>
);

const AdminDashboard = ({ stats }) => (
    <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard title="Total Leads" value={stats?.leads?.total || 0} icon={<FiPieChart />} color="#4f46e5" delay={0.05} />
            <StatCard title="Total Users" value={stats?.users?.total || 0} subtext={`${stats?.users?.active || 0} Active`} icon={<FiUsers />} color="#8b5cf6" delay={0.1} />
            <StatCard title="Overdue Tasks" value={stats?.tasks?.overdue || 0} icon={<FiClock />} color="#ef4444" delay={0.15} />
            <StatCard title="Conversion Rate" value={`${stats?.leads?.total > 0 ? Math.round(((stats?.leads?.byStatus?.find(s => s._id === 'Converted')?.count || 0) / stats?.leads?.total) * 100) : 0}%`} icon={<FiTrendingUp />} color="#10b981" delay={0.2} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Lead Sources</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {(stats?.leads?.bySource || []).map((source, i) => (
                        <div key={i} style={{ flex: '1 1 120px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>{source._id}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{source.count}</div>
                            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                                <div style={{ width: `${(source.count / stats.leads.total) * 100}%`, height: '100%', background: '#6366f1', borderRadius: '2px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Team Performance</h3>
                <div className="table-responsive">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Role</th>
                                <th>Leads</th>
                                <th>Tasks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.performance || []).map((user) => (
                                <tr key={user._id}>
                                    <td style={{ fontWeight: 500 }}>{user.name}</td>
                                    <td><span className="badge">{user.role}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                                <div style={{ width: `${Math.min(user.leadCount * 5, 100)}%`, height: '100%', background: '#4f46e5', borderRadius: '3px' }} />
                                            </div>
                                            {user.leadCount}
                                        </div>
                                    </td>
                                    <td>{user.taskCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const endpoint = user.role === 'sales' ? '/analytics/sales' : '/analytics/admin'; // Manager same as Admin for now
                const { data } = await API.get(endpoint);
                setStats(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user.role]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Dashboard</h1>
                <p style={{ color: '#64748b' }}>Overview for {user.name} ({user.role})</p>
            </div>

            {user.role === 'sales' ? <SalesDashboard stats={stats} /> : <AdminDashboard stats={stats} />}
        </div>
    );
};

export default Dashboard;
