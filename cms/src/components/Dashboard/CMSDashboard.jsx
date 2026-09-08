import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import AlertModal from './AlertModal';
import CaseTimelineModal from './CaseTimelineModal';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const INDIA_DATA = {
  "Andaman and Nicobar Islands": ["Port Blair", "Other"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Other"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Other"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Other"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Ara", "Other"],
  "Chandigarh": ["Chandigarh", "Other"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Other"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa", "Other"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Other"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Other"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Other"],
  "Haryana": ["Faridabad", "Gurugram", "Panipat", "Ambala", "Rohtak", "Karnal", "Hisar", "Other"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Other"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Other"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Other"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Davangere", "Ballari", "Other"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Other"],
  "Ladakh": ["Leh", "Kargil", "Other"],
  "Lakshadweep": ["Kavaratti", "Other"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Rewa", "Other"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Navi Mumbai", "Other"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Other"],
  "Meghalaya": ["Shillong", "Tura", "Cherrapunji", "Other"],
  "Mizoram": ["Aizawl", "Lunglei", "Other"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Other"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Other"],
  "Puducherry": ["Puducherry", "Karaikal", "Ozhukarai", "Other"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Other"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Other"],
  "Sikkim": ["Gangtok", "Namchi", "Other"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Other"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Other"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Other"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Bareilly", "Aligarh", "Noida", "Other"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Other"],
  "West Bengal": ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Kharagpur", "Howrah", "Other"],
  "Other": ["Other"]
};
const INDIAN_STATES = Object.keys(INDIA_DATA).sort();

export default function CMSDashboard({ user, onNavigateToLexAI, showMobileSmsReplies, onCloseMobileSmsReplies }) {
  useBodyScrollLock(Boolean(showMobileSmsReplies));
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedAlertUnseen, setSelectedAlertUnseen] = useState([]);
  const [viewTimelineCase, setViewTimelineCase] = useState(null);

  // New Case Form
  const [formData, setFormData] = useState({
    clientName: '',
    age: '',
    sex: '',
    city: '',
    state: '',
    category: '',
    details: '',
    targetSme: ''
  });
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Fetch Cases and Alerts with live interval polling
  const loadData = async () => {
    try {
      const currentClientId = user?.clientId || 'GUEST-01';
      const casesRes = await api.getCases(currentClientId);
      setCases(casesRes || []);
      const myCaseIds = new Set((casesRes || []).map(c => c.id));

      const alertsRes = await api.getAlerts();
      const myAlerts = alertsRes.filter(a => myCaseIds.has(a.caseId));

      setAlerts(myAlerts);
    } catch (err) {
      console.error('Error polling data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500); // Live sync every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      files.forEach(f => {
        if (f.size > 100 * 1024 * 1024) {
          alert(`File "${f.name}" exceeds the maximum allowed size.`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          setDocuments(prev => [...prev, {
            name: f.name,
            size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
            url: event.target.result
          }]);
        };
        reader.readAsDataURL(f);
      });
    }
  };

  const removeDoc = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCaseSubmit = async (e) => {
    e.preventDefault();

    if (formData.age < 18 || formData.age > 90) {
      alert('Age must be between 18 and 90 years.');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess('');

    try {
      const currentClientId = user?.clientId || 'GUEST-01';
      // Generate ascending sequential Case ID e.g. CASE-08 -> CASE-09 -> CASE-10
      const allCases = await api.getCases().catch(() => []);
      const existingIds = new Set((allCases || []).map(c => c.id));
      let maxSeq = 0;
      for (const c of (allCases || [])) {
        if (!c.id) continue;
        const match = c.id.match(/^CASE-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num < 1000 && num > maxSeq) {
            maxSeq = num;
          }
        }
      }

      let nextNum = maxSeq + 1;
      let generatedCaseId = `CASE-${nextNum.toString().padStart(2, '0')}`;
      while (existingIds.has(generatedCaseId)) {
        nextNum++;
        generatedCaseId = `CASE-${nextNum.toString().padStart(2, '0')}`;
      }

      const payload = {
        id: generatedCaseId,
        clientId: currentClientId,
        clientName: formData.clientName,
        age: formData.age,
        sex: formData.sex,
        city: formData.city,
        state: formData.state,
        category: formData.category,
        details: formData.details,
        documents: documents,
        targetSme: formData.targetSme
      };

      const res = await api.createCase(payload);
      setSubmitSuccess(`Case registered successfully with ID: ${res.case.id}. Sent to SMS for approval!`);

      // Reset form
      setFormData({
        clientName: '',
        age: '',
        sex: '',
        city: '',
        state: '',
        category: '',
        details: '',
        targetSme: ''
      });
      setDocuments([]);
      loadData();
      setTimeout(() => setSubmitSuccess(''), 6000);
    } catch (err) {
      alert(err.message || 'Failed to submit case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlertClick = async (alert, groupItem) => {
    let unseenList = [];
    if (groupItem && groupItem.alerts) {
      const unreadAlerts = groupItem.alerts.filter(al => !al.read);
      if (unreadAlerts.length > 0) {
        const sorted = [...unreadAlerts].sort((x, y) => new Date(x.createdAt || 0) - new Date(y.createdAt || 0));
        unseenList = sorted.map(al => ({
          text: al.message,
          timestamp: al.createdAt
        }));
      }
    }

    const foundCase = cases.find(c => c.id === alert.caseId);
    if (foundCase && foundCase.chats) {
      const unreadChats = foundCase.chats.filter(ch => ch.sender === 'sms' && ch.readByCms === false);
      if (unreadChats.length > unseenList.length) {
        unseenList = unreadChats.map(ch => ({
          text: ch.text,
          timestamp: ch.timestamp
        }));
      }
    }

    setSelectedAlert(alert);
    setSelectedAlertUnseen(unseenList);

    try {
      await api.markCaseRead(alert.caseId);
    } catch {
      await api.markAlertRead(alert.id);
    }
    loadData();
  };

  // Group alerts by caseId:
  // 1. One box per case even if multiple replies are received
  // 2. All unseen/unread alerts stay visible without limit (e.g. 20 unseen all shown)
  // 3. Seen/read alerts capped to at most 10 (older seen alerts automatically drop off)
  const groupedCaseAlerts = React.useMemo(() => {
    const caseMap = new Map();

    alerts.forEach(a => {
      const cid = a.caseId || 'UNKNOWN';
      if (!caseMap.has(cid)) {
        caseMap.set(cid, []);
      }
      caseMap.get(cid).push(a);
    });

    const groupedList = [];

    caseMap.forEach((caseAlerts, caseId) => {
      caseAlerts.sort((x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0));
      const latestAlert = caseAlerts[0];
      const unseenCount = caseAlerts.filter(a => !a.read).length;
      const isUnseen = unseenCount > 0;

      groupedList.push({
        caseId,
        latestAlert,
        alerts: caseAlerts,
        unseenCount,
        isUnseen,
        latestTime: new Date(latestAlert.createdAt || 0).getTime()
      });
    });

    // Separate unseen and seen
    const unseenList = groupedList.filter(g => g.isUnseen);
    const seenList = groupedList.filter(g => !g.isUnseen);

    // Sort unseen latest first (all preserved, no limit)
    unseenList.sort((a, b) => b.latestTime - a.latestTime);

    // Sort seen latest first and cap to max 10
    seenList.sort((a, b) => b.latestTime - a.latestTime);
    const cappedSeenList = seenList.slice(0, 10);

    return [...unseenList, ...cappedSeenList];
  }, [alerts]);

  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Centered Heading */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div className="powered-by-badge">
          Powered by C-Net Infotech Pvt. Ltd.
        </div>
        <h1 className="dashboard-title">
          CMS <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Case Management System)</span>
        </h1>
        <p className="dashboard-subtitle">
          Register new legal cases, submit case documentation to SMS Specialists for review, track old case processes, and manage AI legal intelligence.
        </p>
      </div>

      {/* Main Grid: Left (Form & Archive) + Right (Live Alerts) */}
      <div className="responsive-dashboard-grid">

        {/* Left Column: Form & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* New Case Registration Card */}
          <div className="glass-box" style={{ padding: '1.75rem 2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  Register & Submit New Case
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  This case will be routed immediately to the Subject Matter Specialist (SMS) for validation
                </div>
              </div>
            </div>

            <form onSubmit={handleCaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Row 1: Name, Age, Sex */}
              <div className="responsive-form-row-3">
                <div className="form-group">
                  <label className="form-label">Client / Applicant Name *</label>
                  <input
                    type="text"
                    name="clientName"
                    className="input-control"
                    placeholder="e.g. Ramesh Chandra"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    name="age"
                    className="input-control"
                    placeholder="e.g. 42"
                    value={formData.age}
                    onChange={handleInputChange}
                    style={formData.age && (formData.age < 18 || formData.age > 90) ? { borderColor: '#ef4444', outlineColor: '#ef4444' } : {}}
                    required
                  />
                  {formData.age && (formData.age < 18 || formData.age > 90) && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500' }}>
                      Age must be between 18 and 90 years.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Sex *</label>
                  <select
                    name="sex"
                    className="select-control"
                    value={formData.sex}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select your gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 2: State, City */}
              <div className="responsive-form-row-2">
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <select
                    name="state"
                    className="select-control"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                    required
                  >
                    <option value="" disabled>Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">City / District *</label>
                  {formData.state === 'Other' ? (
                    <input
                      type="text"
                      name="city"
                      className="input-control"
                      placeholder="Enter your city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <select
                      name="city"
                      className="select-control"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!formData.state}
                      required
                    >
                      <option value="" disabled>{formData.state ? 'Select City' : 'Select State First'}</option>
                      {formData.state && (INDIA_DATA[formData.state] || ['Other']).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Row 2.5: Case Subject (Short Description) */}
              <div className="form-group">
                <label className="form-label">Case Subject *</label>
                <input
                  type="text"
                  name="category"
                  className="input-control"
                  placeholder="e.g. Ancestral Property Dispute / Bail Application"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Row 3: Case Details */}
              <div className="form-group">
                <label className="form-label">facts/ Case Summary *</label>
                <textarea
                  name="details"
                  className="textarea-control"
                  rows="4"
                  placeholder="Describe the legal conflict, parties involved, factual timeline, and specific relief sought..."
                  value={formData.details}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              {/* Row 4: Document Upload */}
              <div className="form-group">
                <label className="form-label">Case Supporting Documents Upload *</label>
                <div style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.01)',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    required={documents.length === 0}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>📄</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>
                    Click or Drag & Drop Documents Here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    PDF, DOCX, Scanned Legal Deeds, Evidence Papers
                  </div>
                </div>

                {/* Document preview chips */}
                {documents.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                          {doc.name}
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>({doc.size})</span>
                        <button
                          type="button"
                          onClick={() => removeDoc(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            padding: '0 2px'
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 5: Target SME & Submit Button */}
              <div className="responsive-form-footer">
                <div className="form-group" style={{ marginBottom: 0, flex: 1, maxWidth: '250px' }}>
                  <label className="form-label">Which SME to send this case file? *</label>
                  <select
                    name="targetSme"
                    className="select-control"
                    value={formData.targetSme}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select your SME</option>
                    <option value="SME-01">SME-01</option>
                    <option value="SME-02">SME-02</option>
                    <option value="SME-03">SME-03</option>
                    <option value="SME-04">SME-04</option>
                    <option value="SME-05">SME-05</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ 
                    padding: '0.85rem 2rem', 
                    fontWeight: '600', 
                    fontSize: '1rem', 
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    height: 'fit-content'
                  }}
                >
                  {submitting ? 'Submitting to SMS...' : 'Submit Case to SMS for Approval ➔'}
                </button>
              </div>

              {submitSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#059669',
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500,
                  marginTop: '0.25rem'
                }}>
                  <span style={{ fontWeight: 700 }}>✓</span> {submitSuccess}
                </div>
              )}
            </form>
          </div>


        </div>

        {/* Right Column: SMS Live Alerts Panel (hidden on mobile/tablet - accessible via navbar icon) */}
        <div className="sms-replies-desktop-panel" style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="glass-box" style={{ padding: '1.5rem 1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <h3 style={{ fontSize: '1.1rem' }}>SMS Live Replies</h3>
              </div>

              {unreadAlertsCount > 0 && (
                <span className="badge" style={{ background: 'var(--accent-rose)', color: '#fff' }}>
                  {unreadAlertsCount} New
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
              Click any reply notification to open the <strong>structured review window</strong> with full details & Lex AI instructions.
            </div>

            {groupedCaseAlerts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: 'var(--text-dim)',
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}>
                No incoming replies from SMS yet. Submitting a case will trigger SMS specialist review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
                {groupedCaseAlerts.map(item => {
                  const a = item.latestAlert;
                  return (
                    <div
                      key={item.caseId}
                      className="glass-box glass-box-interactive"
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-md)',
                        background: item.isUnseen ? 'rgba(37, 99, 235, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        borderLeft: `4px solid ${item.isUnseen ? '#2563eb' : 'var(--border-subtle)'}`,
                        borderTop: '1px solid var(--border-subtle)',
                        borderRight: '1px solid var(--border-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleAlertClick(a, item)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: item.isUnseen ? '#1d4ed8' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span>{a.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          {item.isUnseen && (
                            <span style={{
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              boxShadow: '0 0 6px rgba(37, 99, 235, 0.4)'
                            }}>
                              {item.unseenCount > 1 ? `${item.unseenCount} New` : 'New'}
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {a.message ? a.message : 'Click to view structured response details...'}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.65rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>Ref: <strong style={{ color: 'var(--text-main)' }}>{item.caseId}</strong></span>
                          {item.alerts.length > 1 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                              ({item.alerts.length} replies)
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: item.isUnseen ? '#2563eb' : 'var(--text-muted)', fontWeight: 600 }}>
                            Open Window ➔
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Large Structured SMS Reply Modal */}
      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          unseenMessages={selectedAlertUnseen}
          onClose={() => {
            setSelectedAlert(null);
            setSelectedAlertUnseen([]);
          }}
          onNavigateToLexAI={onNavigateToLexAI}
          onOpenTimeline={(caseId) => {
            const found = cases.find(c => c.id === caseId) || { id: caseId };
            setViewTimelineCase(found);
          }}
        />
      )}

      {/* Case Timeline / Chat Modal */}
      {viewTimelineCase && (
        <CaseTimelineModal
          caseItem={cases.find(c => c.id === viewTimelineCase.id) || viewTimelineCase}
          role="cms"
          currentUser={user}
          onRefresh={loadData}
          onClose={() => setViewTimelineCase(null)}
        />
      )}


      {/* Mobile SMS Live Replies Popup Modal */}
      {showMobileSmsReplies && (
        <div
          className="modal-backdrop"
          onClick={onCloseMobileSmsReplies}
          style={{ zIndex: 1100, overscrollBehavior: 'contain' }}
        >
          <div
            className="modal-window"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '85vh',
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '2px solid black',
              overscrollBehavior: 'contain'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#ffffff',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-muted)' }}>SMS Live Replies</h3>
                {unreadAlertsCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}>
                    {unreadAlertsCount} New
                  </span>
                )}
              </div>
              <button
                onClick={onCloseMobileSmsReplies}
                style={{
                  background: 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1, background: '#f8fafc', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                Click any reply notification to open the <strong>structured review window</strong> with full details & Lex AI instructions.
              </div>

              {groupedCaseAlerts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  color: 'var(--text-dim)',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem'
                }}>
                  No incoming replies from SMS yet. Submitting a case will trigger SMS specialist review.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {groupedCaseAlerts.map(item => {
                    const a = item.latestAlert;
                    return (
                      <div
                        key={item.caseId}
                        className="glass-box glass-box-interactive"
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-md)',
                          background: item.isUnseen ? 'rgba(37, 99, 235, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                          borderLeft: `4px solid ${item.isUnseen ? '#2563eb' : 'var(--border-subtle)'}`,
                          borderTop: '1px solid var(--border-subtle)',
                          borderRight: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          handleAlertClick(a, item);
                          onCloseMobileSmsReplies();
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.5rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: item.isUnseen ? '#1d4ed8' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>{a.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            {item.isUnseen && (
                              <span style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                boxShadow: '0 0 6px rgba(37, 99, 235, 0.4)'
                              }}>
                                {item.unseenCount > 1 ? `${item.unseenCount} New` : 'New'}
                              </span>
                            )}
                          </div>
                        </div>

                        <p style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          margin: 0,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {a.message ? a.message : 'Click to view structured response details...'}
                        </p>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.65rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '0.72rem',
                          color: 'var(--text-dim)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>Ref: <strong style={{ color: 'var(--text-main)' }}>{item.caseId}</strong></span>
                            {item.alerts.length > 1 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                                ({item.alerts.length} replies)
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: item.isUnseen ? '#2563eb' : 'var(--text-muted)', fontWeight: 600 }}>
                              Open Window ➔
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
