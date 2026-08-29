import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const AVATAR_PRESETS = {
  Female: [
    { key: 'fem1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily' },
    { key: 'fem2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe' },
    { key: 'fem3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe' },
    { key: 'fem4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
    { key: 'fem5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella' },
    { key: 'fem6', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Mia' },
    { key: 'fem7', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Luna' },
    { key: 'fem8', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Eva' },
    { key: 'fem9', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Gaby' },
    { key: 'fem10', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Sasha' },
  ],
  Male: [
    { key: 'm1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
    { key: 'm2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo' },
    { key: 'm3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo' },
    { key: 'm4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
    { key: 'm5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Otis' },
    { key: 'm6', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Toby' },
    { key: 'm7', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Max' },
    { key: 'm8', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Sam' },
    { key: 'm9', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Alex' },
    { key: 'm10', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Owen' },
  ],
  'Non-Binary': [
    { key: 'nb1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Riley' },
    { key: 'nb2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Robin' },
    { key: 'nb3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Skyler' },
    { key: 'nb4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie' },
    { key: 'nb5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor' },
    { key: 'nb6', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Casey' },
    { key: 'nb7', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Morgan' },
    { key: 'nb8', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Jamie' },
    { key: 'nb9', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Blake' },
    { key: 'nb10', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Jordan' },
  ],
};

const Header = () => {
  const { displayName, user, gender, profileAvatar, setActiveTab } = useContext(AppContext);

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
      const all = [...(AVATAR_PRESETS.Female || []), ...(AVATAR_PRESETS.Male || []), ...(AVATAR_PRESETS['Non-Binary'] || [])];
      const found = all.find(a => a.key === profileAvatar);
      if (found) return found.url;
    }
    if (user?.photoURL) return user.photoURL;
    const seed = gender === 'Female' ? 'Aria' : gender === 'Non-Binary' ? 'Riley' : 'Felix';
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName || 'User'}-${seed}`;
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
