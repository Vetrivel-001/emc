import React from 'react';
import { Heart, PhoneCall, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

export const MentalHealth = () => {
  return (
    <div>
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #6b21a8 0%, #0369a1 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Heart size={32} /> Mental Health & Crisis Support
        </h1>
        <p style={{ opacity: 0.9 }}>24/7 Confidential Helplines, Self-Help Programs & Fastlege Guidance</p>
      </div>

      {/* CRISIS HELPLINES GRID */}
      <div className="dashboard-grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', background: '#f3e8ff', border: '1px solid #e9d5ff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b21a8' }}>24/7 CONFIDENTIAL SUPPORT</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#6b21a8', margin: '0.25rem 0' }}>Mental Helse Hotline</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#581c87' }}>116 123</div>
          <p style={{ fontSize: '0.875rem', color: '#6b21a8', marginTop: '0.5rem' }}>Free, anonymous phone helpline and chat available 24 hours a day, 7 days a week.</p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: '#e0f2fe', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1' }}>KIRKENS SOS CRISIS LINE</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0369a1', margin: '0.25rem 0' }}>Kirkens SOS</h3>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#075985' }}>22 40 00 40</div>
          <p style={{ fontSize: '0.875rem', color: '#0369a1', marginTop: '0.5rem' }}>Emotional support for individuals experiencing acute distress or suicidal thoughts.</p>
        </div>
      </div>

      {/* SELF-HELP & GP REFERRAL */}
      <div className="dashboard-grid-2">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" /> E-Mestring Self-Help Programs
          </h3>
          <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: '700' }}>Depression & Anxiety Guided Self-Course</div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Evidence-based cognitive behavioral therapy modules accessible via HealthBridge.</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="var(--secondary)" /> How to Get Help from a Specialist
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Your Fastlege is your gateway to psychological care in Norway. Your Fastlege can refer you to a psychiatrist, psychologist, or District Psychiatric Centre (DPS).
          </p>
        </div>
      </div>
    </div>
  );
};
