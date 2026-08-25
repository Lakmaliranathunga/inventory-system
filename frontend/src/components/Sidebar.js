import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Sidebar.css';
import logo from '../assets/images/slpa-logo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roleId === 1 || user.roleId === '1';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-logo">
        <div className="logo-wrapper">
          <img src={logo} alt="SLPA Logo" className="sidebar-logo-img" />
        </div>
        <h4>SLPA</h4>
        <span>Inventory Management</span>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <i className="bi bi-grid-1x2-fill"></i>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/inventory" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <i className="bi bi-box-seam"></i>
            Inventory
          </NavLink>
        </li>
        <li>
          <NavLink to="/categories" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <i className="bi bi-tags-fill"></i>
            Categories
          </NavLink>
        </li>
        <li>
          <NavLink to="/suppliers" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <i className="bi bi-truck"></i>
            Suppliers
          </NavLink>
        </li>
        <li>
          <NavLink to="/invoices" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <i className="bi bi-receipt"></i>
            Invoices
          </NavLink>
        </li>
        <li>
          <NavLink to="/stock-adjustments" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <i className="bi bi-tools"></i>
            Stock Adjustments
          </NavLink>
        </li>
        <li>
          <NavLink to="/reports" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <i className="bi bi-file-earmark-bar-graph-fill"></i>
            Reports
          </NavLink>
        </li>
        {isAdmin && (
          <li>
            <NavLink to="/users" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <i className="bi bi-people-fill"></i>
              User Management
            </NavLink>
          </li>
        )}
      </ul>
      <div style={{ marginTop: 'auto', padding: '20px' }}>
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
