import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const features = [
    {
        num: '01',
        title: 'GARAGE',
        sub: 'All your vehicles in one pit stop',
        desc: 'Add every car, bike, or vehicle you own. Track fuel type, mileage, purchase date, and registration. Your entire fleet at a glance.',
        icon: '🚗'
    },
    {
        num: '02',
        title: 'VAULT',
        sub: 'Zero paperwork chaos',
        desc: 'Upload and store RC, Insurance, PUC, and Driving License documents to the cloud. Access them anywhere — no more digging through glove boxes.',
        icon: '📄'
    },
    {
        num: '03',
        title: 'SERVICE LOGS',
        sub: 'Full maintenance history',
        desc: 'Log every oil change, brake service, tire rotation, and general service. Attach invoices, track costs, and set next-service dates.',
        icon: '🔧'
    },
    {
        num: '04',
        title: 'ALERTS',
        sub: 'Never miss a deadline',
        desc: 'Set smart reminders for insurance renewals, PUC tests, and scheduled services. Priority levels, repeat schedules, and completion tracking built in.',
        icon: '🔔'
    },
];

const aiFeatures = [
    {
        tag: 'KNN ML MODEL',
        title: 'CAR ASSISTANT AI',
        sub: 'Find your perfect car match',
        desc: 'Input your budget, city, fuel preference, use-case, and desired features. Our KNN-powered ML model analyses 90+ Indian cars across 32 parameters to rank and recommend your ideal vehicle.',
        icon: '🤖',
        stats: [
            { value: '90+', label: 'Cars analysed' },
            { value: '32', label: 'Features tracked' },
            { value: 'KNN', label: 'Algorithm' },
        ],
        pills: ['Budget Range', 'Fuel Type', 'Segment', 'Safety Rating', 'ADAS', 'City Roads'],
        accent: '#e8f04a',
        path: '/car-assistant',
    },
    {
        tag: 'AI CHATBOT',
        title: 'FAQ CHATBOT',
        sub: 'Instant answers, anytime',
        desc: 'Ask anything about your vehicle — engine oil, tyre pressure, ADAS systems, insurance tips, EMI calculations, or EV range. Your always-online AI car expert.',
        icon: '💬',
        stats: [
            { value: '24/7', label: 'Always online' },
            { value: '∞', label: 'Questions answered' },
            { value: 'NLP', label: 'Powered by' },
        ],
        pills: ['Maintenance', 'Insurance', 'Tyres', 'ADAS', 'EMI', 'EV Range'],
        accent: '#4af0c8',
        path: '/faq-chatbot',
    },
];

const stats = [
    { value: '90+', label: 'Cars in AI database' },
    { value: '32', label: 'AI analysis features' },
    { value: '5', label: 'Document types stored' },
    { value: '∞', label: 'Vehicles per account' },
];

