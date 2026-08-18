import React, { useContext, useState, useEffect } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import ExploreView from './components/ExploreView';
import JourneyView from './components/JourneyView';
import SettingsView from './components/SettingsView';
import JournalModal from './components/JournalModal';
import LoginScreen from './components/LoginScreen';
import { RefreshCw, Heart } from 'lucide-react';
import { initNotifications } from './services/NotificationService';

const SplashOverlay = ({ exit }) => {
  return (
    <div className={`splash-container ${exit ? 'exit' : ''}`}>
      <div className="splash-ripple"></div>
      <div className="splash-logo-wrapper">
        <img 
          src="/favicon.png" 
          alt="Logo" 
          className="splash-logo"
          onError={(e) => {
            // Fallback if PWA icon is not yet loaded in some views
            e.target.style.display = 'none';
          }}
        />
        <h1 className="splash-title">Momentum</h1>
        <span className="splash-sub">Find your daily flow</span>
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
  const { activeTab, loading, displayName, gender, themeColor, user, isGuest, habits, logs } = useContext(AppContext);
  const [showSplash, setShowSplash] = useState(true);
  const [exitSplash, setExitSplash] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExitSplash(true);
    }, 2000); // 2.0s: slide up animation trigger

    const unmountTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2700); // 2.7s: fully unmount from DOM

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeColor || 'default');
  }, [themeColor]);

  // Init notifications once the splash is gone (after 2.7s)
  useEffect(() => {
    if (showSplash) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLog = logs?.[todayStr];
    const checked = todayLog?.habitsChecked || {};
    const completedToday = (habits || []).filter(h => checked[h.id] === true).length;
    const totalHabits = (habits || []).length;
    initNotifications(completedToday, totalHabits).catch(console.error);
  }, [showSplash, habits]); // re-run if habits list changes

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

  // Render LoginScreen if not authenticated and not in guest mode
  const renderLogin = !showSplash && !user && !isGuest;

  // Render Onboarding form if profile displays or genders are unconfigured (only if guest or logged in)
  const renderOnboarding = !showSplash && !renderLogin && (!displayName || !gender);

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
      {showSplash && <SplashOverlay exit={exitSplash} />}
      {renderLogin && <LoginScreen />}
      {renderOnboarding && <OnboardingForm />}

      {!showSplash && !renderLogin && !renderOnboarding && (
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
