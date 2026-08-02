import React, { useState, useEffect } from 'react';
import { Bell, Check, Calendar, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const requests = [api.get('/appointments/my-appointments')];
        if (user.role === 'patient') {
          requests.push(api.get('/HealthBridge-ext/inbox'));
        }
        const [appRes, msgRes] = await Promise.allSettled(requests);

        const items = [];

        if (appRes.status === 'fulfilled' && Array.isArray(appRes.value.data)) {
          const scheduled = appRes.value.data.filter(a => a.status === 'scheduled');
          scheduled.forEach(a => {
            items.push({
              id: `app-${a.id}`,
              title: 'Upcoming Consultation',
              text: `Scheduled on ${a.appointment_date} at ${a.appointment_time}`,
              type: 'appointment',
              date: a.appointment_date,
              is_read: false
            });
          });
        }

        if (msgRes.status === 'fulfilled' && Array.isArray(msgRes.value.data)) {
          msgRes.value.data.forEach(m => {
            items.push({
              id: `msg-${m.id}`,
              title: m.subject || 'Message Received',
              text: m.body ? (m.body.substring(0, 60) + '...') : 'New communication',
              type: 'message',
              date: m.created_at || 'Recently',
              is_read: m.is_read
            });
          });
        }

        setNotifications(items);
        setUnreadCount(items.filter(i => !i.is_read).length);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          padding: '0.5rem',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.6875rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '45px',
          width: '320px',
          background: 'white',
          color: 'var(--text-main)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
          zIndex: 200,
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <h4 style={{ fontWeight: '700', fontSize: '0.9375rem' }}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No active notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{ padding: '0.625rem', borderRadius: '8px', background: n.is_read ? 'var(--bg-subtle)' : '#f0f9ff', borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--primary)', fontSize: '0.8125rem' }}>
                  <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {n.type === 'appointment' ? <Calendar size={14} color="var(--primary)" /> : <Mail size={14} color="var(--secondary)" />}
                    {n.title}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.125rem' }}>{n.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
