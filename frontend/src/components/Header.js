import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import { getStoredUser } from '../auth/session';

const pageDetails = {
  dashboard: ['Dashboard', 'Overview of your inventory operations'],
  inventory: ['Inventory', 'Track and manage registered assets'],
  categories: ['Categories', 'Organize item types and categories'],
  suppliers: ['Suppliers', 'Manage supplier information'],
  invoices: ['Invoices', 'Manage purchases and invoice records'],
  'stock-adjustments': ['Stock Adjustments', 'Record damaged, disposed, or corrected assets'],
  reports: ['Reports', 'Analyze and export inventory data'],
  users: ['User Management', 'Manage access and staff accounts'],
  'change-password': ['Change Password', 'Update your account password with email OTP'],
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = getStoredUser();
    if (userData.id) setUser(userData);
  }, []);

  const getPageDetails = () => {
    const path = location.pathname.split('/')[1];
    return pageDetails[path] || pageDetails.dashboard;
  };

  const [title, subtitle] = getPageDetails();

  return (
    <div className="header-container">
      <button className="header-menu-btn" onClick={onMenuClick} aria-label="Open navigation">
        <i className="bi bi-list"></i>
      </button>
      <div className="header-heading">
        <h2 className="header-title">{title}</h2>
        <span className="header-subtitle">{subtitle}</span>
      </div>
      <div className="header-user-info">
        <div className="user-details text-end">
          <span className="user-name">{user ? user.fullName : 'Admin User'}</span>
          <span className="user-role">@{user ? user.username : 'administrator'}</span>
        </div>
        <div className="user-avatar">
          {user?.fullName?.charAt(0).toUpperCase() || 'A'}
        </div>
      </div>
    </div>
  );
};

export default Header;
