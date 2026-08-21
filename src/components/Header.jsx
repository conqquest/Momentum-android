import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Header = () => {
  const { displayName, user, gender, setActiveTab } = useContext(AppContext);

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

  const avatarSeed = gender === 'Female' ? 'Aria' : (gender === 'Non-Binary' ? 'Riley' : 'Felix');
  const avatarUrl = user?.photoURL ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName || 'User'}-${avatarSeed}`;

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
        style={{ cursor: 'pointer', marginTop: '2px' }}
      />
    </header>
  );
};

export default Header;
