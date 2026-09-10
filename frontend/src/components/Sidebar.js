import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Sidebar.css';
import logo from '../assets/images/slpa-logo-transparent.png';
import { getStoredUser } from '../auth/session';

const menuItems = [
  { to: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
  { to: '/inventory', icon: 'bi-box-seam', label: 'Inventory' },
  { to: '/categories', icon: 'bi-tags-fill', label: 'Categories' },
  { to: '/suppliers', icon: 'bi-truck', label: 'Suppliers' },
  { to: '/invoices', icon: 'bi-receipt', label: 'Invoices' },
  { to: '/stock-adjustments', icon: 'bi-tools', label: 'Stock Adjustments' },
  { to: '/reports', icon: 'bi-file-earmark-bar-graph-fill', label: 'Reports' },
  { to: '/change-password', icon: 'bi-shield-lock-fill', label: 'Change Password' },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user.roleId === 1 || user.roleId === '1';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className={`sidebar-container ${open ? 'is-open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-logo">
        <div className="logo-wrapper">
          <img src={logo} alt="SLPA Logo" className="sidebar-logo-img" />
        </div>
        <h4>SLPA</h4>
        <span>Inventory Management</span>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close navigation">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map(item => (
          <li key={item.to}>
            <NavLink to={item.to} onClick={onClose} className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}

        {isAdmin && (
          <li>
            <NavLink to="/users" onClick={onClose} className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <i className="bi bi-people-fill"></i>
              User Management
            </NavLink>
          </li>
        )}
      </ul>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
