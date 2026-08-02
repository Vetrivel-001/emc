import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Pill, UserCheck, HeartHandshake, CreditCard, Mail, FileText, Lock, Calendar, Bot, BookOpen, Globe, PhoneCall, LayoutDashboard, Receipt, Baby, Heart } from 'lucide-react';

export const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const searchItems = [
    { title: 'My Health Journal & Overview', path: '/patient-dashboard', category: 'Personal', icon: LayoutDashboard },
    { title: 'Inbox & Secure Healthcare Messages', path: '/full-portal', category: 'Messages', icon: Mail },
    { title: 'Hospital Patient Records (Pasientjournal)', path: '/full-portal', category: 'Records', icon: FileText },
    { title: 'E-Resepter & Active Prescriptions', path: '/healthbridge-services', category: 'Medicines', icon: Pill },
    { title: 'Min Fastlege & Bytte Fastlege (Change GP)', path: '/healthbridge-services', category: 'GP', icon: UserCheck },
    { title: 'Frikort Exemption Card & Helfo Refunds', path: '/full-portal', category: 'Finance', icon: Receipt },
    { title: 'Privacy Settings & Power of Attorney (Fullmakt)', path: '/full-portal', category: 'Privacy', icon: Lock },
    { title: 'Digital Organ Donor Card (Donorkort)', path: '/healthbridge-services', category: 'Services', icon: HeartHandshake },
    { title: 'Digital European Health Insurance Card (EHIC)', path: '/healthbridge-services', category: 'Travel', icon: CreditCard },
    { title: 'Doctor Appointment Booking & Calendar', path: '/appointments', category: 'Care', icon: Calendar },
    { title: 'AI Health Assistant (LLM + RAG)', path: '/ai-chat', category: 'AI', icon: Bot },
    { title: 'Health A–Z & Emergency Helplines (116 117)', path: '/health-directory', category: 'Directory', icon: BookOpen },
    { title: 'Health Rights of Foreigners & Travel Coverage', path: '/foreign-rights', category: 'Rights', icon: Globe },
    { title: 'Health Contacts & Care Coordinators', path: '/health-contacts', category: 'Directory', icon: PhoneCall },
    { title: 'Mental Health Resources & Crisis Lines (116 123)', path: '/mental-health', category: 'Support', icon: Heart },
    { title: 'Pregnancy, Maternity Care & Pediatric Health', path: '/pregnancy-pediatrics', category: 'Maternity', icon: Baby }
  ];

  const filtered = searchItems.filter(
    (item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent('open-search-modal'));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px', padding: '1.5rem', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <Search size={20} color="var(--primary)" />
            <input
              type="text"
              placeholder="Search HealthBridge services, records, or topics..."
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', width: '100%', fontFamily: 'var(--font)' }}
            />
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No matching HealthBridge services found.</div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(item.path)}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-main)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>{item.category}</div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Go to page →</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
