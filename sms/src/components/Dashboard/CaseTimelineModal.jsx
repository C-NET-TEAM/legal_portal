import React, { useState, useRef, useEffect } from 'react';
import { api, getApiBase } from '../../api';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

export default function CaseTimelineModal({ caseItem, role = 'sms', currentUser, onRefresh, onClose }) {
  useBodyScrollLock();
  const [chatText, setChatText] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [smsPassword, setSmsPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!caseItem) return null;

  // Auto-scroll to bottom when new chats arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [caseItem.chats?.length]);

  // Mark CMS messages read by SMS when timeline is opened
  useEffect(() => {
    if (caseItem?.id && role === 'sms') {
      localStorage.setItem(`sms_read_${caseItem.id}`, new Date().toISOString());
      api.markCaseReadBySms(caseItem.id)
        .then(() => {
          if (onRefresh) onRefresh();
        })
        .catch(() => {});
    }
  }, [caseItem?.id, caseItem?.chats?.length, role]);

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

    if (file.size > 100 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the maximum allowed size.`);
      e.target.value = null;
      return;
    }

    // Reset input
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

  const handleCompleteCase = async () => {
    if (!smsPassword.trim()) {
      alert("Password is required to complete the case.");
      return;
    }
    setIsCompleting(true);
    try {
      await api.completeCase(caseItem.id, currentUser?.smsId, smsPassword);
      setSmsPassword('');
      setShowPasswordPrompt(false);
      if (onRefresh) onRefresh();
      if (onClose) onClose();
      alert("Case completed successfully. It has been moved to the Completed tab.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const isChatActive = caseItem.status === 'Approved' || caseItem.status === 'AI Output Submitted';

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ 
      zIndex: 1000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      overscrollBehavior: 'contain'
    }}>
      <div 
        className="modal-window" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '650px', 
          width: '100%', 
          height: 'auto',
          maxHeight: '92vh',
          padding: '0',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0', 
          padding: 'clamp(0.85rem, 3vw, 1.25rem) clamp(1rem, 3vw, 1.5rem)' 
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'serif' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              {caseItem.clientName || 'Unknown Client'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
              Client ID: <strong style={{ color: '#334155' }}>{caseItem.clientId || 'N/A'}</strong> &nbsp;|&nbsp; Case ID: <strong style={{ color: '#334155' }}>{caseItem.id}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isChatActive && role === 'sms' && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowPasswordPrompt(!showPasswordPrompt)}
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Complete Case ✓
                </button>
                {showPasswordPrompt && (
                  <div style={{ position: 'absolute', top: '120%', right: '0', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: '250px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Enter SMS Password</div>
                    <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={smsPassword}
                        onChange={e => setSmsPassword(e.target.value)}
                        placeholder="Password"
                        style={{ width: '100%', padding: '0.5rem', paddingRight: '2rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', outline: 'none' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCompleteCase();
                        }}
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem' }}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setShowPasswordPrompt(false); setSmsPassword(''); }} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleCompleteCase} disabled={isCompleting || !smsPassword} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', opacity: isCompleting || !smsPassword ? 0.6 : 1 }}>{isCompleting ? '...' : 'Submit'}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.75rem', cursor: 'pointer', lineHeight: 1, padding: 0 }} onMouseOver={e => e.target.style.color='#ef4444'} onMouseOut={e => e.target.style.color='#94a3b8'}>
              &times;
            </button>
          </div>
        </div>

        {/* Timeline Body */}
        <div style={{ 
          position: 'relative', 
          padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 1.5rem)', 
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          background: '#f1f5f9',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          
          {/* CMS Request Bubble */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              padding: '1.25rem', 
              borderRadius: '12px 12px 12px 0', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              maxWidth: '90%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700 }}>CMS Registration</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(caseItem.createdAt)}</div>
                </div>
              </div>
              
              <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {caseItem.details}
              </div>

              {caseItem.documents && caseItem.documents.length > 0 && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Attached Documents ({caseItem.documents.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {caseItem.documents.map((d, idx) => (
                      <a
                        key={idx}
                        onClick={(e) => handleOpenDocument(e, d.url)}
                        href={d.url || '#'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#f8fafc', border: '1px solid #cbd5e1',
                          color: '#334155', padding: '0.35rem 0.65rem', borderRadius: '6px',
                          fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        {d.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Node 2: SMS Response (If any) */}
          {(caseItem.status !== 'Pending' || caseItem.smsNotes) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ 
                background: '#ecfdf5', 
                border: '1px solid #10b981', 
                padding: '1.25rem', 
                borderRadius: '12px 12px 0 12px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                maxWidth: '90%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 700 }}>You(SMS) {caseItem.reviewerInfo?.smsId || currentUser?.smsId || ''}</div>
                    <div style={{ fontSize: '0.7rem', color: '#047857' }}>{formatDate(caseItem.updatedAt)}</div>
                  </div>
                </div>
                
                {caseItem.smsNotes && (
                  <div style={{ fontSize: '0.9rem', color: '#064e3b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {caseItem.smsNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat History */}
          {caseItem.chats && caseItem.chats.length > 0 && caseItem.chats.map((chat, idx) => {
            const isCMS = chat.sender === 'cms';
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isCMS ? 'flex-start' : 'flex-end' }}>
                <div style={{ 
                  background: isCMS ? '#ffffff' : '#ecfdf5', 
                  border: `1px solid ${isCMS ? '#e2e8f0' : '#10b981'}`, 
                  padding: '1.25rem', 
                  borderRadius: isCMS ? '12px 12px 12px 0' : '12px 12px 0 12px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  maxWidth: '90%'
                }}>
                  {isCMS ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>CMS Representative</span>
                          {chat.readBySms === false && (
                            <span style={{
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              New
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(chat.timestamp)}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 700 }}>You(SMS) {chat.senderId || currentUser?.smsId || ''}</div>
                        <div style={{ fontSize: '0.7rem', color: '#047857' }}>{formatDate(chat.timestamp)}</div>
                      </div>
                    </div>
                  )}

                  {chat.text && (
                    <div style={{ fontSize: '0.9rem', color: isCMS ? '#334155' : '#064e3b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {chat.text}
                    </div>
                  )}
                  {chat.documents && chat.documents.length > 0 && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px dashed ${isCMS ? '#e2e8f0' : '#6ee7b7'}` }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: isCMS ? '#94a3b8' : '#047857', fontWeight: 700, marginBottom: '0.5rem', textAlign: isCMS ? 'left' : 'right' }}>
                        Attached Documents ({chat.documents.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: isCMS ? 'flex-start' : 'flex-end' }}>
                        {chat.documents.map((d, i) => (
                          <a key={i} href={d.url} onClick={(e) => handleOpenDocument(e, d.url)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: isCMS ? '#f8fafc' : '#34d399', border: `1px solid ${isCMS ? '#cbd5e1' : '#10b981'}`,
                            color: isCMS ? '#334155' : '#fff', padding: '0.35rem 0.65rem', borderRadius: '6px',
                            fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer'
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            {d.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Box */}
        {isChatActive && (
          <div style={{
            padding: '1rem 1.5rem',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <textarea 
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type a message to reply..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  resize: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  minHeight: '40px',
                  maxHeight: '100px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
              />
            </div>
            {pendingFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  {pendingFile.name} ({pendingFile.size})
                </span>
                <button onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 0.25rem', fontWeight: 'bold' }}>&times;</button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isSending}
                style={{ 
                  background: 'none', border: '1px dashed #cbd5e1', padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                Attach File
              </button>
              <button 
                onClick={handleSendChat}
                disabled={isSending || (!chatText.trim() && !pendingFile)}
                style={{
                  background: '#3b82f6', color: '#fff', border: 'none', padding: '0.5rem 1.25rem',
                  borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: isSending || (!chatText.trim() && !pendingFile) ? 'not-allowed' : 'pointer',
                  opacity: isSending || (!chatText.trim() && !pendingFile) ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        )}

        {!isChatActive && caseItem.status === 'Completed' && (
          <div style={{
            padding: '1rem 1.5rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Messaging is disabled because this case is solved and closed from your side
          </div>
        )}
      </div>
    </div>
  );
}
