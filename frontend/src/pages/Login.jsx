import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiArrowRight, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in (but wait for context to load)
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate delay for smoother UI feel
        setTimeout(async () => {
            const success = await login(email, password);
            setIsSubmitting(false);
            if (success) {
                navigate('/dashboard');
            }
        }, 800);
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: 'white',
                    borderRadius: '24px',
                    padding: '40px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative top bar */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)'
                }}></div>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                        margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        fontSize: '2rem', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                    }}>
                        ❖
                    </div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800, color: '#1e293b' }}>Mikromedia</h2>
                    <p style={{ color: '#64748b' }}>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <FiMail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: '44px' }}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                style={{ paddingLeft: '44px' }}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px', marginTop: '1rem', justifyContent: 'center' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                                Signing in...
                            </span>
                        ) : (
                            <>Sign In <FiArrowRight /></>
                        )}
                    </button>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7', fontSize: '0.85rem', color: '#166534' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, alignItems: 'center' }}>
                            <FiAlertCircle /> Demo Credentials
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', opacity: 0.9 }}>
                            <div><strong>User:</strong> admin@mikromedia.com</div>
                            <div><strong>Pass:</strong> password123</div>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
