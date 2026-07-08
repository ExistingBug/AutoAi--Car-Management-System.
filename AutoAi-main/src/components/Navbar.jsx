import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null; // Don't show navbar on login/register

    return (
        <nav className="main-nav">
            <div className="nav-logo">Vahansathi</div>
            <div className="nav-links">
                <Link to="/dashboard">Garage</Link>
                <Link to="/documents">Vault</Link>
                <Link to="/maintenance">Logs</Link>
                <Link to="/reminders">Alerts</Link>
                <Link to="/car-assistant">AI Advisor</Link>
                <Link to="/faq-chatbot">FAQ Bot</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;