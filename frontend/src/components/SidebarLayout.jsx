import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SearchModal } from './SearchModal';
import { NotificationCenter } from './NotificationCenter';
import {
  HeartPulse, LayoutDashboard, Pill, UserCheck, Calendar, Bot,
  Shield, Globe, LogOut, Search, ShieldCheck, Mail, Receipt, Lock, BookOpen, PhoneCall, Heart, Baby, Users, User
} from 'lucide-react';

export const SidebarLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { lang, cycleLanguage, languages, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setIsSearchOpen(true);
    window.addEventListener('open-search-modal', handleOpenModal);
    return () => window.removeEventListener('open-search-modal', handleOpenModal);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="app-shell">
      {/* SEARCH MODAL */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)', padding: '0.5rem', borderRadius: '12px', color: 'white', display: 'flex', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
            <HeartPulse size={24} />
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.125rem', letterSpacing: '-0.02em' }}>HealthBridge</div>
            <div style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: '500' }}>{t('brandSubtitle')}</div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-container" style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="sidebar-section-title">Personal Portal</div>

          {isPatient && (
            <>
              <Link to="/patient-dashboard" className={`sidebar-nav-item ${isActive('/patient-dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> {t('myHealth')}
              </Link>

              <Link to="/full-portal" className={`sidebar-nav-item ${isActive('/full-portal') ? 'active' : ''}`}>
                <Mail size={18} /> Inbox & Hospital EHR
              </Link>

              <Link to="/healthbridge-services" className={`sidebar-nav-item ${isActive('/healthbridge-services') ? 'active' : ''}`}>
                <Pill size={18} /> Prescriptions & Primary Doctor
              </Link>

              <Link to="/full-portal" className={`sidebar-nav-item ${isActive('/full-portal') ? 'active' : ''}`}>
                <Receipt size={18} /> Exemption Cards & Refunds
              </Link>

              <Link to="/full-portal" className={`sidebar-nav-item ${isActive('/full-portal') ? 'active' : ''}`}>
                <Lock size={18} /> Consents & Power of Attorney
              </Link>

              <Link to="/health-contacts" className={`sidebar-nav-item ${isActive('/health-contacts') ? 'active' : ''}`}>
                <Users size={18} /> Health Contacts Directory
              </Link>
            </>
          )}

          {isDoctor && (
            <>
              <Link to="/doctor-dashboard" className={`sidebar-nav-item ${isActive('/doctor-dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> Doctor Clinical Portal
              </Link>
              <Link to="/full-portal" className={`sidebar-nav-item ${isActive('/full-portal') ? 'active' : ''}`}>
                <Mail size={18} /> Hospital EHR & Messages
              </Link>
              <Link to="/healthbridge-services" className={`sidebar-nav-item ${isActive('/healthbridge-services') ? 'active' : ''}`}>
                <Pill size={18} /> Prescriptions & Primary Care
              </Link>
              <Link to="/health-contacts" className={`sidebar-nav-item ${isActive('/health-contacts') ? 'active' : ''}`}>
                <Users size={18} /> Health Contacts Directory
              </Link>
            </>
          )}

          <div className="sidebar-section-title">Care & Clinical Services</div>

          <Link to="/appointments" className={`sidebar-nav-item ${isActive('/appointments') ? 'active' : ''}`}>
            <Calendar size={18} /> {t('appointments')}
          </Link>

          <Link to="/mental-health" className={`sidebar-nav-item ${isActive('/mental-health') ? 'active' : ''}`}>
            <Heart size={18} /> Mental Health & Crisis
          </Link>

          <Link to="/pregnancy-pediatrics" className={`sidebar-nav-item ${isActive('/pregnancy-pediatrics') ? 'active' : ''}`}>
            <Baby size={18} /> Pregnancy & Pediatrics
          </Link>

          <Link to="/ai-chat" className={`sidebar-nav-item ${isActive('/ai-chat') ? 'active' : ''}`}>
            <Bot size={18} /> {t('aiAssistant')}
          </Link>

          <div className="sidebar-section-title">Public Directory & Helplines</div>

          <Link to="/health-directory" className={`sidebar-nav-item ${isActive('/health-directory') ? 'active' : ''}`}>
            <BookOpen size={18} /> Health A–Z & Emergency
          </Link>

          <Link to="/foreign-rights" className={`sidebar-nav-item ${isActive('/foreign-rights') ? 'active' : ''}`}>
            <Globe size={18} /> International Health Rights
          </Link>

          {isAdmin && (
            <>
              <div className="sidebar-section-title">Administration</div>
              <Link to="/admin-dashboard" className={`sidebar-nav-item ${isActive('/admin-dashboard') ? 'active' : ''}`}>
                <Shield size={18} /> {t('adminPortal')}
              </Link>
              <Link to="/patient-dashboard" className={`sidebar-nav-item ${isActive('/patient-dashboard') ? 'active' : ''}`}>
                <User size={18} /> Patient Portal View
              </Link>
              <Link to="/doctor-dashboard" className={`sidebar-nav-item ${isActive('/doctor-dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> Doctor Portal View
              </Link>
            </>
          )}

          {/* Support Advisory Pill */}
          <div style={{ margin: '1.25rem 0.75rem', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.6875rem', color: '#cbd5e1', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <PhoneCall size={12} /> HEALTHBRIDGE ADVISORY LINE
            </div>
            <div style={{ fontSize: '0.9375rem', color: '#ffffff', fontWeight: '800', marginTop: '0.25rem' }}>1-800-HEALTH-BRIDGE</div>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Mon–Fri 08:00–17:00</div>
          </div>
        </div>

        {/* Sidebar Footer User Card */}
        {user && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/profile" style={{ overflow: 'hidden', textDecoration: 'none' }}>
              <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</div>
              <span className={`badge badge-${user.role}`} style={{ marginTop: '0.25rem' }}>{user.role}</span>
            </Link>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.375rem 0.5rem', background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center' }} title="Profile Settings">
                <User size={16} />
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.375rem 0.5rem', background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: 'none' }} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        {/* TOP HEADER */}
        <header className="top-header">
          {/* Interactive Search Bar Trigger */}
          <div
            onClick={() => setIsSearchOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.4rem 0.875rem', borderRadius: '10px', width: '360px', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Search HealthBridge services...</span>
            </div>
            <span style={{ fontSize: '0.6875rem', background: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '700' }}>Ctrl K</span>
          </div>

          {/* Right Action Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationCenter />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0f9ff', color: '#0369a1', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #bae6fd' }}>
              <span className="pulse-dot"></span> Secure Digital ID Verified
            </div>

            <button onClick={cycleLanguage} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: '600' }}>
              🌐 {currentLangObj.label}
            </button>
          </div>
        </header>

        {/* SCROLLABLE PAGE BODY */}
        <main className="content-scrollable">
          {children}
        </main>
      </div>
    </div>
  );
};
