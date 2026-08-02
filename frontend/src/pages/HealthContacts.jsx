import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Phone, MapPin, UserCheck, Stethoscope, Heart } from 'lucide-react';

export const HealthContacts = () => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/HealthBridge-ext/health-contacts');
        setContacts(res.data);
      } catch (err) {
        console.error("Failed to load health contacts", err);
      }
    };
    fetchContacts();
  }, []);

  return (
    <div>
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} /> Health Contacts Network
        </h1>
        <p style={{ opacity: 0.9 }}>Your assigned Fastlege, hospital coordinators, and emergency care network</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {contacts.map((c) => (
          <div key={c.id} className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid var(--primary)' }}>
            <span className="badge badge-completed" style={{ marginBottom: '0.5rem' }}>{c.role}</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0.25rem 0' }}>{c.name}</h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <MapPin size={16} /> {c.clinic}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
              <Phone size={16} /> {c.phone}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
