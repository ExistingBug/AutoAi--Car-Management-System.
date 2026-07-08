import React, { useState, useEffect } from 'react';
import api from '../api/api';

// From reminder.models.js
const REMINDER_TYPES = ['Service', 'Insurance', 'PUC', 'Oil Change', 'Custom'];
const PRIORITY_OPTS = ['High', 'Medium', 'Low'];
// repeat enum: "None" | "Monthly" | "Yearly" | "Custom"  (NOT a boolean)
const REPEAT_OPTS = ['None', 'Monthly', 'Yearly', 'Custom'];

const emptyForm = {
    car: '',
    title: '',
    type: 'Custom',
    description: '',
    reminderDate: '',
    priority: 'Medium',
    repeat: 'None'
};

const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [cars, setCars] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchCars = async () => {
        try {
            const { data } = await api.get('/cars/my-cars');
            setCars(data.data);
            if (data.data.length > 0) setForm(f => ({ ...f, car: data.data[0]._id }));
        } catch { setCars([]); }
    };

    const fetchReminders = async () => {
        try {
            const { data } = await api.get('/reminders/records');
            setReminders(data.data);
        } catch { setReminders([]); }
    };

    useEffect(() => { fetchCars(); fetchReminders(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                // Route: PATCH /reminders/update/:reminderId
                // updateReminder uses req.body directly with findByIdAndUpdate
                await api.patch(`/reminders/update/${editingId}`, form);
                setEditingId(null);
            } else {
                // Route: POST /reminders/add
                await api.post('/reminders/add', form);
            }
            setForm(f => ({ ...f, title: '', type: 'Custom', description: '', reminderDate: '', priority: 'Medium', repeat: 'None' }));
            fetchReminders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save reminder');
        } finally {
            setLoading(false);
        }
    };

    // Toggle isCompleted — updateReminder accepts req.body directly
    // Route: PATCH /reminders/update/:reminderId
    const toggleComplete = async (r) => {
        try {
            await api.patch(`/reminders/update/${r._id}`, { isCompleted: !r.isCompleted });
            fetchReminders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update');
        }
    };

    const startEdit = (r) => {
        setEditingId(r._id);
        setForm({
            car: r.car?._id || r.car,
            title: r.title,
            type: r.type || 'Custom',
            description: r.description || '',
            reminderDate: r.reminderDate?.slice(0, 10) || '',
            priority: r.priority,
            repeat: r.repeat || 'None'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(f => ({ ...f, title: '', type: 'Custom', description: '', reminderDate: '', priority: 'Medium', repeat: 'None' }));
    };

    // Route: DELETE /reminders/delete/:reminderId
    const deleteReminder = async (reminderId) => {
        if (!window.confirm('Delete this reminder?')) return;
        try {
            await api.delete(`/reminders/delete/${reminderId}`);
            fetchReminders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="feature-page">
            <h1 className="page-title">Alerts</h1>
            <p className="page-subtitle">Never miss a renewal, service, or due date</p>

            <form onSubmit={handleSubmit} className={`compact-form${editingId ? ' editing' : ''}`}>
                <h3>
                    <span className="form-icon">{editingId ? '✏️' : '🔔'}</span>
                    {editingId ? 'Edit Reminder' : 'Set Reminder'}
                </h3>

                {cars.length === 0
                    ? <p className="warn-text">⚠ No vehicles found. Add a car from the Garage first.</p>
                    : <>
                        <div>
                            <label className="field-label">Vehicle *</label>
                            <select value={form.car} onChange={e => setForm({ ...form, car: e.target.value })}>
                                {cars.map(car => (
                                    <option key={car._id} value={car._id}>
                                        {car.brand} {car.model} — {car.registrationNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="field-label">Title *</label>
                            <input type="text" placeholder="e.g. Renew Insurance" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>

                        <div className="field-row">
                            <div>
                                <label className="field-label">Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="field-label">Priority</label>
                                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                    {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="field-row">
                            <div>
                                <label className="field-label">Reminder Date *</label>
                                <input type="date" value={form.reminderDate}
                                    onChange={e => setForm({ ...form, reminderDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className="field-label">Repeat</label>
                                <select value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}>
                                    {REPEAT_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Description</label>
                            <input type="text" placeholder="Optional notes" value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <button type="submit" disabled={cars.length === 0 || loading}>
                            {loading ? 'Saving...' : editingId ? 'Update Reminder →' : 'Set Reminder →'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn-secondary" onClick={cancelEdit}>
                                Cancel Edit
                            </button>
                        )}
                    </>
                }
            </form>

            <p className="section-label">{reminders.length} Reminder{reminders.length !== 1 ? 's' : ''}</p>

            <div className="reminder-list">
                {reminders.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <p>No reminders set yet</p>
                    </div>
                )}
                {reminders.map((r, i) => (
                    <div key={r._id} className={`card ${r.priority}${r.isCompleted ? ' completed' : ''}`}
                        style={{ animationDelay: `${i * 0.05}s` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <p className="card-title" style={{ textDecoration: r.isCompleted ? 'line-through' : 'none' }}>
                                {r.title}
                            </p>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                                <span className={`priority-badge ${r.priority}`}>{r.priority}</span>
                                {r.type && <span className="type-badge">{r.type}</span>}
                            </div>
                        </div>

                        <p className="card-date">📅 {new Date(r.reminderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                        {r.car && (
                            <p className="card-car">🚗 {r.car.brand} {r.car.model} — {r.car.registrationNumber}</p>
                        )}

                        {r.description && <p className="card-desc">{r.description}</p>}

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            {r.repeat && r.repeat !== 'None' && (
                                <span className="repeat-badge">↻ {r.repeat}</span>
                            )}
                            {r.isCompleted && (
                                <span className="completed-badge">✓ Done</span>
                            )}
                        </div>

                        <div className="card-actions">
                            {/* isCompleted toggle — sends { isCompleted: bool } via PATCH /reminders/update/:reminderId */}
                            <button className="complete-btn" onClick={() => toggleComplete(r)}>
                                {r.isCompleted ? 'Mark Pending' : 'Mark Done'}
                            </button>
                            <button className="edit-btn" onClick={() => startEdit(r)}>Edit</button>
                            <button className="delete-btn" onClick={() => deleteReminder(r._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reminders;
