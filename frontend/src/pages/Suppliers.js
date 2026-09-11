import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-toastify';
import './Suppliers.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Data
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '', name: '', contactPerson: '', contactNo: '', email: '', address: '', remarks: ''
  });

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/api/suppliers');
      if (response.data.success) {
        setSuppliers(response.data.suppliers);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNo') {
      const newValue = value.replace(/\D/g, '');
      if (newValue.length > 10) return;
      setFormData({ ...formData, [name]: newValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openAddModal = () => {
    setIsEdit(false);
    setFormData({ supplierId: '', name: '', contactPerson: '', contactNo: '', email: '', address: '', remarks: '' });
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setIsEdit(true);
    setFormData({
      supplierId: supplier.supplierId,
      name: supplier.supplierName || '',
      contactPerson: supplier.contactPerson || '',
      contactNo: supplier.contactNo || '',
      email: supplier.email || '',
      address: supplier.address || '',
      remarks: supplier.remarks || ''
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.contactNo && formData.contactNo.length !== 10) {
      toast.error('Contact Number must be exactly 10 digits.');
      return;
    }
    try {
      if (isEdit) {
        await api.put(`/api/suppliers/${formData.supplierId}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/api/suppliers', formData);
        toast.success('Supplier added successfully');
      }
      
      closeModal();
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error(isEdit ? 'Failed to update supplier' : 'Failed to add supplier');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/api/suppliers/${id}`);
        toast.success('Supplier deleted successfully');
        fetchSuppliers();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete supplier');
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const search = searchTerm ? searchTerm.toLowerCase() : '';
    if (!search) return true;
    return (
      (s.supplierName && String(s.supplierName).toLowerCase().includes(search)) ||
      (s.contactPerson && String(s.contactPerson).toLowerCase().includes(search)) ||
      (s.email && String(s.email).toLowerCase().includes(search))
    );
  });

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1 className="suppliers-title">Supplier Management</h1>
        <button className="suppliers-add-btn" onClick={openAddModal}>
          <i className="bi bi-plus-circle"></i> Add Supplier
        </button>
      </div>

      <div className="suppliers-card">
        <div className="suppliers-card-header">
          <h6 className="suppliers-card-title">Suppliers List</h6>
          <div className="suppliers-search-group">
            <input 
              type="text" 
              className="suppliers-search-input" 
              placeholder="Search by name, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="suppliers-search-icon"><i className="bi bi-search"></i></span>
          </div>
        </div>
        <div className="suppliers-card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Loading...</div>
            </div>
          ) : (
            <div className="suppliers-table-wrapper">
              <table className="suppliers-table">
                <thead className="suppliers-table-head">
                  <tr>
                    <th>Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr><td colSpan="6" className="suppliers-empty-state">No suppliers found</td></tr>
                  ) : (
                    filteredSuppliers.map(supplier => (
                      <tr key={supplier.supplierId}>
                        <td className="supplier-name-cell">{supplier.supplierName}</td>
                        <td>{supplier.contactPerson}</td>
                        <td>{supplier.contactNo}</td>
                        <td>{supplier.email}</td>
                        <td>{supplier.address}</td>
                        <td>
                          <div className="suppliers-action-group">
                            <button onClick={() => openEditModal(supplier)} className="suppliers-action-btn suppliers-action-btn--edit">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => handleDelete(supplier.supplierId)} className="suppliers-action-btn suppliers-action-btn--delete">
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
          <div className="suppliers-modal-backdrop">
            <div className="suppliers-modal-dialog">
              <div className="suppliers-modal-header">
                <h5 className="suppliers-modal-title">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h5>
                <button type="button" className="suppliers-modal-close" onClick={closeModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="suppliers-modal-body">
                  <div className="suppliers-form-grid">
                    <div className="suppliers-form-group col-span-6">
                      <label className="suppliers-form-label">Supplier Name</label>
                      <input type="text" className="suppliers-form-input" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="suppliers-form-group col-span-6">
                      <label className="suppliers-form-label">Contact Person</label>
                      <input type="text" className="suppliers-form-input" name="contactPerson" value={formData.contactPerson || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="suppliers-form-group col-span-6">
                      <label className="suppliers-form-label">Contact Number</label>
                      <input type="text" className="suppliers-form-input" name="contactNo" value={formData.contactNo} onChange={handleInputChange} maxLength="10" required />
                    </div>
                    <div className="suppliers-form-group col-span-6">
                      <label className="suppliers-form-label">Email</label>
                      <input type="email" className="suppliers-form-input" name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="suppliers-form-group col-span-12">
                      <label className="suppliers-form-label">Address</label>
                      <textarea className="suppliers-form-textarea" name="address" rows="2" value={formData.address} onChange={handleInputChange} required></textarea>
                    </div>
                    <div className="suppliers-form-group col-span-12">
                      <label className="suppliers-form-label">Remarks</label>
                      <textarea className="suppliers-form-textarea" name="remarks" rows="2" value={formData.remarks} onChange={handleInputChange}></textarea>
                    </div>
                  </div>
                </div>
                <div className="suppliers-modal-footer">
                  <button type="button" className="suppliers-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="suppliers-btn-primary">{isEdit ? 'Update Changes' : 'Save Supplier'}</button>
                </div>
              </form>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Suppliers;
