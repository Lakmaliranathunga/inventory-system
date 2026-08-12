import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './StockAdjustments.css';

const StockAdjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    itemId: '',
    adjustmentType: 'DAMAGED',
    quantity: '',
    remarks: '',
    adjustmentDate: new Date().toISOString().slice(0, 16)
  });
  const [editId, setEditId] = useState(null);

  // Custom Dropdown State
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // Pagination (Simple)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
      
      const [adjRes, itemsRes] = await Promise.all([
        axios.get(`${apiBase}/stock-adjustments`, { headers }),
        axios.get(`${apiBase}/inventory`, { headers })
      ]);

      if (adjRes.data.success) {
        setAdjustments(adjRes.data.data);
      }
      if (itemsRes.data.success) {
        setItems(itemsRes.data.items);
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
    if (!formData.itemId || !formData.adjustmentType || !formData.quantity || !formData.remarks) {
      return toast.warning('Please fill all required fields, including Reason.');
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editId) {
        const res = await axios.put(`${apiBase}/stock-adjustments/${editId}`, formData, { headers });
        if (res.data.success) {
          toast.success('Adjustment updated');
        }
      } else {
        const res = await axios.post(`${apiBase}/stock-adjustments`, formData, { headers });
        if (res.data.success) {
          toast.success('Adjustment recorded');
        }
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save adjustment');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      adjustmentType: 'DAMAGED',
      quantity: '',
      remarks: '',
      adjustmentDate: new Date().toISOString().slice(0, 16)
    });
    setEditId(null);
    setItemSearch('');
  };

  const handleEdit = (adj) => {
    setEditId(adj.adjustmentId);
    let tDate = new Date().toISOString().slice(0, 16);
    if(adj.adjustmentDate) {
      const d = new Date(adj.adjustmentDate);
      tDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }

    setFormData({
      itemId: adj.itemId || '',
      adjustmentType: adj.adjustmentType || 'DAMAGED',
      quantity: adj.quantity || '',
      remarks: adj.remarks || '',
      adjustmentDate: tDate
    });
    setItemSearch(adj.itemCode ? `${adj.itemCode} - ${adj.itemName}` : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this adjustment record?")) {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.delete(`${apiBase}/stock-adjustments/${id}`, { headers });
        if (res.data.success) {
          toast.success('Adjustment deleted');
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to delete adjustment');
      }
    }
  };

  const filteredAdjustments = adjustments.filter(adj => {
    const matchSearch = adj.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        adj.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        adj.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType ? adj.adjustmentType === filterType : true;
    
    return matchSearch && matchType;
  });

  // Filter items for the custom dropdown
  const filteredItemsForDropdown = items.filter(i => 
    i.itemCode?.toLowerCase().includes(itemSearch.toLowerCase()) || 
    i.itemName?.toLowerCase().includes(itemSearch.toLowerCase())
  ).slice(0, 50);

  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage);
  const currentAdjustments = filteredAdjustments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getBadgeConfig = (type) => {
    switch(type) {
      case 'DAMAGED': return { class: 'badge-damage', text: 'Damage', icon: 'bi-exclamation-triangle' };
      case 'DISPOSAL': return { class: 'badge-disposal', text: 'Disposal', icon: 'bi-trash-fill' };
      default: return { class: 'badge-default', text: type, icon: 'bi-info-circle' };
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
    <div className="adj-page">
      <div className="adj-header">
        <h2 className="adj-title">Stock Adjustments</h2>
        <div className="adj-subtitle">Record and manage damaged or disposed inventory items</div>
      </div>

      <div className="adj-layout">
        {/* Form Column */}
        <div className="adj-form-col">
          <div className="adj-card">
            <div className="adj-card-header">
              <h5 className="adj-card-title">
                <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-shield-exclamation'} me-2`}></i>
                {editId ? 'Edit Adjustment' : 'Record Adjustment'}
              </h5>
            </div>
            <div className="adj-card-body">
              <form onSubmit={handleSubmit}>
                <div className="adj-form-group" style={{ position: 'relative' }}>
                  <label className="adj-label">Inventory Item *</label>
                  <input 
                    type="text"
                    className="adj-input"
                    placeholder="Type to search item code or name..."
                    value={itemSearch}
                    onChange={(e) => {
                       setItemSearch(e.target.value);
                       setShowItemDropdown(true);
                       if (formData.itemId) setFormData(prev => ({...prev, itemId: ''}));
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                    required={!formData.itemId}
                  />
                  {/* Keep the hidden input to satisfy the form requirement natively if needed, but required is handled manually sometimes */}
                  {showItemDropdown && itemSearch && filteredItemsForDropdown.length > 0 && (
                    <ul className="custom-dropdown-list">
                      {filteredItemsForDropdown.map(item => (
                        <li 
                          key={item.itemId} 
                          className="custom-dropdown-item"
                          onMouseDown={() => {
                             setFormData(prev => ({ ...prev, itemId: item.itemId }));
                             setItemSearch(`${item.itemCode} - ${item.itemName}`);
                             setShowItemDropdown(false);
                          }}
                        >
                          <strong>{item.itemCode}</strong> - {item.itemName}
                        </li>
                      ))}
                    </ul>
                  )}
                  {showItemDropdown && itemSearch && filteredItemsForDropdown.length === 0 && (
                    <ul className="custom-dropdown-list">
                      <li className="custom-dropdown-item text-muted">No items found matching "{itemSearch}"</li>
                    </ul>
                  )}
                </div>

                <div className="adj-form-group">
                  <label className="adj-label">Adjustment Type *</label>
                  <select 
                    className="adj-select" 
                    name="adjustmentType" 
                    value={formData.adjustmentType} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="DAMAGED">Damage</option>
                    <option value="DISPOSAL">Disposal</option>
                  </select>
                </div>

                <div className="adj-form-group">
                  <label className="adj-label">Affected Quantity *</label>
                  <input 
                    type="number" 
                    className="adj-input" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleInputChange} 
                    required 
                    min="1"
                    placeholder="E.g., 1"
                  />
                </div>

                <div className="adj-form-group">
                  <label className="adj-label">Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="adj-input" 
                    name="adjustmentDate" 
                    value={formData.adjustmentDate} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>

                <div className="adj-form-group">
                  <label className="adj-label">Reason / Remarks *</label>
                  <textarea 
                    className="adj-textarea" 
                    name="remarks" 
                    rows="3" 
                    value={formData.remarks} 
                    onChange={handleInputChange}
                    required
                    placeholder="Provide details for this adjustment..."
                  ></textarea>
                </div>

                <button type="submit" className="adj-submit-btn">
                  <i className="bi bi-floppy"></i> {editId ? 'UPDATE RECORD' : 'SAVE RECORD'}
                </button>
                {editId && (
                  <button type="button" className="adj-cancel-btn" onClick={resetForm}>
                    <i className="bi bi-x-circle"></i> CANCEL EDIT
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* List Column */}
        <div className="adj-list-col">
          <div className="adj-card">
            <div className="adj-card-body">
              
              {/* Filters */}
              <div className="adj-filters">
                <div className="adj-search-group">
                  <span className="adj-search-icon"><i className="bi bi-search"></i></span>
                  <input 
                    type="text" 
                    className="adj-search-input" 
                    placeholder="Search item name, code, or reason..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <select 
                  className="adj-filter-select" 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="DAMAGED">Damage</option>
                  <option value="DISPOSAL">Disposal</option>
                </select>
              </div>

              {/* Table */}
              <div className="adj-table-wrapper">
                <table className="adj-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item Details</th>
                      <th>Type & Qty</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAdjustments.length > 0 ? (
                      currentAdjustments.map(adj => {
                        const badge = getBadgeConfig(adj.adjustmentType);
                        return (
                          <tr key={adj.adjustmentId}>
                            <td>
                              <div style={{fontWeight: 600}}>{new Date(adj.adjustmentDate).toLocaleDateString()}</div>
                              <small style={{color: '#94a3b8'}}>{new Date(adj.adjustmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </td>
                            <td>
                              <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{adj.itemName}</div>
                              <small style={{ color: '#64748b' }}>Code: {adj.itemCode}</small>
                              {adj.serialNumber && <div><small style={{color: '#10b981'}}>SN: {adj.serialNumber}</small></div>}
                              {adj.supplierName && <div><small style={{color: '#8b5cf6'}}><i className="bi bi-truck me-1"></i>{adj.supplierName}</small></div>}
                            </td>
                            <td>
                              <div className={`adj-badge ${badge.class}`}>
                                <i className={`bi ${badge.icon}`}></i> {badge.text}
                              </div>
                              <div style={{marginTop: '4px', fontWeight: 'bold', color: '#334155'}}>
                                Qty: {adj.quantity}
                              </div>
                            </td>
                            <td>
                              <div className="adj-reason">
                                {adj.remarks || 'No reason provided'}
                              </div>
                            </td>
                            <td>
                              <div className="adj-actions">
                                <button className="adj-action-btn btn-edit" onClick={() => handleEdit(adj)} title="Edit">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button className="adj-action-btn btn-delete" onClick={() => handleDelete(adj.adjustmentId)} title="Delete">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="adj-empty">
                          <i className="bi bi-clipboard-x adj-empty-icon"></i>
                          <div>No adjustments found matching your criteria</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
                  <button 
                    style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                  ><i className="bi bi-chevron-left"></i></button>
                  <span style={{ padding: '6px 12px', fontWeight: 600, color: '#334155' }}>Page {currentPage} of {totalPages}</span>
                  <button 
                    style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                  ><i className="bi bi-chevron-right"></i></button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustments;
