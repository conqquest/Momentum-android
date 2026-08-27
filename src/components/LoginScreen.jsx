import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowRight, User, Heart, Calendar } from 'lucide-react';

const LoginScreen = () => {
  const { setIsGuest, setDisplayName, setGender, setUserStats } = useContext(AppContext);
  const [step, setStep] = useState(0); // 0: Welcome, 1: Name & Age, 2: Gender & Finish
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  const handleNextStep = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!name.trim()) {
        alert('Please enter your name.');
        return;
      }
      if (!age || Number(age) <= 0 || Number(age) > 120) {
        alert('Please enter a valid age (1-120).');
        return;
      }
      setStep(2);
    }
  };

  const handleFinish = () => {
    if (!selectedGender) {
      alert('Please select a gender preference.');
      return;
    }
    // Save to AppContext
    setDisplayName(name.trim());
    setGender(selectedGender);
    setUserStats(prev => ({
      ...prev,
      age: Number(age)
    }));
    // Save auth mode and enter app
    localStorage.setItem('auth_mode', 'guest');
    setIsGuest(true);
  };

  /* ─── Cute custom SVG green characters ─── */
  const WaveCreature = () => (
    <svg width="180" height="140" viewBox="0 0 180 140" fill="none" style={characterAnimStyle}>
      {/* Wavy Blob */}
      <path
        d="M 20 80 C 20 30, 70 20, 110 30 C 140 38, 160 70, 160 100 C 160 130, 120 120, 90 120 C 60 120, 20 130, 20 80 Z"
        fill="#5cb85c"
      />
      {/* Cute Face */}
      <circle cx="75" cy="70" r="5" fill="#1c1d1a" />
      <circle cx="105" cy="70" r="5" fill="#1c1d1a" />
      <path d="M 85 82 Q 90 88 95 82" stroke="#1c1d1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Tiny Blush */}
      <circle cx="67" cy="75" r="4" fill="#ff8a80" opacity="0.6" />
      <circle cx="113" cy="75" r="4" fill="#ff8a80" opacity="0.6" />
    </svg>
  );

  const PentagonCreature = () => (
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" style={characterAnimStyle}>
      {/* Pentagon Blob */}
      <path
        d="M 75 15 L 130 55 L 110 120 L 40 120 L 20 55 Z"
        fill="#7cb342"
      />
      {/* Cute Face */}
      <circle cx="60" cy="75" r="5" fill="#1c1d1a" />
      <circle cx="90" cy="75" r="5" fill="#1c1d1a" />
      <path d="M 70 88 Q 75 92 80 88" stroke="#1c1d1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Waving Hands */}
      <path d="M 15 65 Q 5 60 10 50" stroke="#7cb342" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M 135 65 Q 145 60 140 50" stroke="#7cb342" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );

  const TriangleCreature = () => (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" style={characterAnimStyle}>
      {/* Triangle Blob */}
      <path
        d="M 70 20 C 85 20, 120 90, 110 110 C 100 125, 40 125, 30 110 C 20 90, 55 20, 70 20 Z"
        fill="#8bc34a"
      />
      {/* Cute Face */}
      <circle cx="58" cy="80" r="5" fill="#1c1d1a" />
      <circle cx="82" cy="80" r="5" fill="#1c1d1a" />
      <path d="M 66 90 Q 70 94 74 90" stroke="#1c1d1a" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Twinkle Sparkles */}
      <path d="M 115 35 L 120 30 M 120 30 L 125 35 M 120 30 L 120 40" stroke="#ffeb3b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  return (
    <div style={containerStyle}>
      {/* Step 0: Moe Welcome Screen */}
      {step === 0 && (
        <div style={stepContainerStyle}>
          {/* Main big typography */}
          <div style={welcomeTypographyStyle}>
            <div>GO FOR</div>
            <div style={{ color: '#8bc34a' }}>BETTER</div>
            <div style={{ color: '#8bc34a' }}>HABITS</div>
            <div>WITH</div>
            <div>MOMENTUM</div>
          </div>

          {/* Cute Character & Speech Bubble */}
          <div style={characterContainerStyle}>
            {/* Speech Bubble */}
            <div style={speechBubbleStyle}>
              IT'S MORE FUN TOGETHER!
              <div style={speechBubbleTailStyle} />
            </div>
            <WaveCreature />
          </div>

          {/* Action Button */}
          <button onClick={handleNextStep} style={primaryBtnStyle}>
            Get Started
            <ArrowRight size={18} style={{ marginLeft: '6px' }} />
          </button>
        </div>
      )}

      {/* Step 1: Name and Age */}
      {step === 1 && (
        <div style={stepContainerStyle}>
          <div style={onboardingHeaderStyle}>
            <div style={miniSpeechBubbleStyle}>
              TELL US YOUR NAME & AGE!
              <div style={miniSpeechBubbleTailStyle} />
            </div>
            <PentagonCreature />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>What should we call you?</label>
            <div style={inputContainerStyle}>
              <User size={18} style={inputIconStyle} />
              <input
                type="text"
                placeholder="e.g. Jose Maria"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>How old are you?</label>
            <div style={inputContainerStyle}>
              <Calendar size={18} style={inputIconStyle} />
              <input
                type="number"
                placeholder="e.g. 24"
                value={age}
                onChange={e => setAge(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <button onClick={handleNextStep} style={primaryBtnStyle}>
            Next Step
            <ArrowRight size={18} style={{ marginLeft: '6px' }} />
          </button>
        </div>
      )}

      {/* Step 2: Gender and Finish */}
      {step === 2 && (
        <div style={stepContainerStyle}>
          <div style={onboardingHeaderStyle}>
            <div style={miniSpeechBubbleStyle}>
              YOUR GENDER PREFERENCE?
              <div style={miniSpeechBubbleTailStyle} />
            </div>
            <TriangleCreature />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Select Gender Profile</label>
            <div style={genderOptionsContainerStyle}>
              {['Female', 'Male', 'Non-Binary'].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  style={{
                    ...genderBtnStyle,
                    ...(selectedGender === g ? activeGenderBtnStyle : {}),
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
            <p style={helpTextStyle}>
              Selecting "Female" unlocks the Cycle Tracker widget in the body and nutrition section.
            </p>
          </div>

          <button onClick={handleFinish} style={primaryBtnStyle}>
            Finish & Launch
            <Heart size={18} style={{ marginLeft: '6px' }} fill="#fff" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Styles ─── */
const containerStyle = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: '#191b18', // Matte Dark Moe background
  fontFamily: 'var(--font-family)',
};

const stepContainerStyle = {
  width: '100%',
  maxWidth: '380px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '32px',
  animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
};

const welcomeTypographyStyle = {
  fontSize: '36px',
  fontWeight: '900',
  lineHeight: '1.05',
  color: '#ffffff',
  textAlign: 'left',
  width: '100%',
  letterSpacing: '-1.5px',
  marginTop: '20px',
};

const characterContainerStyle = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  margin: '20px 0',
};

const speechBubbleStyle = {
  background: '#f1ebd9', // Cozy Cream
  color: '#1c1d1a',
  padding: '10px 16px',
  borderRadius: '16px',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '0.5px',
  position: 'absolute',
  top: '-25px',
  right: '15px',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
  zIndex: 10,
};

const speechBubbleTailStyle = {
  position: 'absolute',
  bottom: '-6px',
  left: '30px',
  width: '12px',
  height: '12px',
  background: '#f1ebd9',
  transform: 'rotate(45deg)',
};

const characterAnimStyle = {
  animation: 'orbFloat 4s ease-in-out infinite',
};

const primaryBtnStyle = {
  width: '100%',
  background: 'linear-gradient(135deg, #8bc34a 0%, #689f38 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '18px',
  padding: '16px 24px',
  fontSize: '16px',
  fontWeight: '900',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 20px rgba(139, 195, 74, 0.35)',
  transition: 'transform 0.15s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const onboardingHeaderStyle = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '10px',
};

const miniSpeechBubbleStyle = {
  background: '#f1ebd9',
  color: '#1c1d1a',
  padding: '8px 14px',
  borderRadius: '12px',
  fontSize: '10px',
  fontWeight: '850',
  position: 'absolute',
  top: '-15px',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
  whiteSpace: 'nowrap',
};

const miniSpeechBubbleTailStyle = {
  position: 'absolute',
  bottom: '-4px',
  left: 'calc(50% - 6px)',
  width: '8px',
  height: '8px',
  background: '#f1ebd9',
  transform: 'rotate(45deg)',
};

const formGroupStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  textAlign: 'left',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '800',
  color: '#8bc34a',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputContainerStyle = {
  position: 'relative',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
};

const inputIconStyle = {
  position: 'absolute',
  left: '16px',
  color: '#a3a3a3',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1.5px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '16px',
  padding: '14px 16px 14px 44px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const genderOptionsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
};

const genderBtnStyle = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1.5px solid rgba(255, 255, 255, 0.12)',
  color: '#cccccc',
  borderRadius: '14px',
  padding: '12px 6px',
  fontSize: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const activeGenderBtnStyle = {
  background: 'rgba(139, 195, 74, 0.25)',
  borderColor: '#8bc34a',
  color: '#ffffff',
  boxShadow: '0 4px 12px rgba(139, 195, 74, 0.2)',
};

const helpTextStyle = {
  fontSize: '11px',
  color: '#a3a3a3',
  lineHeight: '1.4',
  margin: '4px 0 0',
  fontStyle: 'italic',
};

export default LoginScreen;
