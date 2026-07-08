import React, { useState, useEffect } from 'react';
import api from '../api/api';

// serviceType enum from maintenance.models.js
const SERVICE_TYPES = [
    'Oil Change',
    'Brake Service',
    'Tire Rotation',
    'General Service',
    'Battery Replacement',
    'Other'
];

const emptyForm = {
    car: '',
    serviceType: 'Oil Change',
    serviceCenter: '',
    serviceDate: '',
    mileageAtService: '',
    cost: '',
    description: '',
    nextServiceDue: ''
};

const Maintenance = () => {
    const [cars, setCars] = useState([]);
    const [records, setRecords] = useState([]);
    const [selectedCar, setSelectedCar] = useState('');
    const [file, setFile] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);

    const fetchCars = async () => {
        try {
            const { data } = await api.get('/cars/my-cars');
            setCars(data.data);
            if (data.data.length > 0) {
                const firstId = data.data[0]._id;
                setForm(f => ({ ...f, car: firstId }));
                setSelectedCar(firstId);
            }
        } catch {
            setCars([]);
        }
    };

    // Backend: GET /maintenance/records?carId=  — throws 404 when no records, treat as []
    const fetchRecords = async (carId) => {
        if (!carId) return;
        try {
            const { data } = await api.get('/maintenance/records', { params: { carId } });
            setRecords(data.data);
        } catch {
            setRecords([]);
        }
    };

    useEffect(() => { fetchCars(); }, []);
    useEffect(() => { fetchRecords(selectedCar); }, [selectedCar]);

    const handleCarChange = (id) => {
        setForm(f => ({ ...f, car: id }));
        setSelectedCar(id);
    };

    const saveRecord = async (e) => {
        e.preventDefault();
        // Backend requires invoice file: req.files?.invoiceUrl?.[0]?.path — throws 400 if missing
        if (!file) return alert('Invoice file is required by the server');
        setLoading(true);
        try {
            const formData = new FormData();
            // Required
            formData.append('car', form.car);
            formData.append('serviceType', form.serviceType);
            formData.append('serviceDate', form.serviceDate);
            // Optional
            if (form.serviceCenter) formData.append('serviceCenter', form.serviceCenter);
            if (form.mileageAtService) formData.append('mileageAtService', form.mileageAtService);
            if (form.cost) formData.append('cost', form.cost);
            if (form.description) formData.append('description', form.description);
            if (form.nextServiceDue) formData.append('nextServiceDue', form.nextServiceDue);
            // field name must match route: "invoiceUrl"
            formData.append('invoiceUrl', file);

            await api.post('/maintenance/add', formData);
            setForm(f => ({
                ...f,
                serviceType: 'Oil Change',
                serviceCenter: '',
                serviceDate: '',
                mileageAtService: '',
                cost: '',
                description: '',
                nextServiceDue: ''
            }));
            setFile(null);
            fetchRecords(selectedCar);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to log service');
        } finally {
            setLoading(false);
        }
    };

    // Route: DELETE /maintenance/delete/:recordId
    const deleteRecord = async (recordId) => {
        if (!window.confirm('Delete this service record?')) return;
        try {
            await api.delete(`/maintenance/delete/${recordId}`);
            fetchRecords(selectedCar);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="feature-page">
            <h1 className="page-title">Service Logs</h1>
            <p className="page-subtitle">Track every service and maintenance record</p>

            <form onSubmit={saveRecord} className="compact-form">
                <h3><span className="form-icon">🔧</span> Log Service</h3>

                {cars.length === 0
                    ? <p className="warn-text">⚠ No vehicles found. Add a car from the Garage first.</p>
                    : <>
                        <div>
                            <label className="field-label">Vehicle *</label>
                            <select value={form.car} onChange={e => handleCarChange(e.target.value)}>
                                {cars.map(car => (
                                    <option key={car._id} value={car._id}>
                                        {car.brand} {car.model} — {car.registrationNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="field-label">Service Type *</label>
                            <select value={form.serviceType}
                                onChange={e => setForm({ ...form, serviceType: e.target.value })}>
                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="field-row">
                            <div>
                                <label className="field-label">Service Date *</label>
                                <input type="date" value={form.serviceDate}
                                    onChange={e => setForm({ ...form, serviceDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className="field-label">Service Center</label>
                                <input type="text" placeholder="e.g. Tata Workshop" value={form.serviceCenter}
                                    onChange={e => setForm({ ...form, serviceCenter: e.target.value })} />
                            </div>
                        </div>

                        <div className="field-row">
                            <div>
                                <label className="field-label">Mileage at Service (km)</label>
                                <input type="number" placeholder="Optional" value={form.mileageAtService}
                                    onChange={e => setForm({ ...form, mileageAtService: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label">Cost (₹)</label>
                                <input type="number" placeholder="Optional" value={form.cost}
                                    onChange={e => setForm({ ...form, cost: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Description</label>
                            <input type="text" placeholder="Optional notes" value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <div>
                            <label className="field-label">Next Service Due</label>
                            <input type="date" value={form.nextServiceDue}
                                onChange={e => setForm({ ...form, nextServiceDue: e.target.value })} />
                        </div>

                        {/* field name must match route: "invoiceUrl" — REQUIRED by backend */}
                        <div>
                            <label className="field-label">Invoice File * (required by server)</label>
                            <input type="file" name="invoiceUrl"
                                onChange={e => setFile(e.target.files[0])} required />
                        </div>

                        <button type="submit" disabled={cars.length === 0 || loading}>
                            {loading ? 'Saving...' : 'Log Service Record →'}
                        </button>
                    </>
                }
            </form>

            {cars.length > 0 && (
                <>
                    <p className="section-label">{records.length} Record{records.length !== 1 ? 's' : ''} for selected vehicle</p>
                    <div className="card-grid">
                        {records.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">🔧</div>
                                <p>No service records for this vehicle</p>
                            </div>
                        )}
                        {records.map((rec, i) => (
                            <div key={rec._id} className="item-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div>
                                    <p className="item-card-title">{rec.serviceType}</p>
                                    <p className="item-card-meta">
                                        Date: <span>{new Date(rec.serviceDate).toLocaleDateString('en-IN')}</span>
                                    </p>
                                    {rec.serviceCenter && (
                                        <p className="item-card-meta">Center: <span>{rec.serviceCenter}</span></p>
                                    )}
                                    {rec.cost && (
                                        <p className="item-card-meta">Cost: <span>₹{rec.cost}</span></p>
                                    )}
                                    {rec.mileageAtService && (
                                        <p className="item-card-meta">Mileage: <span>{rec.mileageAtService} km</span></p>
                                    )}
                                    {rec.description && (
                                        <p className="item-card-meta">Note: <span>{rec.description}</span></p>
                                    )}
                                    {rec.nextServiceDue && (
                                        <p className="item-card-meta" style={{ color: 'var(--amber)' }}>
                                            Next due: <span>{new Date(rec.nextServiceDue).toLocaleDateString('en-IN')}</span>
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                                    {rec.invoiceUrl && (
                                        <a className="view-link" href={rec.invoiceUrl} target="_blank" rel="noreferrer">↗ Invoice</a>
                                    )}
                                    <button className="delete-btn" onClick={() => deleteRecord(rec._id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Maintenance;
