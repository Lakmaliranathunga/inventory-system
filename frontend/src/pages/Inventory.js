import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Inventory.css';

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
    (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1 className="inventory-title">Inventory Management</h1>
        <button className="inventory-add-btn" onClick={openAddModal}>
          <i className="bi bi-plus-circle"></i> Add Inventory Item
        </button>
      </div>

      <div className="inventory-card">
        <div className="inventory-card-header">
          <h6 className="inventory-card-title">Inventory Items</h6>
          <div className="inventory-search-group">
            <input 
              type="text" 
              className="inventory-search-input" 
              placeholder="Search by name or ISD No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="inventory-search-icon"><i className="bi bi-search"></i></span>
          </div>
        </div>
        <div className="inventory-card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Loading...</div>
            </div>
          ) : (
            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead className="inventory-table-head">
                  <tr>
                    <th>ISD No.</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Division/Section</th>
                    <th>Qty</th>
                    <th>Condition</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No inventory items found</td></tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.itemId}>
                        <td><span className="inventory-badge inventory-badge--gray">{item.itemCode}</span></td>
                        <td>
                          <strong>{item.itemName}</strong>
                        </td>
                        <td>
                           <small>Type: {item.itemTypeName || '-'}</small><br/>
                           <small>Main: {item.mainCategoryName || '-'}</small>
                        </td>
                        <td>
                          {item.divisionName || '-'}<br/>
                          <small style={{ color: '#6c757d' }}>{item.sectionName || '-'}</small>
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          <span className={`inventory-badge ${item.itemCondition === 'New' ? 'inventory-badge--green' : 'inventory-badge--yellow'}`}>
                            {item.itemCondition}
                          </span>
                        </td>
                        <td>
                          <div className="inventory-action-group">
                            <button onClick={() => openEditModal(item)} className="inventory-action-btn inventory-action-btn--edit">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => handleDelete(item.itemId)} className="inventory-action-btn inventory-action-btn--delete">
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
          <div className="inventory-modal-backdrop">
            <div className="inventory-modal-dialog">
              <div className="inventory-modal-header">
                <h5 className="inventory-modal-title">{isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}</h5>
                <button type="button" className="inventory-modal-close" onClick={closeModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="inventory-modal-body">

                  {!isEdit && (
                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#007bff' }}>
                      <i className="bi bi-info-circle"></i> ISD No. will be auto-generated sequentially upon save based on the Quantity entered.
                    </div>
                  )}
                  {isEdit && formData.itemCode && (
                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#6c757d' }}>
                      <strong>ISD No:</strong> {formData.itemCode}
                      <br/>
                      <small>(Quantity modification is disabled for individual tracked items)</small>
                    </div>
                  )}

                  <div className="inventory-form-section">Categorization</div>
                  <div className="inventory-form-grid">
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Item Type</label>
                      <select className="inventory-form-select" name="itemTypeId" value={formData.itemTypeId} onChange={handleInputChange}>
                        <option value="">Select Type</option>
                        {itemTypes.map(t => <option key={t.itemTypeId} value={t.itemTypeId}>{t.itemTypeName}</option>)}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Main Category</label>
                      <select className="inventory-form-select" name="mainCategoryId" value={formData.mainCategoryId} onChange={handleInputChange}>
                        <option value="">Select Main Category</option>
                        {mainCategories.filter(m => !formData.itemTypeId || m.itemTypeId == formData.itemTypeId).map(m => (
                          <option key={m.mainCategoryId} value={m.mainCategoryId}>{m.mainCategoryName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Sub Category</label>
                      <select className="inventory-form-select" name="subCategoryId" value={formData.subCategoryId} onChange={handleInputChange}>
                        <option value="">Select Sub Category</option>
                        {subCategories.filter(s => !formData.mainCategoryId || s.mainCategoryId == formData.mainCategoryId).map(s => (
                          <option key={s.subCategoryId} value={s.subCategoryId}>{s.subCategoryName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="inventory-form-section">Location & Details</div>
                  <div className="inventory-form-grid">
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Division</label>
                      <select className="inventory-form-select" name="divisionId" value={formData.divisionId} onChange={handleInputChange}>
                        <option value="">Select Division</option>
                        {divisions.map(d => <option key={d.divisionId} value={d.divisionId}>{d.divisionName}</option>)}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Section</label>
                      <select className="inventory-form-select" name="sectionId" value={formData.sectionId} onChange={handleInputChange}>
                        <option value="">Select Section</option>
                        {sections.filter(s => !formData.divisionId || s.divisionId == formData.divisionId).map(s => (
                          <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-2">
                      <label className="inventory-form-label">Quantity</label>
                      <input type="number" className="inventory-form-input" name="quantity" value={formData.quantity} onChange={handleInputChange} min="1" required disabled={isEdit} />
                    </div>
                    <div className="inventory-form-group col-span-2">
                      <label className="inventory-form-label">Condition</label>
                      <select className="inventory-form-select" name="itemCondition" value={formData.itemCondition} onChange={handleInputChange}>
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Damaged">Damaged</option>
                      </select>
                    </div>
                  </div>

                  <div className="inventory-form-section">Purchase & Warranty</div>
                  <div className="inventory-form-grid">
                    <div className="inventory-form-group col-span-6">
                      <label className="inventory-form-label">Purchase Date</label>
                      <input type="date" className="inventory-form-input" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} />
                    </div>
                    <div className="inventory-form-group col-span-6">
                      <label className="inventory-form-label">Warranty Expiration Date</label>
                      <input type="date" className="inventory-form-input" name="warrantyExpireDate" value={formData.warrantyExpireDate} onChange={handleInputChange} />
                    </div>
                    <div className="inventory-form-group col-span-12">
                      <label className="inventory-form-label">Remarks</label>
                      <textarea className="inventory-form-textarea" name="remarks" rows="2" value={formData.remarks} onChange={handleInputChange}></textarea>
                    </div>
                  </div>
                </div>
                <div className="inventory-modal-footer">
                  <button type="button" className="inventory-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="inventory-btn-primary">{isEdit ? 'Update Changes' : 'Save Item'}</button>
                </div>
              </form>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Inventory;
