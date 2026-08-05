import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Home, BookOpen, Plus, Heart, User } from 'lucide-react';

const BottomNav = () => {
  const { activeTab, setActiveTab, setShowJournalModal } = useContext(AppContext);

  return (
    <nav className="bottom-nav">
      <div
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
        role="button"
        tabIndex={0}
        aria-label="Home"
      >
        <Home size={22} />
        <span>Home</span>
      </div>

      <div
        className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
        onClick={() => setActiveTab('explore')}
        role="button"
        tabIndex={0}
        aria-label="Explore"
      >
        <BookOpen size={22} />
        <span>Explore</span>
      </div>

      {/* Floating Action Button */}
      <div
        className="nav-item-fab"
        onClick={() => setShowJournalModal(true)}
        role="button"
        tabIndex={0}
        aria-label="New Journal Entry"
      >
        <Plus size={28} />
      </div>

      <div
        className={`nav-item ${activeTab === 'journey' ? 'active' : ''}`}
        onClick={() => setActiveTab('journey')}
        role="button"
        tabIndex={0}
        aria-label="Journey"
      >
        <Heart size={22} />
        <span>Journey</span>
      </div>

      <div
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
        role="button"
        tabIndex={0}
        aria-label="Profile"
      >
        <User size={22} />
        <span>Profile</span>
      </div>
    </nav>
  );
};

export default BottomNav;
