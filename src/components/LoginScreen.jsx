import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { loginWithGoogle } from '../firebase';
import { Heart } from 'lucide-react';

const LoginScreen = () => {
  const { setIsGuest } = useContext(AppContext);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
      localStorage.setItem('auth_mode', 'google');
      setIsGuest(false);
    } catch (err) {
      console.error(err);
      alert('Google Sign-In failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('auth_mode', 'guest');
    setIsGuest(true);
  };

  return (
    <div 
      className="flex-center" 
      style={{ 
        height: '100vh', 
        flexDirection: 'column', 
        padding: '24px', 
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}
    >
      <div 
        className="flex-center" 
        style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '24px', 
          background: 'var(--accent-light)', 
          marginBottom: '24px',
          boxShadow: '0 8px 24px var(--accent-light)'
        }}
      >
        <Heart size={40} color="var(--accent-color)" fill="var(--accent-color)" />
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>
        Momentum
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.5', marginBottom: '48px' }}>
        Track your habits, log your nutrition, and find your daily flow.
      </p>

      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          className="google-signin-btn"
          onClick={handleGoogleLogin}
          disabled={isSigningIn}
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            borderRadius: '16px',
            padding: '16px',
            fontSize: '15px',
            fontWeight: '700'
          }}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" style={{ marginRight: '10px' }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
        </button>

        <button
          onClick={handleGuestMode}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'underline',
            padding: '12px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
