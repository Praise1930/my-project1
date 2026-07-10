import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ThemeToggle } from '../contexts/ThemeContext';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus('success');
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Failed to send reset email. Please ensure the email is correct.');
    }
  };

  return (
    <div className="login-area section-padding" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-5 col-lg-6 col-md-8 col-sm-10">
            <div className="login-form-area login-bg" style={{ padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <ThemeToggle />
              </div>
              
              <div className="text-center mb-30" style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#0f61ef' }}>
                  <i className="fa fa-unlock-alt"></i>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>Reset Password</h2>
                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Enter your registered email address and we will send you a link to reset your password.</p>
              </div>

              {status === 'success' ? (
                <div className="alert alert-success" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '15px', borderRadius: '6px', fontSize: '0.95rem', marginBottom: '20px', textAlign: 'center' }}>
                  {message}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {status === 'error' && (
                    <div className="alert alert-danger" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '20px' }}>
                      {message}
                    </div>
                  )}

                  <div className="input-box mb-20" style={{ marginBottom: '20px' }}>
                    <div className="single-input-fields">
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>Email Address</label>
                      <input 
                        type="email" 
                        placeholder="e.g. user@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          background: 'transparent',
                          color: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-block"
                    style={{
                      background: '#0f61ef',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '12px 20px',
                      fontSize: '1.05rem',
                      borderRadius: '4px',
                      width: '100%',
                      border: 'none',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <Link to="/login" style={{ color: '#4b5563', textDecoration: 'underline', fontSize: '0.9rem' }}>← Back to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
