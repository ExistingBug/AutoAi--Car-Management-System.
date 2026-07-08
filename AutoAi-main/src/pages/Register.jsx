import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Backend: req.files?.profilePicture[0]?.path — field name must be "profilePicture"
        const data = new FormData();
        data.append('name', form.name);
        data.append('email', form.email);
        data.append('password', form.password);
        data.append('phone', form.phone);
        if (file) data.append('profilePicture', file);
        try {
            await api.post('/users/register', data);
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
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
                <h2>Create account</h2>
                <p className="auth-desc">Start managing your vehicles today</p>
                <form onSubmit={handleRegister}>
                    <label className="field-label">Full Name</label>
                    <input type="text" placeholder="Raj Malhotra"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

                    <label className="field-label">Email</label>
                    <input type="email" placeholder="you@example.com"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />

                    <label className="field-label">Password</label>
                    <input type="password" placeholder="••••••••"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />

                    <label className="field-label">Phone Number</label>
                    <input type="text" placeholder="+91 98765 43210"
                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />

                    {/* field name = "profilePicture" — required by backend */}
                    <label className="field-label">Profile Picture (required)</label>
                    <input type="file" name="profilePicture" accept="image/*"
                        onChange={e => setFile(e.target.files[0])} required />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account →'}
                    </button>
                </form>
                <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    );
};

export default Register;
