// frontend/src/pages/EmailVerificationPendingPage.jsx
import React, { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

function EmailVerificationPendingPage() {
  const { user, logout, updateUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    setResending(true);
    setMessage('');
    setError('');

    try {
      await authService.resendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = async () => {
    setChecking(true);
    setMessage('');
    setError('');

    try {
      // Fetch fresh user data from the API
      const response = await fetch('/api/v1/auth/settings/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        if (userData.email_verified) {
          // Update user in context and localStorage
          updateUser({ email_verified: true });
          setMessage('Email verified! Redirecting...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setError('Email is not verified yet. Please check your email or contact support.');
        }
      } else {
        setError('Failed to check verification status. Please try again.');
      }
    } catch (err) {
      setError('Failed to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-cream-light to-white px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-coral" />
          </div>
          
          <h1 className="text-2xl font-bold text-burgundy mb-2">
            Verify Your Email
          </h1>
          
          <p className="text-gray-600 mb-6">
            We've sent a verification email to <strong>{user?.email}</strong>
          </p>

          <div className="bg-cream/50 border border-coral/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-burgundy mb-2">Next steps:</h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected back to Glade</li>
            </ol>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full mb-3 px-6 py-3 bg-coral text-white rounded-lg hover:bg-coral-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {resending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Verification Email
              </>
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full mb-3 px-6 py-3 border border-coral text-coral rounded-lg hover:bg-coral/5 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Verification Status'
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationPendingPage;
