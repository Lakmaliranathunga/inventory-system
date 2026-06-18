import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

import logo from "../assets/images/slpa-logo-original.png";
import bg from "../assets/images/ship-bg.jpg";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      const response = await axios.post("http://localhost:5000/login", {
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
        {/* Left column: Login Box */}
        <div className="login-left-pane">
          <div className="login-form-wrapper">
            <h1 className="welcome-title">
              Welcome to Inventory <br />Management System
            </h1>

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
                <input
                  id="password"
                  type="password"
                  placeholder="........"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="login-forgot-row ">
                <Link to="/forgot">Forgot password</Link>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="login-register-row">
                Don't have an account? <Link to="/register">Sign up</Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Image background */}
        <div className="login-right-pane">
          {/* the background image is on the parent (.login-main-content), this pane is just blank layout spacer */}
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

export default Login;