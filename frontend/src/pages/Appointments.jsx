import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, UserCheck, Stethoscope, Search, Check } from 'lucide-react';

export const Appointments = () => {
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [searchSpec, setSearchSpec] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [booking, setBooking] = useState({
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00 AM',
    reason: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors', { params: { specialization: searchSpec } });
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to load doctors", err);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const res = await api.get('/appointments/my-appointments');
      setMyAppointments(res.data);
    } catch (err) {
      console.error("Failed to load appointments", err);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchMyAppointments();
  }, [searchSpec]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      await api.post('/appointments/', {
        doctor_id: selectedDoctor.id,
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time,
        reason: booking.reason
      });
      setSuccessMsg(`Appointment booked with Dr. ${selectedDoctor.user?.full_name || 'Specialist'}!`);
      setSelectedDoctor(null);
      setBooking({ appointment_date: new Date().toISOString().split('T')[0], appointment_time: '10:00 AM', reason: '' });
      fetchMyAppointments();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Failed to book appointment");
    }
  };

  return (
    <div className="page-container">
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #6366f1 0%, #0284c7 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Doctor Scheduling & Appointments</h1>
        <p style={{ opacity: 0.9 }}>Book consultations with top-rated medical specialists</p>
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
          <Check size={20} /> {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* DOCTOR DIRECTORY */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: '700' }}>Find a Healthcare Specialist</h3>
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search specialization..."
                  value={searchSpec}
                  onChange={(e) => setSearchSpec(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {doctors.map((doc) => (
                <div key={doc.id} style={{
                  padding: '1.25rem',
                  border: selectedDoctor?.id === doc.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '12px',
                  background: 'white',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ width: '42px', height: '42px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <Stethoscope size={22} />
                  </div>
                  <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{doc.user?.full_name || 'Dr. Specialist'}</h4>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '600' }}>{doc.specialization}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Experience: {doc.experience_years} years</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', marginTop: '0.5rem' }}>Fee: ${doc.consultation_fee}</div>

                  <button
                    className={`btn ${selectedDoctor?.id === doc.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8125rem' }}
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    {selectedDoctor?.id === doc.id ? 'Selected' : 'Select Doctor'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOOKING FORM & MY APPOINTMENTS */}
        <div>
          {selectedDoctor ? (
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Book Appointment</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                With <strong>{selectedDoctor.user?.full_name}</strong> ({selectedDoctor.specialization})
              </p>

              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label>Preferred Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={booking.appointment_date}
                    onChange={(e) => setBooking({ ...booking, appointment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Time Slot</label>
                  <select
                    className="form-select"
                    value={booking.appointment_time}
                    onChange={(e) => setBooking({ ...booking, appointment_time: e.target.value })}
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reason for Visit / Symptoms</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Briefly describe your symptoms..."
                    value={booking.reason}
                    onChange={(e) => setBooking({ ...booking, reason: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirm Booking</button>
              </form>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem' }}>Select a doctor from the list to schedule an appointment.</p>
            </div>
          )}

          {/* UPCOMING LIST */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontWeight: '700', marginBottom: '1rem' }}>My Appointments</h4>
            {myAppointments.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No upcoming appointments.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myAppointments.map((app) => (
                  <div key={app.id} style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{app.appointment_date}</strong>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time: {app.appointment_time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
