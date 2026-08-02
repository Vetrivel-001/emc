import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HeartPulse, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { BankIDModal } from '../components/BankIDModal';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBankIDOpen, setIsBankIDOpen] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      redirectUser(user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (user) => {
    if (user.role === 'admin') navigate('/admin-dashboard');
    else if (user.role === 'doctor') navigate('/doctor-dashboard');
    else navigate('/patient-dashboard');
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem' }}>
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>HealthBridge Log In</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Access your digital healthcare platform</p>
        </div>

        {/* BankID Official Login Button */}
        <button
          type="button"
          onClick={() => setIsBankIDOpen(true)}
          className="btn"
          style={{
            width: '100%',
            padding: '0.875rem',
            background: '#003399',
            color: 'white',
            fontWeight: '700',
            fontSize: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 14px rgba(0,51,153,0.3)'
          }}
        >
          <ShieldCheck size={22} /> {t('loginBankID')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-light)', fontSize: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ padding: '0 0.5rem', fontWeight: '700' }}>OR STANDARD LOGIN</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>QUICK DEMO LOGINS:</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => handleQuickLogin('patient@healthbridge.no', 'Patient123!')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
              Demo Patient
            </button>
            <button type="button" onClick={() => handleQuickLogin('doctor@healthbridge.no', 'Doctor123!')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
              Demo Doctor (Fastlege)
            </button>
            <button type="button" onClick={() => handleQuickLogin('admin@healthbridge.no', 'Admin123!')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}>
              Demo Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register">Create Account</Link>
        </div>
      </div>

      <BankIDModal
        isOpen={isBankIDOpen}
        onClose={() => setIsBankIDOpen(false)}
        onSuccess={(user) => redirectUser(user)}
      />
    </div>
  );
};
