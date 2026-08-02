import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Calendar, User, CheckCircle, XCircle, Clock, FileText,
  Search, Pill, PlusCircle, Activity, Stethoscope, Edit3,
  Building, Award, HeartPulse, Eye, FilePlus
} from 'lucide-react';

export const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, patients, prescriptions, profile

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [appLoading, setAppLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [notes, setNotes] = useState('');

  // Patients State
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientEHR, setPatientEHR] = useState(null);
  const [ehrLoading, setEhrLoading] = useState(false);

  // Prescriptions State
  const [issuedRx, setIssuedRx] = useState([]);
  const [rxLoading, setRxLoading] = useState(false);
  const [newRx, setNewRx] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    usage_instructions: '',
    valid_until: ''
  });
  const [rxSuccess, setRxSuccess] = useState('');

  // Doctor Profile State
  const [profile, setProfile] = useState({
    specialization: '',
    qualification: '',
    experience_years: 0,
    license_number: '',
    bio: '',
    consultation_fee: 50.0,
    clinic_name: 'Oslo Municipal Health Center'
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Fetch Appointments
  const fetchAppointments = async () => {
    setAppLoading(true);
    try {
      const res = await api.get('/appointments/my-appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setAppLoading(false);
    }
  };

  // Fetch Patients List
  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const res = await api.get('/doctors/my-patients');
      setPatients(res.data);
    } catch (err) {
      console.error("Failed to load patients", err);
    } finally {
      setPatientsLoading(false);
    }
  };

  // Fetch Doctor Profile
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/doctors/me/profile');
      if (res.data) {
        setProfile({
          specialization: res.data.specialization || 'General Medicine',
          qualification: res.data.qualification || 'MD, General Practice',
          experience_years: res.data.experience_years || 5,
          license_number: res.data.license_number || 'NOR-998241',
          bio: res.data.bio || 'Specialized in primary healthcare and family medicine.',
          consultation_fee: res.data.consultation_fee || 50.0,
          clinic_name: res.data.clinic_name || 'Oslo Municipal Health Center'
        });
      }
    } catch (err) {
      console.error("Failed to load doctor profile", err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch Issued Prescriptions
  const fetchIssuedPrescriptions = async () => {
    setRxLoading(true);
    try {
      const res = await api.get('/doctors/prescriptions/my-issued');
      setIssuedRx(res.data);
    } catch (err) {
      console.error("Failed to load issued prescriptions", err);
    } finally {
      setRxLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchProfile();
    fetchIssuedPrescriptions();
  }, []);

  // Update Appointment Status
  const handleUpdateStatus = async (appId, status) => {
    try {
      await api.put(`/appointments/${appId}`, { status, notes });
      setSelectedApp(null);
      setNotes('');
      fetchAppointments();
    } catch (err) {
      alert("Failed to update appointment");
    }
  };

  // View Detailed Patient EHR
  const handleViewPatientEHR = async (patientId) => {
    setEhrLoading(true);
    try {
      const res = await api.get(`/doctors/patients/${patientId}`);
      setPatientEHR(res.data);
      setSelectedPatient(patientId);
    } catch (err) {
      alert("Could not retrieve patient medical EHR record");
    } finally {
      setEhrLoading(false);
    }
  };

  // Issue New E-Prescription
  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setRxSuccess('');
    try {
      await api.post('/doctors/prescriptions', {
        ...newRx,
        patient_id: parseInt(newRx.patient_id)
      });
      setRxSuccess('E-Prescription issued successfully!');
      setNewRx({
        patient_id: '',
        medication_name: '',
        dosage: '',
        usage_instructions: '',
        valid_until: ''
      });
      fetchIssuedPrescriptions();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to issue prescription");
    }
  };

  // Update Doctor Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    try {
      await api.put('/doctors/profile', profile);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      alert("Failed to update doctor profile");
    }
  };

  const filteredPatients = patients.filter(p => {
    const name = p.user?.full_name?.toLowerCase() || '';
    const email = p.user?.email?.toLowerCase() || '';
    const id = p.id.toString();
    const query = searchPatient.toLowerCase();
    return name.includes(query) || email.includes(query) || id.includes(query);
  });

  return (
    <div className="page-container">
      {/* HEADER BANNER */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Stethoscope size={32} /> Doctor Clinical Portal
            </h1>
            <p style={{ opacity: 0.9, marginTop: '0.25rem' }}>
              Manage consultations, inspect patient medical records, issue e-prescriptions, and manage your clinic profile.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem 1.25rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinic Location</div>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginTop: '0.125rem' }}>{profile.clinic_name}</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('appointments')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Calendar size={18} /> Appointments ({appointments.length})
        </button>

        <button
          className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('patients')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <User size={18} /> Patient Directory & EHR
        </button>

        <button
          className={`btn ${activeTab === 'prescriptions' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('prescriptions')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Pill size={18} /> Issue E-Prescriptions
        </button>

        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Edit3 size={18} /> Clinic Profile Settings
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--primary)" /> Consultation Appointments Schedule
          </h3>

          {appLoading ? (
            <p>Loading doctor schedule...</p>
          ) : appointments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No appointments scheduled at the moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {appointments.map((app) => (
                <div key={app.id} style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Patient #{app.patient_id}</h4>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <span>📅 Date: {app.appointment_date}</span>
                      <span>⏰ Time: {app.appointment_time}</span>
                    </div>
                    {app.reason && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}><strong>Reason:</strong> {app.reason}</p>}
                    {app.notes && <p style={{ fontSize: '0.8125rem', color: 'var(--primary)', marginTop: '0.25rem' }}><strong>Clinical Notes:</strong> {app.notes}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                      onClick={() => {
                        setActiveTab('patients');
                        handleViewPatientEHR(app.patient_id);
                      }}
                    >
                      <Eye size={16} /> View EHR
                    </button>
                    {app.status === 'scheduled' && (
                      <>
                        <button className="btn btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }} onClick={() => setSelectedApp(app)}>
                          <CheckCircle size={16} /> Complete & Add Note
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }} onClick={() => handleUpdateStatus(app.id, 'cancelled')}>
                          <XCircle size={16} /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PATIENTS DIRECTORY & EHR */}
      {activeTab === 'patients' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} color="var(--primary)" /> Registered Patient Directory
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {patientsLoading ? (
              <p>Loading patient directory...</p>
            ) : filteredPatients.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No matching patient profiles found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                {filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleViewPatientEHR(p.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: selectedPatient === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedPatient === p.id ? 'rgba(2,132,199,0.05)' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9375rem' }}>
                        {p.user?.full_name || `Patient #${p.id}`}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        Email: {p.user?.email || 'N/A'} • DOB: {p.date_of_birth || 'Not recorded'}
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
                      Inspect EHR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EHR DETAIL VIEW PANEL */}
          {selectedPatient && (
            <div className="glass-card" style={{ padding: '1.5rem', maxHeight: '700px', overflowY: 'auto' }}>
              {ehrLoading ? (
                <p>Retrieving electronic health record...</p>
              ) : patientEHR ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontWeight: '800' }}>Patient EHR Summary</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{patientEHR.user?.full_name} (Patient ID #{patientEHR.id})</div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedPatient(null)}>
                      Close EHR
                    </button>
                  </div>

                  {/* Basic Profile Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem' }}>
                      <strong>Gender:</strong> {patientEHR.gender || 'Not specified'}
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem' }}>
                      <strong>Blood Group:</strong> {patientEHR.blood_group || 'Unknown'}
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem' }}>
                      <strong>Emergency Contact:</strong> {patientEHR.emergency_contact || 'None'}
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem' }}>
                      <strong>Consent Level:</strong> {patientEHR.consent_level || 'Full'}
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>Active Medical Conditions</h4>
                    {patientEHR.medical_histories?.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No medical conditions recorded.</p>
                    ) : (
                      patientEHR.medical_histories?.map(mh => (
                        <div key={mh.id} style={{ background: '#f8fafc', padding: '0.625rem', borderRadius: '6px', marginBottom: '0.375rem', fontSize: '0.8125rem', border: '1px solid var(--border)' }}>
                          <strong>{mh.condition_name}</strong> - Status: <span className="badge badge-scheduled">{mh.status}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Lab Reports */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>Laboratory Reports</h4>
                    {patientEHR.lab_reports?.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No lab reports recorded.</p>
                    ) : (
                      patientEHR.lab_reports?.map(lab => (
                        <div key={lab.id} style={{ background: '#f8fafc', padding: '0.625rem', borderRadius: '6px', marginBottom: '0.375rem', fontSize: '0.8125rem', border: '1px solid var(--border)' }}>
                          <div><strong>{lab.test_name}</strong> ({lab.category || 'General'})</div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '0.125rem' }}>Result: {lab.result_value} | Ref: {lab.reference_range}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Prescriptions */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>Prescription History</h4>
                    {patientEHR.prescriptions?.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No active prescriptions.</p>
                    ) : (
                      patientEHR.prescriptions?.map(rx => (
                        <div key={rx.id} style={{ background: '#f8fafc', padding: '0.625rem', borderRadius: '6px', marginBottom: '0.375rem', fontSize: '0.8125rem', border: '1px solid var(--border)' }}>
                          <div><strong>{rx.medication_name}</strong> - {rx.dosage}</div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '0.125rem' }}>Instructions: {rx.usage_instructions}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Hospital Pasientjournal EHR Notes */}
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>Hospital Discharge Summaries & EHR Notes</h4>
                    {patientEHR.pasientjournal_notes?.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No hospital discharge notes or specialist records.</p>
                    ) : (
                      patientEHR.pasientjournal_notes?.map(pj => (
                        <div key={pj.id} style={{ background: '#f8fafc', padding: '0.625rem', borderRadius: '6px', marginBottom: '0.375rem', fontSize: '0.8125rem', border: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: '700' }}>{pj.note_type} ({pj.hospital_name})</div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '0.125rem' }}>{pj.summary}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: E-PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Issue New Prescription */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FilePlus size={20} color="var(--primary)" /> Issue New E-Prescription
            </h3>

            {rxSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {rxSuccess}
              </div>
            )}

            <form onSubmit={handleCreatePrescription}>
              <div className="form-group">
                <label>Select Patient</label>
                <select
                  className="form-input"
                  value={newRx.patient_id}
                  onChange={(e) => setNewRx({ ...newRx, patient_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      Patient #{p.id} - {p.user?.full_name || p.user?.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Medication Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Paracetamol / Amoxicillin"
                  value={newRx.medication_name}
                  onChange={(e) => setNewRx({ ...newRx, medication_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Dosage & Strength</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 500mg, 1 tablet 3x daily"
                  value={newRx.dosage}
                  onChange={(e) => setNewRx({ ...newRx, dosage: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Valid Until Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newRx.valid_until}
                  onChange={(e) => setNewRx({ ...newRx, valid_until: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Usage Instructions</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Enter detailed clinical administration instructions..."
                  value={newRx.usage_instructions}
                  onChange={(e) => setNewRx({ ...newRx, usage_instructions: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                Issue Digital Prescription
              </button>
            </form>
          </div>

          {/* List Issued Prescriptions */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill size={20} color="var(--primary)" /> Issued Prescriptions Log
            </h3>

            {rxLoading ? (
              <p>Loading prescription logs...</p>
            ) : issuedRx.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No prescriptions issued by your account yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
                {issuedRx.map((rx) => (
                  <div key={rx.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{rx.medication_name}</h4>
                      <span className="badge badge-active">{rx.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Dosage: {rx.dosage} • Valid Until: {rx.valid_until}
                    </div>
                    {rx.usage_instructions && (
                      <div style={{ fontSize: '0.8125rem', marginTop: '0.375rem', color: 'var(--text-main)' }}>
                        <strong>Instructions:</strong> {rx.usage_instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DOCTOR PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ maxWidth: '650px', margin: '0 auto', padding: '2rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={20} color="var(--primary)" /> Doctor & Clinic Profile Settings
          </h3>

          {profileSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>Medical Specialization</label>
              <input
                type="text"
                className="form-input"
                value={profile.specialization}
                onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Qualification & Degrees</label>
              <input
                type="text"
                className="form-input"
                value={profile.qualification}
                onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  className="form-input"
                  value={profile.experience_years}
                  onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Consultation Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={profile.consultation_fee}
                  onChange={(e) => setProfile({ ...profile, consultation_fee: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Clinic / Practice Name</label>
              <input
                type="text"
                className="form-input"
                value={profile.clinic_name}
                onChange={(e) => setProfile({ ...profile, clinic_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Medical Bio & Consultation Notes</label>
              <textarea
                className="form-textarea"
                rows="4"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* UPDATE APPOINTMENT MODAL */}
      {selectedApp && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Complete Consultation #{selectedApp.id}</h3>
            <div className="form-group">
              <label>Doctor Clinical Notes / Diagnosis</label>
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Enter clinical notes, diagnosis, or recommendations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedApp(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedApp.id, 'completed')}>Mark Consultation Completed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
