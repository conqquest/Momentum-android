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

/* ═══════════════════════════════════════════════════
   CINEMATIC SPLASH — Canvas particles + CSS animation
═══════════════════════════════════════════════════ */
const useSplashCanvas = (canvasRef) => {
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle system
    const PARTICLE_COUNT = 80;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      color: ['#fbbf24', '#f59e0b', '#fde68a', '#ffffff', '#c084fc', '#818cf8'][
        Math.floor(Math.random() * 6)
      ],
    }));

    let frame = 0;
    let animId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkle = Math.sin(frame * p.twinkleSpeed + p.twinklePhase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * twinkle;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
};

const LETTERS = 'MOMENTUM'.split('');

const SplashOverlay = ({ exit }) => {
  const canvasRef = React.useRef(null);
  useSplashCanvas(canvasRef);

  return (
    <div className={`splash-container ${exit ? 'exit' : ''}`}>
      {/* Star canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Background radial glow */}
      <div className="splash-bg-glow" />

      {/* Outer slow-rotating ring */}
      <div className="splash-ring splash-ring-outer" />
      {/* Middle ring */}
      <div className="splash-ring splash-ring-mid" />

      {/* Orb */}
      <div className="splash-orb-wrap">
        <div className="splash-orb-pulse" />
        <div className="splash-orb">
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <defs>
              <radialGradient id="orbGrad" cx="38%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#fff7c0" />
                <stop offset="35%" stopColor="#fbbf24" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </radialGradient>
              <filter id="orbGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx="45" cy="45" r="42" fill="url(#orbGrad)" filter="url(#orbGlow)" />
            {/* Specular highlight */}
            <ellipse cx="34" cy="30" rx="12" ry="8" fill="rgba(255,255,255,0.35)" />
          </svg>
        </div>
      </div>

      {/* Text block */}
      <div className="splash-text-block">
        {/* Letter-by-letter MOMENTUM */}
        <div className="splash-word" aria-label="Momentum">
          {LETTERS.map((l, i) => (
            <span
              key={i}
              className="splash-letter"
              style={{ animationDelay: `${0.55 + i * 0.07}s` }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Golden divider */}
        <div className="splash-divider" />

        {/* Tagline */}
        <p className="splash-tagline">Build habits. Build yourself.</p>
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
