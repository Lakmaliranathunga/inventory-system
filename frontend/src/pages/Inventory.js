import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dropdown options
  const [itemTypes, setItemTypes] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);

  // Modal Data
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    serialNumber: '',
    itemTypeId: '',
    mainCategoryId: '',
    subCategoryId: '',
    divisionId: '',
    sectionId: '',
    quantity: '1',
    itemCondition: 'New',
    purchaseDate: '',
    warrantyExpireDate: '',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [
        itemsRes, typeRes, mainRes, subRes, divRes, secRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/inventory', { headers }),
        axios.get('http://localhost:5000/api/categories/item-types', { headers }),
        axios.get('http://localhost:5000/api/categories/main-categories', { headers }),
        axios.get('http://localhost:5000/api/categories/sub-categories', { headers }),
        axios.get('http://localhost:5000/divisions'),
        axios.get('http://localhost:5000/sections')
      ]);

      if (itemsRes.data.success) setItems(itemsRes.data.items);
      if (typeRes.data.success) setItemTypes(typeRes.data.data);
      if (mainRes.data.success) setMainCategories(mainRes.data.data);
      if (subRes.data.success) setSubCategories(subRes.data.data);
      
      setDivisions(divRes.data);
      setSections(secRes.data);
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
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
    setFormData({
      itemId: '', itemCode: '', itemName: '', serialNumber: '', itemTypeId: '',
      mainCategoryId: '', subCategoryId: '', divisionId: '', sectionId: '',
      quantity: '1', itemCondition: 'New', purchaseDate: '', warrantyExpireDate: '', remarks: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEdit(true);
    setFormData({
      itemId: item.itemId,
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      serialNumber: item.serialNumber || '',
      itemTypeId: item.itemTypeId || '',
      mainCategoryId: item.mainCategoryId || '',
      subCategoryId: item.subCategoryId || '',
      divisionId: item.divisionId || '',
      sectionId: item.sectionId || '',
      quantity: item.quantity || '1',
      itemCondition: item.itemCondition || 'New',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '', // Format date for input type=date
      warrantyExpireDate: item.warrantyExpireDate ? item.warrantyExpireDate.split('T')[0] : '',
      remarks: item.remarks || ''
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
        await axios.put(`http://localhost:5000/api/inventory/${formData.itemId}`, formData, { headers });
        toast.success('Item updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/inventory', formData, { headers });
        toast.success('Item added successfully');
      }
      
      closeModal();
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error(isEdit ? 'Failed to update item' : 'Failed to add item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/inventory/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Item deleted successfully');
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete item');
      }
    }
  };

  const filteredItems = items.filter(item => 
    (item.itemName && item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Inventory Management</h1>
        <button className="btn btn-primary shadow-sm" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add Inventory Item
        </button>
      </div>

      <div className="card shadow mb-4 border-0">
        <div className="card-header py-3 bg-white d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Inventory Items</h6>
          <div className="input-group" style={{ maxWidth: '350px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name, code, serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="input-group-text"><i className="bi bi-search"></i></span>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Division/Section</th>
                    <th>Qty</th>
                    <th>Condition</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4">No inventory items found</td></tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.itemId}>
                        <td><span className="badge bg-secondary">{item.itemCode}</span></td>
                        <td className="fw-bold">{item.itemName} <br/><small className="text-muted fw-normal">SN: {item.serialNumber || 'N/A'}</small></td>
                        <td>
                           <small>Type: {item.itemTypeName || '-'}</small><br/>
                           <small>Main: {item.mainCategoryName || '-'}</small>
                        </td>
                        <td>
                          {item.divisionName || '-'}<br/>
                          <small className="text-muted">{item.sectionName || '-'}</small>
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          <span className={`badge ${item.itemCondition === 'New' ? 'bg-success' : 'bg-warning'}`}>
                            {item.itemCondition}
                          </span>
                        </td>
                        <td className="text-center">
                          <button onClick={() => openEditModal(item)} className="btn btn-sm btn-outline-primary me-2">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button onClick={() => handleDelete(item.itemId)} className="btn btn-sm btn-outline-danger">
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
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <h6 className="mb-3 text-primary border-bottom pb-2">Basic Info</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <label className="form-label">Item Code / Asset No</label>
                        <input type="text" className="form-control" name="itemCode" value={formData.itemCode} onChange={handleInputChange} required />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label">Item Name</label>
                        <input type="text" className="form-control" name="itemName" value={formData.itemName} onChange={handleInputChange} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Serial Number</label>
                        <input type="text" className="form-control" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} />
                      </div>
                    </div>

                    <h6 className="mb-3 text-primary border-bottom pb-2">Categorization</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <label className="form-label">Item Type</label>
                        <select className="form-select" name="itemTypeId" value={formData.itemTypeId} onChange={handleInputChange}>
                          <option value="">Select Type</option>
                          {itemTypes.map(t => <option key={t.itemTypeId} value={t.itemTypeId}>{t.itemTypeName}</option>)}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Main Category</label>
                        <select className="form-select" name="mainCategoryId" value={formData.mainCategoryId} onChange={handleInputChange}>
                          <option value="">Select Main Category</option>
                          {mainCategories.filter(m => !formData.itemTypeId || m.itemTypeId == formData.itemTypeId).map(m => (
                            <option key={m.mainCategoryId} value={m.mainCategoryId}>{m.mainCategoryName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Sub Category</label>
                        <select className="form-select" name="subCategoryId" value={formData.subCategoryId} onChange={handleInputChange}>
                          <option value="">Select Sub Category</option>
                          {subCategories.filter(s => !formData.mainCategoryId || s.mainCategoryId == formData.mainCategoryId).map(s => (
                            <option key={s.subCategoryId} value={s.subCategoryId}>{s.subCategoryName}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <h6 className="mb-3 text-primary border-bottom pb-2">Location & Details</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <label className="form-label">Division</label>
                        <select className="form-select" name="divisionId" value={formData.divisionId} onChange={handleInputChange}>
                          <option value="">Select Division</option>
                          {divisions.map(d => <option key={d.divisionId} value={d.divisionId}>{d.divisionName}</option>)}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Section</label>
                        <select className="form-select" name="sectionId" value={formData.sectionId} onChange={handleInputChange}>
                          <option value="">Select Section</option>
                          {sections.filter(s => !formData.divisionId || s.divisionId == formData.divisionId).map(s => (
                            <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Quantity</label>
                        <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleInputChange} min="1" required />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Condition</label>
                        <select className="form-select" name="itemCondition" value={formData.itemCondition} onChange={handleInputChange}>
                          <option value="New">New</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                    </div>

                    <h6 className="mb-3 text-primary border-bottom pb-2">Purchase & Warranty</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Purchase Date</label>
                        <input type="date" className="form-control" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Warranty Expiration Date</label>
                        <input type="date" className="form-control" name="warrantyExpireDate" value={formData.warrantyExpireDate} onChange={handleInputChange} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Remarks</label>
                        <textarea className="form-control" name="remarks" rows="2" value={formData.remarks} onChange={handleInputChange}></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{isEdit ? 'Update Changes' : 'Save Item'}</button>
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

export default Inventory;
