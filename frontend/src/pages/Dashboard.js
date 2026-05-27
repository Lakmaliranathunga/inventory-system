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
      
      <div className="row">
        <div className="col-12">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                    <h6 className="m-0 font-weight-bold text-primary">System Overview</h6>
                </div>
                <div className="card-body">
                    <p>Welcome to the SLPA Inventory Management System. Use the sidebar to navigate through the modules.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;