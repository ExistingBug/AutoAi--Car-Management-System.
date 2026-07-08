import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-logo">
                    <span className="nav-logo-dot"></span>
                    <span className="auth-logo-text">Vahansathi</span>
                </div>
                <h2>Welcome back</h2>
                <p className="auth-desc">Sign in to manage your vehicles</p>
                <form onSubmit={handleLogin}>
                    <label className="field-label">Email</label>
                    <input type="email" placeholder="you@example.com" value={email}
                        onChange={e => setEmail(e.target.value)} required />
                    <label className="field-label">Password</label>
                    <input type="password" placeholder="••••••••" value={password}
                        onChange={e => setPassword(e.target.value)} required />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>
                <p className="auth-footer">No account? <Link to="/register">Create one</Link></p>
            </div>
        </div>
    );
};

export default Login;
