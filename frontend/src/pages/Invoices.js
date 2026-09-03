import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Invoices.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Data
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '', invoiceNumber: '', supplierId: '', poNo: '', poDate: '', invoiceDate: '', totalAmount: '', remarks: '', invoiceImage: ''
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [invRes, supRes] = await Promise.all([
        axios.get('http://localhost:5000/api/invoices', { headers }),
        axios.get('http://localhost:5000/api/suppliers', { headers })
      ]);

      if (invRes.data.success) setInvoices(invRes.data.invoices);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);

    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setIsEdit(false);
    setImageFile(null);
    setFormData({ invoiceId: '', invoiceNumber: '', supplierId: '', poNo: '', poDate: '', invoiceDate: '', totalAmount: '', remarks: '', invoiceImage: '' });
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setIsEdit(true);
    setImageFile(null);
    setFormData({
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber || '',
      supplierId: invoice.supplierId || '',
      poNo: invoice.poNo || '',
      poDate: invoice.poDate ? invoice.poDate.split('T')[0] : '',
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '',
      totalAmount: invoice.totalAmount || '',
      remarks: invoice.remarks || '',
      invoiceImage: invoice.invoiceImage || ''
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const submitData = new FormData();
      for (const key in formData) {
        submitData.append(key, formData[key] || '');
      }
      if (imageFile) {
        submitData.append('invoiceImage', imageFile);
      }

      if (isEdit) {
        await axios.put(`http://localhost:5000/api/invoices/${formData.invoiceId}`, submitData, { headers });
        toast.success('Invoice updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/invoices', submitData, { headers });
        toast.success('Invoice added successfully');
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response && error.response.data && error.response.data.message 
        ? error.response.data.message 
        : (isEdit ? 'Failed to update invoice' : 'Failed to add invoice');
      toast.error(errMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Invoice deleted successfully');
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete invoice');
      }
    }
  };

  const filteredInvoices = invoices.filter(i => {
    const search = searchTerm ? searchTerm.toLowerCase() : '';
    if (!search) return true;
    return (
      (i.invoiceNumber && String(i.invoiceNumber).toLowerCase().includes(search)) ||
      (i.supplierName && String(i.supplierName).toLowerCase().includes(search))
    );
  });

  return (
    <div className="invoices-page">
      <div className="invoices-header">
        <h1 className="invoices-title">Invoice Management</h1>
        <button className="invoices-add-btn" onClick={openAddModal}>
          <i className="bi bi-plus-circle"></i> Add Invoice
        </button>
      </div>

      <div className="invoices-card">
        <div className="invoices-card-header">
          <h6 className="invoices-card-title">Invoices List</h6>
          <div className="invoices-search-group">
            <input
              type="text"
              className="invoices-search-input"
              placeholder="Search by invoice number, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="invoices-search-icon"><i className="bi bi-search"></i></span>
          </div>
        </div>
        <div className="invoices-card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Loading...</div>
            </div>
          ) : (
            <div className="invoices-table-wrapper">
              <table className="invoices-table">
                <thead className="invoices-table-head">
                  <tr>
                    <th>Invoice Number</th>
                    <th>PO No</th>
                    <th>Supplier</th>
                    <th>Invoice Date</th>
                    <th>PO Date</th>
                    <th>Total Amount</th>
                    <th>Attachment</th>
                    <th>Remarks</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan="6" className="invoices-empty-state">No invoices found</td></tr>
                  ) : (
                    filteredInvoices.map(invoice => (
                      <tr key={invoice.invoiceId}>
                        <td style={{ fontWeight: 'bold', color: '#0d6efd' }}>{invoice.invoiceNumber}</td>
                        <td style={{ fontWeight: 'bold', color: '#64748b' }}>{invoice.poNo || '-'}</td>
                        <td style={{ fontWeight: 'bold' }}>{invoice.supplierName || 'Unknown Supplier'}</td>
                        <td>{invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '-'}</td>
                        <td>{invoice.poDate ? invoice.poDate.split('T')[0] : '-'}</td>
                        <td>
                          <span className="invoices-amount-badge">Rs. {invoice.totalAmount}</span>
                        </td>
                        <td>
                          {invoice.invoiceImage ? (
                            <a href={`http://localhost:5000/uploads/${invoice.invoiceImage}`} target="_blank" rel="noopener noreferrer" style={{color: '#0d6efd', textDecoration: 'none'}}>
                              <i className="bi bi-file-earmark-image"></i> View
                            </a>
                          ) : <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>
                        <td><span style={{ color: '#6c757d', fontSize: '0.875rem' }}>{invoice.remarks || '-'}</span></td>
                        <td>
                          <div className="invoices-action-group">
                            <button onClick={() => openEditModal(invoice)} className="invoices-action-btn invoices-action-btn--edit">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => handleDelete(invoice.invoiceId)} className="invoices-action-btn invoices-action-btn--delete">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <React.Fragment>
          <div className="invoices-modal-backdrop">
            <div className="invoices-modal-dialog">
              <div className="invoices-modal-header">
                <h5 className="invoices-modal-title">{isEdit ? 'Edit Invoice' : 'Add New Invoice'}</h5>
                <button type="button" className="invoices-modal-close" onClick={closeModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="invoices-modal-body">
                  <div className="invoices-form-grid">
                    <div className="invoices-form-group col-span-12">
                      <label className="invoices-form-label">Invoice Number</label>
                      <input type="text" className="invoices-form-input" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} required />
                    </div>
                    <div className="invoices-form-group col-span-12">
                      <label className="invoices-form-label">Supplier</label>
                      <select className="invoices-form-select" name="supplierId" value={formData.supplierId} onChange={handleInputChange} required>
                        <option value="">Select Supplier</option>
                        {suppliers.map(sup => (
                          <option key={sup.supplierId} value={sup.supplierId}>{sup.supplierName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="invoices-form-group col-span-6">
                      <label className="invoices-form-label">PO No (Optional)</label>
                      <input type="text" className="invoices-form-input" name="poNo" value={formData.poNo} onChange={handleInputChange} />
                    </div>
                    <div className="invoices-form-group col-span-6">
                      <label className="invoices-form-label">PO Date (Optional)</label>
                      <input type="date" className="invoices-form-input" name="poDate" value={formData.poDate} onChange={handleInputChange} />
                    </div>
                    <div className="invoices-form-group col-span-6">
                      <label className="invoices-form-label">Invoice Date</label>
                      <input type="date" className="invoices-form-input" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} required />
                    </div>
                    <div className="invoices-form-group col-span-6">
                      <label className="invoices-form-label">Total Amount</label>
                      <div className="invoices-input-group">
                        <span className="invoices-input-group-text">Rs.</span>
                        <input type="text" className="invoices-form-input" name="totalAmount" placeholder="0.00" value={formData.totalAmount} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="invoices-form-group col-span-12">
                      <label className="invoices-form-label">Upload Invoice Image/Document</label>
                      <input type="file" className="invoices-form-input" onChange={(e) => setImageFile(e.target.files[0])} accept="image/*,.pdf" style={{padding: '5px 10px'}} />
                      {isEdit && formData.invoiceImage && (
                        <div style={{marginTop: '5px', fontSize: '13px', color: '#6c757d'}}>
                          <i className="bi bi-paperclip"></i> Currently uploaded: <a href={`http://localhost:5000/uploads/${formData.invoiceImage}`} target="_blank" rel="noopener noreferrer">{formData.invoiceImage}</a>
                        </div>
                      )}
                    </div>
                    <div className="invoices-form-group col-span-12">
                      <label className="invoices-form-label">Remarks</label>
                      <textarea className="invoices-form-textarea" name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange}></textarea>
                    </div>
                  </div>
                </div>
                <div className="invoices-modal-footer">
                  <button type="button" className="invoices-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="invoices-btn-primary">
                    <i className={`bi ${isEdit ? 'bi-check-circle' : 'bi-plus-circle'}`}></i>
                    {isEdit ? 'Update Invoice' : 'Save Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Invoices;
