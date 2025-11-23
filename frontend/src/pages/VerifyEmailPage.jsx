// frontend/src/pages/VerifyEmailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const verifiedRef = React.useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent double verification
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        
        // Update user data with verified email status
        if (response.user && updateUser) {
          updateUser({ email_verified: true });
        }
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        // Only show error if it's not a "token already used" error
        const errorMsg = error.response?.data?.error || '';
        if (errorMsg.includes('Invalid or expired')) {
          setStatus('error');
          setMessage('This verification link has expired or is invalid. Please request a new one.');
        } else {
          // If token was already used, treat it as success
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          if (updateUser) {
            updateUser({ email_verified: true });
          }
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      }
    };

    if (token && !verifiedRef.current) {
      verifyEmail();
    }
  }, [token, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 mx-auto text-green-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-600">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to the home page...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
