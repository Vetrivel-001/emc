import React from 'react';
import { Baby, Calendar, Heart, ShieldCheck, User } from 'lucide-react';

export const PregnancyPediatrics = () => {
  return (
    <div>
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Baby size={32} /> Pregnancy, Maternity & Pediatric Health
        </h1>
        <p style={{ opacity: 0.9 }}>Maternal Health Checks, Week-by-Week Guide & Municipal Health Station Services</p>
      </div>

      {/* MATERNITY CHECKUPS GRID */}
      <div className="dashboard-grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--primary)" /> Standard Pregnancy Checkup Schedule
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.875rem', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontWeight: '700' }}>Week 6–12: Initial Consultation</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>First antenatal checkup with Fastlege or midwife at Municipal Health Station.</div>
            </div>
            <div style={{ padding: '0.875rem', background: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
              <div style={{ fontWeight: '700' }}>Week 18: Routine Hospital Ultrasound</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Anatomy scan and estimated date of delivery calculation.</div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--secondary)" /> Free Rights & Health Station Services
          </h3>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            <li><strong>Free Dental Care:</strong> 100% free dental treatment for all children under age 18.</li>
            <li><strong>School Health Nurse:</strong> Confidential consultations for adolescents at school.</li>
            <li><strong>Child Vaccination Program:</strong> Free immunizations administered according to national schedule.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
