import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HeartPulse, User, Calendar, Bot, Shield, Globe, Pill, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.875rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)',
            padding: '0.5rem',
            borderRadius: '10px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HeartPulse size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>HealthBridge</span>
            <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-muted)', marginTop: '-2px' }}>{t('brandSubtitle')}</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {user && user.role === 'patient' && (
            <>
              <Link to="/patient-dashboard" style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                color: isActive('/patient-dashboard') ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive('/patient-dashboard') ? '700' : '500'
              }}>
                <User size={18} /> {t('myHealth')}
              </Link>

              <Link to="/healthbridge-services" style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                color: isActive('/healthbridge-services') ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive('/healthbridge-services') ? '700' : '500'
              }}>
                <Pill size={18} /> {t('services')}
              </Link>
            </>
          )}

          {user && user.role === 'doctor' && (
            <Link to="/doctor-dashboard" style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              color: isActive('/doctor-dashboard') ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: isActive('/doctor-dashboard') ? '700' : '500'
            }}>
              <User size={18} /> Doctor Dashboard
            </Link>
          )}

          {user && (
            <>
              <Link to="/appointments" style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                color: isActive('/appointments') ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive('/appointments') ? '700' : '500'
              }}>
                <Calendar size={18} /> {t('appointments')}
              </Link>

              <Link to="/ai-chat" style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                color: isActive('/ai-chat') ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive('/ai-chat') ? '700' : '500'
              }}>
                <Bot size={18} /> {t('aiAssistant')}
              </Link>
            </>
          )}

          <Link to="/foreign-rights" style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            color: isActive('/foreign-rights') ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: isActive('/foreign-rights') ? '700' : '500'
          }}>
            <Globe size={18} /> {t('foreignRights')}
          </Link>

          {user && user.role === 'admin' && (
            <Link to="/admin-dashboard" style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              color: isActive('/admin-dashboard') ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: isActive('/admin-dashboard') ? '700' : '500'
            }}>
              <Shield size={18} /> {t('adminPortal')}
            </Link>
          )}
        </div>

        {/* Right Section: Language Toggle & Auth status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={toggleLanguage}
            className="btn btn-secondary"
            style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
          >
            🌐 {lang === 'en' ? 'Norsk (Bokmål) 🇳🇴' : 'English 🇬🇧'}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700' }}>{user.full_name}</div>
                <span className={`badge badge-${user.role}`}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
