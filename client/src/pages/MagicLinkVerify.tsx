import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { setAccessToken } from '@/lib/auth';

export default function MagicLinkVerify() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (!token) {
      setStatus('error');
      setError('No token provided');
      return;
    }

    verifyToken(token);
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await api.post('/api/auth/magic-link/verify', null, {
        params: { token }
      });
      
      setAccessToken(response.data.access_token);
      setStatus('success');
      
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
    } catch (error: any) {
      setStatus('error');
      setError(error.response?.data?.detail || 'Invalid or expired magic link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Verifying your link...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">Login successful!</h2>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Verification failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <a href="/login" className="text-blue-600 hover:underline">
              Back to login
            </a>
          </>
        )}
      </div>
    </div>
  );
}
