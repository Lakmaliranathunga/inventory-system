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
  const [invoices, setInvoices] = useState([]);

  // Modal Data
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
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
    remarks: '',
    invoiceId: ''
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [
        itemsRes, typeRes, mainRes, subRes, divRes, secRes, invRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/inventory', { headers }),
        axios.get('http://localhost:5000/api/categories/item-types', { headers }),
        axios.get('http://localhost:5000/api/categories/main-categories', { headers }),
        axios.get('http://localhost:5000/api/categories/sub-categories', { headers }),
        axios.get('http://localhost:5000/divisions'),
        axios.get('http://localhost:5000/sections'),
        axios.get('http://localhost:5000/api/invoices', { headers })
      ]);

      if (itemsRes.data.success) setItems(itemsRes.data.items);
      if (typeRes.data.success) setItemTypes(typeRes.data.data);
      if (mainRes.data.success) setMainCategories(mainRes.data.data);
      if (subRes.data.success) setSubCategories(subRes.data.data);
      if (invRes.data.success) setInvoices(invRes.data.invoices);
      
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
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    
    // Automatically fill purchase date based on selected invoice
    if (name === 'invoiceId' && value) {
      const selectedInvoice = invoices.find(inv => inv.invoiceId == value);
      if (selectedInvoice && selectedInvoice.invoiceDate) {
         newFormData.purchaseDate = selectedInvoice.invoiceDate.split('T')[0];
      }
    }
    setFormData(newFormData);
  };

  const openAddModal = () => {
    setIsEdit(false);
    setActiveTab('general');
    setFormData({
      itemId: '', itemCode: '', itemName: '', serialNumber: '', itemTypeId: '',
      mainCategoryId: '', subCategoryId: '', divisionId: '', sectionId: '',
      quantity: '1', itemCondition: 'New', purchaseDate: '', warrantyExpireDate: '', remarks: '', invoiceId: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEdit(true);
    setActiveTab('general');
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
      remarks: item.remarks || '',
      invoiceId: item.invoiceId || ''
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
              placeholder="Search by name or Item No..."
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
                    <th>Item No.</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Division/Section</th>
                    <th>Supplier</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No inventory items found</td></tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.itemId}>
                        <td><span className="inventory-badge inventory-badge--green">{item.itemCode}</span></td>
                        <td>
                          <strong>{item.itemName}</strong>
                          {item.serialNumber && (
                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6c757d' }}>
                              <i className="bi bi-upc-scan" style={{marginRight:'3px'}}></i> SN: {item.serialNumber}
                            </div>
                          )}
                        </td>
                        <td>
                           <small>Type: {item.itemTypeName || '-'}</small><br/>
                           <small>Main: {item.mainCategoryName || '-'}</small>
                        </td>
                        <td>
                          {item.divisionName || '-'}<br/>
                          <small style={{ color: '#6c757d' }}>{item.sectionName || '-'}</small>
                        </td>
                        <td>
                          {item.supplierName ? (
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>{item.supplierName}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
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
                  <div className="inventory-tabs">
                    <button type="button" className={`inventory-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                      <i className="bi bi-box-seam"></i> Item Details
                    </button>
                    <button type="button" className={`inventory-tab-btn ${activeTab === 'location' ? 'active' : ''}`} onClick={() => setActiveTab('location')}>
                      <i className="bi bi-geo-alt"></i> Location & Assignment
                    </button>
                    <button type="button" className={`inventory-tab-btn ${activeTab === 'purchase' ? 'active' : ''}`} onClick={() => setActiveTab('purchase')}>
                      <i className="bi bi-receipt"></i> Purchase & Invoice
                    </button>
                  </div>

                  {!isEdit && activeTab === 'general' && (
                    <div style={{ marginBottom: '15px', fontSize: '13px', color: '#007bff' }}>
                      <i className="bi bi-info-circle"></i> Item No. will be auto-generated sequentially upon save.
                    </div>
                  )}
                  {isEdit && formData.itemCode && activeTab === 'general' && (
                    <div style={{ marginBottom: '15px', fontSize: '13px', color: '#6c757d' }}>
                      <strong>Item No:</strong> {formData.itemCode}
                      <br/>
                      <small>(Quantity modification is disabled for individual tracked items)</small>
                    </div>
                  )}

                  {activeTab === 'general' && (
                    <>
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
                        <div className="inventory-form-group col-span-12">
                          <label className="inventory-form-label">Remarks</label>
                          <textarea className="inventory-form-textarea" name="remarks" rows="2" value={formData.remarks} onChange={handleInputChange}></textarea>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'location' && (
                    <>
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
                        <div className="inventory-form-group col-span-4">
                          <label className="inventory-form-label">Quantity</label>
                          <input type="number" className="inventory-form-input" name="quantity" value={formData.quantity} onChange={handleInputChange} min="1" required disabled={isEdit} />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'purchase' && (
                    <>
                      <div className="inventory-form-grid">
                        <div className="inventory-form-group col-span-4">
                          <label className="inventory-form-label">Invoice / PO No.</label>
                          <select className="inventory-form-select" name="invoiceId" value={formData.invoiceId} onChange={handleInputChange}>
                            <option value="">Select Invoice (Optional)</option>
                            {invoices.map(inv => (
                              <option key={inv.invoiceId} value={inv.invoiceId}>
                                {inv.invoiceNumber} {inv.poNo ? `(PO: ${inv.poNo})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="inventory-form-group col-span-4">
                          <label className="inventory-form-label">Purchase Date</label>
                          <input type="date" className="inventory-form-input" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} />
                        </div>
                        <div className="inventory-form-group col-span-4">
                          <label className="inventory-form-label">Warranty Expiration Date</label>
                          <input type="date" className="inventory-form-input" name="warrantyExpireDate" value={formData.warrantyExpireDate} onChange={handleInputChange} />
                        </div>
                        <div className="inventory-form-group col-span-4">
                          <label className="inventory-form-label">Asset / Serial No.</label>
                          <input 
                            type="text" 
                            className="inventory-form-input" 
                            name="serialNumber" 
                            value={formData.serialNumber} 
                            onChange={handleInputChange} 
                            placeholder={(!isEdit && parseInt(formData.quantity || 1) > 1) ? 'Disabled for Qty > 1' : 'Optional'}
                            disabled={!isEdit && parseInt(formData.quantity || 1) > 1}
                          />
                        </div>

                        {formData.invoiceId && (
                          <div className="inventory-form-group col-span-12">
                            <div className="supplier-info-card">
                              {(() => {
                                const selectedInv = invoices.find(i => i.invoiceId == formData.invoiceId);
                                if (!selectedInv) return <div>No details available</div>;
                                return (
                                  <>
                                    <div className="supplier-card-header">
                                      <div className="supplier-card-icon">
                                        <i className="bi bi-building"></i>
                                      </div>
                                      <div>
                                        <h4 className="supplier-card-title">{selectedInv.supplierName || 'Unknown Supplier'}</h4>
                                        <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: '2px'}}>Supplier details linked to Invoice #{selectedInv.invoiceNumber}</div>
                                      </div>
                                    </div>
                                    <div className="supplier-card-grid">
                                      <div className="supplier-detail-item">
                                        <span className="supplier-detail-label">Invoice Date</span>
                                        <span className="supplier-detail-val">
                                          <i className="bi bi-calendar-check"></i>
                                          {selectedInv.invoiceDate ? selectedInv.invoiceDate.split('T')[0] : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="supplier-detail-item">
                                        <span className="supplier-detail-label">Total Amount</span>
                                        <span className="supplier-detail-val highlight">
                                          Rs. {selectedInv.totalAmount || '0.00'}
                                        </span>
                                      </div>
                                      <div className="supplier-detail-item">
                                        <span className="supplier-detail-label">Contact No</span>
                                        <span className="supplier-detail-val">
                                          <i className="bi bi-telephone"></i>
                                          {selectedInv.contactNo || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="supplier-detail-item">
                                        <span className="supplier-detail-label">Email</span>
                                        <span className="supplier-detail-val">
                                          <i className="bi bi-envelope"></i>
                                          {selectedInv.email || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="supplier-detail-item" style={{ gridColumn: 'span 2' }}>
                                        <span className="supplier-detail-label">Address</span>
                                        <span className="supplier-detail-val" style={{ lineHeight: '1.4' }}>
                                          <i className="bi bi-geo-alt"></i>
                                          {selectedInv.address || 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
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
