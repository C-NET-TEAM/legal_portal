import React, { useState, useEffect } from 'react';
import { api } from './api';
import Sidebar from './components/Layout/Sidebar';
import CMSDashboard from './components/Dashboard/CMSDashboard';
import CasesTracker from './components/Dashboard/CasesTracker';
import LexAIView from './components/LexAI/LexAIView';
import AuthModal from './components/Auth/AuthModal';
import ProfileModal from './components/Layout/ProfileModal';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tracker' | 'lexai'
  const [showProfile, setShowProfile] = useState(false);
  const [lexContext, setLexContext] = useState({ caseId: '', prompt: '' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadRepliesCount, setUnreadRepliesCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showMobileSmsReplies, setShowMobileSmsReplies] = useState(false);

  // Force sidebar to always open expanded on mobile
  const handleMobileOpen = () => {
    setIsSidebarCollapsed(false);
    setIsMobileOpen(true);
  };

  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      try {
        const [casesRes, alertsRes] = await Promise.all([
          api.getCases(user.clientId).catch(() => []),
          api.getAlerts().catch(() => [])
        ]);
        const myCaseIds = new Set((casesRes || []).map(c => c.id));
        const unreadAlerts = (alertsRes || []).filter(a => myCaseIds.has(a.caseId) && !a.read);
        const unreadChats = (casesRes || []).filter(c =>
          (c.status === 'Approved' || c.status === 'AI Output Submitted') &&
          c.chats && c.chats.some(ch => ch.sender === 'sms' && ch.readByCms === false)
        );
        const uniqueUnreadCaseIds = new Set([
          ...unreadAlerts.map(a => a.caseId),
          ...unreadChats.map(c => c.id)
        ]);
        setUnreadRepliesCount(uniqueUnreadCaseIds.size);
      } catch {
        // silent
      }
    };
    checkUnread();
    const interval = setInterval(checkUnread, 2500);
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('cms_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cms_user');
    setShowProfile(false);
  };

  const handleNavigateToLexAI = (caseId, prompt) => {
    setLexContext({ caseId, prompt });
    setActiveTab('lexai');
  };

  if (!user) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="cms-layout">
      {/* Mobile Sidebar Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar with Navigation and Profile at Bottom */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenProfile={() => setShowProfile(true)}
        unreadRepliesCount={unreadRepliesCount}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main className="cms-main">
        {/* Mobile Top Navbar (<= 768px only) */}
        <header className="mobile-top-bar">
          <button
            onClick={handleMobileOpen}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-main)'
            }}
            title="Open Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              className="navbar-brand-logo"
              style={{
                width: '40px',
                height: '40px',
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
            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.02em', color: 'var(--text-main)', lineHeight: 1 }}>
              CMS PORTAL
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* SMS Live Replies bell icon - mobile only */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setShowMobileSmsReplies(true);
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: unreadRepliesCount > 0 ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                color: unreadRepliesCount > 0 ? '#2563eb' : 'var(--text-muted)',
                border: unreadRepliesCount > 0 ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              title="SMS Live Replies"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadRepliesCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 4px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadRepliesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowProfile(true)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Profile"
            >
              {user?.name?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        <div className="cms-content-wrapper">
          {activeTab === 'dashboard' && (
            <CMSDashboard
              user={user}
              onNavigateToLexAI={handleNavigateToLexAI}
              showMobileSmsReplies={showMobileSmsReplies}
              onCloseMobileSmsReplies={() => setShowMobileSmsReplies(false)}
            />
          )}

          {activeTab === 'tracker' && (
            <CasesTracker
              user={user}
              onNavigateToLexAI={handleNavigateToLexAI}
            />
          )}

          {activeTab === 'lexai' && (
            <LexAIView
              initialCaseId={lexContext.caseId}
              initialPrompt={lexContext.prompt}
            />
          )}
        </div>
      </main>

      {/* Profile & Password Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
