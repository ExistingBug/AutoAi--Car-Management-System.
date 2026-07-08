import React, { useState, useRef, useEffect, useCallback } from 'react';
import { askChatbot } from '../api/autoaiApi';

function formatTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const INITIAL_MESSAGES = [
    {
        role: 'bot',
        text: "👋 Hello! I'm your VahanSathi car expert.\nAsk me anything — engine oil, tyres, ADAS, insurance, EMI, EV range, or anything about this platform. I'm here to help!",
        time: formatTime(),
        id: 'init',
    },
];

const FaqChatbot = () => {
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [input, setInput]       = useState('');
    const [busy, setBusy]         = useState(false);
    const [connErr, setConnErr]   = useState(false);
    const bottomRef               = useRef(null);
    const inputRef                = useRef(null);

    // Auto-scroll on every new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMsg = (role, text) =>
        setMessages(prev => [...prev, { role, text, time: formatTime(), id: Date.now() + Math.random() }]);

    const send = useCallback(async () => {
        const q = input.trim();
        if (!q || busy) return;
        setInput('');
        setBusy(true);
        setConnErr(false);
        addMsg('user', q);
        // Typing placeholder
        setMessages(prev => [...prev, { role: 'typing', text: '', time: '', id: 'typing' }]);
        try {
            const data = await askChatbot(q);
            setMessages(prev => prev.filter(m => m.id !== 'typing'));
            addMsg('bot', data.answer || 'Sorry, I could not find an answer to that.');
        } catch {
            setMessages(prev => prev.filter(m => m.id !== 'typing'));
            setConnErr(true);
            addMsg('bot', 'Sorry, I had trouble connecting to the server. Please try again.');
        } finally {
            setBusy(false);
            inputRef.current?.focus();
        }
    }, [input, busy]);

    const handleKey = e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <div className="chat-page feature-page">
            {/* ── Header ── */}
            <div className="chat-hero">
                <div>
                    <div className="ai-eyebrow">AI Assistant</div>
                    <h1 className="page-title">FAQ Chatbot</h1>
                    <p className="page-subtitle">
                        Ask anything about your car — maintenance, insurance, tyres, EMI, ADAS &amp; more
                    </p>
                </div>
                <div className="chat-hero-badge">
                    <span className="chat-badge-icon">🤖</span>
                    <span className="chat-badge-text">Always Online</span>
                </div>
            </div>

            {/* ── Chat Card ── */}
            <div className="chat-card">

                {/* Card header */}
                <div className="chat-card-header">
                    <div className="chat-bot-row">
                        <div className="chat-bot-avatar">🤖</div>
                        <div>
                            <div className="chat-bot-name">VahanSathi Assistant</div>
                            <div className="chat-bot-status">
                                <span className="chat-status-dot" />
                                Online — Ready to help
                            </div>
                        </div>
                    </div>
                    <div className="chat-card-meta">Ask about maintenance,<br />insurance, ADAS &amp; more</div>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {messages.map(m => {
                        if (m.role === 'typing') {
                            return (
                                <div key="typing" className="chat-msg bot">
                                    <div className="chat-msg-avatar">🤖</div>
                                    <div>
                                        <div className="chat-bubble bot">
                                            <span className="chat-dot" />
                                            <span className="chat-dot" />
                                            <span className="chat-dot" />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        const isBot = m.role === 'bot';
                        return (
                            <div key={m.id} className={`chat-msg ${m.role}`}>
                                {isBot && <div className="chat-msg-avatar">🤖</div>}
                                <div>
                                    <div className={`chat-bubble ${m.role}`}>
                                        {m.text.split('\n').map((line, i) => (
                                            <React.Fragment key={i}>{line}{i < m.text.split('\n').length - 1 && <br />}</React.Fragment>
                                        ))}
                                    </div>
                                    <div className={`chat-time ${m.role}`}>{m.time}</div>
                                </div>
                                {!isBot && <div className="chat-msg-avatar user">U</div>}
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Error */}
                {connErr && (
                    <div className="chat-error">
                        ⚠️ Could not reach the chatbot server. Make sure the Flask server is running on port 5000.
                    </div>
                )}

                {/* Input */}
                <div className="chat-input-row">
                    <input
                        ref={inputRef}
                        type="text"
                        className="chat-input"
                        placeholder="Ask a car question…"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        maxLength={300}
                        disabled={busy}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={send}
                        disabled={busy || !input.trim()}
                        title="Send">
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaqChatbot;
