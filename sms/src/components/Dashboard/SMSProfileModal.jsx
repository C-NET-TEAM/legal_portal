import React, { useState } from 'react';
import { api } from '../../api';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

export default function SMSProfileModal({ onClose, profileImage, setProfileImage, smsUser }) {
  useBodyScrollLock();
  const [view, setView] = useState('profile'); // 'profile' | 'password'

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    try {
      if (!smsUser || !smsUser.smsId) {
        throw new Error('User not identified.');
      }

      const res = await api.changePassword(smsUser.smsId, oldPassword, newPassword);
      if (res.success) {
        setMsg({ text: 'Security credentials updated successfully.', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          setMsg({ text: '', type: '' });
          setView('profile');
        }, 2000);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Failed to update password.', type: 'error' });
    }
  };

  return (
    <div className="modal-backdrop-formal" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="modal-window-formal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '100%',
          height: 'auto',
          maxHeight: '90vh',
          padding: '1.5rem 1.75rem',
          borderRadius: '8px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
          overflowY: 'auto'
        }}
      >

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'serif', margin: 0, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', letterSpacing: '0.02em' }}>
            {view === 'profile' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            )}
            {view === 'profile' ? 'Official Specialist Profile' : 'Security Settings'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, padding: '0' }} className="hover-text-main">
            &times;
          </button>
        </div>

        {view === 'profile' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Profile Details Badge */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
              padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0',
              textAlign: 'center', boxShadow: 'inset 0 1px 3px rgba(255,255,255,1)'
            }}>
              <div style={{
                width: '56px', height: '56px', background: '#1e3a8a',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#ffffff', marginBottom: '1rem',
                boxShadow: '0 4px 6px -1px rgba(30,58,138,0.2)'
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Specialit ID</div>
              <div style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800, fontFamily: 'serif', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>
                {smsUser ? smsUser.smsId : 'SME-1'}
              </div>
              {smsUser?.position && (
                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, background: '#e2e8f0', padding: '0.2rem 0.75rem', borderRadius: '12px' }}>
                  {smsUser.position}
                </div>
              )}
            </div>

            {/* Bottom Section: Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <button
                className="formal-btn hover-scale"
                onClick={() => setView('password')}
                style={{
                  background: '#ffffff',
                  color: '#1e3a8a',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Change Password
              </button>

              <button
                type="button"
                className="formal-btn hover-scale"
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out of the SMS Specialist Portal?')) {
                    localStorage.removeItem('sms_session');
                    window.location.reload();
                  }
                }}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout Account
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {msg.text && (
              <div style={{
                padding: '0.65rem 0.85rem',
                background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: msg.type === 'success' ? '#059669' : '#dc2626',
                fontSize: '0.82rem',
                borderRadius: '4px',
                border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {msg.type === 'success' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                )}
                <span style={{ fontWeight: 500 }}>{msg.text}</span>
              </div>
            )}

            <div className="form-group" style={{ gap: '0.35rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showOld ? "text" : "password"} required value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="formal-input-control" placeholder="Enter current password" style={{ padding: '0.65rem 0.85rem', paddingRight: '2.5rem', fontSize: '0.9rem', borderRadius: '6px' }} />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showOld ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ gap: '0.35rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="formal-input-control" placeholder="Minimum 6 characters" style={{ padding: '0.65rem 0.85rem', paddingRight: '2.5rem', fontSize: '0.9rem', borderRadius: '6px' }} />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showNew ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ gap: '0.35rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="formal-input-control" placeholder="Re-type new password" style={{ padding: '0.65rem 0.85rem', paddingRight: '2.5rem', fontSize: '0.9rem', borderRadius: '6px' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" className="formal-btn" onClick={() => { setView('profile'); setMsg({ text: '', type: '' }); }} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                Cancel
              </button>
              <button type="submit" className="formal-btn" style={{ background: '#1e3a8a', padding: '0.6rem 1.5rem', fontSize: '0.85rem', borderRadius: '6px', boxShadow: '0 2px 4px rgba(30, 58, 138, 0.25)' }}>
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
