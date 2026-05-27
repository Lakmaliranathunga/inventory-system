import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="header-container">
      <h2 className="header-title">{getPageTitle()}</h2>
      <div className="header-user-info">
        <div className="user-details text-end">
          <span className="user-name">{user ? user.fullName : 'Admin User'}</span>
          <span className="user-role">{user ? user.username : 'Administrator'}</span>
        </div>
        <div className="user-avatar">
          {user ? user.fullName.charAt(0).toUpperCase() : 'A'}
        </div>
      </div>
    </div>
  );
};

export default Header;
