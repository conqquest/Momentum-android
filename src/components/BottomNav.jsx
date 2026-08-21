import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Home, Compass, Plus, BookOpen, User } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'home',    icon: Home,     label: 'Home'    },
  { key: 'explore', icon: Compass,  label: 'Explore' },
  { key: null,      icon: Plus,     label: 'Log'     }, // FAB
  { key: 'journey', icon: BookOpen, label: 'Journey' },
  { key: 'profile', icon: User,     label: 'Profile' },
];

const BottomNav = () => {
  const { activeTab, setActiveTab, setShowJournalModal } = useContext(AppContext);

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;

        // Center FAB
        if (item.key === null) {
          return (
            <div
              key="fab"
              className="nav-item-fab"
              onClick={() => setShowJournalModal(true)}
              role="button"
              tabIndex={0}
              aria-label="New Journal Entry"
            >
              <Icon size={26} strokeWidth={2.5} />
            </div>
          );
        }

        const isActive = activeTab === item.key;
        return (
          <div
            key={item.key}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.key)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
