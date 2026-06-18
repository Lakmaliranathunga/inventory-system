import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Categories.css';

const Categories = () => {
  const [itemTypes, setItemTypes] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Toggle state for each add-form panel */
  const [showItemTypeForm, setShowItemTypeForm] = useState(false);
  const [showMainCategoryForm, setShowMainCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);

  /* Form state for each category type */
  const [itemTypeForm, setItemTypeForm] = useState({ name: '', remarks: '' });
  const [mainCategoryForm, setMainCategoryForm] = useState({ itemTypeId: '', name: '', remarks: '' });
  const [subCategoryForm, setSubCategoryForm] = useState({ mainCategoryId: '', name: '', remarks: '' });

  /* Shared auth header builder */
  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const fetchCategories = async () => {
    try {
      const [itemRes, mainRes, subRes] = await Promise.all([
        axios.get('http://localhost:5000/api/categories/item-types', { headers: getHeaders() }),
        axios.get('http://localhost:5000/api/categories/main-categories', { headers: getHeaders() }),
        axios.get('http://localhost:5000/api/categories/sub-categories', { headers: getHeaders() })
      ]);

      if (itemRes.data.success) setItemTypes(itemRes.data.data);
      if (mainRes.data.success) setMainCategories(mainRes.data.data);
      if (subRes.data.success) setSubCategories(subRes.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddItemType = async (e) => {
    e.preventDefault();
    if (!itemTypeForm.name) return alert('Name is required');
    try {
      await axios.post('http://localhost:5000/api/categories/item-types', itemTypeForm, { headers: getHeaders() });
      setItemTypeForm({ name: '', remarks: '' });
      setShowItemTypeForm(false);
      fetchCategories();
      alert('Item Type Added!');
    } catch (error) {
      console.error(error);
      alert('Failed to add Item Type');
    }
  };

  const handleAddMainCategory = async (e) => {
    e.preventDefault();
    if (!mainCategoryForm.name || !mainCategoryForm.itemTypeId) return alert('Required fields missing');
    try {
      await axios.post('http://localhost:5000/api/categories/main-categories', mainCategoryForm, { headers: getHeaders() });
      setMainCategoryForm({ itemTypeId: '', name: '', remarks: '' });
      setShowMainCategoryForm(false);
      fetchCategories();
      alert('Main Category Added!');
    } catch (error) {
      console.error(error);
      alert('Failed to add Main Category');
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!subCategoryForm.name || !subCategoryForm.mainCategoryId) return alert('Required fields missing');
    try {
      await axios.post('http://localhost:5000/api/categories/sub-categories', subCategoryForm, { headers: getHeaders() });
      setSubCategoryForm({ mainCategoryId: '', name: '', remarks: '' });
      setShowSubCategoryForm(false);
      fetchCategories();
      alert('Sub Category Added!');
    } catch (error) {
      console.error(error);
      alert('Failed to add Sub Category');
    }
  };

  if (loading) return <div>Loading Categories...</div>;

  return (
    <div className="categories-page">
      {/* Page heading */}
      <div className="categories-header">
        <h1 className="categories-title">Categories Management</h1>
      </div>

      <div className="categories-grid">

        {/* ─── ITEM TYPES ───────────────────────────── */}
        <div className="category-card">
          <div className="category-card-header">
            <h6 className="category-card-title">Item Types</h6>
            <button
              className="category-action-btn"
              onClick={() => setShowItemTypeForm(prev => !prev)}
              title={showItemTypeForm ? 'Hide form' : 'Add Item Type'}
            >
              <i className="bi bi-plus"></i>
            </button>
          </div>

          <div className="category-card-body">
            <div className={`category-form-wrapper ${showItemTypeForm ? 'is-visible' : ''}`}>
              <form onSubmit={handleAddItemType} className="category-form">
                <input
                  type="text"
                  className="category-input"
                  placeholder="Name"
                  value={itemTypeForm.name}
                  onChange={e => setItemTypeForm({ ...itemTypeForm, name: e.target.value })}
                />
                <input
                  type="text"
                  className="category-input"
                  placeholder="Remarks"
                  value={itemTypeForm.remarks}
                  onChange={e => setItemTypeForm({ ...itemTypeForm, remarks: e.target.value })}
                />
                <button type="submit" className="category-submit-btn">Save</button>
              </form>
            </div>

            {itemTypes.length === 0 ? (
              <p className="category-empty-state">No Item Types Found</p>
            ) : (
              <ul className="category-list">
                {itemTypes.map(item => (
                  <li key={item.itemTypeId} className="category-list-item">
                    <div className="category-list-item-header">
                      <span className="category-item-name">{item.itemTypeName}</span>
                      <span className="category-item-id">ID: {item.itemTypeId}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ─── MAIN CATEGORIES ──────────────────────── */}
        <div className="category-card">
          <div className="category-card-header">
            <h6 className="category-card-title">Main Categories</h6>
            <button
              className="category-action-btn"
              onClick={() => setShowMainCategoryForm(prev => !prev)}
              title={showMainCategoryForm ? 'Hide form' : 'Add Main Category'}
            >
              <i className="bi bi-plus"></i>
            </button>
          </div>

          <div className="category-card-body">
            <div className={`category-form-wrapper ${showMainCategoryForm ? 'is-visible' : ''}`}>
              <form onSubmit={handleAddMainCategory} className="category-form">
                <select
                  className="category-select"
                  value={mainCategoryForm.itemTypeId}
                  onChange={e => setMainCategoryForm({ ...mainCategoryForm, itemTypeId: e.target.value })}
                >
                  <option value="">Select Item Type</option>
                  {itemTypes.map(it => (
                    <option key={it.itemTypeId} value={it.itemTypeId}>{it.itemTypeName}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="category-input"
                  placeholder="Name"
                  value={mainCategoryForm.name}
                  onChange={e => setMainCategoryForm({ ...mainCategoryForm, name: e.target.value })}
                />
                <input
                  type="text"
                  className="category-input"
                  placeholder="Remarks"
                  value={mainCategoryForm.remarks}
                  onChange={e => setMainCategoryForm({ ...mainCategoryForm, remarks: e.target.value })}
                />
                <button type="submit" className="category-submit-btn">Save</button>
              </form>
            </div>

            {mainCategories.length === 0 ? (
              <p className="category-empty-state">No Main Categories</p>
            ) : (
              <ul className="category-list">
                {mainCategories.map(main => (
                  <li key={main.mainCategoryId} className="category-list-item">
                    <div className="category-list-item-header">
                      <span className="category-item-name">{main.mainCategoryName}</span>
                    </div>
                    <span className="category-item-meta">Type: {main.itemTypeName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ─── SUB CATEGORIES ───────────────────────── */}
        <div className="category-card">
          <div className="category-card-header">
            <h6 className="category-card-title">Sub Categories</h6>
            <button
              className="category-action-btn"
              onClick={() => setShowSubCategoryForm(prev => !prev)}
              title={showSubCategoryForm ? 'Hide form' : 'Add Sub Category'}
            >
              <i className="bi bi-plus"></i>
            </button>
          </div>

          <div className="category-card-body">
            <div className={`category-form-wrapper ${showSubCategoryForm ? 'is-visible' : ''}`}>
              <form onSubmit={handleAddSubCategory} className="category-form">
                <select
                  className="category-select"
                  value={subCategoryForm.mainCategoryId}
                  onChange={e => setSubCategoryForm({ ...subCategoryForm, mainCategoryId: e.target.value })}
                >
                  <option value="">Select Main Category</option>
                  {mainCategories.map(mc => (
                    <option key={mc.mainCategoryId} value={mc.mainCategoryId}>{mc.mainCategoryName}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="category-input"
                  placeholder="Name"
                  value={subCategoryForm.name}
                  onChange={e => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                />
                <input
                  type="text"
                  className="category-input"
                  placeholder="Remarks"
                  value={subCategoryForm.remarks}
                  onChange={e => setSubCategoryForm({ ...subCategoryForm, remarks: e.target.value })}
                />
                <button type="submit" className="category-submit-btn">Save</button>
              </form>
            </div>

            {subCategories.length === 0 ? (
              <p className="category-empty-state">No Sub Categories</p>
            ) : (
              <ul className="category-list">
                {subCategories.map(sub => (
                  <li key={sub.subCategoryId} className="category-list-item">
                    <div className="category-list-item-header">
                      <span className="category-item-name">{sub.subCategoryName}</span>
                    </div>
                    <span className="category-item-meta">{sub.itemTypeName} &rsaquo; {sub.mainCategoryName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Categories;
