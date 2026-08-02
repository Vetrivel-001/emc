import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, ShieldCheck, Mail, Phone, Lock, Save, CheckCircle } from 'lucide-react';

export const UserProfile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    national_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        national_id: user.national_id || 'Active Verification'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    try {
      const res = await api.put('/auth/me', {
        role: user.role,
        full_name: formData.full_name,
        phone: formData.phone
      });
      setSuccess('Profile details updated successfully!');
      if (setUser) setUser(res.data);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.875rem', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <User size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>User Profile & Settings</h1>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.125rem' }}>
              Account role: <span className="badge badge-completed" style={{ marginLeft: '0.25rem' }}>{user?.role?.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="#166534" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <User size={16} /> Full Name
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Mail size={16} /> Email Address (Read-only)
            </label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Phone size={16} /> Contact Phone Number
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="+47 000 00 000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ShieldCheck size={16} /> National ID (Fødselsnummer)
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.national_id}
              disabled
              style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '1rem' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};
