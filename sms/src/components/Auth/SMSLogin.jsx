import React, { useState } from 'react';
import { api } from '../../api';

export default function SMSLogin({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // 'login' | 'register'

  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regPosition, setRegPosition] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSmsId, setRegSmsId] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // UI State
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await api.login(loginId, loginPassword);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Login failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    setSuggestions([]);

    if (!regSmsId) {
      setMsg({ text: 'Please provide or generate an SMS ID.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        smsId: regSmsId,
        position: regPosition || 'Subject Matter Specialist',
        password: regPassword
      };

      const res = await api.register(payload);
      if (res.success && res.user) {
        setMsg({ text: 'Registration successful! Logging in...', type: 'success' });
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 1500);
      }
    } catch (err) {
      if (err.cause && err.cause.suggestions) {
        setSuggestions(err.cause.suggestions);
        setMsg({ text: 'SMS ID already exists. Please choose a suggested ID or enter a new one.', type: 'error' });
      } else {
        setMsg({ text: err.message || 'Registration failed', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: view === 'login' ? '400px' : '600px',
        padding: '2.5rem',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/sms-icon-transparent.png" alt="SMS Logo" style={{ width: '64px', height: '64px', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            DEPARTMENT OF LEGAL REVIEW
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            {view === 'login' ? 'Specialist Login Portal' : 'Specialist Registration Portal'}
          </p>
        </div>

        {msg.text && (
          <div style={{
            padding: '0.75rem 1rem',
            background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: msg.type === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.85rem',
            borderRadius: '4px',
            border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontWeight: 500 }}>{msg.text}</span>
          </div>
        )}

        {view === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">SMS ID</label>
              <input
                type="text"
                required
                className="formal-input-control"
                placeholder="Enter SMS ID"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  className="formal-input-control"
                  placeholder="Enter Password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showLoginPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="formal-btn" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>New Specialist? </span>
              <button
                type="button"
                onClick={() => { setView('register'); setMsg({ text: '', type: '' }); }}
                style={{ background: 'none', border: 'none', color: '#1e3a8a', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Register Account
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#080f19ff' }}>
              Powered by C-Net Infotech Pvt. Ltd.
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div className="form-group" style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Unique SMS ID *</span>
              </label>
              <input type="text" required className="formal-input-control" value={regSmsId} onChange={e => setRegSmsId(e.target.value)} placeholder="Enter unique ID" style={{ background: '#fff' }} />

              {suggestions.length > 0 && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>ID already exists. Try these: </span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setRegSmsId(s); setSuggestions([]); setMsg({ text: '', type: '' }); }}
                        style={{ padding: '0.25rem 0.5rem', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Position / Title</label>
                <input type="text" className="formal-input-control" placeholder="e.g. Senior Specialist" value={regPosition} onChange={e => setRegPosition(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    className="formal-input-control"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars, symbol & number"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showRegPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>



            <button type="submit" disabled={loading} className="formal-btn" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Registering...' : 'Register as Specialist'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Already have an ID? </span>
              <button
                type="button"
                onClick={() => { setView('login'); setMsg({ text: '', type: '' }); }}
                style={{ background: 'none', border: 'none', color: '#1e3a8a', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Go to Login
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#080f19ff' }}>
              Powered by C-Net Infotech Pvt. Ltd.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
