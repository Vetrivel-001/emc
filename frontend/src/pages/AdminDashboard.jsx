import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Shield, Users, FileText, ToggleLeft, ToggleRight, Search, PlusCircle,
  Download, Activity, Calendar, Pill, UserCheck, Stethoscope, Edit, CheckCircle, XCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users'); // users, appointments, audit

  // Data states
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_patients: 0,
    total_doctors: 0,
    total_appointments: 0,
    total_prescriptions: 0,
    total_audit_logs: 0
  });

  // Filter & Search states
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'patient',
    phone: '',
    national_id: '',
    specialization: 'General Practice'
  });

  const [editRole, setEditRole] = useState({
    role: 'patient',
    full_name: '',
    email: '',
    phone: ''
  });

  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [uRes, aRes, sRes, appRes] = await Promise.allSettled([
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
        api.get('/admin/stats'),
        api.get('/admin/appointments')
      ]);

      if (uRes.status === 'fulfilled') setUsers(uRes.value.data);
      if (aRes.status === 'fulfilled') setAuditLogs(aRes.value.data);
      if (sRes.status === 'fulfilled') setStats(sRes.value.data);
      if (appRes.status === 'fulfilled') setAppointments(appRes.value.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-status`);
      fetchData();
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(`Are you sure you want to permanently delete user #${userId}?`)) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchData();
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/admin/users', newUser);
      setShowCreateModal(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'patient',
        phone: '',
        national_id: '',
        specialization: 'General Practice'
      });
      setMessage('User created successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create user");
    }
  };

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setEditRole({
      role: u.role,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || ''
    });
    setShowEditModal(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${selectedUser.id}/role`, editRole);
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to update user role");
    }
  };

  // CSV Export functions
  const exportUsersCSV = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Status'];
    const rows = users.map(u => [u.id, u.full_name, u.email, u.role, u.is_active ? 'Active' : 'Disabled']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `healthbridge_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAuditCSV = () => {
    const headers = ['ID', 'User ID', 'Action', 'Details', 'Timestamp'];
    const rows = auditLogs.map(l => [l.id, l.user_id || 'System', l.action, `"${l.details || ''}"`, l.timestamp]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `healthbridge_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.id.toString().includes(userSearch);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredAudit = auditLogs.filter(l => {
    const q = auditSearch.toLowerCase();
    return l.action.toLowerCase().includes(q) ||
           (l.details && l.details.toLowerCase().includes(q)) ||
           (l.user_id && l.user_id.toString().includes(q));
  });

  return (
    <div className="page-container">
      {/* HERO BANNER */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #6b21a8 0%, #0369a1 100%)', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={32} /> System Governance & Administration
        </h1>
        <p style={{ opacity: 0.9, marginTop: '0.25rem' }}>
          Platform user management, role governance, system metrics, and security audit logs.
        </p>
      </div>

      {/* SYSTEM METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #6b21a8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>REGISTERED USERS</span>
            <Users size={18} color="#6b21a8" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', marginTop: '0.25rem' }}>{stats.total_users}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>PATIENTS</span>
            <UserCheck size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', marginTop: '0.25rem' }}>{stats.total_patients}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #0d9488' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>DOCTORS</span>
            <Stethoscope size={18} color="#0d9488" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', marginTop: '0.25rem' }}>{stats.total_doctors}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>APPOINTMENTS</span>
            <Calendar size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', marginTop: '0.25rem' }}>{stats.total_appointments}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>PRESCRIPTIONS</span>
            <Pill size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', marginTop: '0.25rem' }}>{stats.total_prescriptions}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>AUDIT EVENTS</span>
            <FileText size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', marginTop: '0.25rem' }}>{stats.total_audit_logs}</div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> User Directory ({users.length})
        </button>
        <button className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('appointments')}>
          <Calendar size={16} /> Platform Appointments ({appointments.length})
        </button>
        <button className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('audit')}>
          <FileText size={16} /> Security Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY & ROLE GOVERNANCE */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontWeight: '700' }}>Platform Account Directory</h3>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="admin">Admins</option>
              </select>

              <button className="btn btn-primary" style={{ fontSize: '0.8125rem' }} onClick={() => setShowCreateModal(true)}>
                <PlusCircle size={16} /> Create User
              </button>

              <button className="btn btn-secondary" style={{ fontSize: '0.8125rem' }} onClick={exportUsersCSV}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Full Name</th>
                <th style={{ padding: '0.75rem' }}>Email</th>
                <th style={{ padding: '0.75rem' }}>Role</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>#{u.id}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{u.full_name}</td>
                  <td style={{ padding: '0.75rem' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ color: u.is_active ? '#15803d' : '#b91c1c', fontWeight: '700' }}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }} onClick={() => handleOpenEditModal(u)}>
                      <Edit size={14} /> Edit Role
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }} onClick={() => handleToggleStatus(u.id)}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }} onClick={() => handleDeleteUser(u.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: SYSTEM APPOINTMENTS GOVERNANCE */}
      {activeTab === 'appointments' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1.25rem' }}>System Appointments Governance</h3>
          {appointments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No appointments registered on platform.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem' }}>Appt ID</th>
                  <th style={{ padding: '0.75rem' }}>Patient ID</th>
                  <th style={{ padding: '0.75rem' }}>Doctor ID</th>
                  <th style={{ padding: '0.75rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700' }}>#{app.id}</td>
                    <td style={{ padding: '0.75rem' }}>Patient #{app.patient_id}</td>
                    <td style={{ padding: '0.75rem' }}>Doctor #{app.doctor_id}</td>
                    <td style={{ padding: '0.75rem' }}>{app.appointment_date} @ {app.appointment_time}</td>
                    <td style={{ padding: '0.75rem' }}>{app.reason || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontWeight: '700' }}>Security & Action Audit Logs</h3>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter audit logs..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>

              <button className="btn btn-secondary" style={{ fontSize: '0.8125rem' }} onClick={exportAuditCSV}>
                <Download size={16} /> Export Audit CSV
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredAudit.map((log) => (
              <div key={log.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--primary)' }}>{log.action}</strong>
                  <span style={{ fontSize: '0.875rem', marginLeft: '0.75rem', color: 'var(--text-main)' }}>{log.details}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Create New Account</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-input" required value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-input" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-input" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Assign Role</label>
                <select className="form-select" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {newUser.role === 'doctor' && (
                <div className="form-group">
                  <label>Specialization</label>
                  <input type="text" className="form-input" value={newUser.specialization} onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {showEditModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Edit User Role #{selectedUser.id}</h3>
            <form onSubmit={handleSaveRole}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-input" value={editRole.full_name} onChange={(e) => setEditRole({ ...editRole, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-input" value={editRole.email} onChange={(e) => setEditRole({ ...editRole, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>System Role</label>
                <select className="form-select" value={editRole.role} onChange={(e) => setEditRole({ ...editRole, role: e.target.value })}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
