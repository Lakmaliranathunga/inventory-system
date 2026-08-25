import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Users.css';

const API = 'http://localhost:5000';

const emptyForm = {
  uUsername: '', uFullName: '', uPassword: '', uEmpNo: '',
  contactNo: '', roleId: '', divisionId: '', sectionId: '', uStatus: 'Active'
};

const Users = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roleId === 1 || user.roleId === '1';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [users, setUsers]         = useState([]);
  const [roles, setRoles]         = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [sections, setSections]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);   // null = add, id = edit
  const [form, setForm]           = useState({ ...emptyForm, uConfirmPassword: '' });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, dRes, sRes] = await Promise.all([
        axios.get(`${API}/api/users`, { headers }),
        axios.get(`${API}/roles`),
        axios.get(`${API}/divisions`),
        axios.get(`${API}/sections`),
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
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u.uId);
    setForm({
      uUsername:  u.uUsername  || '',
      uFullName:  u.uFullName  || '',
      uPassword:  '',
      uEmpNo:     u.uEmpNo     || '',
      contactNo:  u.contactNo  || '',
      roleId:     u.roleId     || '',
      divisionId: u.divisionId || '',
      sectionId:  u.sectionId  || '',
      uStatus:    u.uStatus    || 'Active',
      uConfirmPassword: ''
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'divisionId') {
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
    if (!editing && !form.uPassword) {
      toast.error('Password is required for new users.');
      return;
    }
    if (form.uPassword !== form.uConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`${API}/api/users/${editing}`, form, { headers });
        toast.success('User updated successfully!');
      } else {
        await axios.post(`${API}/api/users`, form, { headers });
        toast.success('User created successfully!');
      }
      closeModal();
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
      await axios.delete(`${API}/api/users/${u.uId}`, { headers });
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
                <th>#</th>
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
              {filtered.map((u, i) => (
                <tr key={u.uId}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{i + 1}</td>
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
                      <input name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="Enter contact no" />
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
                      <input
                        name="uPassword" type="password"
                        value={form.uPassword} onChange={handleChange}
                        placeholder={editing ? 'Leave blank to keep' : 'Enter password'}
                        required={!editing}
                      />
                    </div>

                    <div className="dark-form-group">
                      <label>Confirm Password</label>
                      <input
                        name="uConfirmPassword" type="password"
                        value={form.uConfirmPassword} onChange={handleChange}
                        placeholder="Confirm password"
                        required={!editing && form.uPassword !== ''}
                      />
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
