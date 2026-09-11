import React, { useState, useEffect, useRef } from 'react';
import { api, getApiBase } from '../../api';
import CaseTimelineModal from './CaseTimelineModal';
import CaseReviewModal from './CaseReviewModal';
import ServerModal from '../Layout/ServerModal';
import SMSProfileModal from './SMSProfileModal';

export default function SMSDashboard({ activeTab, setActiveTab, onOpenServerModal, smsUser }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null);
  const [viewTimelineCase, setViewTimelineCase] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRepliesDropdown, setShowRepliesDropdown] = useState(false);
  const repliesDropdownRef = useRef(null);
  const [profileImage, setProfileImage] = useState(() => {
    try {
      return localStorage.getItem('sms_profile_image') || null;
    } catch {
      return null;
    }
  });

  const handleUpdateProfileImage = (newImage) => {
    setProfileImage(newImage);
    try {
      if (newImage) {
        localStorage.setItem('sms_profile_image', newImage);
      } else {
        localStorage.removeItem('sms_profile_image');
      }
    } catch (e) {
      console.error('Failed to save profile image to localStorage:', e);
    }
  };

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

  const loadCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error('Error polling SMS cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  useEffect(() => {
    loadCases();
    const interval = setInterval(loadCases, 2500); // Live poll every 2.5s
    return () => clearInterval(interval);
  }, []);

  // Close replies notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (repliesDropdownRef.current && !repliesDropdownRef.current.contains(e.target)) {
        setShowRepliesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const assignedCases = cases.filter(c => {
    if (c.targetSme && smsUser && c.targetSme !== smsUser.smsId) {
      return false;
    }
    return true;
  });

  // Calculate unread CMS replies for each case (resilient to both DB flag & trailing message detection)
  const getCaseUnreadCmsCount = (c) => {
    if (!c.chats || !Array.isArray(c.chats) || c.chats.length === 0) return 0;

    // 1. If any message explicitly has readBySms === false
    const explicitUnread = c.chats.filter(ch => ch.sender === 'cms' && ch.readBySms === false).length;
    if (explicitUnread > 0) return explicitUnread;

    // 2. Trailing CMS messages (CMS messages sent after the last SMS message, not yet read)
    const lastReadTime = localStorage.getItem(`sms_read_${c.id}`);
    let trailingCmsCount = 0;
    for (let i = c.chats.length - 1; i >= 0; i--) {
      const ch = c.chats[i];
      if (ch.sender === 'sms') {
        break; // Stop at last message sent by SMS
      }
      if (ch.sender === 'cms') {
        if (ch.readBySms !== true) {
          if (!lastReadTime || new Date(ch.timestamp) > new Date(lastReadTime)) {
            trailingCmsCount++;
          }
        }
      }
    }
    return trailingCmsCount;
  };

  const casesWithCmsReplies = assignedCases.filter(c => getCaseUnreadCmsCount(c) > 0);
  const totalUnreadCmsReplies = casesWithCmsReplies.reduce((acc, c) => acc + getCaseUnreadCmsCount(c), 0);

  const pendingCases = assignedCases.filter(c => c.status === 'Pending');
  const underReviewCases = assignedCases.filter(c => c.status === 'Approved' || c.status === 'AI Output Submitted');
  const underReviewUnreadCount = underReviewCases.filter(c => getCaseUnreadCmsCount(c) > 0).length;
  const completedCases = assignedCases.filter(c => c.status === 'Completed');

  const handleOpenCaseTimeline = async (c) => {
    setShowRepliesDropdown(false);
    setViewTimelineCase(c);
    localStorage.setItem(`sms_read_${c.id}`, new Date().toISOString());
    try {
      await api.markCaseReadBySms(c.id);
    } catch (err) {
      // silent
    }
    loadCases();
  };

  const filteredCases = assignedCases.filter(c => {
    const search = searchTerm.toLowerCase();
    const matches =
      (c.id || '').toLowerCase().includes(search) ||
      (c.clientName || '').toLowerCase().includes(search) ||
      (c.city || '').toLowerCase().includes(search) ||
      (c.category || '').toLowerCase().includes(search) ||
      (c.details || '').toLowerCase().includes(search);

    if (activeTab === 'dashboard') return matches && c.status === 'Pending';
    if (activeTab === 'underReview') return matches && (c.status === 'Approved' || c.status === 'AI Output Submitted');
    if (activeTab === 'completed') return matches && c.status === 'Completed';
    return matches;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Top Header */}
      <div className="sms-top-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid var(--border-subtle)',
        paddingBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', flex: 1, minWidth: '200px' }}>
          <img src="/sms-icon-transparent.png" alt="SMS Logo" style={{ width: 'clamp(40px, 6vw, 56px)', height: 'clamp(40px, 6vw, 56px)', objectFit: 'contain', borderRadius: '4px', flexShrink: 0, marginTop: 'clamp(0.1rem, 0.5vw, 0.3rem)' }} />
          <div>
            <h1 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)', fontWeight: 700, fontFamily: 'serif', letterSpacing: '0.02em', color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
              DEPARTMENT OF LEGAL REVIEW
            </h1>
            <p style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subject Matter Specialist (SMS) Command Center
            </p>
            <div style={{ marginTop: '0.4rem' }}>
              <span style={{
                display: 'inline-block',
                fontSize: '0.65rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-light)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px'
              }}>
                Powered by C-NET InfoTech Pvt. Ltd.
              </span>
            </div>
          </div>
        </div>

        {/* Actions: Notification Bell + Profile */}
        <div className="sms-top-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          {/* Notification Bell Button */}
          <button
            onClick={() => setShowRepliesDropdown(!showRepliesDropdown)}
            style={{
              position: 'relative',
              height: '36px',
              boxSizing: 'border-box',
              background: totalUnreadCmsReplies > 0 ? '#fef2f2' : 'var(--surface-light)',
              border: totalUnreadCmsReplies > 0 ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0 0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: totalUnreadCmsReplies > 0 ? '#b91c1c' : 'var(--text-main)',
              boxShadow: totalUnreadCmsReplies > 0 ? '0 0 10px rgba(239, 68, 68, 0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
            title={totalUnreadCmsReplies > 0 ? `${totalUnreadCmsReplies} unread message(s) from CMS` : "CMS Notifications"}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {totalUnreadCmsReplies > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)',
                  animation: 'pulseGlow 2s infinite'
                }}>
                  {totalUnreadCmsReplies}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              CMS Replies
            </span>
          </button>

          {/* Profile Button */}
          <div
            onClick={() => setShowProfileModal(true)}
            style={{
              cursor: 'pointer',
              height: '36px',
              boxSizing: 'border-box',
              padding: '0 0.85rem',
              background: 'var(--surface-light)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--surface-light)'; }}
            title="Profile"
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1 }}>
              {smsUser ? smsUser.smsId : 'SME-1'}
            </div>
          </div>

          {/* Notification Dropdown Panel */}
          {showRepliesDropdown && (
            <div
              ref={repliesDropdownRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'clamp(310px, 90vw, 400px)',
                maxHeight: '460px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                    CMS Client Replies
                  </span>
                  {totalUnreadCmsReplies > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '9999px'
                    }}>
                      {totalUnreadCmsReplies} New
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowRepliesDropdown(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '380px', padding: '0.65rem' }}>
                {casesWithCmsReplies.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem', color: '#10b981' }}>✓</div>
                    <strong>No new replies from CMS clients.</strong>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      All under-review cases and messages are up to date.
                    </div>
                  </div>
                ) : (
                  casesWithCmsReplies.map(c => {
                    const unreadCount = getCaseUnreadCmsCount(c);
                    const latestCmsChat = [...(c.chats || [])].reverse().find(ch => ch.sender === 'cms');
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleOpenCaseTimeline(c)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: '#fff',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          borderLeft: '4px solid #ef4444'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                            {c.id}
                          </span>
                          <span style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {unreadCount} New {unreadCount === 1 ? 'Reply' : 'Replies'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                          <span>{latestCmsChat ? formatDateDMY(latestCmsChat.timestamp) : ''}</span>
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>Open the Case ➔</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row (Clickable Filters) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem'
      }}>
        <div
          onClick={() => setActiveTab('dashboard')}
          className={`formal-panel filter-box ${activeTab === 'dashboard' ? 'active-filter' : ''}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', textTransform: 'uppercase', fontWeight: 700 }}>
            Pending Case Approvals
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
            {pendingCases.length}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('underReview')}
          className={`formal-panel filter-box ${activeTab === 'underReview' ? 'active-filter' : ''}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '0.82rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 700 }}>
            Under Review Cases
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
            {underReviewCases.length}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`formal-panel filter-box ${activeTab === 'completed' ? 'active-filter' : ''}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '0.82rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>
            Completed Cases
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
            {completedCases.length}
          </div>
        </div>
      </div>

      {/* Main Content Area based on Tab */}

      {/* List Filter Area */}
      <div className="formal-panel" style={{ padding: 'clamp(1rem, 3vw, 1.75rem) clamp(1rem, 3vw, 2rem)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontFamily: 'serif', letterSpacing: '0.02em', margin: 0 }}>
              {activeTab === 'dashboard' && 'Docket: Pending Case Approvals'}
              {activeTab === 'underReview' && 'Docket: Under Review Cases'}
              {activeTab === 'completed' && 'Docket: Completed Cases'}
            </h2>
          </div>

          <div style={{ width: '100%', maxWidth: '520px', position: 'relative' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="input-control"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.2rem', fontSize: '0.85rem', borderRadius: '4px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)', fontFamily: 'serif' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <img src="/sms-icon-transparent.png" alt="SMS Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', opacity: 0.6 }} />
              </div>
              <div style={{ fontWeight: 600 }}>The docket is currently clear.</div>
            </div>
          ) : (
            filteredCases.map(c => {
              const unreadCmsCount = getCaseUnreadCmsCount(c);
              const hasUnreadCms = unreadCmsCount > 0;
              return (
                <div
                  key={c.id}
                  className="formal-case-card"
                  onClick={() => {
                    if (c.status === 'Pending') {
                      setSelectedCaseForReview(c);
                    } else {
                      handleOpenCaseTimeline(c);
                    }
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    border: hasUnreadCms ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: '0',
                    background: hasUnreadCms ? '#fff5f5' : 'var(--surface-light)',
                    boxShadow: hasUnreadCms ? '0 2px 8px rgba(239, 68, 68, 0.18)' : '0 1px 3px rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    borderLeft: `4px solid ${hasUnreadCms ? '#ef4444' : c.status === 'Pending' ? '#f59e0b' : c.status === 'Completed' ? '#10b981' : c.status === 'AI Output Submitted' ? '#8b5cf6' : '#3b82f6'}`
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = hasUnreadCms ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 3px 8px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = hasUnreadCms ? '0 2px 8px rgba(239, 68, 68, 0.18)' : '0 1px 3px rgba(0,0,0,0.12)'; }}
                >
                  {/* Top Row: IDs + Badge + Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {c.id}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Client: {c.clientId}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Filed: {formatDateDMY(c.createdAt)}
                      </span>
                    </div>
                    <span style={{
                      borderRadius: '0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.62rem',
                      padding: '0.15rem 0.5rem',
                      fontWeight: 700,
                      color: c.status === 'Pending' ? '#f59e0b' : c.status === 'Completed' ? '#10b981' : '#3b82f6',
                      background: c.status === 'Pending' ? 'rgba(245,158,11,0.12)' : c.status === 'Completed' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                      border: `1px solid ${c.status === 'Pending' ? 'rgba(245,158,11,0.3)' : c.status === 'Completed' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`
                    }}>
                      {c.status === 'Approved' ? 'Under Review' : c.status === 'AI Output Submitted' ? 'Under Review' : c.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <span><span style={{ fontWeight: 600 }}>Matter: </span>{c.clientName}</span>
                    <span><span style={{ fontWeight: 600 }}>Age/Sex: </span>{c.age || c.sex ? `${c.age || 'N/A'}/${c.sex || 'N/A'}` : 'N/A'}</span>
                    <span><span style={{ fontWeight: 600 }}>City: </span>{c.city}, {c.state}</span>
                    {c.category && <span><span style={{ fontWeight: 600 }}>Subject: </span>{c.category}</span>}
                  </div>

                  {/* Summary - single line truncated */}
                  {c.details && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>Summary: </span>{c.details}
                    </div>
                  )}

                  {/* Documents & Action - compact inline */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1, minWidth: '200px' }}>
                      {c.documents && c.documents.length > 0 && c.documents.map((d, i) => (
                        <a key={i} onClick={(e) => handleOpenDocument(e, d.url)} href={d.url || '#'} style={{ display: 'inline-block', fontSize: '0.68rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text-main)', padding: '1px 6px', textDecoration: 'none', cursor: 'pointer' }}>
                          📄 {d.name}
                        </a>
                      ))}
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {c.status === 'Pending' ? (
                        <button
                          type="button"
                          className="formal-btn"
                          style={{ backgroundColor: '#1e3a8a', padding: '0.35rem 0.95rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedCaseForReview(c); }}
                        >
                          Examine This Case
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="formal-btn"
                          style={{
                            backgroundColor: hasUnreadCms ? '#ef4444' : '#1e3a8a',
                            color: '#ffffff',
                            padding: '0.35rem 0.95rem',
                            fontSize: '0.78rem',
                            fontWeight: hasUnreadCms ? 700 : 600,
                            whiteSpace: 'nowrap',
                            boxShadow: hasUnreadCms ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
                          }}
                          onClick={(e) => { e.stopPropagation(); handleOpenCaseTimeline(c); }}
                        >
                          {hasUnreadCms ? `● View CMS Reply (${unreadCmsCount}) ➔` : 'Open the Case'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>



      {/* Review Modal (Step 1) */}
      {selectedCaseForReview && (
        <CaseReviewModal
          caseItem={selectedCaseForReview}
          onClose={() => setSelectedCaseForReview(null)}
          onReviewSuccess={loadCases}
          smsUser={smsUser}
        />
      )}



      {/* Profile Modal */}
      {showProfileModal && (
        <SMSProfileModal
          onClose={() => setShowProfileModal(false)}
          profileImage={profileImage}
          setProfileImage={handleUpdateProfileImage}
          smsUser={smsUser}
        />
      )}

      {/* Case Timeline Modal */}
      {viewTimelineCase && (
        <CaseTimelineModal
          caseItem={cases.find(c => c.id === viewTimelineCase.id) || viewTimelineCase}
          role="sms"
          currentUser={smsUser}
          onRefresh={loadCases}
          onClose={() => setViewTimelineCase(null)}
        />
      )}
    </div>
  );
}
