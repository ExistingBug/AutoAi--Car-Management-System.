import React, { useState, useEffect } from 'react';
import api from '../api/api';

// fuelType enum from car.models.js: "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid"
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

const emptyForm = {
    brand: '',
    model: '',
    year: '',
    registrationNumber: '',
    fuelType: 'Petrol',
    mileage: '',
    purchaseDate: ''
};

const Dashboard = () => {
    const [cars, setCars] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);

    const fetchCars = async () => {
        try {
            const { data } = await api.get('/cars/my-cars');
            setCars(data.data);
        } catch {
            setCars([]);
        }
    };

    useEffect(() => { fetchCars(); }, []);

    const addCar = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/cars/add', form);
            setForm(emptyForm);
            fetchCars();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add car');
        } finally {
            setLoading(false);
        }
    };

    // Route: DELETE /cars/delete/:carId
    const deleteCar = async (carId) => {
        if (!window.confirm('Delete this vehicle?')) return;
        try {
            await api.delete(`/cars/delete/${carId}`);
            fetchCars();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete car');
        }
    };

    return (
        <div className="dashboard">
            <h1 className="page-title">Garage</h1>
            <p className="page-subtitle">Manage all your vehicles in one place</p>

            <form onSubmit={addCar} className="compact-form">
                <h3><span className="form-icon">🚗</span> Add New Vehicle</h3>

                <div className="field-row">
                    <div>
                        <label className="field-label">Brand *</label>
                        <input type="text" placeholder="e.g. Tata" value={form.brand}
                            onChange={e => setForm({ ...form, brand: e.target.value })} required />
                    </div>
                    <div>
                        <label className="field-label">Model *</label>
                        <input type="text" placeholder="e.g. Nexon" value={form.model}
                            onChange={e => setForm({ ...form, model: e.target.value })} required />
                    </div>
                </div>

                <div className="field-row">
                    <div>
                        <label className="field-label">Year *</label>
                        <input type="number" placeholder="2022" value={form.year}
                            onChange={e => setForm({ ...form, year: e.target.value })} required />
                    </div>
                    <div>
                        <label className="field-label">Registration No. *</label>
                        <input type="text" placeholder="MH12AB1234" value={form.registrationNumber}
                            onChange={e => setForm({ ...form, registrationNumber: e.target.value })} required />
                    </div>
                </div>

                <div>
                    <label className="field-label">Fuel Type *</label>
                    <select value={form.fuelType} onChange={e => setForm({ ...form, fuelType: e.target.value })}>
                        {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                <div className="field-row">
                    <div>
                        <label className="field-label">Mileage (km)</label>
                        <input type="number" placeholder="Optional" value={form.mileage}
                            onChange={e => setForm({ ...form, mileage: e.target.value })} />
                    </div>
                    <div>
                        <label className="field-label">Purchase Date</label>
                        <input type="date" value={form.purchaseDate}
                            onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                    </div>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Vehicle →'}
                </button>
            </form>

            <p className="section-label">{cars.length} Vehicle{cars.length !== 1 ? 's' : ''}</p>

            <div className="card-grid">
                {cars.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🚗</div>
                        <p>No vehicles added yet</p>
                    </div>
                )}
                {cars.map((car, i) => (
                    <div key={car._id} className="car-card" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="car-card-header">
                            <h4>{car.brand} {car.model}</h4>
                            <span className="car-card-year">{car.year}</span>
                        </div>
                        <div className="car-card-row">
                            <span>Reg No.</span>
                            <strong>{car.registrationNumber}</strong>
                        </div>
                        {car.mileage && (
                            <div className="car-card-row">
                                <span>Mileage</span>
                                <strong>{car.mileage} km</strong>
                            </div>
                        )}
                        {car.purchaseDate && (
                            <div className="car-card-row">
                                <span>Purchased</span>
                                <strong>{new Date(car.purchaseDate).toLocaleDateString('en-IN')}</strong>
                            </div>
                        )}
                        <div><span className="fuel-badge">⛽ {car.fuelType}</span></div>
                        <small className="car-id">ID: {car._id}</small>
                        <div className="card-actions">
                            <button className="delete-btn" onClick={() => deleteCar(car._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
