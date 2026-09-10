import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import "./Login.css";

import logo from "../assets/images/slpa-logo-original.png";
import logoTransparent from "../assets/images/slpa-logo-transparent.png";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/login", {
        uUsername: username,
        uPassword: password,
      });

      if (response.data?.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/dashboard");
      } else {
        setError(response.data?.message || "Invalid credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
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

      <div className="login-main-content">
        <div className="login-left-pane">
          <div className="login-form-wrapper">
            <div className="login-card-logo-container">
              <img src={logoTransparent} alt="SLPA Logo" className="login-card-logo" />
            </div>

            <div className="login-eyebrow">
              <i className="bi bi-shield-check"></i> Secure staff portal
            </div>
            <h1 className="welcome-title">Welcome back</h1>
            <p className="login-intro">Sign in to manage inventory, suppliers, invoices, and reports.</p>

            {error && <div className="login-error-message">{error}</div>}

            <form onSubmit={handleLogin} className="login-form">
              <div className="login-input-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        <div className="login-right-pane"></div>
      </div>

      <footer className="login-page-footer">
        <p>Developed by UCT 2026</p>
        <p>Copyright 2026 Sri Lanka Ports Authority. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Login;
