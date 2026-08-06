import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Check } from 'lucide-react';

const HomeView = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    logs, 
    habits, 
    toggleHabit, 
    setShowJournalModal 
  } = useContext(AppContext);

  // Generate 7 days centered around selected date
  const getWeeklyDates = () => {
    const dates = [];
    const baseDate = new Date(selectedDate);
    
    // Get starting day (Mon is 1, Sun is 0)
    const dayOfWeek = baseDate.getDay();
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMon);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dateNum}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({ dateStr, dayNum: d.getDate(), dayName });
    }
    return dates;
  };

  const weeklyDates = getWeeklyDates();

  // Retrieve current logs for the day
  const currentDayLog = logs[selectedDate] || {
    morningReflect: '',
    eveningReflect: '',
    momentText: '',
    weather: 'Sunny',
    moodDetail: 'Calm',
    emotions: { happy: 25, sad: 25, calm: 25, anxious: 25 },
    habitsChecked: {}
  };

  const habitsChecked = currentDayLog.habitsChecked || {};

  const handleQuickPrompt = (promptText) => {
    setShowJournalModal(true);
  };

  return (
    <div className="container">
      {/* Weekly Date Navigation Strip */}
      <div className="date-selector" style={{ justifyContent: 'space-between' }}>
        {weeklyDates.map((item) => (
          <div
            key={item.dateStr}
            className={`date-card ${selectedDate === item.dateStr ? 'active' : ''}`}
            onClick={() => setSelectedDate(item.dateStr)}
            style={{ flex: 1, minWidth: '46px' }}
          >
            <span className="day-lbl">{item.dayName}</span>
            <span className="date-num">{item.dayNum}</span>
          </div>
        ))}
      </div>

      {/* Greeting Cards */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>My Journal</h2>
      
      {/* Illustrated Morning Card */}
      <div 
        className="illust-card card-morning" 
        onClick={() => setShowJournalModal(true)}
        style={{ cursor: 'pointer', minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.8, color: 'var(--text-secondary)' }}>Morning check-in</span>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px', textTransform: 'none', letterSpacing: 'normal' }}>
            Let's start your day
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>
            {currentDayLog.morningReflect || "Begin with a mindful morning reflections."}
          </p>
        </div>

        {/* sun illustration */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '130px', height: '110px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '90px', height: '90px', borderRadius: '50%', background: '#84cc16', opacity: 0.7 }}></div>
          <div style={{ position: 'absolute', bottom: '-20px', right: '30px', width: '100px', height: '100px', borderRadius: '50%', background: '#4d7c0f' }}></div>
          
          <div style={{ position: 'absolute', bottom: '40px', right: '35px', width: '54px', height: '54px', borderRadius: '50%', background: '#f97316', border: '3px solid #3d2e2c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3d2e2c', position: 'absolute', left: '14px', top: '18px' }}></div>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3d2e2c', position: 'absolute', right: '14px', top: '18px' }}></div>
            <div style={{ width: '10px', height: '5px', borderBottom: '2.5px solid #3d2e2c', borderRadius: '0 0 10px 10px', position: 'absolute', top: '24px' }}></div>
          </div>
        </div>
      </div>

      {/* Habits Checklist (Square Checkbox Core Feature) */}
      <div className="flex-row" style={{ marginTop: '8px', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Habit Tracker</h2>
        <span 
          style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}
          onClick={() => setShowJournalModal(true)}
        >
          Detailed Log
        </span>
      </div>

      {habits.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No habits configured. Go to Profile Settings to add habits.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {habits.map((hbt) => {
            const isCompleted = habitsChecked[hbt.id] === true;
            return (
              <div key={hbt.id} className="habit-item">
                <div>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>{hbt.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{hbt.category}</span>
                </div>
                {/* Square Checkbox */}
                <div 
                  className={`square-checkbox ${isCompleted ? 'checked' : ''}`}
                  onClick={() => toggleHabit(selectedDate, hbt.id)}
                  role="checkbox"
                  aria-checked={isCompleted}
                >
                  {isCompleted && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Journal Scroll Row */}
      <div className="flex-row" style={{ marginTop: '8px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Quick Journal</h2>
        <span 
          style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}
          onClick={() => setShowJournalModal(true)}
        >
          See all
        </span>
      </div>

      <div className="horizontal-scroll" style={{ marginBottom: '8px' }}>
        {/* Grateful Prompts */}
        <div className="prompt-card card-pink" onClick={() => handleQuickPrompt("I am grateful for...")}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Pause & reflect 🌱</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '600', lineHeight: '1.3' }}>
              What are you grateful for today? Write down three small things.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', background: 'var(--bg-main)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '10px' }}>Today</span>
            <span style={{ fontSize: '9px', fontWeight: '700', background: 'var(--bg-main)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '10px' }}>Personal</span>
          </div>
        </div>

        {/* Intention Prompts */}
        <div className="prompt-card card-purple" onClick={() => handleQuickPrompt("My intentions are...")}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Set Intentions ☀️</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '600', lineHeight: '1.3' }}>
              How do you want to feel today? Set your mindset goal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', background: 'var(--bg-main)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '10px' }}>Today</span>
            <span style={{ fontSize: '9px', fontWeight: '700', background: 'var(--bg-main)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '10px' }}>Family</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
