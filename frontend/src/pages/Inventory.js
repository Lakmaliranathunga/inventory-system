import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-toastify';
import './Inventory.css';

const INVENTORY_VIEWS = {
  office: {
    label: 'Office Inventory',
    icon: 'bi-building',
    description: 'Furniture, office equipment, and general administration assets'
  },
  it: {
    label: 'IT Inventory',
    icon: 'bi-pc-display-horizontal',
    description: 'Computers, peripherals, network devices, UPS, and digital equipment'
  }
};

const IT_KEYWORDS = [
  'asset hardware', 'hardware', 'software', 'soft ware', 'computer', 'laptop', 'desktop',
  'monitor', 'screen', 'printer', 'scanner', 'keyboard', 'mouse', 'ups',
  'network', 'router', 'switch', 'server', 'camera', 'cctv', 'projector',
  'interactive', 'digital', 'information systems'
];

const normalizeText = (value) => String(value || '').toLowerCase().replace(/[-_/]+/g, ' ');

const isItInventoryRecord = (record) => {
  const haystack = normalizeText([
    record.itemTypeName,
    record.mainCategoryName,
    record.subCategoryName,
    record.itemName,
    record.itemCode
  ].join(' '));

  return IT_KEYWORDS.some(keyword => haystack.includes(keyword));
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInventory, setActiveInventory] = useState('office');
  
  // Dropdown options
  const [itemTypes, setItemTypes] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Modal Data
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    itemId: '',
    itemCode: '',
    itemName: '',
    serialNumber: '',
    brandName: '',
    modelName: '',
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
      const [
        itemsRes, typeRes, mainRes, subRes, divRes, secRes, invRes
      ] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/categories/item-types'),
        api.get('/api/categories/main-categories'),
        api.get('/api/categories/sub-categories'),
        api.get('/divisions'),
        api.get('/sections'),
        api.get('/api/invoices')
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

  const selectedView = INVENTORY_VIEWS[activeInventory];
  const selectedItemType = itemTypes.find(t => String(t.itemTypeId) === String(formData.itemTypeId));
  const isAssetHardware = String(selectedItemType?.itemTypeName || '').toLowerCase().replace(/[^a-z0-9]/g, '') === 'assethardware';
  const isItCategory = (category) => isItInventoryRecord(category);
  const visibleItemTypes = itemTypes.filter(type => activeInventory === 'it' ? isItCategory(type) : !isItCategory(type));
  const visibleMainCategories = mainCategories.filter(category => activeInventory === 'it' ? isItCategory(category) : !isItCategory(category));
  const scopedItems = items.filter(item => activeInventory === 'it' ? isItInventoryRecord(item) : !isItInventoryRecord(item));
  const getInvoiceItemName = (lineItem) => {
    if (lineItem.itemName) return lineItem.itemName;
    const matchedSubCategory = subCategories.find((item) => String(item.subCategoryId) === String(lineItem.subCategoryId));
    return matchedSubCategory?.subCategoryName || 'Unknown Item';
  };

  const renderSelectedInvoiceItems = (invoice) => {
    if (!invoice.items || !invoice.items.length) return 'N/A';

    return (
      <div className="selected-invoice-items-list">
        {invoice.items.map((lineItem, index) => (
          <div className="selected-invoice-items-line" key={lineItem.invoiceItemId || `${lineItem.subCategoryId}-${index}`}>
            <span className="selected-invoice-items-name">{getInvoiceItemName(lineItem)}</span>
            <span className="selected-invoice-items-qty">Qty: {lineItem.quantity || 0}</span>
          </div>
        ))}
      </div>
    );
  };

  const counts = items.reduce((acc, item) => {
    acc[isItInventoryRecord(item) ? 'it' : 'office'] += 1;
    return acc;
  }, { office: 0, it: 0 });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'itemTypeId') {
      newFormData.mainCategoryId = '';
      newFormData.subCategoryId = '';
      const selectedType = itemTypes.find(t => String(t.itemTypeId) === String(value));
      const assetHardwareSelected = String(selectedType?.itemTypeName || '').toLowerCase().replace(/[^a-z0-9]/g, '') === 'assethardware';
      if (!assetHardwareSelected) {
        newFormData.brandName = '';
        newFormData.modelName = '';
      }
    }

    if (name === 'mainCategoryId') {
      newFormData.subCategoryId = '';
    }

    // Reset sectionId if divisionId changes
    if (name === 'divisionId') {
      newFormData.sectionId = '';
    }
    
    // Automatically fill purchase date based on selected invoice
    if (name === 'invoiceId' && value) {
      const selectedInvoice = invoices.find(inv => String(inv.invoiceId) === String(value));
      if (selectedInvoice && selectedInvoice.invoiceDate) {
         newFormData.purchaseDate = selectedInvoice.invoiceDate.split('T')[0];
      }
    }
    setFormData(newFormData);
  };

  const getInitialFormData = (scope = activeInventory) => {
    const scopedTypes = itemTypes.filter(type => scope === 'it' ? isItCategory(type) : !isItCategory(type));
    const preferredType = scopedTypes[0];

    return {
      itemId: '', itemCode: '', itemName: '', serialNumber: '', itemTypeId: preferredType?.itemTypeId || '',
      brandName: '', modelName: '',
      mainCategoryId: '', subCategoryId: '', divisionId: '', sectionId: '',
      quantity: '1', itemCondition: 'New', purchaseDate: '', warrantyExpireDate: '', remarks: '', invoiceId: ''
    };
  };

  const openAddModal = () => {
    setIsEdit(false);
    setFormData(getInitialFormData());
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEdit(true);
    setFormData({
      itemId: item.itemId,
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      serialNumber: item.serialNumber || '',
      brandName: item.brandName || '',
      modelName: item.modelName || '',
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

    if (!formData.itemTypeId) {
      toast.warning('Please select an Item Type.');
      return;
    }
    if (!formData.mainCategoryId) {
      toast.warning('Please select a Main Category.');
      return;
    }
    if (!formData.subCategoryId) {
      toast.warning('Please select a Sub Category.');
      return;
    }
    if (!formData.divisionId) {
      toast.warning('Please select a Division.');
      return;
    }
    if (!formData.sectionId) {
      toast.warning('Please select a Section.');
      return;
    }
    if (!formData.quantity) {
      toast.warning('Please enter Quantity.');
      return;
    }
    if (isAssetHardware && !formData.brandName.trim()) {
      toast.warning('Please enter Brand Name.');
      return;
    }
    if (isAssetHardware && !formData.modelName.trim()) {
      toast.warning('Please enter Model.');
      return;
    }
    if (!formData.invoiceId) {
      toast.warning('Please select an Invoice / PO No.');
      return;
    }
    if (!formData.purchaseDate) {
      toast.warning('Please select a Purchase Date.');
      return;
    }
    if (!formData.warrantyExpireDate) {
      toast.warning('Please select a Warranty Expiration Date.');
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/api/inventory/${formData.itemId}`, formData);
        toast.success('Item updated successfully');
      } else {
        const response = await api.post('/api/inventory', formData);
        toast.success(response.data?.message || 'Item added successfully');
      }
      
      closeModal();
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || (isEdit ? 'Failed to update item' : 'Failed to add item'));
    }
  };

  const refreshInvoices = async () => {
    try {
      const invRes = await api.get('/api/invoices');
      if (invRes.data.success) {
        setInvoices(invRes.data.invoices);
        toast.info('Invoice list refreshed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/api/inventory/${id}`);
        toast.success('Item deleted successfully');
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete item');
      }
    }
  };

  const filteredItems = scopedItems.filter(item => 
    (item.itemName && item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`inventory-page inventory-page--${activeInventory}`}>
      <div className={`inventory-workspace inventory-workspace--${activeInventory}`}>
        <div className={`inventory-scope-panel inventory-scope-panel--${activeInventory}`}>
          <div className="inventory-header">
            <div>
              <h1 className="inventory-title">Inventory Management</h1>
              <p className="inventory-subtitle">{selectedView.description}</p>
            </div>
            <button className="inventory-add-btn" onClick={openAddModal}>
              <i className="bi bi-plus-circle"></i> Add {selectedView.label} Item
            </button>
          </div>

          <div className={`inventory-switcher inventory-switcher--${activeInventory}`} role="tablist" aria-label="Inventory sections">
            {Object.entries(INVENTORY_VIEWS).map(([key, view]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeInventory === key}
                className={`inventory-switcher-btn ${activeInventory === key ? 'active' : ''}`}
                onClick={() => {
                  setActiveInventory(key);
                  setSearchTerm('');
                }}
              >
                <span className="inventory-switcher-icon"><i className={`bi ${view.icon}`}></i></span>
                <span>
                  <strong>{view.label}</strong>
                  <small>{counts[key]} items</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`inventory-card inventory-card--${activeInventory}`}>
          <div className="inventory-card-header">
            <h6 className="inventory-card-title">{selectedView.label} Items</h6>
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
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No {selectedView.label.toLowerCase()} items found</td></tr>
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
                            {(item.brandName || item.modelName) && (
                              <div style={{ marginTop: '4px', fontSize: '12px', color: '#6c757d' }}>
                                {item.brandName && <div>Brand Name - {item.brandName}</div>}
                                {item.modelName && <div>Model - {item.modelName}</div>}
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
      </div>

      {showModal && (
        <React.Fragment>
          <div className="inventory-modal-backdrop">
            <div className="inventory-modal-dialog">
              <div className="inventory-modal-header">
                <h5 className="inventory-modal-title">{isEdit ? 'Edit Inventory Item' : `Add ${selectedView.label} Item`}</h5>
                <button type="button" className="inventory-modal-close" onClick={closeModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="inventory-modal-body">
                  {!isEdit && (
                    <div style={{ marginBottom: '15px', fontSize: '13px', color: '#007bff' }}>
                      <i className="bi bi-info-circle"></i> Item No. will be auto-generated sequentially upon save.
                    </div>
                  )}
                  {isEdit && formData.itemCode && (
                    <div style={{ marginBottom: '15px', fontSize: '13px', color: '#6c757d' }}>
                      <strong>Item No:</strong> {formData.itemCode}
                      <br/>
                      <small>(Quantity modification is disabled for individual tracked items)</small>
                    </div>
                  )}

                  {/* Section 1: Item Details & Location */}
                  <div className="inventory-form-section">
                    <i className="bi bi-box-seam" style={{ marginRight: '6px' }}></i> Item Details & Location
                  </div>
                  <div className="inventory-form-grid">
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Item Type</label>
                      <select className="inventory-form-select" name="itemTypeId" value={formData.itemTypeId} onChange={handleInputChange} required>
                        <option value="">Select Type</option>
                        {(isEdit ? itemTypes : visibleItemTypes).map(t => <option key={t.itemTypeId} value={t.itemTypeId}>{t.itemTypeName}</option>)}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Main Category</label>
                      <select className="inventory-form-select" name="mainCategoryId" value={formData.mainCategoryId} onChange={handleInputChange} required>
                        <option value="">Select Main Category</option>
                        {(isEdit ? mainCategories : visibleMainCategories).filter(m => !formData.itemTypeId || String(m.itemTypeId) === String(formData.itemTypeId)).map(m => (
                          <option key={m.mainCategoryId} value={m.mainCategoryId}>{m.mainCategoryName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Sub Category</label>
                      <select className="inventory-form-select" name="subCategoryId" value={formData.subCategoryId} onChange={handleInputChange} required>
                        <option value="">Select Sub Category</option>
                        {subCategories.filter(s => !formData.mainCategoryId || String(s.mainCategoryId) === String(formData.mainCategoryId)).map(s => (
                          <option key={s.subCategoryId} value={s.subCategoryId}>{s.subCategoryName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Division</label>
                      <select className="inventory-form-select" name="divisionId" value={formData.divisionId} onChange={handleInputChange} required>
                        <option value="">Select Division</option>
                        {divisions.map(d => <option key={d.divisionId} value={d.divisionId}>{d.divisionName}</option>)}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Section</label>
                      <select 
                        className="inventory-form-select" 
                        name="sectionId" 
                        value={formData.sectionId} 
                        onChange={handleInputChange} 
                        disabled={!formData.divisionId}
                        required
                      >
                        <option value="">{formData.divisionId ? 'Select Section' : 'Select Division First'}</option>
                        {sections.filter(s => !formData.divisionId || String(s.divisionId) === String(formData.divisionId)).map(s => (
                          <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Quantity</label>
                      <input type="number" className="inventory-form-input" name="quantity" value={formData.quantity} onChange={handleInputChange} min="1" required disabled={isEdit} />
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Asset / Serial No.</label>
                      <input 
                        type="text" 
                        className="inventory-form-input" 
                        name="serialNumber" 
                        value={formData.serialNumber} 
                        onChange={handleInputChange} 
                        placeholder="Enter Asset / Serial No."
                      />
                    </div>
                    {isAssetHardware && (
                      <>
                        <div className="inventory-form-group col-span-4">
                          <label className="inventory-form-label">Brand Name</label>
                          <input
                            type="text"
                            className="inventory-form-input"
                            name="brandName"
                            value={formData.brandName}
                            onChange={handleInputChange}
                            placeholder="Enter brand name"
                            required={isAssetHardware}
                          />
                        </div>
                        <div className="inventory-form-group col-span-4">
                          <label className="inventory-form-label">Model</label>
                          <input
                            type="text"
                            className="inventory-form-input"
                            name="modelName"
                            value={formData.modelName}
                            onChange={handleInputChange}
                            placeholder="Enter model"
                            required={isAssetHardware}
                          />
                        </div>
                      </>
                    )}
                    <div className="inventory-form-group col-span-8">
                      <label className="inventory-form-label">Remarks</label>
                      <textarea className="inventory-form-textarea" name="remarks" rows="1" style={{ height: '42px', resize: 'vertical' }} value={formData.remarks} onChange={handleInputChange}></textarea>
                    </div>
                  </div>

                  {/* Section 2: Purchase & Invoice Details */}
                  <div className="inventory-form-section">
                    <i className="bi bi-receipt" style={{ marginRight: '6px' }}></i> Purchase & Invoice Details
                  </div>
                  <div className="inventory-form-grid">
                    <div className="inventory-form-group col-span-4" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="inventory-form-label" style={{ margin: 0 }}>Invoice / PO No.</label>
                        <button 
                          type="button" 
                          onClick={refreshInvoices} 
                          style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                          title="Refresh invoice dropdown"
                        >
                          <i className="bi bi-arrow-clockwise"></i> Refresh List
                        </button>
                      </div>
                      <select className="inventory-form-select" name="invoiceId" value={formData.invoiceId} onChange={handleInputChange} required>
                        <option value="">Select Invoice</option>
                        {invoices.map(inv => (
                          <option key={inv.invoiceId} value={inv.invoiceId}>
                            Invoice #{inv.invoiceNumber} {inv.poNo ? `(PO: ${inv.poNo})` : ''}
                          </option>
                        ))}
                      </select>


                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Purchase Date</label>
                      <input type="date" className="inventory-form-input" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} required />
                    </div>
                    <div className="inventory-form-group col-span-4">
                      <label className="inventory-form-label">Warranty Expiration Date</label>
                      <input type="date" className="inventory-form-input" name="warrantyExpireDate" value={formData.warrantyExpireDate} onChange={handleInputChange} required />
                    </div>
                    {formData.invoiceId && (
                      <div className="inventory-form-group col-span-12">
                        <div className="supplier-info-card compact-card">
                          {(() => {
                            const selectedInv = invoices.find(i => String(i.invoiceId) === String(formData.invoiceId));
                            if (!selectedInv) return <div>No details available</div>;
                            return (
                              <>
                                <div className="supplier-card-header compact-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="supplier-card-icon compact-icon">
                                      <i className="bi bi-building-check"></i>
                                    </div>
                                    <div>
                                      <h4 className="supplier-card-title compact-title">{selectedInv.supplierName || 'Unknown Supplier'}</h4>
                                      <div className="supplier-card-subtitle compact-subtitle">
                                        <span className="supplier-badge">
                                          <i className="bi bi-receipt-cutoff"></i> INV #{selectedInv.invoiceNumber}
                                        </span>
                                        {selectedInv.poNo && (
                                          <span className="supplier-badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                                            <i className="bi bi-clipboard-check"></i> PO: {selectedInv.poNo}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <a 
                                      href="/invoices" target="_blank" rel="noopener noreferrer" 
                                      className="inventory-btn-secondary compact-btn"
                                      title="Open Invoices"
                                    >
                                      <i className="bi bi-file-earmark-text"></i> Invoice
                                    </a>
                                    <a 
                                      href="/suppliers" target="_blank" rel="noopener noreferrer" 
                                      className="inventory-btn-secondary compact-btn"
                                      title="Open Suppliers"
                                    >
                                      <i className="bi bi-truck"></i> Supplier
                                    </a>
                                  </div>
                                </div>
                                <div className="supplier-card-body compact-body">
                                  <div className="supplier-card-grid compact-grid">
                                    <div className="supplier-detail-item compact-item">
                                      <span className="supplier-detail-label"><i className="bi bi-calendar-check"></i> Invoice Date</span>
                                      <span className="supplier-detail-val">{selectedInv.invoiceDate ? selectedInv.invoiceDate.split('T')[0] : 'N/A'}</span>
                                    </div>
                                    <div className="supplier-detail-item compact-item">
                                      <span className="supplier-detail-label"><i className="bi bi-cash-coin"></i> Total Amount</span>
                                      <span className="supplier-detail-val highlight">Rs. {selectedInv.totalAmount ? Number(selectedInv.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span>
                                    </div>
                                    <div className="supplier-detail-item compact-item">
                                      <span className="supplier-detail-label"><i className="bi bi-telephone"></i> Contact</span>
                                      <span className="supplier-detail-val">{selectedInv.contactNo || 'N/A'}</span>
                                    </div>
                                    <div className="supplier-detail-item compact-item" style={{ gridColumn: '1 / -1' }}>
                                      <span className="supplier-detail-label"><i className="bi bi-box-seam"></i> Invoice Items</span>
                                      <span className="supplier-detail-val">{renderSelectedInvoiceItems(selectedInv)}</span>
                                    </div>
                                    <div className="supplier-detail-item compact-item" style={{ gridColumn: '1 / -1' }}>
                                      <span className="supplier-detail-label"><i className="bi bi-geo-alt"></i> Address</span>
                                      <span className="supplier-detail-val">{selectedInv.address || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="inventory-modal-footer">
                  <button type="button" className="inventory-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="inventory-btn-primary">
                    <i className="bi bi-check-circle" style={{ marginRight: '6px' }}></i>
                    {isEdit ? 'Update Changes' : 'Save Item'}
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

export default Inventory;
