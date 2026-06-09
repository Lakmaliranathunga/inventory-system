import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';

const StockTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    itemId: '',
    transactionType: 'IN',
    quantity: '',
    fromDivisionId: '',
    toDivisionId: '',
    remarks: '',
    transactionDate: new Date().toISOString().slice(0, 16)
  });
  const [editId, setEditId] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // APIs
  const apiBase = "http://localhost:5000/api";
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [transRes, itemsRes, divRes] = await Promise.all([
        axios.get(`${apiBase}/stock-transactions`, { headers }),
        axios.get(`${apiBase}/inventory`, { headers }),
        axios.get(`http://localhost:5000/divisions`, { headers }) // Endpoint given in server.js
      ]);

      if (transRes.data.success) {
        setTransactions(transRes.data.data);
      }
      if (itemsRes.data.success) {
        setItems(itemsRes.data.items);
      }
      if (divRes.data) {
        setDivisions(divRes.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemId || !formData.transactionType || !formData.quantity) {
      return toast.warning('Please fill all required fields');
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editId) {
        const res = await axios.put(`${apiBase}/stock-transactions/${editId}`, formData, { headers });
        if (res.data.success) {
          toast.success('Transaction updated successfully');
        }
      } else {
        const res = await axios.post(`${apiBase}/stock-transactions`, formData, { headers });
        if (res.data.success) {
          toast.success('Transaction added successfully');
        }
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save transaction');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      transactionType: 'IN',
      quantity: '',
      fromDivisionId: '',
      toDivisionId: '',
      remarks: '',
      transactionDate: new Date().toISOString().slice(0, 16)
    });
    setEditId(null);
  };

  const handleEdit = (txn) => {
    setEditId(txn.transactionId);
    let tDate = new Date().toISOString().slice(0, 16);
    if(txn.transactionDate) {
      const d = new Date(txn.transactionDate);
      // to local datetime-local format
      tDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }

    setFormData({
      itemId: txn.itemId || '',
      transactionType: txn.transactionType || 'IN',
      quantity: txn.quantity || '',
      fromDivisionId: txn.fromDivisionId || '',
      toDivisionId: txn.toDivisionId || '',
      remarks: txn.remarks || '',
      transactionDate: tDate
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.delete(`${apiBase}/stock-transactions/${id}`, { headers });
        if (res.data.success) {
          toast.success('Transaction deleted');
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to delete transaction');
      }
    }
  };

  // Filter & Pagination Logic
  const filteredTransactions = transactions.filter(txn => {
    const matchSearch = txn.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        txn.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        txn.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType ? txn.transactionType === filterType : true;
    
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTransactionBadge = (type) => {
    switch(type) {
      case 'IN': return 'bg-success';
      case 'OUT': return 'bg-danger';
      case 'TRANSFER': return 'bg-warning text-dark';
      case 'RETURN': return 'bg-info';
      case 'DAMAGED': return 'bg-secondary';
      case 'DISPOSAL': return 'bg-dark';
      default: return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-secondary fw-bold" style={{ color: '#0b2239' }}>Stock Transactions</h2>
      </div>

      <div className="row">
        {/* Form Column */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm border-0" style={{ borderTop: '4px solid #0b2239', borderRadius: '10px' }}>
            <div className="card-header bg-white text-dark py-3">
              <h5 className="mb-0 fw-bold">
                <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                {editId ? 'Edit Transaction' : 'Record Transaction'}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Item <span className="text-danger">*</span></label>
                  <select 
                    className="form-select" 
                    name="itemId" 
                    value={formData.itemId} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select Item --</option>
                    {items.map(item => (
                      <option key={item.itemId} value={item.itemId}>
                        {item.itemCode} - {item.itemName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Transaction Type <span className="text-danger">*</span></label>
                  <select 
                    className="form-select" 
                    name="transactionType" 
                    value={formData.transactionType} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="RETURN">RETURN</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="DISPOSAL">DISPOSAL</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Quantity <span className="text-danger">*</span></label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleInputChange} 
                    required 
                    min="1"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">From Division</label>
                  <select 
                    className="form-select" 
                    name="fromDivisionId" 
                    value={formData.fromDivisionId} 
                    onChange={handleInputChange}
                  >
                    <option value="">-- Select Division --</option>
                    {divisions.map(div => (
                      <option key={div.divisionId} value={div.divisionId}>
                        {div.divisionName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">To Division</label>
                  <select 
                    className="form-select" 
                    name="toDivisionId" 
                    value={formData.toDivisionId} 
                    onChange={handleInputChange}
                  >
                    <option value="">-- Select Division --</option>
                    {divisions.map(div => (
                      <option key={div.divisionId} value={div.divisionId}>
                        {div.divisionName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="form-control" 
                    name="transactionDate" 
                    value={formData.transactionDate} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Remarks</label>
                  <textarea 
                    className="form-control" 
                    name="remarks" 
                    rows="2" 
                    value={formData.remarks} 
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn text-white fw-bold" style={{ backgroundColor: '#0b2239' }}>
                    {editId ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}
                  </button>
                  {editId && (
                    <button type="button" className="btn btn-secondary fw-bold" onClick={resetForm}>
                      CANCEL
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* List Column */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
            <div className="card-body">
              
              {/* Filters */}
              <div className="row mb-4 bg-light p-3 rounded mx-0">
                <div className="col-md-4 mb-2 mb-md-0">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0" 
                      placeholder="Search Item or Code..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="col-md-3 mb-2 mb-md-0">
                  <select 
                    className="form-select" 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="RETURN">RETURN</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="DISPOSAL">DISPOSAL</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.length > 0 ? (
                      currentTransactions.map(txn => (
                        <tr key={txn.transactionId}>
                          <td>{new Date(txn.transactionDate).toLocaleDateString()}</td>
                          <td>
                            <div className="fw-bold text-dark">{txn.itemName}</div>
                            <small className="text-muted">{txn.itemCode}</small>
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${getTransactionBadge(txn.transactionType)} px-3 py-2 shadow-sm`}>
                              {txn.transactionType}
                            </span>
                          </td>
                          <td className="fw-bold">{txn.quantity}</td>
                          <td><small>{txn.fromDivisionName || '-'}</small></td>
                          <td><small>{txn.toDivisionName || '-'}</small></td>
                          <td>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(txn)} title="Edit">
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(txn.transactionId)} title="Delete">
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination pagination-sm">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i+1} className={`page-item ${currentPage === i+1 ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(i+1)}>{i+1}</button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTransactions;
