import React, { useState } from 'react';
import { getApiBase, setApiBase } from '../../api';

export default function ServerModal({ onClose }) {
  const [serverUrl, setServerUrl] = useState(getApiBase().replace(/\/api$/, ''));
  const [msg, setMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setApiBase(serverUrl);
    setMsg(`Connected to: ${getApiBase()}`);
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1000);
  };

  const handleReset = () => {
    setApiBase('');
    setServerUrl('http://localhost:5000');
    setMsg('Reset to default http://localhost:5000');
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="modal-backdrop-formal" onClick={onClose}>
      <div className="modal-window-formal" style={{ maxWidth: '480px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'serif', margin: 0 }}>
            <span>🌐</span> Server Configuration
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>

        {msg && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            ✓ {msg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, fontFamily: 'serif' }}>
            Agar backend kisi doosre computer / server par chal raha hai, toh uska IP address yahan daalein:
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontFamily: 'serif', fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>Backend Server URL</label>
            <input
              type="text"
              className="formal-input-control"
              placeholder="e.g. http://192.168.1.15:5000"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              required
            />
            <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Current Active API: <code>{getApiBase()}</code>
            </small>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="formal-btn formal-btn-alt"
              style={{ flex: 1, padding: '0.65rem' }}
              onClick={handleReset}
            >
              Reset to Localhost
            </button>
            <button
              type="submit"
              className="formal-btn"
              style={{ flex: 1, padding: '0.65rem' }}
            >
              Save & Reconnect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
