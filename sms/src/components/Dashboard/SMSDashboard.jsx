import React, { useState, useEffect } from 'react';
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

  const assignedCases = cases.filter(c => {
    if (c.targetSme && smsUser && c.targetSme !== smsUser.smsId) {
      return false;
    }
    return true;
  });

  const pendingCases = assignedCases.filter(c => c.status === 'Pending');
  const underReviewCases = assignedCases.filter(c => c.status === 'Approved' || c.status === 'AI Output Submitted');
  const completedCases = assignedCases.filter(c => c.status === 'Completed');

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
      <div style={{
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

        {/* Profile Button */}
        <div
          onClick={() => setShowProfileModal(true)}
          style={{
            cursor: 'pointer',
            padding: '0.45rem 1rem',
            background: 'var(--surface-light)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            transition: 'background 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            flexShrink: 0
          }}
          title="Profile"
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
            {smsUser?.smsId?.charAt(0) || 'S'}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {smsUser ? smsUser.smsId : 'SME-1'}
            </div>
          </div>
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
            filteredCases.map(c => (
              <div
                key={c.id}
                className="formal-case-card"
                onClick={() => {
                  if (c.status === 'Pending') {
                    setSelectedCaseForReview(c);
                  } else {
                    setViewTimelineCase(c);
                  }
                }}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0',
                  background: 'var(--surface-light)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  borderLeft: `3px solid ${c.status === 'Pending' ? '#f59e0b' : c.status === 'Completed' ? '#10b981' : c.status === 'AI Output Submitted' ? '#8b5cf6' : '#3b82f6'}`
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; }}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {c.documents && c.documents.length > 0 && c.documents.map((d, i) => (
                      <a key={i} onClick={(e) => handleOpenDocument(e, d.url)} href={d.url || '#'} style={{ display: 'inline-block', fontSize: '0.68rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text-main)', padding: '1px 6px', textDecoration: 'none', cursor: 'pointer' }}>
                        📄 {d.name}
                      </a>
                    ))}
                  </div>
                  {c.status === 'Pending' && (
                    <button
                      type="button"
                      className="formal-btn"
                      style={{ backgroundColor: '#1e3a8a', padding: '0.3rem 0.85rem', fontSize: '0.78rem' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedCaseForReview(c); }}
                    >
                      Examine This Case
                    </button>
                  )}
                </div>
              </div>
            ))
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