const Landing = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);

    // Parallax on hero text
    useEffect(() => {
        const handleScroll = () => {
            if (heroRef.current) {
                heroRef.current.style.transform = `translateY(${window.scrollY * 0.25}px)`;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="land">

            {/* ── NAV ── */}
            <nav className="land-nav">
                <div className="land-nav-logo">
                    <span className="land-nav-dot"></span>
                    VAHANSATHI
                </div>
                <div className="land-nav-links">
                    <button className="land-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                    <button className="land-btn-solid" onClick={() => navigate('/register')}>Get Started</button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="land-hero">
                <div className="land-hero-bg">
                    <div className="land-hero-grid"></div>
                    <div className="land-hero-glow"></div>
                    <div className="land-speed-lines"></div>
                </div>

                <div className="land-hero-content" ref={heroRef}>
                    <div className="land-eyebrow">
                        <span className="land-eyebrow-dot"></span>
                        AI-Powered Vehicle Management Platform
                    </div>
                    <h1 className="land-hero-title">
                        <span className="land-title-outline">YOUR</span>
                        <span className="land-title-solid"> VEHICLES.</span>
                        <br />
                        <span className="land-title-outline">YOUR</span>
                        <span className="land-title-solid"> RULES.</span>
                    </h1>
                    <p className="land-hero-sub">
                        One AI-powered dashboard to own, track, and manage every vehicle
                        you've ever driven — with smart recommendations and instant answers.
                    </p>
                    <div className="land-hero-badges">
                        <span className="land-hero-badge">🤖 KNN Car Recommender</span>
                        <span className="land-hero-badge">💬 AI FAQ Chatbot</span>
                        <span className="land-hero-badge">⚡ Real-time Alerts</span>
                    </div>
                    <div className="land-hero-cta">
                        <button className="land-btn-hero" onClick={() => navigate('/register')}>
                            Start for free
                            <span className="land-btn-arrow">→</span>
                        </button>
                        <button className="land-btn-secondary" onClick={() => navigate('/login')}>
                            Already have an account
                        </button>
                    </div>
                </div>

                <div className="land-scroll-hint">
                    <span>SCROLL</span>
                    <div className="land-scroll-line"></div>
                </div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="land-stats">
                {stats.map((s, i) => (
                    <div key={i} className="land-stat">
                        <span className="land-stat-value">{s.value}</span>
                        <span className="land-stat-label">{s.label}</span>
                    </div>
                ))}
            </section>

            {/* ── AI FEATURES ── */}
            <section className="land-ai-section">
                <div className="land-ai-section-inner">
                    <div className="land-section-header">
                        <div className="land-section-tag">POWERED BY AI</div>
                        <h2 className="land-section-title">Intelligent features<br />built for drivers</h2>
                        <p className="land-ai-section-sub">
                            VahanSathi combines vehicle management with powerful AI tools
                            to help you buy smarter and drive worry-free.
                        </p>
                    </div>

                    <div className="land-ai-cards">
                        {aiFeatures.map((ai, i) => (
                            <div key={i} className="land-ai-card" style={{ '--ai-accent': ai.accent }}>
                                <div className="land-ai-card-header">
                                    <div className="land-ai-tag">{ai.tag}</div>
                                    <div className="land-ai-icon">{ai.icon}</div>
                                </div>

                                <h3 className="land-ai-title">{ai.title}</h3>
                                <p className="land-ai-sub">{ai.sub}</p>
                                <p className="land-ai-desc">{ai.desc}</p>

                                <div className="land-ai-stats-row">
                                    {ai.stats.map((s, j) => (
                                        <div key={j} className="land-ai-stat">
                                            <div className="land-ai-stat-val">{s.value}</div>
                                            <div className="land-ai-stat-lbl">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="land-ai-pills">
                                    {ai.pills.map((p, j) => (
                                        <span key={j} className="land-ai-pill">{p}</span>
                                    ))}
                                </div>

                                <button
                                    className="land-ai-cta-btn"
                                    onClick={() => navigate('/register')}
                                >
                                    Try it free
                                    <span className="land-btn-arrow">→</span>
                                </button>

                                <div className="land-ai-card-glow"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="land-features">
                <div className="land-section-header">
                    <div className="land-section-tag">WHAT YOU GET</div>
                    <h2 className="land-section-title">Built for every<br />car owner in India</h2>
                </div>

                <div className="land-features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="land-feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="land-feature-top">
                                <span className="land-feature-num">{f.num}</span>
                                <span className="land-feature-icon">{f.icon}</span>
                            </div>
                            <h3 className="land-feature-title">{f.title}</h3>
                            <p className="land-feature-sub">{f.sub}</p>
                            <p className="land-feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── MARQUEE STRIP ── */}
            <div className="land-marquee-wrap">
                <div className="land-marquee">
                    {Array(3).fill(null).map((_, i) => (
                        <span key={i} className="land-marquee-inner">
                            GARAGE&nbsp;&nbsp;/&nbsp;&nbsp;VAULT&nbsp;&nbsp;/&nbsp;&nbsp;SERVICE LOGS&nbsp;&nbsp;/&nbsp;&nbsp;ALERTS&nbsp;&nbsp;/&nbsp;&nbsp;AI RECOMMENDER&nbsp;&nbsp;/&nbsp;&nbsp;FAQ CHATBOT&nbsp;&nbsp;/&nbsp;&nbsp;
                        </span>
                    ))}
                </div>
            </div>

            {/* ── HOW IT WORKS ── */}
            <section className="land-how">
                <div className="land-section-header">
                    <div className="land-section-tag">HOW IT WORKS</div>
                    <h2 className="land-section-title">Up and running<br />in 3 steps</h2>
                </div>

                <div className="land-steps">
                    <div className="land-step">
                        <div className="land-step-num">1</div>
                        <div className="land-step-line"></div>
                        <h4 className="land-step-title">Create your account</h4>
                        <p className="land-step-desc">Register in seconds. Upload a profile picture. No credit card needed.</p>
                    </div>
                    <div className="land-step">
                        <div className="land-step-num">2</div>
                        <div className="land-step-line"></div>
                        <h4 className="land-step-title">Add your vehicles</h4>
                        <p className="land-step-desc">Enter your car's brand, model, year, registration number, and fuel type.</p>
                    </div>
                    <div className="land-step">
                        <div className="land-step-num">3</div>
                        <div className="land-step-line"></div>
                        <h4 className="land-step-title">Let AI do the rest</h4>
                        <p className="land-step-desc">Get AI-powered car recommendations, instant chatbot answers, and smart deadline alerts.</p>
                    </div>
                </div>
            </section>

            {/* ── AI TEASER BAND ── */}
            <section className="land-ai-teaser">
                <div className="land-ai-teaser-bg"></div>
                <div className="land-ai-teaser-content">
                    <div className="land-ai-teaser-icon">🤖</div>
                    <div className="land-ai-teaser-text">
                        <div className="land-section-tag">AI CAR CONFIGURATOR</div>
                        <h2 className="land-ai-teaser-title">Not sure which car to buy?</h2>
                        <p className="land-ai-teaser-desc">
                            Tell our KNN model your budget, city, and priorities — it analyses 90+ Indian cars
                            across safety, mileage, ADAS, price and more to give you a personalised ranked shortlist.
                        </p>
                    </div>
                    <button className="land-btn-hero" onClick={() => navigate('/register')}>
                        Find my car
                        <span className="land-btn-arrow">→</span>
                    </button>
                </div>
            </section>

            {/* ── CTA BAND ── */}
            <section className="land-cta-band">
                <div className="land-cta-band-bg"></div>
                <div className="land-cta-band-content">
                    <h2 className="land-cta-title">READY TO TAKE<br />CONTROL?</h2>
                    <p className="land-cta-desc">Join thousands of vehicle owners who use AI to buy smarter, manage records, and never miss a renewal.</p>
                    <div className="land-hero-cta">
                        <button className="land-btn-hero" onClick={() => navigate('/register')}>
                            Create free account
                            <span className="land-btn-arrow">→</span>
                        </button>
                        <button className="land-btn-secondary" onClick={() => navigate('/login')}>
                            Sign in instead
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="land-footer">
                <div className="land-footer-logo">VAHANSATHI</div>
                <p className="land-footer-tagline">AI-Powered · Document Vault · Smart Alerts</p>
                <p className="land-footer-copy">© {new Date().getFullYear()} Vahansathi. Built for India's roads.</p>
            </footer>
        </div>
    );
};

export default Landing;
