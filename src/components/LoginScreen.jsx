import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { loginWithGoogle } from '../firebase';
import { Heart } from 'lucide-react';

const LoginScreen = () => {
  const { setIsGuest } = useContext(AppContext);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError('');
    try {
      // loginWithGoogle either calls Firebase popup OR sets mockUser
      // In both cases, subscribeToAuthChanges will be notified and setUser() called in AppContext
      // which causes the app to re-render and skip LoginScreen automatically
      await loginWithGoogle();
      // Clear guest mode flag so the app shows cloud sync state
      localStorage.setItem('auth_mode', 'google');
      setIsGuest(false);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Sign in failed. Please check your connection and try again.');
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
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        textAlign: 'center',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: '88px',
          height: '88px',
          borderRadius: '28px',
          background: 'var(--accent-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          border: '1.5px solid var(--border-color)',
        }}
      >
        <Heart size={44} color="var(--accent-color)" fill="var(--accent-color)" />
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: '34px',
          fontWeight: '900',
          letterSpacing: '-1.5px',
          marginBottom: '10px',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
        }}
      >
        Momentum
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '260px',
          lineHeight: '1.55',
          marginBottom: '52px',
        }}
      >
        Track habits, journal your day, and build your daily flow.
      </p>

      {/* Buttons */}
      <div
        style={{
          width: '100%',
          maxWidth: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSigningIn}
          className="google-signin-btn"
          style={{
            width: '100%',
            marginTop: 0,
            padding: '15px 20px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '700',
            justifyContent: 'center',
          }}
        >
          {isSigningIn ? (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <p
            style={{
              fontSize: '13px',
              color: '#ef4444',
              marginTop: '4px',
              padding: '0 4px',
            }}
          >
            {error}
          </p>
        )}

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Guest Mode */}
        <button
          onClick={handleGuestMode}
          style={{
            background: 'transparent',
            border: '1.5px solid var(--border-color)',
            borderRadius: '16px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '700',
            padding: '14px 20px',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
        >
          Continue as Guest
        </button>
      </div>

      {/* Disclaimer */}
      <p
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          maxWidth: '280px',
          lineHeight: '1.5',
          marginTop: '32px',
        }}
      >
        Guest data is saved locally on this device only. Sign in with Google to sync your habits across devices.
      </p>
    </div>
  );
};

export default LoginScreen;
