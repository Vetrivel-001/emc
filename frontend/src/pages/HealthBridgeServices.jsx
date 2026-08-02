import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Pill, UserCheck, HeartHandshake, CreditCard, ShieldCheck, FileSearch, RefreshCw, Check,
  Mail, FileText, Lock, Users, Receipt, AlertTriangle, Send, Plus, BookOpen, Activity,
  Syringe, FlaskConical, Heart, File, Wrench, Info, Compass, ShieldAlert, Building2
} from 'lucide-react';

export const HealthBridgeServices = () => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Data states
  const [prescriptions, setPrescriptions] = useState([]);
  const [fastlege, setFastlege] = useState(null);
  const [availableFastleger, setAvailableFastleger] = useState([]);
  const [donorCard, setDonorCard] = useState({ is_donor: true, organ_restrictions: 'All organs', next_of_kin_name: '', next_of_kin_phone: '' });
  const [ehic, setEhic] = useState(null);
  const [accessLogs, setAccessLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pasientjournal, setPasientjournal] = useState([]);
  const [fullmakter, setFullmakter] = useState([]);
  const [frikort, setFrikort] = useState({ spent_amount: 1850.0, exemption_threshold: 3040.0, is_exempt: false });
  const [claims, setClaims] = useState([]);
  const [consentLevel, setConsentLevel] = useState('full');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [newMsg, setNewMsg] = useState({ subject: '', body: '' });
  const [newFullmakt, setNewFullmakt] = useState({ attorney_name: '', attorney_national_id: '', valid_until: '2027-12-31' });
  const [newClaim, setNewClaim] = useState({ claim_type: 'pasientreiser', amount: 350.0, details: '' });
  const [newSideEffect, setNewSideEffect] = useState({ medicine_name: '', description: '', severity: 'Moderate' });

  const fetchServicesData = async () => {
    try {
      const [rxRes, gpRes, gplistRes, donorRes, ehicRes, logRes, msgRes, pjRes, fmRes, fkRes, clRes] = await Promise.all([
        api.get('/HealthBridge/prescriptions'),
        api.get('/HealthBridge/fastlege'),
        api.get('/HealthBridge/fastlege/available'),
        api.get('/HealthBridge/donorkort'),
        api.get('/HealthBridge/ehic'),
        api.get('/HealthBridge/access-log'),
        api.get('/HealthBridge-ext/inbox'),
        api.get('/HealthBridge-ext/pasientjournal'),
        api.get('/HealthBridge-ext/fullmakt'),
        api.get('/HealthBridge-ext/frikort'),
        api.get('/HealthBridge-ext/claims')
      ]);
      setPrescriptions(rxRes.data);
      setFastlege(gpRes.data);
      setAvailableFastleger(gplistRes.data);
      setDonorCard(donorRes.data);
      setEhic(ehicRes.data);
      setAccessLogs(logRes.data);
      setMessages(msgRes.data);
      setPasientjournal(pjRes.data);
      setFullmakter(fmRes.data);
      setFrikort(fkRes.data);
      setClaims(clRes.data);
    } catch (err) {
      console.error("Failed to load HealthBridge services", err);
    }
  };

  useEffect(() => {
    fetchServicesData();
  }, []);

  const handleRenewPrescription = async (rxId) => {
    try {
      const res = await api.post(`/HealthBridge/prescriptions/${rxId}/renew`);
      setSuccessMsg(res.data.message);
      fetchServicesData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to request prescription renewal");
    }
  };

  const handleSwitchFastlege = async (docId) => {
    try {
      const res = await api.post(`/HealthBridge/fastlege/switch/${docId}`);
      setSuccessMsg(res.data.message);
      fetchServicesData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to switch GP");
    }
  };

  const handleSaveDonorCard = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/HealthBridge/donorkort', donorCard);
      setDonorCard(res.data);
      setSuccessMsg("Digital Organ Donor Card updated successfully.");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to update donor card");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await api.post('/HealthBridge-ext/inbox', newMsg);
      setNewMsg({ subject: '', body: '' });
      setSuccessMsg("Message sent to health service.");
      fetchServicesData();
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
      setSuccessMsg("Power of Attorney (Fullmakt) granted successfully.");
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
      setSuccessMsg(`Consent tier updated to ${lvl.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to update consent settings");
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      await api.post('/HealthBridge-ext/claims', newClaim);
      setNewClaim({ claim_type: 'pasientreiser', amount: 0, details: '' });
      setSuccessMsg("Claim submitted to Helfo/Pasientreiser.");
      fetchServicesData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to submit claim");
    }
  };

  // 21 Service Categories Definition
  const serviceTabs = [
    { id: 'inbox', title: 'Inbox & Messages', group: 'care', icon: Mail },
    { id: 'referrals', title: 'Referrals Overview', group: 'care', icon: FileText },
    { id: 'patient-records', title: 'Patient Records (Pasientjournal)', group: 'care', icon: FileText },
    { id: 'shared-data', title: 'Shared Health Data', group: 'care', icon: Activity },
    { id: 'fastlege', title: 'Min Fastlege & Waiting List', group: 'care', icon: UserCheck },
    { id: 'treatment-centres', title: 'Choose Treatment Centre', group: 'care', icon: Building2 },
    { id: 'research-screening', title: 'Research & Screening', group: 'care', icon: Activity },
    { id: 'health-contacts', title: 'Health Contacts Directory', group: 'care', icon: Users },

    { id: 'prescriptions', title: 'Prescriptions (E-Resepter)', group: 'overview', icon: Pill },
    { id: 'vaccinations', title: 'Vaccinations Tracker', group: 'overview', icon: Syringe },
    { id: 'tests-examinations', title: 'Tests & Examinations', group: 'overview', icon: FlaskConical },
    { id: 'illnesses-critical', title: 'Illnesses & Critical Info', group: 'overview', icon: Heart },
    { id: 'donorkort', title: 'Donorkort (Organ Donor)', group: 'overview', icon: HeartHandshake },
    { id: 'documents', title: 'Stored Documents', group: 'overview', icon: File },
    { id: 'tools', title: 'Health Tools & Calculators', group: 'overview', icon: Wrench },

    { id: 'frikort', title: 'Exemption Card & User Fees', group: 'finance', icon: Receipt },
    { id: 'patient-travel', title: 'Patient Travel (Pasientreiser)', group: 'finance', icon: Compass },
    { id: 'ehic', title: 'European Health Card (EHIC)', group: 'finance', icon: CreditCard },

    { id: 'health-registers', title: 'Health Registers', group: 'privacy', icon: BookOpen },
    { id: 'report-side-effects', title: 'Report Side Effects (SLV)', group: 'privacy', icon: ShieldAlert },
    { id: 'notify-serious-events', title: 'Notify Serious Events', group: 'privacy', icon: AlertTriangle },
    { id: 'privacy-settings', title: 'Privacy & 3-Tier Consents', group: 'privacy', icon: Lock },
    { id: 'power-of-attorney', title: 'Power of Attorney (Fullmakt)', group: 'privacy', icon: Users },
    { id: 'brukslogg', title: 'Brukslogg (Access Log)', group: 'privacy', icon: FileSearch },
    { id: 'about-services', title: 'About HealthBridge Services', group: 'privacy', icon: Info }
  ];

  const filteredTabs = categoryFilter === 'all'
    ? serviceTabs
    : serviceTabs.filter((t) => t.group === categoryFilter);

  return (
    <div>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>HealthBridge Services Overview</h1>
        <p style={{ opacity: 0.9 }}>Comprehensive 21 Digital Self-Service Categories • Norsk Helsenett SF</p>
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          <Check size={20} /> {successMsg}
        </div>
      )}

      {/* CATEGORY GROUP FILTER BAR */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className={`btn ${categoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8125rem' }} onClick={() => setCategoryFilter('all')}>All 21 Services</button>
        <button className={`btn ${categoryFilter === 'care' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8125rem' }} onClick={() => setCategoryFilter('care')}>Follow-up & Clinical Care</button>
        <button className={`btn ${categoryFilter === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8125rem' }} onClick={() => setCategoryFilter('overview')}>Health Overviews</button>
        <button className={`btn ${categoryFilter === 'finance' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8125rem' }} onClick={() => setCategoryFilter('finance')}>Applications & Refunds</button>
        <button className={`btn ${categoryFilter === 'privacy' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8125rem' }} onClick={() => setCategoryFilter('privacy')}>Quality, Safety & Privacy</button>
      </div>

      {/* 21 TABS HORIZONTAL SCROLLER */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        {filteredTabs.map((tItem) => {
          const IconComponent = tItem.icon;
          return (
            <button
              key={tItem.id}
              className={`btn ${activeTab === tItem.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab(tItem.id)}
            >
              <IconComponent size={15} /> {tItem.title}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. INBOX */}
      {activeTab === 'inbox' && (
        <div className="dashboard-grid-2">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Digital Healthcare Messages ({messages.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.map((m) => (
                <div key={m.id} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>{m.sender_name}</div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', margin: '0.25rem 0' }}>{m.subject}</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{m.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Compose Secure Message</h3>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Subject</label>
                <input type="text" className="form-input" required value={newMsg.subject} onChange={(e) => setNewMsg({ ...newMsg, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Body</label>
                <textarea className="form-textarea" rows="4" required value={newMsg.body} onChange={(e) => setNewMsg({ ...newMsg, body: e.target.value })}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Send size={16} /> Send to GP Clinic</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. REFERRALS */}
      {activeTab === 'referrals' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Specialist Referrals Overview</h3>
          <div style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontWeight: '700' }}>Referral for Cardiology Specialist Consultation</h4>
              <span className="badge badge-scheduled">Under Review</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Referred by Fastlege Dr. Astrid Lindgren to Oslo University Hospital.</p>
          </div>
        </div>
      )}

      {/* 3. PATIENT RECORDS */}
      {activeTab === 'patient-records' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Hospital Electronic Health Records (Pasientjournal)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pasientjournal.map((pj) => (
              <div key={pj.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ fontWeight: '700', color: 'var(--primary)' }}>{pj.hospital_name} • {pj.department}</div>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginTop: '0.25rem' }}>{pj.doctor_name} ({pj.note_type})</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.375rem' }}>{pj.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SHARED HEALTH DATA */}
      {activeTab === 'shared-data' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Shared Health Information (Kjernejournal)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configure critical medical information shared with emergency rooms and hospitals across Norway.</p>
        </div>
      )}

      {/* 5. FASTLEGE & WAITING LIST */}
      {activeTab === 'fastlege' && (
        <div className="dashboard-grid-2">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Your Assigned Fastlege</h3>
            {fastlege && (
              <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '800', color: 'var(--primary)' }}>{fastlege.doctor_name}</h4>
                <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{fastlege.specialization}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{fastlege.clinic_name} • Phone: {fastlege.phone}</p>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Bytte Fastlege (Change GP & Waiting List)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availableFastleger.map((doc) => (
                <div key={doc.doctor_id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{doc.doctor_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.clinic_name} • Cap: {doc.capacity_available}</div>
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => handleSwitchFastlege(doc.doctor_id)}>Select GP</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. CHOOSE TREATMENT CENTRE */}
      {activeTab === 'treatment-centres' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Velg Behandlingssted (Free Choice of Hospital)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Compare hospital wait times and select your preferred public specialist treatment center in Norway.</p>
          <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ fontWeight: '700' }}>Oslo University Hospital (Rikshospitalet)</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Average Wait Time for Cardiology Outpatients: <strong>4 weeks</strong></div>
          </div>
        </div>
      )}

      {/* 7. RESEARCH & SCREENING */}
      {activeTab === 'research-screening' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>National Screening Programs & Health Surveys</h3>
          <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: '700' }}>Bowel Cancer Screening Program</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Eligible age cohort 50–74 • Status: Up to date</div>
          </div>
        </div>
      )}

      {/* 8. HEALTH CONTACTS */}
      {activeTab === 'health-contacts' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Health Contacts Network</h3>
          <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ fontWeight: '700' }}>Dr. Astrid Lindgren (Fastlege)</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Oslo Sentrum Legesenter • +47 2233 4455</div>
          </div>
        </div>
      )}

      {/* 9. PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>E-Resepter (Active Prescriptions)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {prescriptions.map((rx) => (
              <div key={rx.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>{rx.medication_name} ({rx.dosage})</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Valid until: {rx.valid_until} • Dr. {rx.doctor_name}</div>
                </div>
                <button className="btn btn-secondary" disabled={rx.status === 'renewal_requested'} onClick={() => handleRenewPrescription(rx.id)}>
                  <RefreshCw size={14} /> {rx.status === 'renewal_requested' ? 'Requested' : 'Renew'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. VACCINATIONS */}
      {activeTab === 'vaccinations' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>National Immunization Registry (SYSVAK)</h3>
          <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: '700' }}>Influenza Vaccine 2025/2026</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Administered at Oslo Health Center</div>
          </div>
        </div>
      )}

      {/* 11. TESTS & EXAMINATIONS */}
      {activeTab === 'tests-examinations' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Tests & Examinations Results</h3>
          <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ fontWeight: '700' }}>Lipid Panel & Fasting Glucose</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Result: <strong>5.4 mmol/L</strong> (Normal Range)</div>
          </div>
        </div>
      )}

      {/* 12. ILLNESSES & CRITICAL INFO */}
      {activeTab === 'illnesses-critical' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Illnesses & Critical Medical Information</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Emergency medical notes, severe drug allergies, and critical health alerts accessible to paramedics.</p>
        </div>
      )}

      {/* 13. DONORKORT */}
      {activeTab === 'donorkort' && (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Digital Organ Donor Card (Donorkort)</h3>
          <form onSubmit={handleSaveDonorCard}>
            <div className="form-group">
              <label>Organ Donation Consent</label>
              <select className="form-select" value={donorCard.is_donor ? 'yes' : 'no'} onChange={(e) => setDonorCard({ ...donorCard, is_donor: e.target.value === 'yes' })}>
                <option value="yes">Yes, I consent to organ donation</option>
                <option value="no">No, I do not consent</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Digital Donorkort</button>
          </form>
        </div>
      )}

      {/* 14. DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Stored Hospital Documents</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Discharge letters, referral notes, and health certificates.</p>
        </div>
      )}

      {/* 15. TOOLS */}
      {activeTab === 'tools' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Self-Help Health Tools & Calculators</h3>
          <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
            <div style={{ fontWeight: '700' }}>BMI & Cardiovascular Risk Calculator</div>
          </div>
        </div>
      )}

      {/* 16. FRIKORT */}
      {activeTab === 'frikort' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Exemption Card (Frikort 3,040 NOK Threshold)</h3>
          <div style={{ background: '#e2e8f0', borderRadius: '9999px', height: '18px', margin: '1rem 0' }}>
            <div style={{ background: '#15803d', width: `${(frikort.spent_amount / frikort.exemption_threshold) * 100}%`, height: '100%' }}></div>
          </div>
          <div style={{ fontWeight: '700' }}>Registered Egenandeler: {frikort.spent_amount} NOK / {frikort.exemption_threshold} NOK</div>
        </div>
      )}

      {/* 17. PATIENT TRAVEL */}
      {activeTab === 'patient-travel' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Patient Travel Refund (Pasientreiser)</h3>
          <form onSubmit={handleSubmitClaim}>
            <div className="form-group">
              <label>Travel Expense Amount (NOK)</label>
              <input type="number" className="form-input" required value={newClaim.amount} onChange={(e) => setNewClaim({ ...newClaim, amount: parseFloat(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Travel Details</label>
              <textarea className="form-textarea" rows="3" required placeholder="Travel from home to hospital consultation..." value={newClaim.details} onChange={(e) => setNewClaim({ ...newClaim, details: e.target.value })}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Pasientreiser Claim</button>
          </form>
        </div>
      )}

      {/* 18. EHIC */}
      {activeTab === 'ehic' && ehic && (
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '1.5rem', background: '#003399', color: 'white' }}>
          <div style={{ fontSize: '0.75rem', color: '#ffcc00', fontWeight: '800' }}>EUROPEAN HEALTH INSURANCE CARD</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0.5rem 0' }}>{ehic.full_name.toUpperCase()}</div>
          <div style={{ fontSize: '0.875rem' }}>Card No: {ehic.card_number} • Expiry: {ehic.expiry_date}</div>
        </div>
      )}

      {/* 19. HEALTH REGISTERS */}
      {activeTab === 'health-registers' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>National Health Registers Access</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Cancer Registry of Norway, Cause of Death Registry, SYSVAK.</p>
        </div>
      )}

      {/* 20. REPORT SIDE EFFECTS */}
      {activeTab === 'report-side-effects' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Report Drug Side Effects (SLV-PasRapp)</h3>
          <form onSubmit={(e) => { e.preventDefault(); setSuccessMsg("Side effect report submitted to Norwegian Medical Products Agency."); }}>
            <div className="form-group">
              <label>Medicine Name</label>
              <input type="text" className="form-input" required value={newSideEffect.medicine_name} onChange={(e) => setNewSideEffect({ ...newSideEffect, medicine_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Adverse Reaction Description</label>
              <textarea className="form-textarea" rows="3" required value={newSideEffect.description} onChange={(e) => setNewSideEffect({ ...newSideEffect, description: e.target.value })}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit SLV Adverse Report</button>
          </form>
        </div>
      )}

      {/* 21. PRIVACY & BRUKSLOGG */}
      {(activeTab === 'privacy-settings' || activeTab === 'brukslogg' || activeTab === 'power-of-attorney' || activeTab === 'notify-serious-events' || activeTab === 'about-services') && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Privacy Settings, Consents & Brukslogg</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Current Data Access Consent Tier: <strong style={{ color: 'var(--primary)' }}>{consentLevel.toUpperCase()}</strong></p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => handleUpdateConsent('basic')}>Basic Consent</button>
            <button className="btn btn-secondary" onClick={() => handleUpdateConsent('basic_plus')}>Basic+ Consent</button>
            <button className="btn btn-primary" onClick={() => handleUpdateConsent('full')}>Full Consent</button>
          </div>
        </div>
      )}
    </div>
  );
};
