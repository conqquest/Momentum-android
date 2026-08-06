import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Cloud, Sun, CloudRain, Wind, Snowflake, CheckSquare } from 'lucide-react';

const WEATHER_ICONS = {
  Sunny: Sun,
  Cloudy: Cloud,
  Rainy: CloudRain,
  Windy: Wind,
  Snowy: Snowflake
};

const JourneyView = () => {
  const { logs, habits, setShowJournalModal } = useContext(AppContext);

  // Compute logs stats
  const loggedDates = Object.keys(logs).sort().reverse(); // Show newest first
  const logsCount = loggedDates.length;

  // Calculate average emotion percentages across all entries
  let avgHappy = 0;
  let avgSad = 0;
  let avgCalm = 0;
  let avgAnxious = 0;

  // Calculate habit stats
  let totalHabitTasks = 0;
  let completedHabitsCount = 0;
  let habitCompletionRate = 0;

  if (logsCount > 0) {
    let sumHappy = 0, sumSad = 0, sumCalm = 0, sumAnxious = 0;
    
    loggedDates.forEach(date => {
      const entry = logs[date];
      
      // Emotions
      const em = entry.emotions || { happy: 25, sad: 25, calm: 25, anxious: 25 };
      sumHappy += em.happy ?? 25;
      sumSad += em.sad ?? 25;
      sumCalm += em.calm ?? 25;
      sumAnxious += em.anxious ?? 25;

      // Habits
      const checked = entry.habitsChecked || {};
      habits.forEach(h => {
        totalHabitTasks += 1;
        if (checked[h.id] === true) {
          completedHabitsCount += 1;
        }
      });
    });

    // Normalize emotions
    const totalSum = sumHappy + sumSad + sumCalm + sumAnxious;
    if (totalSum > 0) {
      avgHappy = Math.round((sumHappy / totalSum) * 100);
      avgSad = Math.round((sumSad / totalSum) * 100);
      avgCalm = Math.round((sumCalm / totalSum) * 100);
      avgAnxious = 100 - (avgHappy + avgSad + avgCalm);
    }

    if (totalHabitTasks > 0) {
      habitCompletionRate = Math.round((completedHabitsCount / totalHabitTasks) * 100);
    }
  } else {
    avgHappy = 25; avgSad = 25; avgCalm = 25; avgAnxious = 25;
  }

  // Get last 7 days of logs data for our custom SVG charts
  const getLast7DaysData = () => {
    const list = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const log = logs[dateStr] || {
        moodDetail: 'Calm',
        emotions: { happy: 25, sad: 25, calm: 25, anxious: 25 },
        habitsChecked: {}
      };
      
      // Calculate a mood index: Happy=100, Calm=75, Anxious=35, Sad=10
      const em = log.emotions || { happy: 25, sad: 25, calm: 25, anxious: 25 };
      const happyScore = (em.happy ?? 25) * 1.0;
      const calmScore = (em.calm ?? 25) * 0.75;
      const anxiousScore = (em.anxious ?? 25) * 0.35;
      const sadScore = (em.sad ?? 25) * 0.1;
      const moodIndex = Math.round(happyScore + calmScore + anxiousScore + sadScore);

      // Calculate habit completion ratio
      const checked = log.habitsChecked || {};
      let checkedCount = 0;
      habits.forEach(h => {
        if (checked[h.id] === true) checkedCount++;
      });
      const habitRatio = habits.length > 0 ? checkedCount / habits.length : 0;

      list.push({
        dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        moodIndex,
        habitRatio
      });
    }
    return list;
  };

  const chartData = getLast7DaysData();

  // Generate SVG paths for Mood Trend Chart
  const moodPoints = chartData.map((d, idx) => {
    const x = 30 + idx * 50;
    // Map mood index (0 - 100) to SVG y coordinate (10 - 90)
    const y = 90 - (d.moodIndex / 100) * 80;
    return { x, y };
  });

  const moodPath = moodPoints.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const moodAreaPath = moodPoints.length > 0 
    ? `${moodPath} L ${moodPoints[moodPoints.length - 1].x} 100 L ${moodPoints[0].x} 100 Z` 
    : '';

  // Generate SVG paths for Habit Completion Area Chart
  const habitPoints = chartData.map((d, idx) => {
    const x = 30 + idx * 50;
    // Map completion ratio (0 - 1) to SVG y coordinate (10 - 90)
    const y = 90 - d.habitRatio * 80;
    return { x, y };
  });

  const habitPath = habitPoints.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const habitAreaPath = habitPoints.length > 0
    ? `${habitPath} L ${habitPoints[habitPoints.length - 1].x} 100 L ${habitPoints[0].x} 100 Z`
    : '';

  // Donut chart calculations
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  
  const happyOffset = circumference - (avgHappy / 100) * circumference;
  const calmOffset = circumference - (avgCalm / 100) * circumference;
  const sadOffset = circumference - (avgSad / 100) * circumference;
  const anxiousOffset = circumference - (avgAnxious / 100) * circumference;

  return (
    <div className="container">
      {/* Journal Statistics Banner */}
      <div style={{ textAlign: 'center', margin: '14px 0 24px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>My Journal</span>
        <h1 style={{ fontSize: '54px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1' }}>{logsCount}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '6px' }}>
          Celebrate what made you smile today.
        </p>
      </div>

      {/* Habit Consistency Card */}
      <div className="glass-card flex-row" style={{ borderRadius: '24px', padding: '16px 20px', gap: '14px', marginBottom: '16px' }}>
        <div 
          className="flex-center" 
          style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%', 
            background: 'var(--accent-light)',
            color: 'var(--accent-hover)',
            flexShrink: 0
          }}
        >
          <CheckSquare size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: '800', fontSize: '14px', display: 'block', color: 'var(--text-primary)' }}>
            Habits Consistency: {habitCompletionRate}%
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Completed {completedHabitsCount} out of {totalHabitTasks} habits tracked.
          </span>
          <div style={{ width: '100%', height: '6px', background: '#f3eae3', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${habitCompletionRate}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '3px', transition: 'width 0.8s ease-out' }}></div>
          </div>
        </div>
      </div>

      {/* Animated SVG Mood Trend Chart */}
      <div className="glass-card" style={{ borderRadius: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '800' }}>Mood Trend (Last 7 Days)</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500', marginBottom: '12px' }}>
          Daily calculated emotional state indexes.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 350 120" style={{ width: '100%', height: 'auto', background: 'transparent' }}>
            {/* Grid Lines */}
            <line x1="30" y1="10" x2="330" y2="10" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
            <line x1="30" y1="50" x2="330" y2="50" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
            <line x1="30" y1="90" x2="330" y2="90" stroke="var(--border-color)" strokeWidth="1" />
            
            {/* Shaded Area */}
            <path 
              d={moodAreaPath} 
              fill="rgba(251, 191, 36, 0.12)" 
              style={{ transition: 'all 0.5s ease' }}
            />
            
            {/* Core Trend Line */}
            <path 
              d={moodPath} 
              fill="none" 
              stroke="var(--accent-color)" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                strokeDasharray: '400',
                strokeDashoffset: '0',
                transition: 'stroke-dashoffset 1.5s ease-in-out'
              }}
            />
            
            {/* Graph Data Dots */}
            {moodPoints.map((p, idx) => (
              <g key={idx}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="6" 
                  fill="#ffffff" 
                  stroke="var(--accent-color)" 
                  strokeWidth="2.5" 
                  style={{ transition: 'cy 0.5s ease' }}
                />
                <text 
                  x={p.x} 
                  y="112" 
                  textAnchor="middle" 
                  fontSize="9px" 
                  fontWeight="700" 
                  fill="var(--text-secondary)"
                >
                  {chartData[idx].label}
                </text>
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="8px"
                  fontWeight="800"
                  fill="var(--text-primary)"
                >
                  {chartData[idx].moodIndex}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Animated SVG Habit Completion Wave Chart */}
      <div className="glass-card" style={{ borderRadius: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '800' }}>Habit Progress Wave</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500', marginBottom: '12px' }}>
          Visual ratio of checklist completions.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 350 120" style={{ width: '100%', height: 'auto', background: 'transparent' }}>
            {/* Grid Tracks */}
            <line x1="30" y1="10" x2="330" y2="10" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
            <line x1="30" y1="50" x2="330" y2="50" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3" />
            <line x1="30" y1="90" x2="330" y2="90" stroke="var(--border-color)" strokeWidth="1" />
            
            {/* Shaded Area */}
            <path 
              d={habitAreaPath} 
              fill="rgba(167, 243, 208, 0.15)" 
              style={{ transition: 'all 0.5s ease' }}
            />
            
            {/* Line Path */}
            <path 
              d={habitPath} 
              fill="none" 
              stroke="#059669" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            
            {/* Dots & Labels */}
            {habitPoints.map((p, idx) => (
              <g key={idx}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  fill="#ffffff" 
                  stroke="#059669" 
                  strokeWidth="2.5" 
                  style={{ transition: 'cy 0.5s ease' }}
                />
                <text 
                  x={p.x} 
                  y="112" 
                  textAnchor="middle" 
                  fontSize="9px" 
                  fontWeight="700" 
                  fill="var(--text-secondary)"
                >
                  {chartData[idx].label}
                </text>
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="8px"
                  fontWeight="800"
                  fill="var(--text-primary)"
                >
                  {Math.round(chartData[idx].habitRatio * 100)}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Circular Segmented Radial Donut Chart */}
      <div className="glass-card flex-row" style={{ borderRadius: '24px', padding: '20px', gap: '20px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
          <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            {/* Gray Background circle */}
            <circle cx="40" cy="40" r="30" fill="none" stroke="var(--border-color)" strokeWidth="8" />
            
            {/* Happy Segments */}
            {avgHappy > 0 && (
              <circle 
                cx="40" 
                cy="40" 
                r="30" 
                fill="none" 
                stroke="var(--color-happy)" 
                strokeWidth="8" 
                strokeDasharray={circumference}
                strokeDashoffset={happyOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            )}
            
            {/* Calm Segments */}
            {avgCalm > 0 && (
              <circle 
                cx="40" 
                cy="40" 
                r="30" 
                fill="none" 
                stroke="var(--color-calm)" 
                strokeWidth="8" 
                strokeDasharray={circumference}
                strokeDashoffset={calmOffset}
                strokeLinecap="round"
                style={{ 
                  transformOrigin: '40px 40px',
                  transform: `rotate(${avgHappy * 3.6}deg)`,
                  transition: 'stroke-dashoffset 1s ease-out' 
                }}
              />
            )}
          </svg>
          <div className="flex-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {avgHappy + avgCalm}%
            </span>
            <span style={{ fontSize: '8px', color: 'var(--text-secondary)', fontWeight: '700' }}>POSITIVE</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '800', margin: 0 }}>Mood Composition</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-happy)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Happy: {avgHappy}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-calm)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Calm: {avgCalm}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-sad)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Sad: {avgSad}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-anxious)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Anxious: {avgAnxious}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Journal Action CTA */}
      <button 
        onClick={() => setShowJournalModal(true)} 
        className="btn btn-primary flex-center"
        style={{ width: '100%', borderRadius: '20px', fontSize: '15px', fontWeight: '800', marginBottom: '24px' }}
      >
        Create a New Journal
      </button>

      {/* Diary Logs Timeline List */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Journal Entries</h2>
      {loggedDates.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '24px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No journal logs found. Click "+" to start writing.</p>
        </div>
      ) : (
        <div className="moments-list">
          {loggedDates.map((date) => {
            const log = logs[date];
            const WeatherIcon = WEATHER_ICONS[log.weather] || Sun;
            return (
              <div key={date} className="moment-card" style={{ background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px', borderLeft: '4px solid var(--accent-color)', padding: '14px' }}>
                <div className="flex-row" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {log.moodDetail && (
                      <span 
                        style={{ 
                          fontSize: '9px', 
                          fontWeight: '800', 
                          padding: '2px 8px', 
                          borderRadius: '10px',
                          backgroundColor: log.moodDetail === 'Happy' ? 'var(--accent-light)' : '#f3eae3'
                        }}
                      >
                        {log.moodDetail}
                      </span>
                    )}
                    <WeatherIcon size={14} color="var(--text-secondary)" />
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                  {log.momentText || log.morningReflect || log.eveningReflect || "Logged parameters."}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JourneyView;
