import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Login.css";
import logo from "../assets/images/slpa-logo.png";
import bg from "../assets/images/ship-bg.jpg";

function Register() {
  const [formData, setFormData] = useState({
    uUsername: "",
    uFullName: "",
    uPassword: "",
    uStatus: "",
    uEmpNo: "",
    roleId: "",
    sectionId: "",
    divisionId: "",
    contactNo: ""
  });
  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDivisions();
    fetchSections();
    fetchRoles();
  }, []);

  const fetchDivisions = async () => {
    try {
      const response = await axios.get("http://localhost:5000/divisions");
      setDivisions(response.data);
    } catch (err) {
      setError("Unable to load division list.");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:5000/roles");
      setRoles(response.data);
    } catch (err) {
      setError("Unable to load roles list.");
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get("http://localhost:5000/sections");
      setSections(response.data);
    } catch (err) {
      setError("Unable to load section list.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.uUsername || !formData.uPassword || !formData.uFullName) {
      setError("Username, full name, and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/register", formData);
      setSuccess(response.data?.message || "User registered successfully.");
      setFormData({
        uUsername: "",
        uFullName: "",
        uPassword: "",
        uStatus: "",
        uEmpNo: "",
        roleId: "",
        sectionId: "",
        divisionId: "",
        contactNo: ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
      {/* Top Header */}
      <header className="custom-login-header">
        <div className="header-logo-container">
          <img src={logo} alt="SLPA Logo" className="slpa-logo" />
          <div className="header-brand-text">
            <span>Sri Lanka</span>
            <span>Ports Authority</span>
            <span className="small-hub-text">Sri Lanka the Maritime Hub</span>
          </div>
        </div>
        <div className="header-title-container">
          <h2>Inventory Management System</h2>
        </div>
      </header>

      {/* Main split screen */}
      <div 
        className="login-main-content" 
        style={{ backgroundImage: `url(${bg})` }}
      >
        {/* Left column: Login Box styled for Register */}
        <div className="login-left-pane register-full-pane">
          <div className="login-form-wrapper register-form-wrapper">
            <h1 className="welcome-title" style={{ marginBottom: "20px" }}>
              Create an Account
            </h1>

            {error && <div className="login-error-message">{error}</div>}
            {success && <div className="login-error-message" style={{ backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>{success}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="register-grid">
                
                <div className="login-input-group">
                  <label htmlFor="uUsername">Username</label>
                  <input
                    id="uUsername"
                    name="uUsername"
                    type="text"
                    placeholder="Enter username"
                    value={formData.uUsername}
                    onChange={handleChange}
                  />
                </div>

                <div className="login-input-group">
                  <label htmlFor="uFullName">Full Name</label>
                  <input
                    id="uFullName"
                    name="uFullName"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.uFullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="login-input-group">
                  <label htmlFor="uPassword">Password</label>
                  <input
                    id="uPassword"
                    name="uPassword"
                    type="password"
                    placeholder="Enter password"
                    value={formData.uPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="login-input-group">
                  <label htmlFor="uStatus">Status</label>
                  <select
                    id="uStatus"
                    name="uStatus"
                    className="register-select"
                    value={formData.uStatus}
                    onChange={handleChange}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="login-input-group">
                  <label htmlFor="uEmpNo">Employee Number</label>
                  <input
                    id="uEmpNo"
                    name="uEmpNo"
                    type="text"
                    placeholder="Enter employee no"
                    value={formData.uEmpNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="login-input-group">
                  <label htmlFor="roleId">Role</label>
                  <select
                    id="roleId"
                    name="roleId"
                    className="register-select"
                    value={formData.roleId}
                    onChange={handleChange}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="login-input-group">
                  <label htmlFor="divisionId">Division</label>
                  <select
                    id="divisionId"
                    name="divisionId"
                    className="register-select"
                    value={formData.divisionId}
                    onChange={handleChange}
                  >
                    <option value="">Select division</option>
                    {divisions.map((division) => {
                      const id = division.division_id ?? division.divisionId ?? division.id;
                      const label = division.description ?? division.divisionName ?? division.name ?? "Unnamed division";
                      return (
                        <option key={id ?? label} value={id ?? label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="login-input-group">
                  <label htmlFor="sectionId">Section</label>
                  <select
                    id="sectionId"
                    name="sectionId"
                    className="register-select"
                    value={formData.sectionId}
                    onChange={handleChange}
                  >
                    <option value="">Select section</option>
                    {sections.map((section) => {
                      const id = section.sectionid ?? section.sectionId ?? section.section_id ?? section.id;
                      const label = section.sectionname ?? section.sectionName ?? section.name ?? section.selectname ?? "Unnamed section";
                      return (
                        <option key={id ?? label} value={id ?? label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="login-input-group">
                  <label htmlFor="contactNo">Contact Number</label>
                  <input
                    id="contactNo"
                    name="contactNo"
                    type="text"
                    placeholder="Enter contact no"
                    value={formData.contactNo}
                    onChange={handleChange}
                  />
                </div>

                {/* Empty cell to keep submit and footer aligned or push submit full width */}
                <div className="login-input-group register-submit-btn" style={{ marginTop: "12px" }}>
                  <button type="submit" className="login-submit-btn" disabled={loading}>
                    {loading ? "Registering..." : "Create Account"}
                  </button>
                  <div className="login-register-row">
                    Already have an account? <Link to="/">Sign in</Link>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-page-footer">
        <p>Developed by UCT 2026</p>
        <p>Copyrights © 2026 Sri Lanka Ports Authority. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default Register;
