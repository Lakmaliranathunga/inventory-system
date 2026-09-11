import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/client';
import './ChangePassword.css';

const ChangePassword = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/password-change/request');
      setOtpSent(true);
      toast.success(response.data?.message || 'OTP sent to your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter the 6-digit OTP.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/password-change/confirm', {
        otp,
        newPassword,
      });
      toast.success(response.data?.message || 'Password changed successfully.');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <section className="change-password-card">
        <div className="change-password-header">
          <i className="bi bi-shield-lock"></i>
          <div>
            <h1>Change Password</h1>
            <p>Send an OTP to your saved email address, then enter a new password.</p>
          </div>
        </div>

        <button type="button" className="otp-send-btn" onClick={requestOtp} disabled={loading}>
          <i className="bi bi-envelope-check"></i>
          {otpSent ? 'Send OTP Again' : 'Send OTP to Email'}
        </button>

        <form className="change-password-form" onSubmit={changePassword}>
          <label>
            OTP Code
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              disabled={!otpSent}
            />
          </label>

          <label>
            New Password
            <span className="password-input-wrap">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={!otpSent}
              />
              <button
                type="button"
                className="password-view-btn"
                onClick={() => setShowNewPassword(value => !value)}
                disabled={!otpSent}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </span>
          </label>

          <label>
            Confirm Password
            <span className="password-input-wrap">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                disabled={!otpSent}
              />
              <button
                type="button"
                className="password-view-btn"
                onClick={() => setShowConfirmPassword(value => !value)}
                disabled={!otpSent}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </span>
          </label>

          <button type="submit" className="password-change-btn" disabled={!otpSent || loading}>
            <i className="bi bi-key"></i>
            {loading ? 'Please wait...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default ChangePassword;
