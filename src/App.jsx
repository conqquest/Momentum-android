import React, { useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import ExploreView from './components/ExploreView';
import JourneyView from './components/JourneyView';
import SettingsView from './components/SettingsView';
import JournalModal from './components/JournalModal';
import { RefreshCw } from 'lucide-react';

const MainAppContent = () => {
  const { activeTab, loading } = useContext(AppContext);

  if (loading) {
    return (
      <div 
        className="flex-center" 
        style={{ 
          height: '100vh', 
          flexDirection: 'column', 
          gap: '16px',
          background: 'var(--bg-main)',
          color: 'var(--text-primary)'
        }}
      >
        <RefreshCw size={36} color="var(--accent-color)" className="spinning" />
        <span style={{ fontSize: '15px', fontWeight: '700' }}>
          Mindfulness is loading...
        </span>
      </div>
    );
  }

  // Screen routing matching selected activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'explore':
        return <ExploreView />;
      case 'journey':
        return <JourneyView />;
      case 'profile':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <>
      <Header />
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
        {renderTabContent()}
      </main>
      <BottomNav />
      {/* Journal entries slide sheet overlay */}
      <JournalModal />
    </>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;
