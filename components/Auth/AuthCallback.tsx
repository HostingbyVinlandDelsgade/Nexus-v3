import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import googleSheetsService from '../../services/googleSheetsService';

interface AuthCallbackProps {
  onSuccess: () => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Google...');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Google Authorization Failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received.');
        return;
      }

      try {
        setMessage('Exchanging code for access token...');
        
        // Exchange code for tokens
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code,
            // Use the current origin + path as redirect URI to match what was sent
            redirectUri: `${window.location.origin}/auth/callback`
          }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to exchange token');
        }

        const { tokens } = await response.json();
        
        // Save tokens
        googleSheetsService.setTokens(tokens);
        
        // Create or find spreadsheet
        setMessage('Setting up inventory spreadsheet...');
        if (!googleSheetsService.hasSpreadsheet()) {
            await googleSheetsService.createSpreadsheet();
        }

        setStatus('success');
        setMessage('Successfully connected to Google Sheets!');
        
        // Redirect back to app after a short delay
        setTimeout(() => {
          // Clear query params
          window.history.replaceState({}, document.title, '/');
          onSuccess();
        }, 2000);

      } catch (err: any) {
        console.error('Auth Error:', err);
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred.');
      }
    };

    handleCallback();
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex justify-center mb-6">
          {status === 'loading' && <Loader2 size={48} className="text-indigo-600 animate-spin" />}
          {status === 'success' && <CheckCircle size={48} className="text-green-500" />}
          {status === 'error' && <XCircle size={48} className="text-red-500" />}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'loading' ? 'Connecting...' : status === 'success' ? 'Connected!' : 'Connection Failed'}
        </h2>
        
        <p className="text-gray-500 mb-6">{message}</p>
        
        {status === 'error' && (
          <button 
            onClick={() => {
                window.history.replaceState({}, document.title, '/');
                onSuccess();
            }}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Return to App
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
