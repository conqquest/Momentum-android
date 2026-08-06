import React, { useContext, useState, useEffect } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import ExploreView from './components/ExploreView';
import JourneyView from './components/JourneyView';
import SettingsView from './components/SettingsView';
import JournalModal from './components/JournalModal';
import { RefreshCw, Heart } from 'lucide-react';

const SplashOverlay = () => {
  return (
    <div className="splash-container">
      <img 
        src="/favicon.png" 
        alt="Logo" 
        className="splash-logo"
        onError={(e) => {
          // Fallback if PWA icon is not yet loaded in some views
          e.target.style.display = 'none';
        }}
      />
      <div className="splash-text-fallback" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
        <Heart size={42} color="var(--accent-color)" fill="var(--accent-color)" className="spinning" style={{ animationDuration: '3s' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '12px' }}>
          Momentum
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
          Find your daily flow
        </span>
      </div>
    </div>
  );
};

const OnboardingForm = () => {
  const { setDisplayName, setGender } = useContext(AppContext);
  const [nameInput, setNameInput] = useState('');
  const [genderInput, setGenderInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      alert('Please tell us your name.');
      return;
    }
    if (!genderInput) {
      alert('Please select a gender preference.');
      return;
    }
    setDisplayName(nameInput.trim());
    setGender(genderInput);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div 
            className="flex-center" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '20px', 
              background: 'var(--accent-light)', 
              margin: '0 auto 12px' 
            }}
          >
            <Heart size={32} color="var(--accent-color)" fill="var(--accent-color)" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>Welcome to Momentum</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Let's customize your mindfulness journal.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>What should we call you?</label>
            <input 
              type="text" 
              placeholder="e.g. Jose Maria"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '18px' }}>
            <label>Your Gender</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {['Female', 'Male', 'Non-Binary'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderInput(g)}
                  className={`gender-select-btn ${genderInput === g ? 'active' : ''}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', borderRadius: '16px', marginTop: '24px', fontSize: '15px' }}
          >
            Let's Start
          </button>
        </form>
      </div>
    </div>
  );
};

const MainAppContent = () => {
  const { activeTab, loading, displayName, gender } = useContext(AppContext);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5 seconds matching keyframe fades
    return () => clearTimeout(timer);
  }, []);

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

  // Render Splash overlay
  const renderSplash = showSplash;

  // Render Onboarding form if profile displays or genders are unconfigured
  const renderOnboarding = !showSplash && (!displayName || !gender);

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
      {renderSplash && <SplashOverlay />}
      {renderOnboarding && <OnboardingForm />}

      {!renderOnboarding && (
        <>
          <Header />
          <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
            {renderTabContent()}
          </main>
          <BottomNav />
          <JournalModal />
        </>
      )}
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
