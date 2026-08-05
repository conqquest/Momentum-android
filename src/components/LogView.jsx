import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Sun, Cloud, CloudRain, Wind, Snowflake,
  Moon, CheckCircle2, ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';

const WEATHER_OPTIONS = [
  { id: 'Sunny', label: 'Sunny', icon: Sun, color: '#f59e0b' },
  { id: 'Cloudy', label: 'Cloudy', icon: Cloud, color: '#9ca3af' },
  { id: 'Rainy', label: 'Rainy', icon: CloudRain, color: '#60a5fa' },
  { id: 'Windy', label: 'Windy', icon: Wind, color: '#2dd4bf' },
  { id: 'Snowy', label: 'Snowy', icon: Snowflake, color: '#c084fc' }
];

const MOOD_OPTIONS = [
  { id: 'Blissful', label: 'Blissful', cssClass: 'mood-blissful' },
  { id: 'Happy', label: 'Happy', cssClass: 'mood-happy' },
  { id: 'Energetic', label: 'Energetic', cssClass: 'mood-energetic' },
  { id: 'Average', label: 'Average', cssClass: 'mood-average' },
  { id: 'Sad', label: 'Sad', cssClass: 'mood-sad' },
  { id: 'Anxious', label: 'Anxious', cssClass: 'mood-anxious' },
  { id: 'Very Tired', label: 'Very Tired', cssClass: 'mood-tired' },
  { id: 'Sick', label: 'Sick', cssClass: 'mood-sick' }
];

const LogView = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    checkpoints, 
    logs, 
    updateLog, 
    updateWeather, 
    updateMoodDetail, 
    updateMomentText 
  } = useContext(AppContext);

  const dateSelectorRef = useRef(null);

  // Parse current selected date
  const [year, month, day] = selectedDate.split('-').map(Number);
  const currentDate = new Date(year, month - 1, day);

  // Generate days of the current month
  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const totalDays = getDaysInMonth(year, month);
  
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const dNum = i + 1;
    const dateObj = new Date(year, month - 1, dNum);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    return { dNum, dayName, dateStr };
  });

  // Auto-scroll selected date card into view in the horizontal scroller
  useEffect(() => {
    if (dateSelectorRef.current) {
      const activeCard = dateSelectorRef.current.querySelector('.date-card.active');
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  const changeMonth = (offset) => {
    const nextDate = new Date(year, month - 1 + offset, 1);
    const yStr = nextDate.getFullYear();
    const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-01`);
  };

  const currentMonthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get active log values for selected date
  const currentDayLog = logs[selectedDate] || { moodDetail: 'Average', weather: 'Sunny', momentText: '', values: {} };
  const currentValues = currentDayLog.values || {};

  // Filter checkpoints by section
  const vitals = checkpoints.filter(c => c.section === 'vitals');
  const habits = checkpoints.filter(c => c.section === 'habits');
  const meds = checkpoints.filter(c => c.section === 'meds');

  return (
    <div className="container">
      {/* Month Navigator Header */}
      <div className="flex-row" style={{ marginBottom: '12px' }}>
        <button onClick={() => changeMonth(-1)} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '38px' }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0.2px' }}>
          {currentMonthLabel}
        </span>
        <button onClick={() => changeMonth(1)} className="btn btn-secondary" style={{ padding: '6px 12px', minHeight: '38px' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Horizontal Date Card Row */}
      <div className="date-selector" ref={dateSelectorRef}>
        {daysArray.map((dayItem) => (
          <div
            key={dayItem.dateStr}
            className={`date-card ${selectedDate === dayItem.dateStr ? 'active' : ''}`}
            onClick={() => setSelectedDate(dayItem.dateStr)}
          >
            <span className="day-lbl">{dayItem.dayName}</span>
            <span className="date-num">{dayItem.dNum}</span>
          </div>
        ))}
      </div>

      {/* Weather & Mood logs */}
      <div className="glass-card">
        <h2>Weather & Mood</h2>
        
        {/* Weather selection */}
        <h3 style={{ marginTop: '8px' }}>Today's Weather</h3>
        <div className="grid-select">
          {WEATHER_OPTIONS.map((opt) => {
            const IconComponent = opt.icon;
            const isSelected = currentDayLog.weather === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => updateWeather(selectedDate, opt.id)}
                className={`grid-btn ${isSelected ? 'active' : ''}`}
              >
                <IconComponent size={20} color={isSelected ? 'var(--accent-color)' : opt.color} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mood Selection */}
        <h3 style={{ marginTop: '16px' }}>Energy & Mood State</h3>
        <div className="grid-select">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = currentDayLog.moodDetail === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => updateMoodDetail(selectedDate, opt.id)}
                className={`grid-btn ${isSelected ? 'active' : ''}`}
                style={{ padding: '8px 2px' }}
              >
                <div className={`mood-badge ${opt.cssClass}`} style={{ transform: isSelected ? 'scale(1.2)' : 'none' }}></div>
                <span style={{ fontSize: '10px' }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Vitals Tracker */}
      <div className="glass-card">
        <h2>Vitals & Levels</h2>
        {vitals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No trackers defined. Go to Trackers tab.</p>
        ) : (
          vitals.map((vit) => {
            const currentVal = currentValues[vit.id] ?? vit.default ?? 5;
            
            return (
              <div key={vit.id} style={{ marginBottom: '16px' }}>
                <div className="flex-row">
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{vit.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-color)' }}>
                    {currentVal} {vit.unit || ''}
                  </span>
                </div>
                
                {vit.type === 'scale' ? (
                  <input
                    type="range"
                    min={vit.min || 1}
                    max={vit.max || 10}
                    value={currentVal}
                    onChange={(e) => updateLog(selectedDate, vit.id, Number(e.target.value))}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="number"
                      value={currentValues[vit.id] ?? ''}
                      placeholder={`Enter ${vit.unit || 'value'}`}
                      onChange={(e) => updateLog(selectedDate, vit.id, e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ padding: '8px 12px', fontSize: '13px', flex: 1 }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Habits & Supplements Tracker */}
      <div className="glass-card">
        <h2>Daily Checkpoints</h2>
        <div className="habit-list">
          {habits.map((hbt) => {
            const isChecked = currentValues[hbt.id] === true;
            return (
              <div key={hbt.id} className="habit-row">
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{hbt.name}</span>
                <div 
                  className={`habit-checkbox ${isChecked ? 'checked' : ''}`}
                  onClick={() => updateLog(selectedDate, hbt.id, !isChecked)}
                >
                  {isChecked && <CheckCircle2 size={16} color="#fff" />}
                </div>
              </div>
            );
          })}
        </div>

        {meds.length > 0 && (
          <>
            <h2 style={{ marginTop: '20px' }}>Meds & Supplements</h2>
            <div className="habit-list">
              {meds.map((med) => {
                const isChecked = currentValues[med.id] === true;
                return (
                  <div key={med.id} className="habit-row">
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{med.name}</span>
                    <div 
                      className={`habit-checkbox ${isChecked ? 'checked' : ''}`}
                      onClick={() => updateLog(selectedDate, med.id, !isChecked)}
                    >
                      {isChecked && <CheckCircle2 size={16} color="#fff" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Memorable Moments / Notes */}
      <div className="glass-card">
        <h2>Memorable Moments</h2>
        <textarea
          placeholder="Brief summary of today... 'Coffee with mates', 'Finished 10km run', etc."
          value={currentDayLog.momentText || ''}
          onChange={(e) => updateMomentText(selectedDate, e.target.value)}
        />
      </div>
    </div>
  );
};

export default LogView;
