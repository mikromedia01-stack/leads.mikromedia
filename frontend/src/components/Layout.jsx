import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUsers, FiLayers, FiCheckSquare, FiLogOut, FiPieChart, FiMenu, FiX } from 'react-icons/fi';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FiPieChart, roles: ['admin', 'manager', 'sales'] },
        { path: '/leads', label: 'Leads Pipeline', icon: FiLayers, roles: ['admin', 'manager', 'sales'] },
        { path: '/tasks', label: 'Tasks & To-Dos', icon: FiCheckSquare, roles: ['admin', 'manager', 'sales'] },
        { path: '/users', label: 'Team Members', icon: FiUsers, roles: ['admin'] },
    ];

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    return (
        <div className="app-container">
            {/* Mobile Header */}
            <div className="mobile-header" style={{
                display: 'none', // Hidden on desktop via CSS, but let's be explicit here or use media query class
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: '60px',
                background: 'white',
                zIndex: 40,
                padding: '0 20px',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span style={{ color: '#6366f1' }}>❖</span> Mikromedia
                </div>
                <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '1.5rem' }}>
                    <FiMenu />
                </button>
            </div>

            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div className="sidebar-logo" style={{ marginBottom: 0 }}>
                        <span style={{ fontSize: '2rem', color: '#6366f1' }}>❖</span> Mikromedia
                    </div>
                    <button
                        className="close-sidebar-btn"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.5rem' }} // Show only on mobile via CSS
                    >
                        <FiX />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {navItems.map((item) => (
                        item.roles.includes(user?.role) && (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        )
                    ))}
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{user?.role} Access</div>
                        </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary" style={{ width: '100%', gap: '0.5rem', justifyContent: 'center' }}>
                        <FiLogOut /> Sign Out
                    </button>
                </div>
            </aside>
            <main className="main-area">
                <style>{`
                    @media (max-width: 768px) {
                        .mobile-header { display: flex !important; }
                        .main-area { padding-top: 80px; } /* Push content down */
                        .close-sidebar-btn { display: block !important; }
                    }
                `}</style>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
