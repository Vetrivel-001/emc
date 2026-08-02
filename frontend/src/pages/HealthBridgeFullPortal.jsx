import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Mail, FileText, Lock, Users, Receipt, AlertTriangle, Send, Check, Plus, ShieldCheck, RefreshCw
} from 'lucide-react';

export const HealthBridgeFullPortal = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('inbox');

  // Data states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ subject: '', body: '' });
  const [pasientjournal, setPasientjournal] = useState([]);
  const [fullmakter, setFullmakter] = useState([]);
  const [newFullmakt, setNewFullmakt] = useState({ attorney_name: '', attorney_national_id: '', valid_until: '2027-12-31' });
  const [frikort, setFrikort] = useState({ spent_amount: 1850.0, exemption_threshold: 3000.0, is_exempt: false });
  const [claims, setClaims] = useState([]);
  const [newClaim, setNewClaim] = useState({ claim_type: 'medical_travel', amount: 450.0, details: '' });
  const [consentLevel, setConsentLevel] = useState('full');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const [msgRes, pjRes, fmRes, fkRes, clRes] = await Promise.all([
        api.get('/HealthBridge-ext/inbox'),
        api.get('/HealthBridge-ext/pasientjournal'),
        api.get('/HealthBridge-ext/fullmakt'),
        api.get('/HealthBridge-ext/frikort'),
        api.get('/HealthBridge-ext/claims')
      ]);
      setMessages(msgRes.data);
      setPasientjournal(pjRes.data);
      setFullmakter(fmRes.data);
      setFrikort(fkRes.data);
      setClaims(clRes.data);
    } catch (err) {
      console.error("Failed to load full portal data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await api.post('/HealthBridge-ext/inbox', newMessage);
      setNewMessage({ subject: '', body: '' });
      setSuccessMsg("Secure message sent to healthcare provider.");
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const handleCreateFullmakt = async (e) => {
    e.preventDefault();
    try {
      await api.post('/HealthBridge-ext/fullmakt', newFullmakt);
      setNewFullmakt({ attorney_name: '', attorney_national_id: '', valid_until: '2027-12-31' });
      setSuccessMsg("Power of Attorney granted successfully.");
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to grant Power of Attorney");
    }
  };

  const handleUpdateConsent = async (lvl) => {
    try {
      await api.put('/HealthBridge-ext/consents', null, { params: { consent_level: lvl } });
      setConsentLevel(lvl);
      setSuccessMsg(`Consent level updated to ${lvl.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to update consent settings");
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      await api.post('/HealthBridge-ext/claims', newClaim);
      setNewClaim({ claim_type: 'medical_travel', amount: 0, details: '' });
      setSuccessMsg("Reimbursement claim submitted to Health Insurance Bureau.");
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to submit reimbursement claim");
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>HealthBridge Complete Digital Portal</h1>
        <p style={{ opacity: 0.9 }}>Unified Health Services • Medical Records, Inbox, Exemption Cards & Power of Attorney</p>
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          <Check size={20} /> {successMsg}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeTab === 'inbox' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('inbox')}>
          <Mail size={16} /> Inbox ({messages.length})
        </button>
        <button className={`btn ${activeTab === 'pasientjournal' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('pasientjournal')}>
          <FileText size={16} /> Hospital Medical Records ({pasientjournal.length})
        </button>
        <button className={`btn ${activeTab === 'consents' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('consents')}>
          <Lock size={16} /> Privacy & Power of Attorney
        </button>
        <button className={`btn ${activeTab === 'frikort' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('frikort')}>
          <Receipt size={16} /> Exemption Card & Refunds
        </button>
      </div>

      {/* TAB 1: INBOX & MESSAGES */}
      {activeTab === 'inbox' && (
        <div className="dashboard-grid-2">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Healthcare Messages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '700' }}>
                    <span>{m.sender_name}</span>
                    <span>{m.created_at.split('T')[0]}</span>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', margin: '0.25rem 0' }}>{m.subject}</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{m.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Send Message to Provider</h3>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" className="form-input" placeholder="e.g. Question regarding prescription dosage" required value={newMessage.subject} onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Message Content</label>
                <textarea className="form-textarea" rows="5" required placeholder="Type your secure message..." value={newMessage.body} onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Send size={16} /> Send Secure Message</button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITAL MEDICAL RECORDS */}
      {activeTab === 'pasientjournal' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>Hospital Electronic Health Records (EHR)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pasientjournal.map((pj) => (
              <div key={pj.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--primary)' }}>{pj.hospital_name} • {pj.department}</span>
                  <span className="badge badge-completed">{pj.note_type}</span>
                </div>
                <h4 style={{ fontWeight: '700', fontSize: '1.125rem', marginTop: '0.25rem' }}>Consultation Note by {pj.doctor_name}</h4>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>{pj.summary}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Date of record: {pj.record_date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONSENTS & POWER OF ATTORNEY */}
      {activeTab === 'consents' && (
        <div className="dashboard-grid-2">
          {/* 3-Tier Consent Controls */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>3-Tier Privacy & Data Sharing Consent</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Select the data access tier granted to treating physicians.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', border: consentLevel === 'basic' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleUpdateConsent('basic')}>
                <div style={{ fontWeight: '700' }}>Basic Access</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Only essential emergency profile and active Primary Doctor access.</div>
              </div>

              <div style={{ padding: '1rem', border: consentLevel === 'basic_plus' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleUpdateConsent('basic_plus')}>
                <div style={{ fontWeight: '700' }}>Basic+ Access</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Includes emergency summary care record, blood work, and lab test results.</div>
              </div>

              <div style={{ padding: '1rem', border: consentLevel === 'full' ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleUpdateConsent('full')}>
                <div style={{ fontWeight: '700' }}>Full Access (Recommended)</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Full integration across hospital EHRs, prescriptions, and medical notes.</div>
              </div>
            </div>
          </div>

          {/* Power of Attorney Administration */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Power of Attorney</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Grant trusted adult family members access to act on your behalf.</p>

            <form onSubmit={handleCreateFullmakt} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Attorney Full Name</label>
                <input type="text" className="form-input" required value={newFullmakt.attorney_name} onChange={(e) => setNewFullmakt({ ...newFullmakt, attorney_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Attorney National Health ID / SSN</label>
                <input type="text" className="form-input" required value={newFullmakt.attorney_national_id} onChange={(e) => setNewFullmakt({ ...newFullmakt, attorney_national_id: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Plus size={16} /> Grant Power of Attorney</button>
            </form>

            <h4 style={{ fontWeight: '700', fontSize: '0.875rem' }}>Active Granted Authorizations:</h4>
            {fullmakter.length === 0 ? <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No active power of attorney granted.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {fullmakter.map((f) => (
                  <div key={f.id} style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '0.8125rem' }}>
                    <strong>{f.attorney_name}</strong> ({f.scope}) • Valid until: {f.valid_until}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EXEMPTION CARD & REIMBURSEMENTS */}
      {activeTab === 'frikort' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Exemption Tracker Banner */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Medical Expense Exemption Card</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Once you pay <strong>$3,000</strong> in eligible out-of-pocket medical deductibles, you receive an automatic exemption card for free healthcare for the rest of the year.
            </p>

            <div style={{ background: '#e2e8f0', borderRadius: '9999px', height: '20px', width: '100%', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ background: 'linear-gradient(90deg, #0284c7 0%, #15803d 100%)', width: `${(frikort.spent_amount / frikort.exemption_threshold) * 100}%`, height: '100%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700' }}>
              <span>Registered Out-of-Pocket Deductibles: ${frikort.spent_amount}</span>
              <span>Annual Cap: ${frikort.exemption_threshold}</span>
            </div>
          </div>

          {/* Submit Reimbursement Claim Form */}
          <div className="dashboard-grid-2">
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Submit Financial Refund Claim</h3>
              <form onSubmit={handleSubmitClaim}>
                <div className="form-group">
                  <label>Claim Category</label>
                  <select className="form-select" value={newClaim.claim_type} onChange={(e) => setNewClaim({ ...newClaim, claim_type: e.target.value })}>
                    <option value="medical_travel">Patient Medical Travel Refund</option>
                    <option value="prescription_coverage">Prescription Medication Coverage Claim</option>
                    <option value="dental">Dental Treatment Refund</option>
                    <option value="patient_injury">Patient Injury Compensation Claim</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Refund Amount Requested ($ USD)</label>
                  <input type="number" className="form-input" required value={newClaim.amount} onChange={(e) => setNewClaim({ ...newClaim, amount: parseFloat(e.target.value) })} />
                </div>

                <div className="form-group">
                  <label>Details / Reason for Reimbursement</label>
                  <textarea className="form-textarea" rows="3" required placeholder="Describe travel details, treatment receipts, or medical expense..." value={newClaim.details} onChange={(e) => setNewClaim({ ...newClaim, details: e.target.value })}></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Claim to Health Insurance Bureau</button>
              </form>
            </div>

            {/* Submitted Claims List */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Submitted Refund Applications</h3>
              {claims.length === 0 ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No submitted reimbursement claims.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {claims.map((c) => (
                    <div key={c.id} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '700' }}>
                        <span style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{c.claim_type}</span>
                        <span className="badge badge-scheduled">{c.status}</span>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '1.125rem', margin: '0.25rem 0' }}>${c.amount}</div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{c.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
