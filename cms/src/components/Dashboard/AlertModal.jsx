import React, { useState } from 'react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

export default function AlertModal({ alert, unseenMessages = [], onClose, onNavigateToLexAI, onOpenTimeline }) {
  useBodyScrollLock(Boolean(alert));
  const [copied, setCopied] = useState(false);

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${day}/${month}/${d.getFullYear()}, ${hours}:${minutes} ${ampm}`;
  };

  if (!alert) return null;

  const data = alert.structuredData || {};
  const smsNotes = data.smsNotes || alert.message || '';

  const copyText = (unseenMessages && unseenMessages.length > 1)
    ? unseenMessages.map((m, idx) => `[Reply ${idx + 1}] ${m.text || m.message}`).join('\n\n')
    : smsNotes;

  const handleCopy = () => {
    if (copyText) {
      navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window modal-window-lg"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: 'var(--radius-lg)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><polyline points="12 11 12 17 9 14"></polyline><line x1="12" y1="17" x2="15" y2="14"></line></svg>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>
                SMS Specialist Response
              </h2>
              <span className={`badge ${data.status === 'Approved' ? 'badge-approved' :
                data.status === 'Completed' ? 'badge-completed' : 'badge-pending'
                }`} style={{ marginLeft: '0.5rem' }}>
                {data.status || 'Reviewed'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Case Ref: <strong style={{ color: 'var(--text-main)' }}>{alert.caseId || data.caseId}</strong> |
              Received: {formatDateDMY(alert.createdAt)}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.75rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Structured Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Grid of Key Properties */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid var(--border-subtle)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              borderTop: '3px solid var(--text-muted)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                Assigned Case Category
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {data.category || 'Standard Legal Review'}
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid var(--border-subtle)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              borderTop: '3px solid #059669'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                Reviewing Authority
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#059669' }}>
                {data.reviewerInfo ? data.reviewerInfo.smsId : 'SMS Specialist Desk'}
              </div>
              {data.reviewerInfo?.position && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  {data.reviewerInfo.position}
                </div>
              )}
            </div>
          </div>

          {/* SMS Specialist Notes & Instructions (Doubles as AI Prompt) */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            borderLeft: '4px solid #059669'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#059669',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                subject matter expert Instructions
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  background: copied ? 'rgba(16,185,129,0.1)' : '#fff',
                  borderColor: copied ? '#059669' : 'var(--border-subtle)',
                  color: copied ? '#059669' : 'var(--text-muted)'
                }}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied' : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Instructions
                  </span>
                )}
              </button>
            </div>
            {unseenMessages && unseenMessages.length > 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }}></span>
                  {unseenMessages.length} Unseen Specialist Replies:
                </div>
                {unseenMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '6px',
                      padding: '0.7rem 0.9rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>
                        Reply #{idx + 1}
                      </span>
                      {msg.timestamp && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          {formatDateDMY(msg.timestamp)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {msg.text || msg.message}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{
                margin: '0',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: 'var(--text-main)',
                fontWeight: 500,
                whiteSpace: 'pre-wrap'
              }}>
                {smsNotes}
              </p>
            )}
          </div>

          {/* Action Footer */}
          {onOpenTimeline && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: '#111827',
                  color: '#ffffff',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.86rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  border: '1px solid #111827'
                }}
                onClick={() => {
                  onClose();
                  onOpenTimeline(alert.caseId || data.caseId);
                }}
              >
                <span>💬 Open Case Timeline & Chat ➔</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
