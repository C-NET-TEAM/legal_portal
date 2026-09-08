import React, { useState } from 'react';
import { api, getApiBase } from '../../api';

const CATEGORIES = [
  'Property Law / Real Estate Partition',
  'Civil Litigation & Contract Breach',
  'Criminal Defense & Bail Matter',
  'Corporate & Commercial Disputes',
  'Family & Matrimonial Law',
  'Constitutional & Writ Jurisdiction',
  'Labour & Service Law',
  'Intellectual Property / Trademark'
];

export default function CaseReviewModal({ caseItem, onClose, onReviewSuccess, smsUser }) {
  // Initialize as empty so SMS MUST select an official classification
  const [category, setCategory] = useState('');

  const [smsNotes, setSmsNotes] = useState(caseItem.smsNotes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      await api.reviewCase(caseItem.id, {
        status: 'Approved',
        category,
        smsNotes,
        reviewerInfo: smsUser ? {
          name: `${smsUser.firstName} ${smsUser.lastName}`,
          position: smsUser.position,
          smsId: smsUser.smsId,
          profileImage: smsUser.profileImage
        } : null
      });
      onReviewSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit case approval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-formal" onClick={onClose}>
      <div
        className="modal-window-formal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid var(--border-subtle)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <img src="/sms-icon-transparent.png" alt="SMS Logo" style={{ width: 'clamp(30px, 3.5vw, 48px)', height: 'clamp(30px, 3.5vw, 48px)', objectFit: 'contain', borderRadius: '4px' }} />
              <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontFamily: 'serif', margin: 0, fontWeight: 700 }}>
                OFFICIAL CASE REVIEW
              </h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Client ID: <strong style={{ color: 'var(--text-main)' }}>{caseItem.clientId}</strong> |
              Case ID: <strong style={{ color: 'var(--text-main)' }}>{caseItem.id}</strong> |
              Filed: {formatDateDMY(caseItem.createdAt)}
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

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Case Info Summary Card */}
        <div style={{
          background: 'var(--surface-light)',
          border: '1px solid var(--border-subtle)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>In the Matter Of</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'serif', fontSize: '1.1rem' }}>{caseItem.clientName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Age / Sex</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {caseItem.age || caseItem.sex ? `${caseItem.age || 'N/A'} / ${caseItem.sex || 'N/A'}` : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>City</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{caseItem.city}, {caseItem.state}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Case Subject</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{caseItem.category || 'N/A'}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.2rem' }}>
              Case Summary
            </div>
            <div style={{
              padding: '0.5rem 0',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--text-main)',
              fontFamily: 'serif'
            }}>
              {caseItem.details}
            </div>
          </div>

          {/* Documents */}
          {caseItem.documents && caseItem.documents.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                Exhibits Attached ({caseItem.documents.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {caseItem.documents.map((d, idx) => (
                  <a
                    key={idx}
                    onClick={(e) => handleOpenDocument(e, d.url)}
                    href={d.url || '#'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    📄 Document {idx + 1}: {d.name} <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>({d.size})</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Evaluation & Approval Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="form-group">
            <label className="form-label" style={{ fontFamily: 'serif', fontWeight: 600, fontSize: '1.1rem' }}>
              1. Case Classification
            </label>
            <select
              className="formal-input-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>Select Case Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontFamily: 'serif', fontWeight: 600, fontSize: '1.1rem' }}>
              2. Specialist Verdict & Directives
            </label>
            <textarea
              className="formal-textarea-control"
              rows="3"
              placeholder="Enter official directives, observations, or instructions (including AI prompts) to the CMS client..."
              value={smsNotes}
              onChange={e => setSmsNotes(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem',
            marginTop: '0.5rem'
          }}>
            <button
              type="submit"
              className="formal-btn"
              disabled={loading}
              style={{ padding: '0.85rem 1.75rem', backgroundColor: '#1e3a8a' }}
            >
              {loading ? 'Processing...' : 'Send this review'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
