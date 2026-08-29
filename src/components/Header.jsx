import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const AVATAR_PRESETS = [
  { key: 'avatar1', url: 'avatars/avatar1.jpeg' },
  { key: 'avatar2', url: 'avatars/avatar2.jpeg' },
  { key: 'avatar3', url: 'avatars/avatar3.jpeg' },
  { key: 'avatar4', url: 'avatars/avatar4.jpeg' },
  { key: 'avatar5', url: 'avatars/avatar5.jpeg' },
  { key: 'avatar6', url: 'avatars/avatar6.jpeg' },
  { key: 'avatar7', url: 'avatars/avatar7.jpeg' },
  { key: 'avatar8', url: 'avatars/avatar8.jpeg' },
  { key: 'avatar9', url: 'avatars/avatar9.jpeg' },
  { key: 'avatar10', url: 'avatars/avatar10.jpeg' },
  { key: 'avatar11', url: 'avatars/avatar11.jpeg' },
  { key: 'avatar12', url: 'avatars/avatar12.jpeg' },
  { key: 'avatar13', url: 'avatars/avatar13.jpeg' },
  { key: 'avatar14', url: 'avatars/avatar14.jpeg' },
  { key: 'avatar15', url: 'avatars/avatar15.jpeg' },
  { key: 'avatar16', url: 'avatars/avatar16.jpeg' },
];

const Header = () => {
  const { displayName, user, profileAvatar, setActiveTab } = useContext(AppContext);

  // Time-sensitive greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning ☀️' :
    hour < 17 ? 'Good afternoon 👋' :
                'Good evening 🌙';

  // Full date string
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Derive the displayed avatar URL
  const avatarUrl = (() => {
    if (profileAvatar && profileAvatar.startsWith('data:')) {
      return profileAvatar;
    }
    if (profileAvatar) {
      const found = AVATAR_PRESETS.find(a => a.key === profileAvatar);
      if (found) return found.url;
    }
    if (user?.photoURL) return user.photoURL;
    return AVATAR_PRESETS[0].url;
  })();

  return (
    <header className="app-header">
      <div style={{ flex: 1 }}>
        {/* Greeting line */}
        <span style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontWeight: '700',
          display: 'block',
          marginBottom: '4px',
          letterSpacing: '0.1px',
        }}>
          {greeting}
        </span>

        {/* Large bold name — like reference app */}
        <h1 style={{
          fontSize: '28px',
          color: 'var(--text-primary)',
          fontWeight: '900',
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
        }}>
          {displayName || 'Welcome'}
        </h1>

        {/* Date sub-line */}
        <span style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontWeight: '600',
          display: 'block',
          marginTop: '3px',
        }}>
          {dateStr}
        </span>
      </div>

      {/* Avatar — tappable, goes to Profile */}
      <img
        src={avatarUrl}
        alt="Profile"
        className="profile-avatar"
        onClick={() => setActiveTab('profile')}
        style={{ cursor: 'pointer', marginTop: '2px', objectFit: 'cover' }}
      />
    </header>
  );
};

export default Header;
