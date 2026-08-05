import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Header = () => {
  const { displayName, user, setActiveTab } = useContext(AppContext);

  // Use a cute adventurer avatar to match illustration style
  const avatarUrl = user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName}`;

  return (
    <header className="app-header">
      <div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
        <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', marginTop: '2px', fontWeight: '800' }}>
          Hi, {displayName}
        </h1>
      </div>
      <img
        src={avatarUrl}
        alt="Profile"
        className="profile-avatar"
        onClick={() => setActiveTab('profile')}
        style={{ cursor: 'pointer' }}
      />
    </header>
  );
};

export default Header;
