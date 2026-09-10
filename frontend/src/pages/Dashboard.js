import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './Dashboard.css';

const initialData = {
  stats: {
    users: 0,
    items: 0,
    good: 0,
    damaged: 0,
    disposal: 0,
    suppliers: 0,
    invoices: 0,
    invoiceValue: 0,
    warrantiesDue: 0,
  },
  warrantyAlerts: [],
  categoryDistribution: [],
  recentInventory: [],
  recentAdjustments: [],
};

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : '-';

const conditionClass = (value) => {
  const condition = String(value || 'Good').toLowerCase();
  if (condition === 'damaged') return 'is-damaged';
  if (condition === 'disposal') return 'is-disposal';
  return 'is-good';
};

const quickLinks = [
  { to: '/inventory', className: 'quick-blue', icon: 'bi-box-seam-fill', title: 'Inventory', text: 'View and manage assets' },
  { to: '/categories', className: 'quick-purple', icon: 'bi-tags-fill', title: 'Categories', text: 'Organize inventory items' },
  { to: '/suppliers', className: 'quick-cyan', icon: 'bi-truck', title: 'Suppliers', text: 'Manage supplier details' },
  { to: '/invoices', className: 'quick-amber', icon: 'bi-receipt-cutoff', title: 'Invoices', text: 'Review purchase records' },
  { to: '/stock-adjustments', className: 'quick-green', icon: 'bi-tools', title: 'Stock Adjustments', text: 'Record asset conditions' },
  { to: '/reports', className: 'quick-red', icon: 'bi-file-earmark-bar-graph-fill', title: 'Reports', text: 'Analyze and export data' },
];

const Dashboard = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/dashboard/stats');
      if (response.data?.success) setData({ ...initialData, ...response.data });
      else setError('Dashboard data could not be loaded.');
    } catch (requestError) {
      console.error('Error fetching dashboard data', requestError);
      setError(requestError.response?.data?.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const { stats } = data;

  if (loading) {
    return <div className="page-loading"><span className="app-loader" />Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-error" role="alert">
        <i className="bi bi-cloud-slash"></i>
        <h3>Unable to load the dashboard</h3>
        <p>{error}</p>
        <button type="button" onClick={fetchDashboard}>
          <i className="bi bi-arrow-clockwise"></i> Try again
        </button>
      </div>
    );
  }

  const summaryCards = [
    { label: 'All assets', value: stats.items, detail: 'Registered inventory', icon: 'bi-box-seam-fill', tone: 'blue' },
    { label: 'Good condition', value: stats.good, detail: `${stats.items ? Math.round((stats.good / stats.items) * 100) : 0}% of inventory`, icon: 'bi-check-circle-fill', tone: 'green' },
    { label: 'Damaged', value: stats.damaged, detail: stats.damaged ? 'Requires attention' : 'No items reported', icon: 'bi-exclamation-triangle-fill', tone: 'amber' },
    { label: 'For disposal', value: stats.disposal, detail: stats.disposal ? 'Awaiting action' : 'No items reported', icon: 'bi-trash3-fill', tone: 'red' },
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-summary-grid" aria-label="Inventory summary">
        {summaryCards.map(card => (
          <article className={`dashboard-summary-card tone-${card.tone}`} key={card.label}>
            <div className="dashboard-summary-copy">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </div>
            <div className="dashboard-summary-icon">
              <i className={`bi ${card.icon}`}></i>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-quick-section" aria-labelledby="quick-access-title">
        <div className="dashboard-section-heading">
          <div>
            <span className="section-kicker">Workspace</span>
            <h2 id="quick-access-title">Quick Access</h2>
          </div>
          <p>Jump directly to your most-used inventory tools</p>
        </div>

        <div className="dashboard-quick-grid">
          {quickLinks.map(link => (
            <Link to={link.to} className={`dashboard-quick-card ${link.className}`} key={link.to}>
              <i className="bi bi-arrow-up-right quick-card-arrow"></i>
              <span className="quick-card-icon">
                <i className={`bi ${link.icon}`}></i>
              </span>
              <strong>{link.title}</strong>
              <small>{link.text}</small>
            </Link>
          ))}
        </div>
      </section>

      <div className="dashboard-activity-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recently added</h2>
              <p>Latest registered inventory assets</p>
            </div>
            <Link to="/inventory" className="dashboard-text-link">All inventory <i className="bi bi-arrow-right"></i></Link>
          </div>
          <div className="dashboard-list">
            {data.recentInventory.length === 0 ? (
              <div className="dashboard-empty"><i className="bi bi-box"></i>No inventory added yet</div>
            ) : data.recentInventory.map(item => (
              <Link to="/inventory" className="dashboard-list-item" key={item.itemId}>
                <span className="list-icon inventory"><i className="bi bi-box-seam"></i></span>
                <span className="list-copy"><strong>{item.itemName}</strong><small>{item.itemCode} / {item.divisionName}</small></span>
                <span className={`condition-pill ${conditionClass(item.itemCondition)}`}>{item.itemCondition || 'Good'}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recent adjustments</h2>
              <p>Latest condition changes and corrections</p>
            </div>
            <Link to="/stock-adjustments" className="dashboard-text-link">View all <i className="bi bi-arrow-right"></i></Link>
          </div>
          <div className="dashboard-list">
            {data.recentAdjustments.length === 0 ? (
              <div className="dashboard-empty"><i className="bi bi-clipboard-check"></i>No adjustment activity yet</div>
            ) : data.recentAdjustments.map(item => (
              <Link to="/stock-adjustments" className="dashboard-list-item" key={item.adjustmentId}>
                <span className={`list-icon adjustment ${String(item.adjustmentType).toLowerCase()}`}><i className="bi bi-arrow-repeat"></i></span>
                <span className="list-copy"><strong>{item.itemName}</strong><small>{item.itemCode || 'Unassigned'} / {formatDate(item.adjustmentDate)}</small></span>
                <span className={`condition-pill ${conditionClass(item.adjustmentType)}`}>{item.adjustmentType}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
