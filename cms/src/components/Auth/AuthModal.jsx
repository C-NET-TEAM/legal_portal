import React, { useState } from 'react';
import { api } from '../../api';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(clientId, name, password);
        onLoginSuccess(res.user);
      } else {
        const res = await api.login(clientId, password);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" style={{ maxWidth: '360px', padding: '1.25rem', margin: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            border: '2px solid var(--border-subtle)'
          }}>
            <img
              src="/Law-icon.jpg"
              alt="Law Icon"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>
            CMS Portal
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Case Management System
          </p>
        </div>

        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.04)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.85rem',
              background: !isRegister ? 'var(--bg-card)' : 'transparent',
              color: !isRegister ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.85rem',
              background: isRegister ? 'var(--bg-card)' : 'transparent',
              color: isRegister ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            New Client Register
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            color: '#fca5a5',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div>
              <strong style={{ display: 'block', color: '#f87171', marginBottom: '0.2rem' }}>
                {error.toLowerCase().includes('exists') || error.toLowerCase().includes('already') ? 'Client Already Registered!' : 'Authentication Failed'}
              </strong>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Adv. Amit Verma"
                value={name}
                onChange={handleNameChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Client ID</label>
            </div>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. USR-101"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1.1rem',
                  userSelect: 'none'
                }}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '0.65rem' }}
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Access Portal'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Powered by C-Net Infotech Pvt. Ltd.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
