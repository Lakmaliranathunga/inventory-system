import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, items: 0, suppliers: 0, invoices: 0, stockIn: 0, stockOut: 0, stockTransfer: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const txRes = await axios.get('http://localhost:5000/api/stock-adjustments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
      if (txRes.data.success) {
        setRecentTransactions(txRes.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      {/* Top Stats Row (4 items) */}
      <div className="stat-cards-grid">
        
        <div className="stat-card">
          <div className="stat-card-body">
            <div>
              <div className="stat-label stat-label--blue">Total Users</div>
              <div className="stat-value">{stats.users}</div>
            </div>
            <i className="bi bi-people-fill stat-icon stat-icon--blue"></i>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-body">
            <div>
              <div className="stat-label stat-label--green">Inventory Items</div>
              <div className="stat-value">{stats.items}</div>
            </div>
            <i className="bi bi-box-seam-fill stat-icon stat-icon--green"></i>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-body">
            <div>
              <div className="stat-label stat-label--cyan">Suppliers</div>
              <div className="stat-value">{stats.suppliers}</div>
            </div>
            <i className="bi bi-truck stat-icon stat-icon--cyan"></i>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-body">
            <div>
              <div className="stat-label stat-label--yellow">Invoices</div>
              <div className="stat-value">{stats.invoices}</div>
            </div>
            <i className="bi bi-receipt stat-icon stat-icon--yellow"></i>
          </div>
        </div>
      </div>


      
      {/* Quick Links Section */}
      <div className="quick-links-section">
        <div className="quick-links-header">
          <h5 className="recent-card-title">Quick Access</h5>
        </div>
        <div className="quick-links-grid">
          <Link to="/inventory" className="quick-link-card quick-link-card--blue">
            <i className="bi bi-box-seam-fill quick-link-icon"></i>
            <span className="quick-link-text">Inventory</span>
          </Link>
          <Link to="/categories" className="quick-link-card quick-link-card--purple">
            <i className="bi bi-tags-fill quick-link-icon"></i>
            <span className="quick-link-text">Categories</span>
          </Link>
          <Link to="/suppliers" className="quick-link-card quick-link-card--cyan">
            <i className="bi bi-truck quick-link-icon"></i>
            <span className="quick-link-text">Suppliers</span>
          </Link>
          <Link to="/invoices" className="quick-link-card quick-link-card--yellow">
            <i className="bi bi-receipt quick-link-icon"></i>
            <span className="quick-link-text">Invoices</span>
          </Link>
          <Link to="/stock-adjustments" className="quick-link-card quick-link-card--green">
            <i className="bi bi-tools quick-link-icon"></i>
            <span className="quick-link-text">Stock Adjustments</span>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;