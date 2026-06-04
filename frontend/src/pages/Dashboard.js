import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, items: 0, suppliers: 0, invoices: 0 });
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
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        
        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div className="card shadow-sm border-0 h-100 py-2">
            <div className="card-body">
              <div className="row">
                <div className="col">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Users</div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.users}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-people-fill fa-2x text-gray-300 fs-1 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div className="card shadow-sm border-0 h-100 py-2">
            <div className="card-body">
              <div className="row">
                <div className="col">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Inventory Items</div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.items}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-box-seam-fill fa-2x text-gray-300 fs-1 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div className="card shadow-sm border-0 h-100 py-2">
            <div className="card-body">
              <div className="row">
                <div className="col">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Suppliers</div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.suppliers}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-truck fa-2x text-gray-300 fs-1 text-info"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div className="card shadow-sm border-0 h-100 py-2">
            <div className="card-body">
              <div className="row">
                <div className="col">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Invoices</div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.invoices}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-receipt fa-2x text-gray-300 fs-1 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-2">
        <div className="col-12">
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '16px', background: 'linear-gradient(145deg, #ffffff, #f8faff)' }}>
            <div className="card-body p-5">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary text-white p-2 rounded-3 me-3 shadow-sm">
                      <i className="bi bi-grid-fill fs-5"></i>
                    </div>
                    <h2 className="fw-bold mb-0" style={{ color: '#1e293b' }}>
                      SLPA Inventory Manager
                    </h2>
                  </div>
                  <h4 className="text-muted fw-normal mb-4" style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                    Welcome back! Streamline your workflow with real-time tracking of assets, robust supplier management, and comprehensive invoicing tools.
                  </h4>
                  <div className="d-flex flex-wrap gap-3 mt-4">
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold border border-primary border-opacity-25" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-speedometer2 me-2"></i> Real-time Analytics
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-semibold border border-success border-opacity-25" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-shield-check me-2"></i> Secure Platform
                    </span>
                    <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill fw-semibold border border-info border-opacity-25" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-cloud-arrow-up me-2"></i> Cloud Sync
                    </span>
                  </div>
                </div>
                <div className="col-lg-4 d-none d-lg-flex justify-content-center position-relative mt-4 mt-lg-0">
                  <div className="position-absolute top-50 start-50 translate-middle" style={{ width: '180px', height: '180px', background: '#cbd5e1', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.5, zIndex: 0 }}></div>
                  <i className="bi bi-box-seam text-primary position-relative" style={{ fontSize: '8rem', zIndex: 1, filter: 'drop-shadow(0 15px 25px rgba(13,110,253,0.2))' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;