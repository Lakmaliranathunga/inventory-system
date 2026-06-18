import React, { useState, useEffect } from 'react';
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
      const txRes = await axios.get('http://localhost:5000/api/stock-transactions', {
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

      {/* Second Stats Row (3 items) */}
      <div className="stat-cards-grid stat-cards-grid--3">
        
        <div className="stat-card">
          <div className="stat-card-body">
            <div>
              <div className="stat-label stat-label--green">Total Stock In</div>
              <div className="stat-value">{stats.stockIn}</div>
            </div>
            <i className="bi bi-arrow-down-circle-fill stat-icon stat-icon--green"></i>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-body">
            <div>
              <div className="stat-label stat-label--red">Total Stock Out</div>
              <div className="stat-value">{stats.stockOut}</div>
            </div>
            <i className="bi bi-arrow-up-circle-fill stat-icon stat-icon--red"></i>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-body">
            <div>
              <div className="stat-label stat-label--yellow">Total Transfers</div>
              <div className="stat-value">{stats.stockTransfer}</div>
            </div>
            <i className="bi bi-arrow-left-right stat-icon stat-icon--yellow"></i>
          </div>
        </div>
      </div>
      
      {/* Welcome Banner */}
      <div className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-layout">
            <div className="welcome-content">
              <div className="welcome-brand">
                <i className="bi bi-grid-fill welcome-brand-icon"></i>
                <h2 className="welcome-heading">SLPA Inventory Manager</h2>
              </div>
              <h4 className="welcome-description">
                Welcome back! Streamline your workflow with real-time tracking of assets, robust supplier management, and comprehensive invoicing tools.
              </h4>
              <div className="welcome-features">
                <span className="welcome-feature welcome-feature--blue">
                  <i className="bi bi-speedometer2"></i> Real-time Analytics
                </span>
                <span className="welcome-feature welcome-feature--green">
                  <i className="bi bi-shield-check"></i> Secure Platform
                </span>
                <span className="welcome-feature welcome-feature--cyan">
                  <i className="bi bi-cloud-arrow-up"></i> Cloud Sync
                </span>
              </div>
            </div>
            <div className="welcome-illustration">
              <div className="welcome-glow"></div>
              <i className="bi bi-box-seam welcome-main-icon"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="recent-section">
        <div className="recent-card">
          <div className="recent-card-header">
            <h5 className="recent-card-title">Recent Stock Transactions</h5>
          </div>
          <div className="recent-table-wrapper">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th className="recent-date-cell">Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>From</th>
                  <th>To</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(txn => (
                  <tr key={txn.transactionId}>
                    <td className="recent-date-cell text-muted"><small>{new Date(txn.transactionDate).toLocaleDateString()}</small></td>
                    <td><div className="fw-bold">{txn.itemName}</div><small className="text-muted">{txn.itemCode}</small></td>
                    <td>
                      <span className={`txn-badge ${txn.transactionType === 'IN' ? 'txn-badge--in' : txn.transactionType === 'OUT' ? 'txn-badge--out' : 'txn-badge--transfer'}`}>
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="fw-bold">{txn.quantity}</td>
                    <td><small>{txn.fromDivisionName || '-'}</small></td>
                    <td><small>{txn.toDivisionName || '-'}</small></td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No recent transactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;