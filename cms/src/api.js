const DEFAULT_API_BASE = 'http://localhost:5000/api';

export const getApiBase = () => {
  return localStorage.getItem('cms_api_url') || import.meta.env.VITE_API_URL || DEFAULT_API_BASE;
};

export const setApiBase = (url) => {
  if (!url || url.trim() === '') {
    localStorage.removeItem('cms_api_url');
  } else {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    if (!clean.endsWith('/api')) {
      clean = clean.replace(/\/+$/, '') + '/api';
    }
    localStorage.setItem('cms_api_url', clean);
  }
};

export const api = {
  // Auth
  async register(clientId, name, password) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, name, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(clientId, password) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async changePassword(clientId, oldPassword, newPassword) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password change failed');
    return data;
  },

  async forgotPassword(clientId, newPassword) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  },

  // Cases
  async getCases(clientId) {
    const API_BASE = getApiBase();
    const url = clientId ? `${API_BASE}/cases?clientId=${encodeURIComponent(clientId)}` : `${API_BASE}/cases`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load cases');
    return await res.json();
  },

  async createCase(caseData) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit case');
    return data;
  },

  async submitLexOutput(caseId, lexOutput) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases/${caseId}/lex-output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lexOutput })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit Lex AI output');
    return data;
  },

  async addChatMessage(caseId, sender, text, documents) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases/${caseId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, text, documents })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send chat message');
    return data;
  },

  // Alerts
  async getAlerts() {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to load alerts');
    return await res.json();
  },

  async markAlertRead(alertId) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
      method: 'POST'
    });
    return await res.json();
  },

  async markAllAlertsRead() {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/alerts/mark-all-read`, {
      method: 'POST'
    });
    return await res.json();
  },

  async markCaseRead(caseId) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases/${caseId}/mark-read`, {
      method: 'POST'
    });
    return await res.json();
  }
};
