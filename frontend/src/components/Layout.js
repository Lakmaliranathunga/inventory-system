import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Navigate, Outlet } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" />;
  }

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
