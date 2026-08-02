import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Activity, Heart, FlaskConical, Syringe, Plus, User, Pill, UserCheck,
  HeartHandshake, CreditCard, ShieldCheck, ArrowUpRight, FileText,
  Mail, Calendar, Lock, AlertCircle, CheckCircle, RefreshCw, XCircle
} from 'lucide-react';

export const PatientDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [fastlege, setFastlege] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [pasientjournal, setPasientjournal] = useState([]);
  const [frikort, setFrikort] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [donorCard, setDonorCard] = useState(null);
  const [ehicCard, setEhicCard] = useState(null);

  // Modals state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showVacModal, setShowVacModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Quick Action Inline Modals
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showGPModal, setShowGPModal] = useState(false);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showEHICModal, setShowEHICModal] = useState(false);

  // Available GPs for switching
  const [availableGPs, setAvailableGPs] = useState([]);

  // Form states
  const [newHistory, setNewHistory] = useState({ condition_name: '', status: 'active', notes: '' });
  const [newLab, setNewLab] = useState({ test_name: '', category: 'Blood Work', result_value: '', reference_range: '' });
  const [newVac, setNewVac] = useState({ vaccine_name: '', dose_number: 1, administered_date: '', provider: 'Municipal Health Clinic' });
  const [newDoc, setNewDoc] = useState({ record_type: 'Medical Document', title: '', description: '' });

  // Quick Action State
  const [selectedRxId, setSelectedRxId] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchData = async () => {
    try {
      const [
        profRes, histRes, labRes, vacRes, recRes,
        rxRes, gpRes, msgRes, friRes, appRes, donRes, ehicRes, pjRes
      ] = await Promise.allSettled([
        api.get('/patients/profile'),
        api.get('/patients/medical-history'),
        api.get('/patients/lab-reports'),
        api.get('/patients/vaccinations'),
        api.get('/patients/records'),
        api.get('/HealthBridge/prescriptions'),
        api.get('/HealthBridge/fastlege'),
        api.get('/HealthBridge-ext/inbox'),
        api.get('/HealthBridge-ext/frikort'),
        api.get('/appointments/my-appointments'),
        api.get('/HealthBridge/donorkort'),
        api.get('/HealthBridge/ehic'),
        api.get('/HealthBridge-ext/pasientjournal')
      ]);

      if (profRes.status === 'fulfilled') setProfile(profRes.value.data);
      if (histRes.status === 'fulfilled') setMedicalHistory(histRes.value.data);
      if (labRes.status === 'fulfilled') setLabReports(labRes.value.data);
      if (vacRes.status === 'fulfilled') setVaccinations(vacRes.value.data);
      if (recRes.status === 'fulfilled') setHealthRecords(recRes.value.data);
      if (rxRes.status === 'fulfilled') setPrescriptions(rxRes.value.data);
      if (gpRes.status === 'fulfilled') setFastlege(gpRes.value.data);
      if (msgRes.status === 'fulfilled') setInbox(msgRes.value.data);
      if (friRes.status === 'fulfilled') setFrikort(friRes.value.data);
      if (appRes.status === 'fulfilled') setAppointments(appRes.value.data);
      if (donRes.status === 'fulfilled') setDonorCard(donRes.value.data);
      if (ehicRes.status === 'fulfilled') setEhicCard(ehicRes.value.data);
      if (pjRes.status === 'fulfilled') setPasientjournal(pjRes.value.data);
    } catch (err) {
      console.error("Failed to load patient dashboard", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddHistory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients/medical-history', newHistory);
      setShowHistoryModal(false);
      setNewHistory({ condition_name: '', status: 'active', notes: '' });
      fetchData();
    } catch (err) {
      alert("Failed to add medical history record");
    }
  };

  const handleAddLab = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients/lab-reports', newLab);
      setShowLabModal(false);
      setNewLab({ test_name: '', category: 'Blood Work', result_value: '', reference_range: '' });
      fetchData();
    } catch (err) {
      alert("Failed to add lab report");
    }
  };

  const handleAddVaccination = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients/vaccinations', newVac);
      setShowVacModal(false);
      setNewVac({ vaccine_name: '', dose_number: 1, administered_date: '', provider: 'Municipal Health Clinic' });
      fetchData();
    } catch (err) {
      alert("Failed to record vaccination");
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients/records', newDoc);
      setShowDocModal(false);
      setNewDoc({ record_type: 'Medical Document', title: '', description: '' });
      fetchData();
    } catch (err) {
      alert("Failed to upload health document");
    }
  };

  // Inline Quick Actions
  const handleRenewPrescription = async (e) => {
    e.preventDefault();
    setActionSuccess('');
    setActionError('');
    try {
      await api.post(`/HealthBridge/prescriptions/${selectedRxId}/renew`);
      setActionSuccess('Prescription renewal request submitted to your GP!');
      setTimeout(() => setShowRenewModal(false), 1500);
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to renew prescription");
    }
  };

  const handleOpenGPSwitchModal = async () => {
    setShowGPModal(true);
    try {
      const res = await api.get('/HealthBridge/fastlege/available');
      setAvailableGPs(res.data);
    } catch (err) {
      console.error("Failed to load available GPs", err);
    }
  };

  const handleSwitchGP = async (gpId) => {
    setActionSuccess('');
    setActionError('');
    try {
      const res = await api.post(`/HealthBridge/fastlege/switch/${gpId}`);
      setActionSuccess(res.data.message || 'GP switched successfully!');
      fetchData();
      setTimeout(() => setShowGPModal(false), 1500);
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to switch GP");
    }
  };

  const handleUpdateDonorCard = async (isDonor) => {
    setActionSuccess('');
    try {
      await api.put('/HealthBridge/donorkort', { is_donor: isDonor, organ_restrictions: 'All organs' });
      setActionSuccess('Digital Organ Donor status updated!');
      fetchData();
      setTimeout(() => setShowDonorModal(false), 1200);
    } catch (err) {
      setActionError("Failed to update organ donor status");
    }
  };

  const exportHealthDataCSV = () => {
    const data = [
      ['Health Passport Export', userName, nationalId],
      ['Blood Group', profile?.blood_group || 'O+'],
      ['Assigned GP', fastlege?.doctor_name || 'GP'],
      ['Medical Conditions', medicalHistory.map(m => m.condition_name).join('; ')],
      ['Lab Reports', labReports.map(l => `${l.test_name}: ${l.result_value}`).join('; ')],
      ['Vaccinations', vaccinations.map(v => `${v.vaccine_name} (Dose ${v.dose_number})`).join('; ')]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `healthbridge_passport_${userName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userName = profile?.user?.full_name || 'Patient';
  const nationalId = profile?.user?.national_id || 'Fødselsnummer Active';

  return (
    <div>
      {/* HERO BANNER */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(255,255,255,0.18)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} /> National Health Journal • {nationalId}
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              Welcome back, {userName}
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Your encrypted health timeline is active and synchronized across public Norwegian healthcare registers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/appointments" className="btn" style={{ background: 'white', color: 'var(--text-main)', fontWeight: '700', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
              <Calendar size={16} /> Book Appointment
            </Link>
            <button onClick={exportHealthDataCSV} className="btn" style={{ background: 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: '700' }}>
              Export Health Passport
            </button>
            <Link to="/full-portal" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: '700' }}>
              Hospital EHR <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* ALERT NOTIFICATIONS BANNER */}
      {appointments.filter(a => a.status === 'scheduled').length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} color="#1d4ed8" />
            <div>
              <strong>Upcoming Consultation:</strong> You have {appointments.filter(a => a.status === 'scheduled').length} scheduled appointment(s).
            </div>
          </div>
          <Link to="/appointments" className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
            View Schedule
          </Link>
        </div>
      )}

      {/* STAT METRICS GRID */}
      <div className="dashboard-grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BLOOD GROUP</span>
            <Activity size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>{profile?.blood_group || 'O+'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', marginTop: '0.25rem' }}>
            ✓ Verified in Kjernejournal
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ASSIGNED FASTLEGE (GP)</span>
            <UserCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fastlege?.doctor_name || 'Dr. Assigned GP'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{fastlege?.clinic_name || 'Oslo Health Clinic'}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ACTIVE PRESCRIPTIONS</span>
            <Pill size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>{prescriptions.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Reseptformidleren Active</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FRIKORT 2026 STATUS</span>
            <CreditCard size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.375rem' }}>
            {frikort?.is_exempt ? 'EXEMPT (Frikort Active)' : `$${frikort?.spent_amount || 0} / $${frikort?.exemption_threshold || 3040}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {frikort?.is_exempt ? 'No copay fee required' : 'Helfo automatic tracking'}
          </div>
        </div>
      </div>

      {/* QUICK INLINE SELF-SERVICE ACTIONS BAR */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>INLINE SELF-SERVICE ACTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div onClick={() => setShowRenewModal(true)} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px' }}>
              <Pill size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>Renew Prescription</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inline request to GP</div>
            </div>
          </div>

          <div onClick={handleOpenGPSwitchModal} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#ecfdf5', color: '#047857', borderRadius: '8px' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>Bytte Fastlege</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Change assigned GP</div>
            </div>
          </div>

          <div onClick={() => setShowDonorModal(true)} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
              <HeartHandshake size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>Digital Donorkort</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Organ donor status</div>
            </div>
          </div>

          <div onClick={() => setShowEHICModal(true)} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#f3e8ff', color: '#6b21a8', borderRadius: '8px' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>Digital EHIC Card</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EU health coverage</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="dashboard-grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* LEFT COLUMN: MEDICAL CONDITIONS */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={20} color="var(--primary)" /> Medical Conditions ({medicalHistory.length})
            </h3>
            <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }} onClick={() => setShowHistoryModal(true)}>
              <Plus size={14} /> Add Condition
            </button>
          </div>

          {medicalHistory.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
              No active medical conditions reported.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {medicalHistory.map((item) => (
                <div key={item.id} style={{ padding: '0.875rem', background: 'var(--bg-subtle)', borderRadius: '10px', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9375rem' }}>{item.condition_name}</span>
                    <span className="badge badge-completed">{item.status}</span>
                  </div>
                  {item.notes && <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>{item.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LAB TEST RESULTS */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FlaskConical size={20} color="var(--secondary)" /> Lab Test Results ({labReports.length})
            </h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }} onClick={() => setShowLabModal(true)}>
              <Plus size={14} /> Add Test
            </button>
          </div>

          {labReports.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
              No lab test records uploaded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {labReports.map((lab) => (
                <div key={lab.id} style={{ padding: '0.875rem', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700' }}>{lab.category || 'BLOOD WORK'}</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem' }}>{lab.test_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span>Result: <strong style={{ color: 'var(--text-main)' }}>{lab.result_value}</strong></span>
                    <span>{lab.report_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECOND TWO-COLUMN GRID: VACCINATIONS & HEALTH DOCUMENTS */}
      <div className="dashboard-grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* VACCINATIONS TRACKER */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Syringe size={20} color="#0d9488" /> Vaccination Records ({vaccinations.length})
            </h3>
            <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }} onClick={() => setShowVacModal(true)}>
              <Plus size={14} /> Record Vaccine
            </button>
          </div>

          {vaccinations.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
              No vaccination records registered.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              {vaccinations.map((vac) => (
                <div key={vac.id} style={{ padding: '0.875rem', background: 'var(--bg-subtle)', borderRadius: '10px', borderLeft: '4px solid #0d9488' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9375rem' }}>{vac.vaccine_name}</span>
                    <span className="badge badge-completed">Dose #{vac.dose_number}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Administered: {vac.administered_date} • Provider: {vac.provider || 'Municipal Health'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HEALTH DOCUMENTS */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="#6366f1" /> Health Documents & EHR ({healthRecords.length})
            </h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }} onClick={() => setShowDocModal(true)}>
              <Plus size={14} /> Upload Record
            </button>
          </div>

          {healthRecords.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
              No uploaded medical documents found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              {healthRecords.map((doc) => (
                <div key={doc.id} style={{ padding: '0.875rem', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '700' }}>{doc.record_type}</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem' }}>{doc.title}</div>
                  {doc.description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{doc.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALS SECTION */}
      {/* RENEW PRESCRIPTION MODAL */}
      {showRenewModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill size={20} color="var(--primary)" /> Renew Prescription Request
            </h3>
            {actionSuccess && <div style={{ background: '#f0fdf4', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{actionSuccess}</div>}
            {actionError && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{actionError}</div>}
            <form onSubmit={handleRenewPrescription}>
              <div className="form-group">
                <label>Select Active Prescription</label>
                <select className="form-input" value={selectedRxId} onChange={(e) => setSelectedRxId(e.target.value)} required>
                  <option value="">-- Choose Prescription --</option>
                  {prescriptions.map((rx) => (
                    <option key={rx.id} value={rx.id}>
                      {rx.medication_name} - {rx.dosage} (Valid until: {rx.valid_until})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRenewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Request to GP</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BYTTE FASTLEGE MODAL */}
      {showGPModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} color="var(--primary)" /> Bytte Fastlege (Change GP)
            </h3>
            {actionSuccess && <div style={{ background: '#f0fdf4', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{actionSuccess}</div>}
            {actionError && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{actionError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {availableGPs.map((gp) => (
                <div key={gp.doctor_id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{gp.doctor_name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{gp.clinic_name} • {gp.specialization}</div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>Capacity available: {gp.capacity_available} slots</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }} onClick={() => handleSwitchGP(gp.doctor_id)}>
                    Select GP
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowGPModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DONORKORT MODAL */}
      {showDonorModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartHandshake size={20} color="#b91c1c" /> Digital Organ Donor Card
            </h3>
            {actionSuccess && <div style={{ background: '#f0fdf4', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{actionSuccess}</div>}
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your organ donor declaration is legally recognized in Norwegian health registers.
            </p>
            <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: '800', color: '#991b1b' }}>
                Status: {donorCard?.is_donor ? 'REGISTERED ORGAN DONOR' : 'NOT REGISTERED'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#7f1d1d', marginTop: '0.25rem' }}>
                Organ Restrictions: {donorCard?.organ_restrictions || 'All organs'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => handleUpdateDonorCard(true)}>Declare as Donor</button>
              <button className="btn btn-danger" onClick={() => handleUpdateDonorCard(false)}>Opt Out</button>
              <button className="btn btn-secondary" onClick={() => setShowDonorModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EHIC MODAL */}
      {showEHICModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="#6b21a8" /> Digital European Health Insurance Card (EHIC)
            </h3>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '0.1em' }}>EUROPEAN HEALTH INSURANCE CARD</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '0.75rem', letterSpacing: '0.05em' }}>
                {ehicCard?.card_number || 'NO-8947-29184-12'}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <div>
                  <div style={{ opacity: 0.7 }}>Holder Name</div>
                  <div style={{ fontWeight: '700' }}>{ehicCard?.full_name || userName}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.7 }}>Expiry Date</div>
                  <div style={{ fontWeight: '700' }}>{ehicCard?.expiry_date || '2028-12-31'}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowEHICModal(false)}>Close Card</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONDITION MODAL */}
      {showHistoryModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Add Medical Condition</h3>
            <form onSubmit={handleAddHistory}>
              <div className="form-group">
                <label>Condition / Diagnosis Name</label>
                <input type="text" className="form-input" required value={newHistory.condition_name} onChange={(e) => setNewHistory({ ...newHistory, condition_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={newHistory.status} onChange={(e) => setNewHistory({ ...newHistory, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="chronic">Chronic</option>
                  <option value="cured">Cured / Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes / Treatment</label>
                <textarea className="form-textarea" rows="3" value={newHistory.notes} onChange={(e) => setNewHistory({ ...newHistory, notes: e.target.value })}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD LAB MODAL */}
      {showLabModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Add Lab Test Result</h3>
            <form onSubmit={handleAddLab}>
              <div className="form-group">
                <label>Test Name</label>
                <input type="text" className="form-input" placeholder="e.g. Hemoglobin A1C" required value={newLab.test_name} onChange={(e) => setNewLab({ ...newLab, test_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" className="form-input" placeholder="e.g. Blood Work / Lipid Panel" value={newLab.category} onChange={(e) => setNewLab({ ...newLab, category: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Result Value</label>
                <input type="text" className="form-input" placeholder="e.g. 5.6 %" required value={newLab.result_value} onChange={(e) => setNewLab({ ...newLab, result_value: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLabModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Result</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VACCINATION MODAL */}
      {showVacModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Record Vaccination</h3>
            <form onSubmit={handleAddVaccination}>
              <div className="form-group">
                <label>Vaccine Name</label>
                <input type="text" className="form-input" placeholder="e.g. Influenza / COVID-19 Booster" required value={newVac.vaccine_name} onChange={(e) => setNewVac({ ...newVac, vaccine_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Dose Number</label>
                <input type="number" className="form-input" min="1" value={newVac.dose_number} onChange={(e) => setNewVac({ ...newVac, dose_number: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="form-group">
                <label>Administered Date</label>
                <input type="date" className="form-input" required value={newVac.administered_date} onChange={(e) => setNewVac({ ...newVac, administered_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Health Provider / Clinic</label>
                <input type="text" className="form-input" value={newVac.provider} onChange={(e) => setNewVac({ ...newVac, provider: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVacModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vaccine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD HEALTH RECORD MODAL */}
      {showDocModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Upload Health Document</h3>
            <form onSubmit={handleAddRecord}>
              <div className="form-group">
                <label>Document Title</label>
                <input type="text" className="form-input" placeholder="e.g. Discharge Summary / X-Ray Report" required value={newDoc.title} onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Document Category</label>
                <select className="form-select" value={newDoc.record_type} onChange={(e) => setNewDoc({ ...newDoc, record_type: e.target.value })}>
                  <option value="Medical Document">Medical Document</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Imaging Report">Imaging Report</option>
                  <option value="Specialist Referral">Specialist Referral</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description / Notes</label>
                <textarea className="form-textarea" rows="3" value={newDoc.description} onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDocModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
