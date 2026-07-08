import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './styles/App.css';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Documents from './pages/Documents.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Reminders from './pages/Reminders.jsx';
import CarAssistant from './pages/CarAssistant.jsx';
import FaqChatbot from './pages/FaqChatbot.jsx';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Landing page — no Navbar */}
                    <Route path="/" element={<Landing />} />

                    {/* Auth pages — no Navbar */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* App pages — with Navbar */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Navbar />
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/documents" element={
                        <ProtectedRoute>
                            <Navbar />
                            <Documents />
                        </ProtectedRoute>
                    } />
                    <Route path="/maintenance" element={
                        <ProtectedRoute>
                            <Navbar />
                            <Maintenance />
                        </ProtectedRoute>
                    } />
                    <Route path="/reminders" element={
                        <ProtectedRoute>
                            <Navbar />
                            <Reminders />
                        </ProtectedRoute>
                    } />
                    <Route path="/car-assistant" element={
                        <ProtectedRoute>
                            <Navbar />
                            <CarAssistant />
                        </ProtectedRoute>
                    } />
                    <Route path="/faq-chatbot" element={
                        <ProtectedRoute>
                            <Navbar />
                            <FaqChatbot />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
