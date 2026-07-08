import React, { createContext, useState, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const s = localStorage.getItem('vahansathi_user');
            return s ? JSON.parse(s) : null;
        } catch { return null; }
    });

    const login = async (email, password) => {
        const { data } = await api.post('/users/login', { email, password });
        const userData = data.data.user;
        setUser(userData);
        localStorage.setItem('vahansathi_user', JSON.stringify(userData));
    };

    const logout = async () => {
        await api.post('/users/logout');
        setUser(null);
        localStorage.removeItem('vahansathi_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
