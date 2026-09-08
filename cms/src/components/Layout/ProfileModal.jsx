import React, { useState } from 'react';
import { api } from '../../api';

export default function ProfileModal({ user, onClose, onLogout }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'change'
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(user.clientId, oldPassword, newPassword);
      setMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error changing password' });
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show, onClick }) => (
    <span
      onClick={onClick}
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
      )}
    </span>
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-window" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Client Profile
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
            &times;
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', padding: '4px', borderRadius: '8px', marginBottom: '1.5rem', gap: '4px' }}>
          <button
            className="btn"
            style={{
              flex: 1, padding: '0.5rem', fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === 'details' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'details' ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === 'details' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}
            onClick={() => { setActiveTab('details'); setMsg({ type: '', text: '' }); }}
          >
            My Details
          </button>
          <button
            className="btn"
            style={{
              flex: 1, padding: '0.5rem', fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === 'change' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'change' ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === 'change' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}
            onClick={() => { setActiveTab('change'); setMsg({ type: '', text: '' }); }}
          >
            Security Settings
          </button>
        </div>

        {msg.text && (
          <div style={{
            background: msg.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            color: msg.type === 'error' ? '#ef4444' : '#10b981',
            padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500
          }}>
            {msg.text}
          </div>
        )}

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
              background: 'linear-gradient(to bottom right, rgba(59,130,246,0.05), rgba(6,182,212,0.05))',
              padding: '1.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)', textAlign: 'center'
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
              }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.02em' }}>{user?.name}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                  Client ID: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{user?.clientId}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button type="button" className="btn" style={{ flex: 1, background: '#f1f5f9', color: '#475569', fontWeight: 600, border: '1px solid #e2e8f0' }} onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn" style={{ flex: 1, background: '#fee2e2', color: '#ef4444', fontWeight: 600, border: '1px solid #fca5a5' }} onClick={onLogout}>
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'change' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showOld ? "text" : "password"}
                  className="input-control"
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <EyeIcon show={showOld} onClick={() => setShowOld(!showOld)} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? "text" : "password"}
                  className="input-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <EyeIcon show={showNew} onClick={() => setShowNew(!showNew)} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  className="input-control"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <EyeIcon show={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem', fontWeight: 600 }}>
              {loading ? 'Updating Security...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
