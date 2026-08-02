import React, { useState } from 'react';
import { Globe, Briefcase, GraduationCap, Plane, Heart, Shield, ArrowRight } from 'lucide-react';

export const ForeignRights = () => {
  const [selectedCategory, setSelectedCategory] = useState('employees');

  const categories = [
    { id: 'employees', title: 'Employees & Workers', icon: Briefcase },
    { id: 'students', title: 'Foreign Students', icon: GraduationCap },
    { id: 'tourists', title: 'Tourists & Visitors', icon: Plane },
    { id: 'refugees', title: 'Refugees & Asylum Seekers', icon: Heart },
    { id: 's1', title: 'Cross-border & S1 Holders', icon: Shield },
  ];

  return (
    <div className="page-container">
      {/* Banner */}
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Globe size={28} />
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: '600' }}>
            HealthBridge Public Guidance
          </span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }}>Healthcare Rights of Foreign Nationals in Norway</h1>
        <p style={{ opacity: 0.9, maxWidth: '700px', fontSize: '1rem', marginTop: '0.5rem' }}>
          Official guidance on medical coverage, National Insurance membership (Folketrygden), GP rights, and user fees for non-Norwegian residents.
        </p>
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon size={18} /> {cat.title}
            </button>
          );
        })}
      </div>

      {/* Dynamic details card */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        {selectedCategory === 'employees' && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Rights for Employees Working in Norway</h3>
            <p style={{ marginBottom: '1rem' }}>
              If you work in Norway for a Norwegian employer, you automatically become a member of the <strong>National Insurance Scheme (Folketrygden)</strong> from your first day of work.
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <li><strong>Entitlement to GP (Fastlege)</strong>: If registered in the National Population Register for more than 6 months.</li>
              <li><strong>User Fees (Egenandel)</strong>: Pay standard state user fees until reaching the exemption card threshold (Egenandelskort).</li>
              <li><strong>EU/EEA Posted Workers</strong>: Covered via the A1/S1 certificate issued by your home country.</li>
            </ul>
          </div>
        )}

        {selectedCategory === 'students' && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Rights for International Students</h3>
            <p style={{ marginBottom: '1rem' }}>
              Coverage depends on your duration of stay and country of origin:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <li><strong>Stays over 12 months</strong>: Automatically registered in National Population Register with full rights to a Fastlege.</li>
              <li><strong>EU/EEA Students (Under 12 months)</strong>: Must present a valid European Health Insurance Card (EHIC).</li>
              <li><strong>Non-EU Students (3 to 12 months)</strong>: Can apply for voluntary membership in Folketrygden upon arrival.</li>
            </ul>
          </div>
        )}

        {selectedCategory === 'tourists' && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Rights for Tourists & Short-Term Visitors</h3>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <li><strong>Emergency Care</strong>: Everyone in Norway has a statutory right to urgent emergency care at Legevakt (116 117) or 113.</li>
              <li><strong>EU/EEA Visitors</strong>: Present your EHIC card to receive necessary medical care on equal fee terms as Norwegian residents.</li>
              <li><strong>Non-EU Visitors</strong>: Must hold valid private travel insurance to cover medical costs in Norway.</li>
            </ul>
          </div>
        )}

        {selectedCategory === 'refugees' && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Rights for Refugees & Asylum Seekers</h3>
            <p style={{ marginBottom: '1rem' }}>
              Asylum seekers and refugees residing in Norwegian reception centers or municipalities are entitled to necessary physical and mental healthcare.
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <li>Full access to municipal health services, public health nurses, and GP consultation.</li>
              <li>Children under 16 receive free healthcare without user fees.</li>
            </ul>
          </div>
        )}

        {selectedCategory === 's1' && (
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Cross-border Workers & S1 Certificate Holders</h3>
            <p style={{ marginBottom: '1rem' }}>
              The S1 certificate allows EU/EEA citizens working in one state but living in another to register for healthcare coverage in their country of residence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
