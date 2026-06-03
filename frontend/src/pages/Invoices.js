import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Data
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '', invoiceNumber: '', supplierId: '', invoiceDate: '', totalAmount: '', remarks: ''
  });

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
    setFormData({ invoiceId: '', invoiceNumber: '', supplierId: '', invoiceDate: '', totalAmount: '', remarks: '' });
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setIsEdit(true);
    setFormData({
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber || '',
      supplierId: invoice.supplierId || '',
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '',
      totalAmount: invoice.totalAmount || '',
      remarks: invoice.remarks || ''
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/invoices/${formData.invoiceId}`, formData, { headers });
        toast.success('Invoice updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/invoices', formData, { headers });
        toast.success('Invoice added successfully');
      }
      
      closeModal();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(isEdit ? 'Failed to update invoice' : 'Failed to add invoice');
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
    <div className="container-fluid py-4">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Invoice Management</h1>
        <button className="btn btn-primary shadow-sm" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add Invoice
        </button>
      </div>

      <div className="card shadow mb-4 border-0">
        <div className="card-header py-3 bg-white d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Invoices List</h6>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by invoice number, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="input-group-text"><i className="bi bi-search"></i></span>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Invoice Number</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Remarks</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4">No invoices found</td></tr>
                  ) : (
                    filteredInvoices.map(invoice => (
                      <tr key={invoice.invoiceId}>
                        <td className="fw-bold text-primary">{invoice.invoiceNumber}</td>
                        <td className="fw-bold">{invoice.supplierName || 'Unknown Supplier'}</td>
                        <td>{invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : '-'}</td>
                        <td>
                          <span className="badge bg-success fs-6">Rs. {invoice.totalAmount}</span>
                        </td>
                        <td><span className="text-muted small">{invoice.remarks || '-'}</span></td>
                        <td className="text-center">
                          <button onClick={() => openEditModal(invoice)} className="btn btn-sm btn-outline-primary me-2">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button onClick={() => handleDelete(invoice.invoiceId)} className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
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
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-light">
                  <h5 className="modal-title text-primary fw-bold">{isEdit ? 'Edit Invoice' : 'Add New Invoice'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-bold">Invoice Number</label>
                        <input type="text" className="form-control" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold">Supplier</label>
                        <select className="form-select" name="supplierId" value={formData.supplierId} onChange={handleInputChange} required>
                          <option value="">Select Supplier</option>
                          {suppliers.map(sup => (
                            <option key={sup.supplierId} value={sup.supplierId}>{sup.supplierName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Invoice Date</label>
                        <input type="date" className="form-control" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Total Amount</label>
                        <div className="input-group">
                          <span className="input-group-text">Rs.</span>
                          <input type="text" className="form-control" name="totalAmount" placeholder="0.00" value={formData.totalAmount} onChange={handleInputChange} required />
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold">Remarks</label>
                        <textarea className="form-control" name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange}></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary px-4" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm">
                      <i className={`bi ${isEdit ? 'bi-check-circle' : 'bi-plus-circle'} me-2`}></i>
                      {isEdit ? 'Update Invoice' : 'Save Invoice'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Invoices;
