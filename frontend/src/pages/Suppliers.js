import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/suppliers/${formData.supplierId}`, formData, { headers });
        toast.success('Supplier updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/suppliers', formData, { headers });
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
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/suppliers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
    <div className="container-fluid py-4">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Supplier Management</h1>
        <button className="btn btn-primary shadow-sm" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add Supplier
        </button>
      </div>

      <div className="card shadow mb-4 border-0">
        <div className="card-header py-3 bg-white d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Suppliers List</h6>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name, contact..."
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
                    <th>Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Remarks</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4">No suppliers found</td></tr>
                  ) : (
                    filteredSuppliers.map(supplier => (
                      <tr key={supplier.supplierId}>
                        <td className="fw-bold">{supplier.supplierName}</td>
                        <td>{supplier.contactPerson}</td>
                        <td>{supplier.contactNo}</td>
                        <td>{supplier.email}</td>
                        <td>{supplier.address}</td>
                        <td><span className="text-muted small">{supplier.remarks || '-'}</span></td>
                        <td className="text-center">
                          <button onClick={() => openEditModal(supplier)} className="btn btn-sm btn-outline-primary me-2">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button onClick={() => handleDelete(supplier.supplierId)} className="btn btn-sm btn-outline-danger">
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
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Supplier Name</label>
                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={formData.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Contact Number</label>
                        <input type="text" className="form-control" name="contactNo" value={formData.contactNo} onChange={handleInputChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <textarea className="form-control" name="address" rows="2" value={formData.address} onChange={handleInputChange}></textarea>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Remarks</label>
                        <textarea className="form-control" name="remarks" rows="2" value={formData.remarks} onChange={handleInputChange}></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{isEdit ? 'Update Changes' : 'Save Supplier'}</button>
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

export default Suppliers;
