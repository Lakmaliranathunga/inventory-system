import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './StockTransactions.css';

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
      case 'IN': return 'badge-in';
      case 'OUT': return 'badge-out';
      case 'TRANSFER': return 'badge-transfer';
      case 'RETURN': return 'badge-return';
      case 'DAMAGED': return 'badge-damaged';
      case 'DISPOSAL': return 'badge-disposal';
      case 'SELL': return 'badge-sell';
      default: return 'badge-primary';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="transaction-page">
      <div className="transaction-header">
        <h2 className="transaction-title">Stock Transactions</h2>
      </div>

      <div className="transaction-layout">
        {/* Form Column */}
        <div className="transaction-form-col">
          <div className="transaction-card transaction-form-card">
            <div className="transaction-card-header">
              <h5 className="transaction-card-title">
                <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                {editId ? 'Edit Transaction' : 'Record Transaction'}
              </h5>
            </div>
            <div className="transaction-card-body">
              <form onSubmit={handleSubmit}>
                <div className="transaction-form-group">
                  <label className="transaction-label">Item</label>
                  <select 
                    className="transaction-select" 
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

                <div className="transaction-form-group">
                  <label className="transaction-label">Transaction Type</label>
                  <select 
                    className="transaction-select" 
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
                    <option value="SELL">SELL</option>
                  </select>
                </div>

                <div className="transaction-form-group">
                  <label className="transaction-label">Quantity</label>
                  <input 
                    type="number" 
                    className="transaction-input" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleInputChange} 
                    required 
                    min="1"
                  />
                </div>

                <div className="transaction-form-group">
                  <label className="transaction-label">From Division</label>
                  <select 
                    className="transaction-select" 
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

                <div className="transaction-form-group">
                  <label className="transaction-label">To Division</label>
                  <select 
                    className="transaction-select" 
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

                <div className="transaction-form-group">
                  <label className="transaction-label">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="transaction-input" 
                    name="transactionDate" 
                    value={formData.transactionDate} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="transaction-form-group">
                  <label className="transaction-label">Remarks</label>
                  <textarea 
                    className="transaction-textarea" 
                    name="remarks" 
                    rows="2" 
                    value={formData.remarks} 
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <button type="submit" className="transaction-submit-btn">
                  {editId ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}
                </button>
                {editId && (
                  <button type="button" className="transaction-cancel-btn" onClick={resetForm}>
                    CANCEL
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* List Column */}
        <div className="transaction-list-col">
          <div className="transaction-card">
            <div className="transaction-card-body">
              
              {/* Filters */}
              <div className="transaction-filters">
                <div className="transaction-search-group">
                  <span className="transaction-search-icon"><i className="bi bi-search"></i></span>
                  <input 
                    type="text" 
                    className="transaction-search-input" 
                    placeholder="Search Item or Code..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <select 
                  className="transaction-filter-select" 
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
                  <option value="SELL">SELL</option>
                </select>
              </div>

              {/* Table */}
              <div className="transaction-table-wrapper">
                <table className="transaction-table">
                  <thead>
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
                            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{txn.itemName}</div>
                            <small style={{ color: '#64748b' }}>{txn.itemCode}</small>
                          </td>
                          <td>
                            <span className={`transaction-badge ${getTransactionBadge(txn.transactionType)}`}>
                              {txn.transactionType}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{txn.quantity}</td>
                          <td><small>{txn.fromDivisionName || '-'}</small></td>
                          <td><small>{txn.toDivisionName || '-'}</small></td>
                          <td>
                            <div className="transaction-actions">
                              <button className="transaction-action-btn transaction-action-btn--edit" onClick={() => handleEdit(txn)} title="Edit">
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="transaction-action-btn transaction-action-btn--delete" onClick={() => handleDelete(txn.transactionId)} title="Delete">
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="transaction-empty">
                          <i className="bi bi-inbox transaction-empty-icon"></i>
                          <div>No transactions found</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <ul className="transaction-pagination">
                  <li>
                    <button 
                      className="transaction-page-btn" 
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i+1}>
                      <button 
                        className={`transaction-page-btn ${currentPage === i+1 ? 'transaction-page-btn--active' : ''}`} 
                        onClick={() => setCurrentPage(i+1)}
                      >
                        {i+1}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button 
                      className="transaction-page-btn" 
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTransactions;
