import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

const isNewer = (local, remote) => {
  if (!local || !remote) return false;
  const l = local.replace(/^v/, '').split('.').map(Number);
  const r = remote.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    const lVal = l[i] || 0;
    const rVal = r[i] || 0;
    if (rVal > lVal) return true;
    if (rVal < lVal) return false;
  }
  return false;
};

const UpdateNotifier = () => {
  const [newVersion, setNewVersion] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const localVer = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
        
        // Fetch version.json from the hosted site
        const res = await fetch('https://conqquest.github.io/Momentum-android/version.json');
        if (!res.ok) return;
        const data = await res.json();
        
        if (data && data.version) {
          const dismissed = localStorage.getItem('momentum_dismissed_version');
          if (dismissed === data.version) return;

          if (isNewer(localVer, data.version)) {
            setNewVersion(data.version);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Update check failed:', err);
      }
    };

    // Check after 2.5 seconds (so it loads after splash and initial tab animations)
    const timer = setTimeout(checkUpdate, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (newVersion) {
      localStorage.setItem('momentum_dismissed_version', newVersion);
    }
    setIsOpen(false);
  };

  if (!isOpen || !newVersion) return null;

  return (
    <div style={containerStyle}>
      <div style={bannerStyle}>
        <div style={contentStyle}>
          <div style={iconContainerStyle}>
            <Sparkles size={16} color="#D4A574" fill="#D4A574" />
          </div>
          <div style={textContainerStyle}>
            <h4 style={titleStyle}>Update Available ✨</h4>
            <p style={descStyle}>A new version of Momentum (v{newVersion}) is available. Get it now for new features!</p>
          </div>
        </div>
        <div style={actionsStyle}>
          <a
            href="https://github.com/conqquest/Momentum-android/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDismiss}
            style={buttonStyle}
          >
            <Download size={13} style={{ marginRight: '4px' }} />
            Update
          </a>
          <button onClick={handleDismiss} style={closeButtonStyle}>
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const containerStyle = {
  position: 'fixed',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 32px)',
  maxWidth: '440px',
  zIndex: 10000,
  animation: 'slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
};

const bannerStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  padding: '12px 14px 12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const contentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
};

const iconContainerStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '10px',
  background: 'rgba(212, 165, 116, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const textContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const titleStyle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: '800',
  color: 'var(--text-primary)',
};

const descStyle = {
  margin: 0,
  fontSize: '11px',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  lineHeight: '1.4',
};

const actionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexShrink: 0,
};

const buttonStyle = {
  background: 'linear-gradient(135deg, #6B8F71 0%, #4a6b4f 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  padding: '8px 14px',
  fontSize: '12px',
  fontWeight: '800',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 3px 10px rgba(107, 143, 113, 0.3)',
  transition: 'transform 0.15s ease',
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  borderRadius: '50%',
};

export default UpdateNotifier;
