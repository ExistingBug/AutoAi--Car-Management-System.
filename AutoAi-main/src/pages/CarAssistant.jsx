import React, { useState, useCallback } from 'react';
import { getRecommendations } from '../api/autoaiApi';

// ── Constants ────────────────────────────────────────────────────────────────
const PRIORITIES = [
    { key: 'balanced',    label: '⚖️ Balanced' },
    { key: 'mileage',     label: '⛽ Best Mileage' },
    { key: 'performance', label: '🚀 Performance' },
    { key: 'safety',      label: '🛡️ Safety First' },
    { key: 'comfort',     label: '🛋️ Comfort' },
    { key: 'technology',  label: '📱 Technology' },
    { key: 'luxury',      label: '💎 Luxury' },
    { key: 'offroad',     label: '🏔️ Off-road' },
];

const USE_CASES = [
    { key: 'city',    label: '🏙️ City Driving' },
    { key: 'highway', label: '🛣️ Highway / Long Distance' },
    { key: 'family',  label: '👨‍👩‍👧 Family Car' },
    { key: 'offroad', label: '🏔️ Off-road / Rough Roads' },
    { key: 'sporty',  label: '🏎️ Sporty / Performance' },
    { key: 'luxury',  label: '💎 Premium / Luxury' },
];

const FEATURES = [
    { key: 'sunroof',           label: 'Sunroof / Moonroof',    icon: '🌤️' },
    { key: 'adas',              label: 'ADAS (Lane Assist, AEB)',icon: '🤖' },
    { key: 'wireless_charging', label: 'Wireless Charging',      icon: '🔋' },
    { key: 'cruise_control',    label: 'Cruise Control',         icon: '🚗' },
    { key: 'parking_sensors',   label: 'Parking Sensors / Camera',icon: '🅿️' },
];

const EMPTY_FORM = {
    budget_min: '',
    budget_max: '',
    city: 'Mumbai',
    fuel: 'any',
    segment: '',
    seating: '5',
    transmission: '',
    brand_origin: '',
    min_airbags: '0',
    warranty_years: '0',
};

