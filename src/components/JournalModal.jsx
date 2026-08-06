import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Sun, Cloud, CloudRain, Wind, Snowflake, Check } from 'lucide-react';

const EMOJI_OPTIONS = [
  { id: 'Happy', emoji: '😊', label: 'Happy', split: { happy: 70, sad: 5, calm: 20, anxious: 5 } },
  { id: 'Sad', emoji: '😢', label: 'Sad', split: { happy: 5, sad: 70, calm: 5, anxious: 20 } },
  { id: 'Calm', emoji: '😌', label: 'Calm', split: { happy: 20, sad: 5, calm: 70, anxious: 5 } },
  { id: 'Anxious', emoji: '😰', label: 'Anxious', split: { happy: 5, sad: 20, calm: 5, anxious: 70 } }
];

const WEATHER_OPTIONS = [
  { id: 'Sunny', icon: Sun },
  { id: 'Cloudy', icon: Cloud },
  { id: 'Rainy', icon: CloudRain },
  { id: 'Windy', icon: Wind },
  { id: 'Snowy', icon: Snowflake }
];

const JournalModal = () => {
  const { 
    selectedDate, 
    showJournalModal, 
    setShowJournalModal, 
    logs, 
    habits, 
    toggleHabit, 
    saveDailyEntry 
  } = useContext(AppContext);

  const [moodDetail, setMoodDetail] = useState('Calm');
  const [weather, setWeather] = useState('Sunny');
  const [morningReflect, setMorningReflect] = useState('');
  const [eveningReflect, setEveningReflect] = useState('');
  const [momentText, setMomentText] = useState('');
  const [emotions, setEmotions] = useState({ happy: 25, sad: 25, calm: 25, anxious: 25 });

  // Pre-fill existing logs
  useEffect(() => {
    if (showJournalModal) {
      const entry = logs[selectedDate];
      if (entry) {
        setMoodDetail(entry.moodDetail || 'Calm');
        setWeather(entry.weather || 'Sunny');
        setMorningReflect(entry.morningReflect || '');
        setEveningReflect(entry.eveningReflect || '');
        setMomentText(entry.momentText || '');
        setEmotions(entry.emotions || { happy: 25, sad: 25, calm: 25, anxious: 25 });
      } else {
        setMoodDetail('Calm');
        setWeather('Sunny');
        setMorningReflect('');
        setEveningReflect('');
        setMomentText('');
        setEmotions({ happy: 25, sad: 25, calm: 25, anxious: 25 });
      }
    }
  }, [selectedDate, showJournalModal, logs]);

  if (!showJournalModal) return null;

  const handleMoodSelect = (opt) => {
    setMoodDetail(opt.id);
    setEmotions(opt.split);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveDailyEntry(selectedDate, {
      moodDetail,
      weather,
      morningReflect,
      eveningReflect,
      momentText: momentText.trim() || `${morningReflect} ${eveningReflect}`.trim(),
      emotions
    });
    setShowJournalModal(false);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const habitsChecked = logs[selectedDate]?.habitsChecked || {};

  return (
    <div className="modal-overlay" onClick={() => setShowJournalModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-row" style={{ marginBottom: '16px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Log Entry</span>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              {formattedDate}
            </h2>
          </div>
          <button 
            onClick={() => setShowJournalModal(false)}
            className="btn btn-secondary flex-center"
            style={{ width: '30px', height: '30px', minHeight: '30px', padding: 0, borderRadius: '50%', background: 'var(--border-color)', border: 'none' }}
          >
            <X size={14} color="var(--text-primary)" />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* Mood Selection */}
          <div className="form-group">
            <label>Primary Emotion</label>
            <div className="emotion-picker">
              {EMOJI_OPTIONS.map((opt) => {
                const isActive = moodDetail === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleMoodSelect(opt)}
                    className={`emoji-btn ${isActive ? 'active' : ''}`}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                    <span style={{ fontSize: '10px' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Selector */}
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Today's Weather</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {WEATHER_OPTIONS.map((opt) => {
                const WeatherIcon = opt.icon;
                const isActive = weather === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWeather(opt.id)}
                    className="flex-center"
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '10px',
                      border: isActive ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      background: isActive ? 'var(--accent-light)' : 'var(--bg-card)',
                      cursor: 'pointer'
                    }}
                  >
                    <WeatherIcon size={16} color="var(--text-primary)" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habits Check List (Square Checkboxes) */}
          {habits.length > 0 && (
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Habits Completed</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {habits.map((hbt) => {
                  const isCompleted = habitsChecked[hbt.id] === true;
                  return (
                    <div 
                      key={hbt.id} 
                      className="flex-row"
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-main)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '12px'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{hbt.name}</span>
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
            </div>
          )}

          {/* Morning Reflection */}
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Morning Reflection</label>
            <input
              type="text"
              placeholder="Grateful for..."
              value={morningReflect}
              onChange={(e) => setMorningReflect(e.target.value)}
            />
          </div>

          {/* Evening Reflection */}
          <div className="form-group">
            <label>Evening Reflection</label>
            <input
              type="text"
              placeholder="Wind down..."
              value={eveningReflect}
              onChange={(e) => setEveningReflect(e.target.value)}
            />
          </div>

          {/* Memorable Moments */}
          <div className="form-group">
            <label>Journal Notes</label>
            <textarea
              placeholder="What made you smile..."
              value={momentText}
              onChange={(e) => setMomentText(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowJournalModal(false)}
              style={{ flex: 1, borderRadius: '14px', minHeight: '44px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ flex: 1, borderRadius: '14px', minHeight: '44px' }}
            >
              Save Entry
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default JournalModal;
