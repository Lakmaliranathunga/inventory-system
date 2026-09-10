import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-toastify';
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
  const [editing, setEditing] = useState({ type: '', id: null });
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const getVisibleItems = (items, fields) => {
    if (!normalizedSearch) return items;
    return items.filter(item =>
      fields.some(field => String(item[field] || '').toLowerCase().includes(normalizedSearch))
    );
  };

  const visibleItemTypes = getVisibleItems(itemTypes, ['itemTypeName', 'remarks']);
  const visibleMainCategories = getVisibleItems(mainCategories, ['mainCategoryName', 'itemTypeName', 'remarks']);
  const visibleSubCategories = getVisibleItems(subCategories, ['subCategoryName', 'mainCategoryName', 'itemTypeName', 'remarks']);

  const resetEditing = () => {
    setEditing({ type: '', id: null });
  };

  const closeItemTypeForm = () => {
    setItemTypeForm({ name: '', remarks: '' });
    setShowItemTypeForm(false);
    if (editing.type === 'item') resetEditing();
  };

  const closeMainCategoryForm = () => {
    setMainCategoryForm({ itemTypeId: '', name: '', remarks: '' });
    setShowMainCategoryForm(false);
    if (editing.type === 'main') resetEditing();
  };

  const closeSubCategoryForm = () => {
    setSubCategoryForm({ mainCategoryId: '', name: '', remarks: '' });
    setShowSubCategoryForm(false);
    if (editing.type === 'sub') resetEditing();
  };

  const toggleItemTypeForm = () => {
    if (showItemTypeForm) closeItemTypeForm();
    else {
      resetEditing();
      setItemTypeForm({ name: '', remarks: '' });
      setShowItemTypeForm(true);
    }
  };

  const toggleMainCategoryForm = () => {
    if (showMainCategoryForm) closeMainCategoryForm();
    else {
      resetEditing();
      setMainCategoryForm({ itemTypeId: '', name: '', remarks: '' });
      setShowMainCategoryForm(true);
    }
  };

  const toggleSubCategoryForm = () => {
    if (showSubCategoryForm) closeSubCategoryForm();
    else {
      resetEditing();
      setSubCategoryForm({ mainCategoryId: '', name: '', remarks: '' });
      setShowSubCategoryForm(true);
    }
  };

  const fetchCategories = async () => {
    try {
      const [itemRes, mainRes, subRes] = await Promise.all([
        api.get('/api/categories/item-types'),
        api.get('/api/categories/main-categories'),
        api.get('/api/categories/sub-categories')
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
    if (!itemTypeForm.name.trim()) return toast.warning('Enter an item type name');
    try {
      if (editing.type === 'item') await api.put(`/api/categories/item-types/${editing.id}`, itemTypeForm);
      else await api.post('/api/categories/item-types', itemTypeForm);
      setItemTypeForm({ name: '', remarks: '' });
      setShowItemTypeForm(false);
      fetchCategories();
      setEditing({ type: '', id: null });
      toast.success(editing.type === 'item' ? 'Item type updated' : 'Item type added');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save item type');
    }
  };

  const handleAddMainCategory = async (e) => {
    e.preventDefault();
    if (!mainCategoryForm.itemTypeId) return toast.warning('Select an item type first');
    if (!mainCategoryForm.name.trim()) return toast.warning('Enter a main category name');
    try {
      if (editing.type === 'main') await api.put(`/api/categories/main-categories/${editing.id}`, mainCategoryForm);
      else await api.post('/api/categories/main-categories', mainCategoryForm);
      setMainCategoryForm({ itemTypeId: '', name: '', remarks: '' });
      setShowMainCategoryForm(false);
      fetchCategories();
      setEditing({ type: '', id: null });
      toast.success(editing.type === 'main' ? 'Main category updated' : 'Main category added');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save main category');
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!subCategoryForm.mainCategoryId) return toast.warning('Select a main category first');
    if (!subCategoryForm.name.trim()) return toast.warning('Enter a sub category name');
    try {
      if (editing.type === 'sub') await api.put(`/api/categories/sub-categories/${editing.id}`, subCategoryForm);
      else await api.post('/api/categories/sub-categories', subCategoryForm);
      setSubCategoryForm({ mainCategoryId: '', name: '', remarks: '' });
      setShowSubCategoryForm(false);
      fetchCategories();
      setEditing({ type: '', id: null });
      toast.success(editing.type === 'sub' ? 'Subcategory updated' : 'Subcategory added');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save subcategory');
    }
  };

  const editCategory = (type, category) => {
    setEditing({ type, id: category.itemTypeId || category.mainCategoryId || category.subCategoryId });
    if (type === 'item') {
      setItemTypeForm({ name: category.itemTypeName, remarks: category.remarks || '' });
      setShowItemTypeForm(true);
      setShowMainCategoryForm(false);
      setShowSubCategoryForm(false);
    } else if (type === 'main') {
      setMainCategoryForm({ itemTypeId: category.itemTypeId, name: category.mainCategoryName, remarks: category.remarks || '' });
      setShowMainCategoryForm(true);
      setShowItemTypeForm(false);
      setShowSubCategoryForm(false);
    } else {
      setSubCategoryForm({ mainCategoryId: category.mainCategoryId, name: category.subCategoryName, remarks: category.remarks || '' });
      setShowSubCategoryForm(true);
      setShowItemTypeForm(false);
      setShowMainCategoryForm(false);
    }
  };

  const deleteCategory = async (type, id) => {
    if (!window.confirm('Delete this category? This is allowed only when it is not in use.')) return;
    const resource = type === 'item' ? 'item-types' : type === 'main' ? 'main-categories' : 'sub-categories';
    try {
      await api.delete(`/api/categories/${resource}/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete category');
    }
  };

  if (loading) return <div className="categories-loading">Loading categories...</div>;

  return (
    <div className="categories-page">
      {/* Page heading */}
      <div className="categories-header">
        <h1 className="categories-title">Categories</h1>
      </div>

      <div className="categories-toolbar">
        <label className="category-search">
          <i className="bi bi-search"></i>
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
          />
        </label>
      </div>

      <div className="categories-grid">

        {/* Item types */}
        <div className="category-card">
          <div className="category-card-header">
            <div>
              <h6 className="category-card-title">Item Types</h6>
              <span className="category-count">{visibleItemTypes.length} of {itemTypes.length}</span>
            </div>
            <button
              className="category-action-btn"
              onClick={toggleItemTypeForm}
              title={showItemTypeForm ? 'Hide form' : 'Add Item Type'}
            >
              <i className={`bi ${showItemTypeForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
            </button>
          </div>

          <div className="category-card-body">
            <div className={`category-form-wrapper ${showItemTypeForm ? 'is-visible' : ''}`}>
              <form onSubmit={handleAddItemType} className="category-form">
                <div className="category-form-title">{editing.type === 'item' ? 'Edit item type' : 'New item type'}</div>
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
                <div className="category-form-actions">
                  <button type="button" className="category-cancel-btn" onClick={closeItemTypeForm}>Cancel</button>
                  <button type="submit" className="category-submit-btn">{editing.type === 'item' ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>

            {visibleItemTypes.length === 0 ? (
              <p className="category-empty-state">{itemTypes.length === 0 ? 'No item types yet' : 'No item types match your search'}</p>
            ) : (
              <ul className="category-list">
                {visibleItemTypes.map(item => (
                  <li key={item.itemTypeId} className="category-list-item">
                    <div className="category-list-item-header">
                      <span className="category-item-name">{item.itemTypeName}</span>
                      <span className="category-row-actions"><button type="button" className="category-icon-btn" title="Edit" onClick={() => editCategory('item', item)}><i className="bi bi-pencil"></i></button><button type="button" className="category-icon-btn is-danger" title="Delete" onClick={() => deleteCategory('item', item.itemTypeId)}><i className="bi bi-trash"></i></button></span>
                    </div>
                    {item.remarks && <span className="category-item-meta">{item.remarks}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Main categories */}
        <div className="category-card">
          <div className="category-card-header">
            <div>
              <h6 className="category-card-title">Main Categories</h6>
              <span className="category-count">{visibleMainCategories.length} of {mainCategories.length}</span>
            </div>
            <button
              className="category-action-btn"
              onClick={toggleMainCategoryForm}
              title={showMainCategoryForm ? 'Hide form' : 'Add Main Category'}
              disabled={itemTypes.length === 0}
            >
              <i className={`bi ${showMainCategoryForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
            </button>
          </div>

          <div className="category-card-body">
            <div className={`category-form-wrapper ${showMainCategoryForm ? 'is-visible' : ''}`}>
              <form onSubmit={handleAddMainCategory} className="category-form">
                <div className="category-form-title">{editing.type === 'main' ? 'Edit main category' : 'New main category'}</div>
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
                <div className="category-form-actions">
                  <button type="button" className="category-cancel-btn" onClick={closeMainCategoryForm}>Cancel</button>
                  <button type="submit" className="category-submit-btn">{editing.type === 'main' ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>

            {visibleMainCategories.length === 0 ? (
              <p className="category-empty-state">{mainCategories.length === 0 ? 'No main categories yet' : 'No main categories match your filters'}</p>
            ) : (
              <ul className="category-list">
                {visibleMainCategories.map(main => (
                  <li key={main.mainCategoryId} className="category-list-item">
                    <div className="category-list-item-header">
                      <span className="category-item-name">{main.mainCategoryName}</span>
                      <span className="category-row-actions"><button type="button" className="category-icon-btn" title="Edit" onClick={() => editCategory('main', main)}><i className="bi bi-pencil"></i></button><button type="button" className="category-icon-btn is-danger" title="Delete" onClick={() => deleteCategory('main', main.mainCategoryId)}><i className="bi bi-trash"></i></button></span>
                    </div>
                    <span className="category-item-meta">Type: {main.itemTypeName}</span>
                    {main.remarks && <span className="category-item-meta">{main.remarks}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sub categories */}
        <div className="category-card">
          <div className="category-card-header">
            <div>
              <h6 className="category-card-title">Sub Categories</h6>
              <span className="category-count">{visibleSubCategories.length} of {subCategories.length}</span>
            </div>
            <button
              className="category-action-btn"
              onClick={toggleSubCategoryForm}
              title={showSubCategoryForm ? 'Hide form' : 'Add Sub Category'}
              disabled={mainCategories.length === 0}
            >
              <i className={`bi ${showSubCategoryForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
            </button>
          </div>

          <div className="category-card-body">
            <div className={`category-form-wrapper ${showSubCategoryForm ? 'is-visible' : ''}`}>
              <form onSubmit={handleAddSubCategory} className="category-form">
                <div className="category-form-title">{editing.type === 'sub' ? 'Edit sub category' : 'New sub category'}</div>
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
                <div className="category-form-actions">
                  <button type="button" className="category-cancel-btn" onClick={closeSubCategoryForm}>Cancel</button>
                  <button type="submit" className="category-submit-btn">{editing.type === 'sub' ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>

            {visibleSubCategories.length === 0 ? (
              <p className="category-empty-state">{subCategories.length === 0 ? 'No sub categories yet' : 'No sub categories match your filters'}</p>
            ) : (
              <ul className="category-list">
                {visibleSubCategories.map(sub => (
                  <li key={sub.subCategoryId} className="category-list-item">
                    <div className="category-list-item-header">
                      <span className="category-item-name">{sub.subCategoryName}</span>
                      <span className="category-row-actions"><button type="button" className="category-icon-btn" title="Edit" onClick={() => editCategory('sub', sub)}><i className="bi bi-pencil"></i></button><button type="button" className="category-icon-btn is-danger" title="Delete" onClick={() => deleteCategory('sub', sub.subCategoryId)}><i className="bi bi-trash"></i></button></span>
                    </div>
                    <span className="category-item-meta">{sub.itemTypeName} / {sub.mainCategoryName}</span>
                    {sub.remarks && <span className="category-item-meta">{sub.remarks}</span>}
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
