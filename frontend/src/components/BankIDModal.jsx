import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BankIDModal = ({ isOpen, onClose, onSuccess }) => {
  const [nationalId, setNationalId] = useState('15068844321');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleBankIDSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      // Simulate BankID authentication by logging into demo patient account
      const user = await login('patient@healthbridge.no', 'Patient123!');
      setLoading(false);
      onSuccess(user);
      onClose();
    } catch (err) {
      setLoading(false);
      alert("BankID authentication failed");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '420px', borderTop: '6px solid #003399' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '12px', marginBottom: '0.75rem' }}>
            <ShieldCheck size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#003399' }}>ID-porten / BankID</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Official Norwegian eID Authentication</p>
        </div>

        <form onSubmit={handleBankIDSubmit}>
          {step === 1 ? (
            <div className="form-group">
              <label>Fødselsnummer / D-nummer (11 digits)</label>
              <input
                type="text"
                className="form-input"
                maxLength="11"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginTop: '0.25rem' }}>Demo National ID pre-filled for test login</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <Smartphone size={48} color="var(--primary)" style={{ margin: '0 auto 0.75rem auto', animation: 'bounce 1s infinite' }} />
              <h4 style={{ fontWeight: '700' }}>Open BankID Mobile App</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Confirm prompt code <strong>"HEALTH-88"</strong> on your mobile phone</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#003399' }} disabled={loading}>
              {step === 1 ? 'Next' : (loading ? 'Authenticating...' : 'Confirm BankID')} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
