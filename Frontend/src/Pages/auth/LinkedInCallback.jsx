import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const LinkedInCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('message');

    if (error) {
      // Optionally show an error UI or just redirect to login
      navigate('/login');
      return;
    }

    if (success === 'true' && token) {
      const userData = JSON.parse(atob(token));
      login(userData, token);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  // Optionally, show a loading spinner here
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-lg font-semibold">Connecting to LinkedIn...</div>
    </div>
  );
};

export default LinkedInCallback;