// ── Sub-components ────────────────────────────────────────────────────────────
function ResultCard({ car, rank }) {
    const isBest = rank === 0;
    const mileage = car.fuel === 'Electric' ? '⚡ EV' : `${car.mileage_kmpl} kmpl`;
    const stars = '⭐'.repeat(Math.min(car.safety_rating || 0, 5));

    return (
        <div className={`ai-result-card${isBest ? ' ai-result-best' : ''}`}>
            {isBest && <div className="ai-best-badge">🏆 BEST MATCH</div>}

            <div className="ai-car-header">
                <div>
                    <div className="ai-car-name">{car.name}</div>
                    <div className="ai-car-meta">
                        <span>🚗 {car.segment}</span>
                        <span>⚡ {car.fuel}</span>
                        <span>⚙️ {car.transmission}</span>
                        <span>🏭 {car.brand_origin}</span>
                    </div>
                </div>
                <div className="ai-score-badge">
                    <div className="ai-score-num">{car.score}%</div>
                    <div className="ai-score-lbl">Match</div>
                </div>
            </div>

            <div className="ai-spec-grid">
                {[
                    { label: 'Price',           value: `₹${car.price_lakh}L` },
                    { label: 'Mileage',         value: mileage },
                    { label: 'Power',           value: `${car.power_bhp} bhp` },
                    { label: 'Torque',          value: `${car.torque_nm} Nm` },
                    { label: 'Ground Clearance',value: `${car.ground_clearance_mm}mm` },
                    { label: 'Seating',         value: car.seating },
                    { label: 'Safety',          value: stars || 'N/A' },
                    { label: 'Airbags',         value: car.airbags },
                    { label: 'Warranty',        value: `${car.warranty_years} yrs` },
                    ...(car.boot_space_l > 0 ? [{ label: 'Boot Space', value: `${car.boot_space_l}L` }] : []),
                ].map(s => (
                    <div className="ai-spec-item" key={s.label}>
                        <div className="ai-spec-label">{s.label}</div>
                        <div className="ai-spec-value">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="ai-feat-badges">
                {[
                    { k: 'sunroof', l: 'Sunroof' },
                    { k: 'adas', l: 'ADAS' },
                    { k: 'wireless_charging', l: 'Wireless Charging' },
                    { k: 'cruise_control', l: 'Cruise Control' },
                    { k: 'parking_sensors', l: 'Parking Sensors' },
                ].map(f => (
                    <span key={f.k}
                        className={`ai-feat-badge${car[f.k] ? ' yes' : ' no'}`}>
                        {car[f.k] ? '✓' : '✗'} {f.l}
                    </span>
                ))}
            </div>

            {car.highlights?.length > 0 && (
                <div className="ai-highlights">
                    {car.highlights.map((h, i) => <span key={i} className="ai-highlight">{h}</span>)}
                </div>
            )}
            {car.city_note && (
                <div className="ai-city-note">🏙️ {car.city_note}</div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const CarAssistant = () => {
    const [form, setForm]             = useState(EMPTY_FORM);
    const [priority, setPriority]     = useState('balanced');
    const [useCases, setUseCases]     = useState([]);
    const [features, setFeatures]     = useState({});
    const [safetyRating, setSafety]   = useState(0);
    const [results, setResults]       = useState(null);      // null=idle, []=empty, [...]= cards
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');

    const toggleUseCase = key =>
        setUseCases(prev =>
            prev.includes(key) ? prev.filter(u => u !== key) : [...prev, key]
        );

    const toggleFeature = key =>
        setFeatures(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleStar = rating =>
        setSafety(prev => (prev === rating ? 0 : rating));

    const handleChange = e =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = useCallback(async () => {
        const min = parseFloat(form.budget_min);
        const max = parseFloat(form.budget_max);
        if (!min || !max || min >= max) {
            setError('Please enter a valid budget range (min must be less than max).');
            return;
        }
        setError('');
        setLoading(true);
        setResults(null);
        try {
            const payload = {
                budget_min:       min,
                budget_max:       max,
                fuel:             form.fuel,
                segment:          form.segment,
                seating:          parseInt(form.seating),
                city:             form.city,
                transmission:     form.transmission,
                brand_origin:     form.brand_origin,
                priority,
                use_case:         useCases,
                min_safety_rating: safetyRating,
                min_airbags:      parseInt(form.min_airbags),
                warranty_years:   parseInt(form.warranty_years),
                ...features,
            };
            const data = await getRecommendations(payload);
            setResults(data.success ? (data.recommendations || []) : []);
            if (!data.success) setError(data.error || 'No results returned.');
        } catch (err) {
            setError(err?.response?.data?.error || err.message || 'Failed to reach the AI server.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [form, priority, useCases, features, safetyRating]);

    return (
        <div className="ai-page feature-page">
            {/* ── Header ── */}
            <div className="ai-hero">
                <div>
                    <div className="ai-eyebrow">KNN-Powered ML Model</div>
                    <h1 className="page-title">Car Assistant AI</h1>
                    <p className="page-subtitle">
                        ML-powered recommendations from 90+ Indian cars · 32 features analysed
                    </p>
                </div>
                <div className="ai-hero-stats">
                    {[['90+','Cars'],['32','Features'],['13','Cities'],['KNN','Algorithm']].map(([n,l]) => (
                        <div className="ai-hstat" key={l}>
                            <div className="ai-hstat-num">{n}</div>
                            <div className="ai-hstat-lbl">{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="ai-info-banner">
                💡 Our AI analyses safety ratings, ADAS, mileage, ground clearance, and city road conditions to find your ideal match.
            </div>

            {/* ── Budget & Basics ── */}
            <div className="ai-section">
                <div className="ai-section-head"><span>💰</span>Budget &amp; Basics</div>

                <div className="ai-grid-2">
                    <div className="ai-group">
                        <label className="ai-label">💵 Minimum Budget <span className="ai-req">*</span></label>
                        <input type="number" name="budget_min" value={form.budget_min}
                            onChange={handleChange} placeholder="e.g. 8" min="1" step="0.5" />
                        <small className="ai-hint">₹ Lakh (Ex-showroom)</small>
                    </div>
                    <div className="ai-group">
                        <label className="ai-label">💵 Maximum Budget <span className="ai-req">*</span></label>
                        <input type="number" name="budget_max" value={form.budget_max}
                            onChange={handleChange} placeholder="e.g. 20" min="1" step="0.5" />
                        <small className="ai-hint">₹ Lakh (Ex-showroom)</small>
                    </div>
                </div>

                <div className="ai-grid-3" style={{ marginTop: '16px' }}>
                    <div className="ai-group">
                        <label className="ai-label">🏙️ Your City</label>
                        <select name="city" value={form.city} onChange={handleChange}>
                            {['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Kolkata',
                              'Ahmedabad','Jaipur','Chandigarh','Kochi','Lucknow','Other City']
                              .map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="ai-group">
                        <label className="ai-label">⚡ Fuel Type</label>
                        <select name="fuel" value={form.fuel} onChange={handleChange}>
                            <option value="any">Any Fuel Type</option>
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="electric">Electric (EV)</option>
                        </select>
                    </div>
                    <div className="ai-group">
                        <label className="ai-label">🚗 Car Segment</label>
                        <select name="segment" value={form.segment} onChange={handleChange}>
                            <option value="">Any Segment</option>
                            <option value="hatchback">Hatchback</option>
                            <option value="sedan">Sedan</option>
                            <option value="compact_suv">Compact SUV</option>
                            <option value="midsize_suv">Mid-size SUV</option>
                            <option value="large_suv">Large SUV</option>
                            <option value="mpv">MPV / 7-Seater</option>
                            <option value="luxury_suv">Luxury SUV</option>
                        </select>
                    </div>
                </div>

                <div className="ai-grid-3" style={{ marginTop: '16px' }}>
                    <div className="ai-group">
                        <label className="ai-label">👥 Seating Capacity</label>
                        <select name="seating" value={form.seating} onChange={handleChange}>
                            <option value="1">No Preference</option>
                            <option value="5">5+ Seats</option>
                            <option value="6">6+ Seats</option>
                            <option value="7">7+ Seats</option>
                        </select>
                    </div>
                    <div className="ai-group">
                        <label className="ai-label">⚙️ Transmission</label>
                        <select name="transmission" value={form.transmission} onChange={handleChange}>
                            <option value="">Any Transmission</option>
                            <option value="manual">Manual</option>
                            <option value="automatic">Automatic / CVT / DCT</option>
                        </select>
                    </div>
                    <div className="ai-group">
                        <label className="ai-label">🏭 Brand Origin</label>
                        <select name="brand_origin" value={form.brand_origin} onChange={handleChange}>
                            <option value="">Any Brand</option>
                            <option value="japanese">Japanese (Maruti, Honda, Toyota)</option>
                            <option value="korean">Korean (Hyundai, Kia)</option>
                            <option value="indian">Indian (Tata, Mahindra)</option>
                            <option value="european">European (VW, Skoda, BMW)</option>
                            <option value="american">American (Jeep, Ford)</option>
                            <option value="chinese">Chinese (MG, BYD)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Priority & Usage ── */}
            <div className="ai-section">
                <div className="ai-section-head"><span>🎯</span>Priority &amp; Usage</div>
                <label className="ai-label" style={{ marginBottom: '10px' }}>⚖️ Top Priority</label>
                <div className="ai-chip-row">
                    {PRIORITIES.map(p => (
                        <button key={p.key}
                            className={`ai-chip${priority === p.key ? ' active' : ''}`}
                            onClick={() => setPriority(p.key)}>
                            {p.label}
                        </button>
                    ))}
                </div>

                <label className="ai-label" style={{ marginTop: '20px', marginBottom: '10px' }}>
                    📍 How will you use it? <span className="ai-hint">(Select all that apply)</span>
                </label>
                <div className="ai-chip-row">
                    {USE_CASES.map(u => (
                        <button key={u.key}
                            className={`ai-tag${useCases.includes(u.key) ? ' active' : ''}`}
                            onClick={() => toggleUseCase(u.key)}>
                            {u.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Premium Features ── */}
            <div className="ai-section">
                <div className="ai-section-head"><span>✨</span>Premium Features (Must-Have)</div>
                <div className="ai-toggle-grid">
                    {FEATURES.map(f => (
                        <div key={f.key}
                            className={`ai-toggle${features[f.key] ? ' active' : ''}`}
                            onClick={() => toggleFeature(f.key)}>
                            <div className="ai-toggle-info">
                                <span>{f.icon}</span>
                                <span>{f.label}</span>
                            </div>
                            <div className="ai-toggle-switch">
                                <div className="ai-toggle-thumb" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Safety & Reliability ── */}
            <div className="ai-section">
                <div className="ai-section-head"><span>🛡️</span>Safety &amp; Reliability</div>

                <label className="ai-label" style={{ marginBottom: '8px' }}>⭐ Minimum Safety Rating (NCAP)</label>
                <div className="ai-stars">
                    {[1,2,3,4,5].map(r => (
                        <button key={r}
                            className={`ai-star${safetyRating >= r ? ' active' : ''}`}
                            onClick={() => toggleStar(r)}>
                            ⭐
                        </button>
                    ))}
                    <span className="ai-star-label">
                        {safetyRating === 0 ? 'Any rating' : `${safetyRating}+ stars`}
                    </span>
                </div>

                <div className="ai-grid-2" style={{ marginTop: '16px' }}>
                    <div className="ai-group">
                        <label className="ai-label">🎈 Minimum Airbags</label>
                        <select name="min_airbags" value={form.min_airbags} onChange={handleChange}>
                            <option value="0">Any Number</option>
                            <option value="2">2+ Airbags</option>
                            <option value="4">4+ Airbags</option>
                            <option value="6">6+ Airbags</option>
                        </select>
                    </div>
                    <div className="ai-group">
                        <label className="ai-label">📋 Minimum Warranty</label>
                        <select name="warranty_years" value={form.warranty_years} onChange={handleChange}>
                            <option value="0">Any Warranty</option>
                            <option value="2">2+ Years</option>
                            <option value="3">3+ Years</option>
                            <option value="4">4+ Years</option>
                            <option value="5">5+ Years</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Submit ── */}
            {error && <div className="ai-error">{error}</div>}
            <button className="ai-submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="ai-spinner" /> Analysing cars…</> : '🔍 Find My Perfect Car'}
            </button>

            {/* ── Results ── */}
            {loading && (
                <div className="ai-loading">
                    <div className="ai-loading-ring" />
                    <p>Analysing 90+ cars with 32 features…</p>
                </div>
            )}

            {results !== null && !loading && (
                results.length === 0
                    ? (
                        <div className="ai-no-results">
                            <div className="ai-no-icon">🔍</div>
                            <p>No cars matched your criteria. Try widening your budget or relaxing filters.</p>
                        </div>
                    )
                    : (
                        <div className="ai-results">
                            <div className="ai-results-header">
                                <span className="ai-results-title">Your Top {results.length} Matches</span>
                                <span className="ai-results-city">📍 {form.city}</span>
                            </div>
                            {results.map((car, i) => (
                                <ResultCard key={car.name + i} car={car} rank={i} />
                            ))}
                        </div>
                    )
            )}
        </div>
    );
};

export default CarAssistant;
