import React, { useState, useEffect } from 'react';
import api from '../api/api';

// documentType enum from document.models.js: "RC" | "Insurance" | "PUC" | "Driving License" | "Other"
const DOC_TYPES = ['RC', 'Insurance', 'PUC', 'Driving License', 'Other'];

const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [cars, setCars] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        car: '',
        documentType: 'RC',
        issueDate: '',
        expiryDate: '',
        notes: ''
    });

    const fetchDocs = async () => {
        try {
            const { data } = await api.get('/documents/getdocs');
            setDocs(data.data);
        } catch {
            setDocs([]);
        }
    };

    const fetchCars = async () => {
        try {
            const { data } = await api.get('/cars/my-cars');
            setCars(data.data);
            if (data.data.length > 0) setForm(f => ({ ...f, car: data.data[0]._id }));
        } catch {
            setCars([]);
        }
    };

    useEffect(() => { fetchDocs(); fetchCars(); }, []);

    const upload = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select a file');
        setLoading(true);
        try {
            const formData = new FormData();
            // Backend reads: req.files?.fileImage?.[0]  — field name must be "fileImage"
            formData.append('fileImage', file);
            formData.append('car', form.car);
            formData.append('documentType', form.documentType);
            if (form.issueDate) formData.append('issueDate', form.issueDate);
            if (form.expiryDate) formData.append('expiryDate', form.expiryDate);
            if (form.notes) formData.append('notes', form.notes);
            await api.post('/documents/upload', formData);
            setFile(null);
            setForm(f => ({ ...f, issueDate: '', expiryDate: '', notes: '' }));
            fetchDocs();
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    // Route: DELETE /documents/:documentId
    const deleteDoc = async (documentId) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            await api.delete(`/documents/${documentId}`);
            fetchDocs();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="feature-page">
            <h1 className="page-title">Vault</h1>
            <p className="page-subtitle">Store and access all your vehicle documents</p>

            <form onSubmit={upload} className="compact-form">
                <h3><span className="form-icon">📄</span> Upload Document</h3>

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
                            <label className="field-label">Document Type *</label>
                            <select value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })}>
                                {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className="field-row">
                            <div>
                                <label className="field-label">Issue Date</label>
                                <input type="date" value={form.issueDate}
                                    onChange={e => setForm({ ...form, issueDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label">Expiry Date</label>
                                <input type="date" value={form.expiryDate}
                                    onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="field-label">Notes</label>
                            <input type="text" placeholder="Optional notes" value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>

                        {/* field name must match route: "fileImage" */}
                        <div>
                            <label className="field-label">Document File *</label>
                            <input type="file" name="fileImage"
                                onChange={e => setFile(e.target.files[0])} required />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload Document →'}
                        </button>
                    </>
                }
            </form>

            <p className="section-label">{docs.length} Document{docs.length !== 1 ? 's' : ''}</p>

            <div className="card-grid">
                {docs.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <p>No documents uploaded yet</p>
                    </div>
                )}
                {docs.map((doc, i) => (
                    <div key={doc._id} className="item-card" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div>
                            <p className="item-card-title">{doc.documentType}</p>
                            {doc.car && (
                                <p className="item-card-meta">
                                    Vehicle: <span>{doc.car.brand} {doc.car.model} — {doc.car.registrationNumber}</span>
                                </p>
                            )}
                            {doc.issueDate && (
                                <p className="item-card-meta">
                                    Issued: <span>{new Date(doc.issueDate).toLocaleDateString('en-IN')}</span>
                                </p>
                            )}
                            {doc.expiryDate && (
                                <p className="item-card-meta" style={{ color: 'var(--amber)' }}>
                                    Expires: <span>{new Date(doc.expiryDate).toLocaleDateString('en-IN')}</span>
                                </p>
                            )}
                            {doc.notes && <p className="item-card-meta">Note: <span>{doc.notes}</span></p>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                            <a className="view-link" href={doc.fileImage} target="_blank" rel="noreferrer">↗ View</a>
                            <button className="delete-btn" onClick={() => deleteDoc(doc._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Documents;
