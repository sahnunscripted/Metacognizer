import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/common';

export default function AuthPage() {
  const { user, login, register, googleLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(response.credential);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-dark-100">Metacognizer</h1>
          <p className="text-dark-400 text-sm">Your ADHD-friendly productivity system</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-dark-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              isLogin ? 'bg-dark-700 text-dark-100' : 'text-dark-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !isLogin ? 'bg-dark-700 text-dark-100' : 'text-dark-400'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
            />
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className="text-sm text-danger-400">{error}</p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Google Sign-In */}
        {googleClientId && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-dark-700" />
              <span className="text-xs text-dark-500">or</span>
              <div className="flex-1 h-px bg-dark-700" />
            </div>

            <div id="google-signin-container">
              <GoogleSignInButton
                clientId={googleClientId}
                onSuccess={handleGoogleSuccess}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleSignInButton({ clientId, onSuccess }) {
  const [loaded, setLoaded] = useState(false);

  useState(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onSuccess
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        {
          theme: 'filled_black',
          size: 'large',
          width: '100%',
          text: 'continue_with'
        }
      );
      setLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  });

  return <div id="google-btn" className="flex justify-center" />;
}
