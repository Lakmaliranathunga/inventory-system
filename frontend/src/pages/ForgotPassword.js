import React from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Forgot password</h2>
        <p>Enter your email or username and we will send password reset instructions.</p>
        <form className="auth-form">
          <label htmlFor="forgotEmail">Email or username</label>
          <input id="forgotEmail" type="text" placeholder="Enter your email or username" />
          <button type="button">Send reset link</button>
        </form>
        <div className="auth-footer">
          Remembered your password? <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
