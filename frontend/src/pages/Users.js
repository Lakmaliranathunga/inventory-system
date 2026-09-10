import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-toastify';
import './Users.css';
import { getStoredUser } from '../auth/session';

const emptyForm = {
  uUsername: '', uFullName: '', uPassword: '', uEmpNo: '',
  contactNo: '', uEmail: '', roleId: '', divisionId: '', sectionId: '', uStatus: 'Active'
};

const Users = () => {
  const user = getStoredUser();
  const isAdmin = user.roleId === 1 || user.roleId === '1';
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);   // null = add, id = edit
  const [form, setForm] = useState({ ...emptyForm, uConfirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, dRes, sRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/roles'),
        api.get('/divisions'),
        api.get('/sections'),
      ]);
      if (uRes.data.success) setUsers(uRes.data.users);
      setRoles(rRes.data || []);
      setDivisions(dRes.data || []);
      setSections(sRes.data || []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u.uId);
    setForm({
      uUsername: u.uUsername || '',
      uFullName: u.uFullName || '',
      uPassword: '',
      uEmpNo: u.uEmpNo || '',
      contactNo: u.contactNo || '',
      uEmail: u.uEmail || '',
      roleId: u.roleId || '',
      divisionId: u.divisionId || '',
      sectionId: u.sectionId || '',
      uStatus: u.uStatus || 'Active',
      uConfirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setCreatedCredentials(null);
    setPhoneError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNo') {
      const newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) return;
      setForm(f => ({ ...f, [name]: newValue }));
      if (newValue.length > 0 && newValue.length !== 10) {
        setPhoneError('Phone number must be exactly 10 digits.');
      } else {
        setPhoneError('');
      }
    } else if (name === 'divisionId') {
      setForm(f => ({ ...f, divisionId: value, sectionId: '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.uUsername || !form.uFullName) {
      toast.error('Username and Full Name are required.');
      return;
    }
    if (form.contactNo && form.contactNo.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      toast.error('Contact Number must be exactly 10 digits.');
      return;
    }
    if (!editing && !form.uPassword) {
      toast.error('Password is required for new users.');
      return;
    }
    if (form.uEmail && !/^\S+@\S+\.\S+$/.test(form.uEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (form.uPassword !== form.uConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/users/${editing}`, form);
        toast.success('User updated successfully!');
        closeModal();
      } else {
        const response = await api.post('/api/users', form);
        toast.success(response.data?.message || 'User created successfully!');
        setCreatedCredentials({
          fullName: form.uFullName,
          username: form.uUsername,
          password: form.uPassword,
          email: form.uEmail,
          emailSent: Boolean(response.data?.emailSent),
          emailError: response.data?.emailError || '',
        });
      }
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Deactivate user "${u.uUsername}"?`)) return;
    try {
      await api.delete(`/api/users/${u.uId}`);
      toast.success('User deactivated.');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  // Filtered sections based on selected division
  const filteredSections = sections.filter(s => {
    if (!form.divisionId) return false;
    const did = s.division_id ?? s.divisionId;
    return String(did) === String(form.divisionId);
  });

  const filtered = users.filter(u =>
    u.uFullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.uUsername?.toLowerCase().includes(search.toLowerCase()) ||
    u.roleName?.toLowerCase().includes(search.toLowerCase())
  );

  /* ──────────── ACCESS DENIED ──────────── */
  if (!isAdmin) {
    return (
      <div className="users-page">
        <div className="access-denied">
          <i className="bi bi-shield-lock-fill"></i>
          <h3>Access Denied</h3>
          <p>You do not have permission to view this page.<br />Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  /* ──────────── LOADING ──────────── */
  if (loading) return <div className="users-page" style={{ padding: 40, color: '#64748b' }}>Loading users...</div>;

  /* ──────────── MAIN VIEW ──────────── */
  return (
    <div className="users-page">

      {/* Top bar */}
      <div className="users-topbar">
        <h4><i className="bi bi-people-fill" style={{ marginRight: 8 }}></i>User Management</h4>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="users-search-input"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-add-user" onClick={openAdd}>
            <i className="bi bi-person-plus-fill"></i> Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="users-table-wrapper">
        {filtered.length === 0 ? (
          <div className="users-empty">
            <i className="bi bi-people"></i>
            <p>No users found.</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Employee No</th>
                <th>Role</th>
                <th>Division</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uId}>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar-sm">{u.uFullName?.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.uFullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>@{u.uUsername}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.uEmpNo || '—'}</td>
                  <td><span className="role-badge">{u.roleName || '—'}</span></td>
                  <td>{u.divisionName || '—'}</td>
                  <td>{u.contactNo || '—'}</td>
                  <td>
                    <span className={`status-badge ${u.uStatus?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                      {u.uStatus || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon-edit" title="Edit" onClick={() => openEdit(u)}>
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button className="btn-icon-del" title="Deactivate" onClick={() => handleDelete(u)}>
                        <i className="bi bi-person-x-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ──────────── MODAL ──────────── */}
      {showModal && (
        <div className="dark-modal-overlay" onClick={closeModal}>
          <div className="dark-user-modal" onClick={e => e.stopPropagation()}>
            {createdCredentials ? (
              <div className="credentials-view">
                <div className="dark-modal-header" style={{ paddingBottom: '20px' }}>
                  <h2 style={{ color: '#4ade80' }}>Account Created!</h2>
                  <p style={{ color: '#94a3b8', marginTop: '10px' }}>Please share these credentials with the new user.</p>
                </div>
                <div className="dark-modal-body" style={{ textAlign: 'center', padding: '10px 50px 30px' }}>
                  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '1.05rem', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Name:</span> <strong style={{ color: '#f8fafc' }}>{createdCredentials.fullName}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Username:</span> <strong style={{ color: '#f8fafc' }}>{createdCredentials.username}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Password:</span> <strong style={{ color: '#f8fafc' }}>{createdCredentials.password}</strong></div>
                    {createdCredentials.email && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Email:</span> <strong style={{ color: createdCredentials.emailSent ? '#4ade80' : '#facc15' }}>{createdCredentials.emailSent ? 'Sent' : 'Not sent'}</strong></div>}
                    {createdCredentials.email && !createdCredentials.emailSent && createdCredentials.emailError && (
                      <div style={{ color: '#facc15', fontSize: '0.85rem', textAlign: 'right' }}>{createdCredentials.emailError}</div>
                    )}
                  </div>
                </div>
                <div className="dark-modal-footer">
                  <button type="button" className="btn-cancel-dark" onClick={closeModal}>DONE</button>
                  <button type="button" className="btn-save-dark" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px -2px rgba(16, 185, 129, 0.4)' }} onClick={() => {
                    navigator.clipboard.writeText(`Name: ${createdCredentials.fullName}\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`);
                    toast.success('Credentials copied to clipboard!');
                  }}><i className="bi bi-clipboard" style={{ marginRight: '8px' }}></i>COPY CREDENTIALS</button>
                </div>
              </div>
            ) : (
              <>
                <div className="dark-modal-header">
                  <h2>{editing ? 'Edit Account' : 'Create an Account'}</h2>
                </div>

                <form onSubmit={handleSave}>
                  <div className="dark-modal-body">
                    <div className="dark-panels-container">

                      {/* LEFT PANEL */}
                      <fieldset className="dark-fieldset">
                        <legend className="dark-legend">USER DETAILS</legend>

                        <div className="dark-form-group">
                          <label>Full Name</label>
                          <input name="uFullName" value={form.uFullName} onChange={handleChange} placeholder="Enter full name" required />
                        </div>

                        <div className="dark-form-group">
                          <label>Employee Number</label>
                          <input name="uEmpNo" value={form.uEmpNo} onChange={handleChange} placeholder="Enter employee no" />
                        </div>

                        <div className="dark-form-group">
                          <label>Contact Number</label>
                          <input name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="Enter contact no" maxLength="10" />
                          {phoneError && <small style={{ color: '#fca5a5' }}>{phoneError}</small>}
                        </div>

                        <div className="dark-form-group">
                          <label>Email Address</label>
                          <input name="uEmail" type="email" value={form.uEmail} onChange={handleChange} placeholder="User email for OTP and account details" />
                        </div>

                        <div className="dark-form-group">
                          <label>Division</label>
                          <select name="divisionId" value={form.divisionId} onChange={handleChange}>
                            <option value="">Select division</option>
                            {divisions.map(d => {
                              const id = d.division_id ?? d.divisionId;
                              const label = d.description ?? d.divisionName ?? 'Unnamed';
                              return <option key={id} value={id}>{label}</option>;
                            })}
                          </select>
                        </div>

                        <div className="dark-form-group">
                          <label>Section</label>
                          <select name="sectionId" value={form.sectionId} onChange={handleChange} disabled={!form.divisionId}>
                            <option value="">Select section</option>
                            {filteredSections.map(s => {
                              const id = s.sectionid ?? s.sectionId;
                              const label = s.sectionname ?? s.sectionName ?? 'Unnamed';
                              return <option key={id} value={id}>{label}</option>;
                            })}
                          </select>
                        </div>

                      </fieldset>

                      {/* RIGHT PANEL */}
                      <fieldset className="dark-fieldset">
                        <legend className="dark-legend">ACCOUNT DETAILS</legend>

                        <div className="dark-form-group">
                          <label>Username</label>
                          <input name="uUsername" value={form.uUsername} onChange={handleChange} placeholder="Enter username" required />
                        </div>

                        <div className="dark-form-group">
                          <label>Password</label>
                          <div className="password-input-wrapper">
                            <input
                              name="uPassword"
                              type={showPassword ? "text" : "password"}
                              value={form.uPassword}
                              onChange={handleChange}
                              placeholder={editing ? 'Leave blank to keep' : 'Enter password'}
                              required={!editing}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowPassword(!showPassword)}
                              title={showPassword ? "Hide password" : "Show password"}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              tabIndex="-1"
                            >
                              <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                            </button>
                          </div>
                        </div>

                        <div className="dark-form-group">
                          <label>Confirm Password</label>
                          <div className="password-input-wrapper">
                            <input
                              name="uConfirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={form.uConfirmPassword}
                              onChange={handleChange}
                              placeholder="Confirm password"
                              required={!editing && form.uPassword !== ''}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              title={showConfirmPassword ? "Hide password" : "Show password"}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              tabIndex="-1"
                            >
                              <i className={`bi ${showConfirmPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                            </button>
                          </div>
                        </div>

                        <div className="dark-form-group">
                          <label>Status</label>
                          <select name="uStatus" value={form.uStatus} onChange={handleChange}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>

                        <div className="dark-form-group">
                          <label>Role</label>
                          <select name="roleId" value={form.roleId} onChange={handleChange}>
                            <option value="">Select Role</option>
                            {roles.map(r => (
                              <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                            ))}
                          </select>
                        </div>

                      </fieldset>
                    </div>
                  </div>

                  <div className="dark-modal-footer">
                    <button type="button" className="btn-cancel-dark" onClick={closeModal}>CANCEL</button>
                    <button type="submit" className="btn-save-dark" disabled={saving}>
                      {saving ? 'SAVING...' : editing ? 'UPDATE ACCOUNT' : 'CREATE ACCOUNT'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
