import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Categories = () => {
  const [itemTypes, setItemTypes] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [itemTypeForm, setItemTypeForm] = useState({ name: '', remarks: '' });
  const [mainCategoryForm, setMainCategoryForm] = useState({ itemTypeId: '', name: '', remarks: '' });
  const [subCategoryForm, setSubCategoryForm] = useState({ mainCategoryId: '', name: '', remarks: '' });

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [itemRes, mainRes, subRes] = await Promise.all([
        axios.get('http://localhost:5000/api/categories/item-types', { headers }),
        axios.get('http://localhost:5000/api/categories/main-categories', { headers }),
        axios.get('http://localhost:5000/api/categories/sub-categories', { headers })
      ]);

      if (itemRes.data.success) setItemTypes(itemRes.data.data);
      if (mainRes.data.success) setMainCategories(mainRes.data.data);
      if (subRes.data.success) setSubCategories(subRes.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddItemType = async (e) => {
    e.preventDefault();
    if (!itemTypeForm.name) return alert("Name is required");
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/categories/item-types', itemTypeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItemTypeForm({ name: '', remarks: '' });
      fetchCategories();
      alert("Item Type Added!");
    } catch (error) {
      console.error(error);
      alert("Failed to add Item Type");
    }
  };

  const handleAddMainCategory = async (e) => {
    e.preventDefault();
    if (!mainCategoryForm.name || !mainCategoryForm.itemTypeId) return alert("Required fields missing");
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/categories/main-categories', mainCategoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMainCategoryForm({ itemTypeId: '', name: '', remarks: '' });
      fetchCategories();
      alert("Main Category Added!");
    } catch (error) {
      console.error(error);
      alert("Failed to add Main Category");
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!subCategoryForm.name || !subCategoryForm.mainCategoryId) return alert("Required fields missing");
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/categories/sub-categories', subCategoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubCategoryForm({ mainCategoryId: '', name: '', remarks: '' });
      fetchCategories();
      alert("Sub Category Added!");
    } catch (error) {
      console.error(error);
      alert("Failed to add Sub Category");
    }
  };

  if (loading) return <div>Loading Categories...</div>;

  return (
    <div className="container-fluid">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Categories Management</h1>
      </div>
      <div className="row">
        
        {/* ITEM TYPES */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Item Types</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                data-bs-toggle="collapse" 
                data-bs-target="#collapseItemType"
              ><i className="bi bi-plus"></i></button>
            </div>
            <div className="card-body">
              <div className="collapse mb-3" id="collapseItemType">
                <form onSubmit={handleAddItemType} className="border p-2 rounded bg-light">
                  <input type="text" className="form-control mb-2 form-control-sm" placeholder="Name" value={itemTypeForm.name} onChange={e=>setItemTypeForm({...itemTypeForm, name: e.target.value})} />
                  <input type="text" className="form-control mb-2 form-control-sm" placeholder="Remarks" value={itemTypeForm.remarks} onChange={e=>setItemTypeForm({...itemTypeForm, remarks: e.target.value})} />
                  <button type="submit" className="btn btn-sm btn-primary w-100">Save</button>
                </form>
              </div>
              
              {itemTypes.length === 0 ? <p className="text-muted text-center mt-3">No Item Types Found</p> : (
                <ul className="list-group list-group-flush" style={{maxHeight:'400px', overflowY:'auto'}}>
                  {itemTypes.map(item => (
                    <li key={item.itemTypeId} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      {item.itemTypeName}
                      <span className="badge bg-primary rounded-pill">ID: {item.itemTypeId}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CATEGORIES */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Main Categories</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                data-bs-toggle="collapse" 
                data-bs-target="#collapseMainCategory"
              ><i className="bi bi-plus"></i></button>
            </div>
            <div className="card-body">
              <div className="collapse mb-3" id="collapseMainCategory">
                <form onSubmit={handleAddMainCategory} className="border p-2 rounded bg-light">
                  <select className="form-select mb-2 form-select-sm" value={mainCategoryForm.itemTypeId} onChange={e=>setMainCategoryForm({...mainCategoryForm, itemTypeId: e.target.value})}>
                    <option value="">Select Item Type</option>
                    {itemTypes.map(it=><option key={it.itemTypeId} value={it.itemTypeId}>{it.itemTypeName}</option>)}
                  </select>
                  <input type="text" className="form-control mb-2 form-control-sm" placeholder="Name" value={mainCategoryForm.name} onChange={e=>setMainCategoryForm({...mainCategoryForm, name: e.target.value})} />
                  <input type="text" className="form-control mb-2 form-control-sm" placeholder="Remarks" value={mainCategoryForm.remarks} onChange={e=>setMainCategoryForm({...mainCategoryForm, remarks: e.target.value})} />
                  <button type="submit" className="btn btn-sm btn-primary w-100">Save</button>
                </form>
              </div>

              {mainCategories.length === 0 ? <p className="text-muted text-center mt-3">No Main Categories</p> : (
                <ul className="list-group list-group-flush" style={{maxHeight:'400px', overflowY:'auto'}}>
                  {mainCategories.map(main => (
                    <li key={main.mainCategoryId} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="font-weight-bold">{main.mainCategoryName}</span>
                      </div>
                      <small className="text-muted">Type: {main.itemTypeName}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* SUB CATEGORIES */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Sub Categories</h6>
              <button 
                className="btn btn-sm btn-outline-primary"
                data-bs-toggle="collapse" 
                data-bs-target="#collapseSubCategory"
              ><i className="bi bi-plus"></i></button>
            </div>
            <div className="card-body">
              <div className="collapse mb-3" id="collapseSubCategory">
                <form onSubmit={handleAddSubCategory} className="border p-2 rounded bg-light">
                  <select className="form-select mb-2 form-select-sm" value={subCategoryForm.mainCategoryId} onChange={e=>setSubCategoryForm({...subCategoryForm, mainCategoryId: e.target.value})}>
                    <option value="">Select Main Category</option>
                    {mainCategories.map(mc=><option key={mc.mainCategoryId} value={mc.mainCategoryId}>{mc.mainCategoryName}</option>)}
                  </select>
                  <input type="text" className="form-control mb-2 form-control-sm" placeholder="Name" value={subCategoryForm.name} onChange={e=>setSubCategoryForm({...subCategoryForm, name: e.target.value})} />
                  <input type="text" className="form-control mb-2 form-control-sm" placeholder="Remarks" value={subCategoryForm.remarks} onChange={e=>setSubCategoryForm({...subCategoryForm, remarks: e.target.value})} />
                  <button type="submit" className="btn btn-sm btn-primary w-100">Save</button>
                </form>
              </div>

              {subCategories.length === 0 ? <p className="text-muted text-center mt-3">No Sub Categories</p> : (
                <ul className="list-group list-group-flush" style={{maxHeight:'400px', overflowY:'auto'}}>
                  {subCategories.map(sub => (
                    <li key={sub.subCategoryId} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="font-weight-bold">{sub.subCategoryName}</span>
                      </div>
                      <small className="text-muted">{sub.itemTypeName} &rsaquo; {sub.mainCategoryName}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Categories;
