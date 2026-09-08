import React, { useState, useEffect } from 'react';
import SMSDashboard from './components/Dashboard/SMSDashboard';
import ServerModal from './components/Layout/ServerModal';
import SMSLogin from './components/Auth/SMSLogin';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showServerModal, setShowServerModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [smsUser, setSmsUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedSession = localStorage.getItem('sms_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSmsUser(parsed);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('sms_session');
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setSmsUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('sms_session', JSON.stringify(user));
  };

  if (!isAuthenticated) {
    return <SMSLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="sms-layout-formal">
      <main className="sms-main-formal">
        <div className="sms-content-wrapper-formal">
          <SMSDashboard 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenServerModal={() => setShowServerModal(true)}
            smsUser={smsUser}
          />
        </div>
      </main>

      {/* Server IP Configuration Modal */}
      {showServerModal && (
        <ServerModal onClose={() => setShowServerModal(false)} />
      )}
    </div>
  );
}
