import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { Loader, CheckCircle, XCircle, Linkedin, ArrowRight } from 'lucide-react';

const LinkedInCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing LinkedIn authentication...');
  const [userInfo, setUserInfo] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        if (error) {
          setStatus('error');
          setMessage(errorMessage || 'LinkedIn authentication failed');
          
          // Start countdown for redirect
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/login');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return;
        }

        if (success === 'true' && token) {
          // Decode user data from token
          const userData = JSON.parse(atob(token));
          setUserInfo(userData);
          
          // Login user with LinkedIn data
          login(userData, token);
          
          setStatus('success');
          setMessage(`Welcome ${userData.firstName || userData.name}! LinkedIn authentication successful.`);
          
          // Start countdown for redirect
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/dashboard');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setStatus('error');
          setMessage('Invalid authentication response from LinkedIn');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        setStatus('error');
        setMessage('Failed to process LinkedIn authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800 shadow-2xl">
          {/* LinkedIn Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center relative">
              <Linkedin className="w-8 h-8 text-white" />
              {status === 'processing' && (
                <div className="absolute inset-0 bg-blue-600 rounded-xl animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'processing' && (
              <div className="relative">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
              </div>
            )}
            {status === 'success' && (
              <div className="relative">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
              </div>
            )}
            {status === 'error' && (
              <div className="relative">
                <XCircle className="w-12 h-12 text-red-500" />
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">
            {status === 'processing' && 'Authenticating...'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>

          {/* User Info for Success */}
          {status === 'success' && userInfo && (
            <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-3">
                {userInfo.picture && (
                  <img 
                    src={userInfo.picture} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full border-2 border-blue-500"
                  />
                )}
                <div className="text-left">
                  <p className="text-white font-medium">{userInfo.name}</p>
                  <p className="text-gray-400 text-sm">{userInfo.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          <p className="text-gray-400 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Progress Bar for Processing */}
          {status === 'processing' && (
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse transition-all duration-1000" style={{ width: '70%' }}></div>
            </div>
          )}

          {/* Countdown */}
          {status !== 'processing' && (
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'error' && (
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowRight className="h-5 w-5" />
                <span>Back to Login</span>
              </button>
            )}
            
            {status === 'success' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowRight className="h-5 w-5" />
                <span>Go to Dashboard</span>
              </button>
            )}

            {status === 'processing' && (
              <button
                disabled
                className="w-full bg-gray-700 text-gray-400 font-medium py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Loader className="h-5 w-5 animate-spin" />
                <span>Please wait...</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Powered by <span className="text-blue-500 font-medium">Whizmedia</span> Social Media Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInCallback;