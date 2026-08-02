import React, { useState } from 'react';
import { BookOpen, PhoneCall, Search } from 'lucide-react';

export const HealthDirectory = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const azTopics = [
    { title: 'Asthma & Respiratory Care', summary: 'Guidance on preventative inhalers, triggers, and emergency acute care.' },
    { title: 'Blood Pressure & Cardiovascular Health', summary: 'Hypertension thresholds, lifestyle advice, and prescription tracking.' },
    { title: 'Cancer Screening Programs', summary: 'National screening schedules for breast, cervical, and colorectal cancer.' },
    { title: 'Diabetes Management (Type 1 & 2)', summary: 'Fasting glucose parameters, insulin guidance, and coverage options.' },
    { title: 'Emergency Care & Urgent Telehealth', summary: 'When to call out-of-hours urgent care clinics versus emergency medical services.' },
    { title: 'Immunization & Vaccines', summary: 'Standard childhood vaccine program and adult booster recommendations.' },
    { title: 'Mental Health & Psychotherapy', summary: 'Self-help programs, primary doctor referrals, and 24/7 crisis helplines.' },
    { title: 'Pregnancy, Birth & Maternity Care', summary: 'Week-by-week maternal health checks, midwife appointments, and health station services.' }
  ];

  const filteredTopics = azTopics.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #6b21a8 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>HealthBridge Health A–Z & Emergency Helplines</h1>
        <p style={{ opacity: 0.9 }}>Quality-Assured National Health Information & 24/7 Emergency Helplines</p>
      </div>

      {/* EMERGENCY HELPLINES BANNER */}
      <div className="dashboard-grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', background: '#fee2e2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#991b1b' }}>MEDICAL EMERGENCY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#991b1b' }}>911 / 112</div>
          <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>Life-threatening accidents & acute emergencies</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: '#e0f2fe', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1' }}>URGENT CARE TELEHEALTH</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0369a1' }}>1-800-555-1111</div>
          <div style={{ fontSize: '0.75rem', color: '#075985' }}>Out-of-hours urgent doctor consultation</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: '#fef3c7', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400e' }}>POISON CONTROL CENTER</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#92400e' }}>1-800-222-1222</div>
          <div style={{ fontSize: '0.75rem', color: '#78350f' }}>24/7 poison emergency guidance</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: '#f3e8ff', border: '1px solid #e9d5ff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b21a8' }}>CRISIS HELPLINE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#6b21a8' }}>988</div>
          <div style={{ fontSize: '0.75rem', color: '#581c87' }}>24/7 confidential psychological support</div>
        </div>
      </div>

      {/* ADVISORY PHONE CHANNEL */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.625rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px' }}>
            <PhoneCall size={24} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.125rem' }}>HealthBridge Advisory Phone Service</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Call <strong>1-800-HEALTH-BRIDGE</strong> • Open Monday–Friday 08:00–17:00</div>
          </div>
        </div>
        <span className="badge badge-completed">Live Support</span>
      </div>

      {/* SEARCH BAR */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Search size={20} color="var(--primary)" />
          <input
            type="text"
            className="form-input"
            placeholder="Search A–Z health encyclopedia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredTopics.map((topic, idx) => (
            <div key={idx} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'white' }}>
              <h4 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>{topic.title}</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{topic.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
