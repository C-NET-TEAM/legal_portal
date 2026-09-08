import React, { useState, useRef, useEffect } from 'react';
import { api, getApiBase } from '../../api';

export default function CaseTimelineModal({ caseItem, role = 'cms', currentUser, onRefresh, onClose }) {
  const [chatText, setChatText] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!caseItem) return null;

  // Auto-scroll to bottom when new chats arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (caseItem?.id && role === 'cms') {
      api.markCaseRead(caseItem.id).catch(() => {});
    }
  }, [caseItem?.id, caseItem?.chats?.length]);

  const handleOpenDocument = (e, url) => {
    e.preventDefault();
    if (!url || url === '#') return;
    let fullUrl = url;
    if (url.startsWith('/')) {
      const base = getApiBase().replace(/\/api\/?$/, '');
      fullUrl = `${base}${url}`;
    }
    fetch(fullUrl)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      })
      .catch(err => {
        console.error('Error opening document:', err);
        window.open(fullUrl, '_blank');
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  const handleSendChat = async () => {
    if (!chatText.trim() && !pendingFile) return;
    setIsSending(true);
    try {
      const docs = pendingFile ? [pendingFile] : [];
      await api.addChatMessage(caseItem.id, role, chatText, docs);
      setChatText('');
      setPendingFile(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error sending message: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = null;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target.result;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      setPendingFile({
        name: file.name,
        size: sizeMb,
        url: base64Url
      });
    };
    reader.readAsDataURL(file);
  };

  const isChatActive = caseItem.status === 'Approved' || caseItem.status === 'AI Output Submitted';

  // Outside box style mapping for status badges & colors
  const getStatusBadgeMeta = (status) => {
    switch (status) {
      case 'Pending':
        return {
          label: 'PENDING',
          color: '#fbbf24',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          reason: 'Specialist review has not started yet. Messaging unlocks automatically once the case moves to Under Review.'
        };
      case 'Completed':
        return {
          label: 'COMPLETED',
          color: '#22d3ee',
          bg: 'rgba(6, 182, 212, 0.15)',
          border: 'rgba(6, 182, 212, 0.35)',
          reason: 'This case has been resolved and marked as complete. The communication history is archived as read-only.'
        };
      case 'Approved':
        return {
          label: 'UNDER REVIEW',
          color: '#34d399',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.35)',
          reason: 'Case is actively undergoing review by the assigned legal specialist.'
        };
      case 'AI Output Submitted':
        return {
          label: 'SMS REVIEW PENDING',
          color: '#c084fc',
          bg: 'rgba(139, 92, 246, 0.15)',
          border: 'rgba(139, 92, 246, 0.35)',
          reason: 'AI output submitted and pending specialist review.'
        };
      default:
        return {
          label: (status || 'UNKNOWN').toUpperCase(),
          color: '#94a3b8',
          bg: '#f1f5f9',
          border: '#e2e8f0',
          reason: 'Case is not currently open for active messaging.'
        };
    }
  };

  const statusMeta = getStatusBadgeMeta(caseItem.status);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)'
    }}>
      <div
        className="modal-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '720px', width: '100%', height: '85vh', maxHeight: '820px',
          padding: '0', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden', background: '#ffffff',
          border: '2px solid #000000',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Chat Header - Black and White Theme */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#111827', color: '#ffffff', padding: '0.9rem 1.25rem',
          borderBottom: '1px solid #1f2937', zIndex: 10, gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#1f2937', color: '#ffffff', border: '1px solid #374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1rem', overflow: 'hidden', flexShrink: 0
            }}>
              {caseItem.reviewerInfo?.profileImage ? (
                <img src={caseItem.reviewerInfo.profileImage} alt="SMS" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                caseItem.reviewerInfo?.name?.charAt(0) || 'S'
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {caseItem.reviewerInfo?.name || 'SMS Specialist Desk'}
                </h2>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  color: statusMeta.color,
                  background: statusMeta.bg,
                  border: `1px solid ${statusMeta.border}`,
                  letterSpacing: '0.04em'
                }}>
                  {statusMeta.label}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '3px' }}>
                Case Ref: <strong style={{ color: '#ffffff' }}>{caseItem.id}</strong> | Client: {caseItem.clientName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.3rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Chat Body (Scrollable, Light Clean Theme) */}
        <div style={{
          padding: '1.5rem', overflowY: 'auto', flex: 1,
          display: 'flex', flexDirection: 'column', gap: '1rem',
          background: '#f8fafc'
        }}>

          {/* System Info: Case Initialized */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
            <div style={{
              background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
              padding: '0.35rem 0.9rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600
            }}>
              Case #{caseItem.id} initialized on {formatDate(caseItem.createdAt)}
            </div>
          </div>

          {/* CMS Initial Request (Right - Black Bubble, White Text) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              background: '#18181b', color: '#ffffff', padding: '0.85rem 1.1rem',
              borderRadius: '14px 2px 14px 14px', maxWidth: '82%',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)', position: 'relative'
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                You (CMS) {currentUser?.clientId ? `- ${currentUser.clientId}` : ''}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {caseItem.details}
              </div>

              {caseItem.documents && caseItem.documents.length > 0 && (
                <div style={{ marginTop: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {caseItem.documents.map((d, idx) => (
                    <a
                      key={idx}
                      onClick={(e) => handleOpenDocument(e, d.url)}
                      href={d.url || '#'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        background: 'rgba(255, 255, 255, 0.12)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '0.3rem 0.6rem', borderRadius: '6px',
                        fontSize: '0.74rem', color: '#ffffff', textDecoration: 'none'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      {d.name}
                    </a>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '0.65rem', color: '#71717a', textAlign: 'right', marginTop: '0.35rem' }}>
                {formatDate(caseItem.createdAt)} <span style={{ color: '#38bdf8' }}>✓✓</span>
              </div>
            </div>
          </div>

          {/* SMS Specialist Initial Reply (Left - White Bubble, Dark Text) */}
          {caseItem.smsNotes && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: '#ffffff', color: '#1e293b', padding: '0.85rem 1.1rem',
                borderRadius: '2px 14px 14px 14px', maxWidth: '82%',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', position: 'relative'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                  {caseItem.reviewerInfo?.name || 'SMS Specialist'}
                </div>

                <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {caseItem.smsNotes}
                </div>

                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'right', marginTop: '0.35rem' }}>
                  {formatDate(caseItem.updatedAt)}
                </div>
              </div>
            </div>
          )}

          {/* Sequential Chat History */}
          {caseItem.chats && caseItem.chats.map((chat, idx) => {
            const isCMS = chat.sender === 'cms';
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: isCMS ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  background: isCMS ? '#18181b' : '#ffffff',
                  color: isCMS ? '#ffffff' : '#1e293b',
                  padding: '0.85rem 1.1rem',
                  borderRadius: isCMS ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                  maxWidth: '82%',
                  border: isCMS ? 'none' : '1px solid #e2e8f0',
                  boxShadow: isCMS ? '0 2px 6px rgba(0, 0, 0, 0.12)' : '0 2px 4px rgba(0, 0, 0, 0.04)'
                }}>
                  {isCMS ? (
                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      You (CMS) {currentUser?.clientId ? `- ${currentUser.clientId}` : ''}
                    </div>
                  ) : (
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                      {caseItem.reviewerInfo?.name || 'SMS Specialist'}
                    </div>
                  )}

                  {chat.text && (
                    <div style={{ fontSize: '0.9rem', color: isCMS ? '#ffffff' : '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {chat.text}
                    </div>
                  )}

                  {chat.documents && chat.documents.length > 0 && (
                    <div style={{ marginTop: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {chat.documents.map((d, i) => (
                        <a
                          key={i}
                          onClick={(e) => handleOpenDocument(e, d.url)}
                          href={d.url || '#'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            background: isCMS ? 'rgba(255, 255, 255, 0.12)' : '#f1f5f9',
                            border: isCMS ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #e2e8f0',
                            padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.74rem',
                            color: isCMS ? '#ffffff' : '#0f172a', textDecoration: 'none'
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          {d.name}
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '0.65rem', color: isCMS ? '#71717a' : '#94a3b8', textAlign: 'right', marginTop: '0.35rem' }}>
                    {formatDate(chat.timestamp)} {isCMS && <span style={{ color: '#38bdf8' }}>✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input or Realistic Status Banner */}
        {isChatActive ? (
          <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.8rem', color: '#0f172a', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  {pendingFile.name}
                </span>
                <button onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.color = '#0f172a';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#475569';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                title="Upload Document"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </button>

              <textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type your message to specialist..."
                style={{
                  flex: 1, padding: '0.65rem 1rem', border: '1px solid #cbd5e1', borderRadius: '20px',
                  resize: 'none', outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit',
                  maxHeight: '100px', minHeight: '42px', background: '#f8fafc', color: '#0f172a'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
              />

              <button
                onClick={handleSendChat}
                disabled={isSending || (!chatText.trim() && !pendingFile)}
                style={{
                  background: '#111827', color: '#ffffff', border: 'none', borderRadius: '50%',
                  width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isSending || (!chatText.trim() && !pendingFile) ? 'not-allowed' : 'pointer',
                  opacity: isSending || (!chatText.trim() && !pendingFile) ? 0.4 : 1,
                  flexShrink: 0, transition: 'background 0.2s ease',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                }}
                title="Send Message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(1px)' }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        ) : (
          /* Realistic Status Banner when Messaging is disabled */
          <div style={{
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '1.1rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.86rem', color: '#475569' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Messaging is disabled. Case status:</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: statusMeta.color,
                background: statusMeta.bg,
                border: `1px solid ${statusMeta.border}`,
                letterSpacing: '0.04em'
              }}>
                {statusMeta.label}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.4 }}>
              {statusMeta.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
