import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Navigate, Outlet } from 'react-router-dom';
import './Layout.css';
import { hasUsableToken } from '../auth/session';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  if (!hasUsableToken()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/" />;
  }

  return (
    <div className="layout-wrapper">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <button
        className={`sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close navigation"
        tabIndex={sidebarOpen ? 0 : -1}
      />
      <div className="layout-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
