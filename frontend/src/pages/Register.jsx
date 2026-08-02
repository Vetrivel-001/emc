import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, ArrowRight } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'patient',
    specialization: 'General Medicine'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(formData);
      if (user.role === 'admin') navigate('/admin-dashboard');
      else if (user.role === 'doctor') navigate('/doctor-dashboard');
      else navigate('/patient-dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px', height: '54px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)',
            borderRadius: '16px', color: 'white',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <HeartPulse size={30} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join HealthBridge Healthcare Platform</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="full_name" className="form-input" placeholder="Dr. John Doe / Jane Smith" value={formData.full_name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" className="form-input" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-input" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" className="form-input" placeholder="+47 9123 4567" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Register As</label>
            <select name="role" className="form-select" value={formData.role} onChange={handleChange}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor / Healthcare Professional</option>
            </select>
          </div>

          {formData.role === 'doctor' && (
            <div className="form-group">
              <label>Specialization</label>
              <input type="text" name="specialization" className="form-input" placeholder="Cardiology, General Physician, Pediatrics" value={formData.specialization} onChange={handleChange} />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};
