import React from 'react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onOpenProfile,
  pendingCount,
  unreadRepliesCount,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  onCloseMobile
}) {
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`cms-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div style={{
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              className="cms-brand-logo"
              style={{
                width: '46px',
                height: '46px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                overflow: 'hidden'
              }}
            >
              <img
                src="/Law-icon.jpg"
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: 'scale(1.35)',
                  transformOrigin: 'center center',
                  display: 'block'
                }}
              />
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <h2 style={{ fontSize: '1.18rem', lineHeight: '1.15', fontWeight: 700 }}>
                  CMS PORTAL
                </h2>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.04em' }}>
                  CASE MANAGEMENT
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, marginTop: '0.5rem' }}>

        <button
          className="btn"
          style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.85rem 0' : '0.85rem 1rem',
            background: activeTab === 'dashboard' ? 'rgba(33, 37, 41, 0.05)' : 'transparent',
            borderLeft: activeTab === 'dashboard' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)'
          }}
          onClick={() => handleNavClick('dashboard')}
          title={isCollapsed ? "Dashboard & Cases" : ""}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </span>
          {!isCollapsed && <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>Dashboard & Cases</span>}
          {pendingCount > 0 && !isCollapsed && (
            <span className="badge badge-pending" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          className="btn"
          style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0.85rem 0' : '0.85rem 1rem',
            background: activeTab === 'tracker' ? 'rgba(33, 37, 41, 0.05)' : 'transparent',
            borderLeft: activeTab === 'tracker' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'tracker' ? 'var(--primary)' : 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)'
          }}
          onClick={() => handleNavClick('tracker')}
          title={isCollapsed ? "Cases Tracker" : ""}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          {!isCollapsed && <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>Cases Tracker</span>}
          {unreadRepliesCount > 0 && !isCollapsed && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '9999px',
              lineHeight: '1.2'
            }}>
              {unreadRepliesCount}
            </span>
          )}
        </button>
      </div>



      {/* Collapse Toggle */}
      <div className="sidebar-collapse-toggle" style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '0.75rem',
            padding: '0.5rem',
            width: '100%',
            borderRadius: 'var(--radius-md)'
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', flexShrink: 0 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {!isCollapsed && <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Collapse</span>}
        </button>
      </div>

      {/* Bottom Profile Section */}
      <div className="sidebar-bottom-profile" style={{
        marginTop: '0.25rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div
          onClick={onOpenProfile}
          className="glass-box glass-box-interactive"
          style={{
            padding: isCollapsed ? '0.4rem' : '0.6rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
          title="Click to view profile, change password or logout"
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.name || 'Client User'}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  letterSpacing: '0.02em'
                }}>
                  ID: {user?.clientId}
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
