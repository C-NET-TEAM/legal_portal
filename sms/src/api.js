const DEFAULT_API_BASE = 'http://localhost:5000/api';

export const getApiBase = () => {
  return localStorage.getItem('sms_api_url') || import.meta.env.VITE_API_URL || DEFAULT_API_BASE;
};

export const setApiBase = (url) => {
  if (!url || url.trim() === '') {
    localStorage.removeItem('sms_api_url');
  } else {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    if (!clean.endsWith('/api')) {
      clean = clean.replace(/\/+$/, '') + '/api';
    }
    localStorage.setItem('sms_api_url', clean);
  }
};

export const api = {
  // SMS Authentication
  async register(payload) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/sms/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register', { cause: data });
    return data;
  },

  async login(smsId, password) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/sms/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smsId, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async changePassword(smsId, oldPassword, newPassword) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/sms/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smsId, oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },

  async getCases() {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases`);
    if (!res.ok) throw new Error('Failed to load cases');
    return await res.json();
  },

  async reviewCase(caseId, reviewPayload) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases/${caseId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit review');
    return data;
  },

  async finalReviewCase(caseId, finalPayload) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases/${caseId}/final-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit final review');
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

  async completeCase(caseId, smsId, password) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases/${caseId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smsId, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete case. Invalid password?');
    return data;
  },

  async getAlerts() {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to load alerts');
    return await res.json();
  },

  async markCaseReadBySms(caseId) {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/cases/${caseId}/mark-sms-read`, {
      method: 'POST'
    });
    return await res.json();
  }
};
