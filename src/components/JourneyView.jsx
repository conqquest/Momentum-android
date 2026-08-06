import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Cloud, Sun, CloudRain, Wind, Snowflake } from 'lucide-react';

const WEATHER_ICONS = {
  Sunny: Sun,
  Cloudy: Cloud,
  Rainy: CloudRain,
  Windy: Wind,
  Snowy: Snowflake
};

const THEMES = {
  emerald: { name: 'Emerald Glow', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', gradStart: '#34d399', gradEnd: '#059669' },
  cyan: { name: 'Neon Cyber', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', gradStart: '#22d3ee', gradEnd: '#0891b2' },
  rose: { name: 'Sunset Rose', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', gradStart: '#fb7185', gradEnd: '#e11d48' },
  violet: { name: 'Purple Dream', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', gradStart: '#a78bfa', gradEnd: '#7c3aed' }
};

const JourneyView = () => {
  const { logs, habits, setShowJournalModal } = useContext(AppContext);
  const [neonTheme, setNeonTheme] = useState('emerald');

  // Compute logs stats
  const loggedDates = Object.keys(logs).sort().reverse(); // Show newest first
  const logsCount = loggedDates.length;

  const activeTheme = THEMES[neonTheme] || THEMES.emerald;

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
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        moodIndex,
        habitRatio
      });
    }
    return list;
  };

  const chartData = getLast7DaysData();

  // Custom SVG Donut properties
  const radius = 55;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Calculate offsets for emotion segment lines
  const happyOffset = circumference - (avgHappy / 100) * circumference;
  const sadOffset = circumference - (avgSad / 100) * circumference;
  const calmOffset = circumference - (avgCalm / 100) * circumference;
  const anxiousOffset = circumference - (avgAnxious / 100) * circumference;

  return (
    <div className="container">
      {/* Analytics Hero Card */}
      <div className="glass-card" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Current Flow</span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0 2px' }}>
            {habitCompletionRate}% Completed
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, fontWeight: '600' }}>
            {completedHabitsCount} total check-ins tracked.
          </p>
        </div>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
        </div>
      </div>

      {/* Grid containing Mood and Habit trend graphs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        
        {/* Mood Index trend SVG line graph */}
        <div className="glass-card" style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
            Mood Index
          </h3>
          <div style={{ height: '110px', width: '100%' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
              
              {/* Sparkline Path */}
              {chartData.length > 1 && (
                <path
                  d={chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 92 + 4;
                    const y = 90 - (d.moodIndex / 100) * 80;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="path-animate"
                />
              )}

              {/* Sparkline Dots */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * 92 + 4;
                const y = 90 - (d.moodIndex / 100) * 80;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2"
                    fill="var(--bg-card)"
                    stroke="var(--accent-color)"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {chartData.map((d, i) => (
              <span key={i} style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-muted)' }}>{d.dayLabel}</span>
            ))}
          </div>
        </div>

        {/* Habit Completion Ratio SVG Area graph */}
        <div className="glass-card" style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
            Habit Wave
          </h3>
          <div style={{ height: '110px', width: '100%' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="2,2" />
              
              {/* Filled Area Wave */}
              {chartData.length > 1 && (
                <path
                  d={`${chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 92 + 4;
                    const y = 90 - d.habitRatio * 80;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')} L 96 90 L 4 90 Z`}
                  fill="var(--accent-light)"
                  opacity="0.5"
                />
              )}

              {/* Area stroke border line */}
              {chartData.length > 1 && (
                <path
                  d={chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 92 + 4;
                    const y = 90 - d.habitRatio * 80;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="path-animate"
                />
              )}
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {chartData.map((d, i) => (
              <span key={i} style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-muted)' }}>{d.dayLabel}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Emotion Breakdown Radial Segment Donut */}
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Emotion Splits
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Radial Donut */}
          <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle track */}
              <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--border-color)" strokeWidth={strokeWidth} />
              
              {/* Happy Segment */}
              {avgHappy > 0 && (
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke="var(--color-happy)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={happyOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
              )}

              {/* Calm Segment */}
              {avgCalm > 0 && (
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke="var(--color-calm)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={calmOffset}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: 'center',
                    transform: `rotate(${(avgHappy / 100) * 360}deg)`,
                    transition: 'stroke-dashoffset 0.8s ease-in-out'
                  }}
                />
              )}

              {/* Sad Segment */}
              {avgSad > 0 && (
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke="var(--color-sad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={sadOffset}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: 'center',
                    transform: `rotate(${((avgHappy + avgCalm) / 100) * 360}deg)`,
                    transition: 'stroke-dashoffset 0.8s ease-in-out'
                  }}
                />
              )}

              {/* Anxious Segment */}
              {avgAnxious > 0 && (
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke="var(--color-anxious)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={anxiousOffset}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: 'center',
                    transform: `rotate(${((avgHappy + avgCalm + avgSad) / 100) * 360}deg)`,
                    transition: 'stroke-dashoffset 0.8s ease-in-out'
                  }}
                />
              )}
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{logsCount}</span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Entries</span>
            </div>
          </div>

          {/* Color Indicators Legend */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-happy)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Happy: {avgHappy}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-calm)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Calm: {avgCalm}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-sad)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Sad: {avgSad}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-anxious)' }}></div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Anxious: {avgAnxious}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Studio & Preview (Inspired by Hyper Charts) */}
      <div className="widget-studio-container">
        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>Widget Studio</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#71717a', fontWeight: '600' }}>
          Customize and preview neon-glowing widgets for your home screen.
        </p>

        {/* Theme selectors */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '700', marginRight: '6px' }}>THEME:</span>
          {Object.keys(THEMES).map(tKey => {
            const th = THEMES[tKey];
            return (
              <button
                key={tKey}
                onClick={() => setNeonTheme(tKey)}
                className={`theme-btn ${neonTheme === tKey ? 'active' : ''}`}
                style={{ 
                  backgroundColor: th.color, 
                  color: th.color
                }}
                title={th.name}
              />
            );
          })}
        </div>

        {/* Hyper Widgets Carousel/Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Card 1: Habit Bar Chart */}
          <div className="hyper-widget-card">
            {/* Top Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="hyper-widget-title" style={{ color: '#a1a1aa' }}>Habit Progress</span>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTheme.color, boxShadow: `0 0 8px ${activeTheme.color}` }}></div>
            </div>
            <h4 className="hyper-widget-val">{habitCompletionRate}%</h4>
            <span className="hyper-widget-sub" style={{ color: activeTheme.color, fontWeight: '700' }}>
              ✦ {completedHabitsCount} check-ins total
            </span>

            {/* Glowing SVG Bar Chart */}
            <div style={{ marginTop: '16px', height: '90px' }}>
              <svg width="100%" height="100%" viewBox="0 0 200 90">
                <defs>
                  <linearGradient id={`neonGrad-${neonTheme}`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={activeTheme.gradEnd} />
                    <stop offset="100%" stopColor={activeTheme.gradStart} />
                  </linearGradient>
                  <filter id={`neonGlow-${neonTheme}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* 7 Days Bars */}
                {[45, 60, 30, 80, 50, 75, 90].map((val, idx) => {
                  const x = 12 + idx * 26;
                  const barHeight = (val / 100) * 60;
                  const y = 70 - barHeight;
                  return (
                    <g key={idx}>
                      <rect className="widget-bar-bg" x={x} y="10" width="14" height="60" />
                      <rect 
                        className="widget-bar" 
                        x={x} 
                        y={y} 
                        width="14" 
                        height={barHeight} 
                        fill={`url(#neonGrad-${neonTheme})`}
                        filter={`url(#neonGlow-${neonTheme})`}
                      />
                      <text x={x + 7} y="82" fill="#71717a" fontSize="7" textAnchor="middle" fontWeight="bold">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Card 2: Emotion Area Flow Widget */}
          <div className="hyper-widget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="hyper-widget-title" style={{ color: '#a1a1aa' }}>Mindfulness Wave</span>
              <span style={{ fontSize: '9px', color: activeTheme.color, fontWeight: '800', textShadow: `0 0 6px ${activeTheme.color}` }}>LIVE PREVIEW</span>
            </div>
            <h4 className="hyper-widget-val">{logsCount} Logs</h4>
            <span className="hyper-widget-sub" style={{ color: '#71717a' }}>Calm State Rating Trend</span>

            {/* Glowing SVG Line Area Chart */}
            <div style={{ marginTop: '16px', height: '90px' }}>
              <svg width="100%" height="100%" viewBox="0 0 200 90">
                <defs>
                  <linearGradient id={`areaGrad-${neonTheme}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeTheme.color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={activeTheme.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Wave Area */}
                <path
                  d="M 10 70 Q 40 25 70 50 T 130 30 T 190 15 L 190 70 L 10 70 Z"
                  fill={`url(#areaGrad-${neonTheme})`}
                />
                {/* Wave Line */}
                <path
                  d="M 10 70 Q 40 25 70 50 T 130 30 T 190 15"
                  fill="none"
                  stroke={activeTheme.color}
                  strokeWidth="2.5"
                  filter={`url(#neonGlow-${neonTheme})`}
                />
                {/* Dots */}
                {[
                  { x: 10, y: 70 },
                  { x: 70, y: 50 },
                  { x: 130, y: 30 },
                  { x: 190, y: 15 }
                ].map((pt, i) => (
                  <circle 
                    key={i} 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4" 
                    fill="#ffffff" 
                    stroke={activeTheme.color} 
                    strokeWidth="2" 
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Integration Instructions */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #1c1c24', paddingTop: '16px' }}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
            📲 HOW TO ADD THE HOME SCREEN WIDGET:
          </span>
          <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#71717a', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Compile the APK via GitHub Actions and install it on your Android phone.</li>
            <li>Long-press an empty space on your phone's home screen, then tap **Widgets**.</li>
            <li>Scroll down, tap **Momentum**, and drag the widget onto your home screen.</li>
            <li>Any habit changes inside the app will instantly update your home screen progress bar!</li>
          </ol>
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
      <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>Journal Entries</h2>
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
              <div key={date} className="moment-card" style={{ borderLeft: '4px solid var(--accent-color)', padding: '14px' }}>
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
                          backgroundColor: log.moodDetail === 'Happy' ? 'var(--accent-light)' : 'var(--border-color)',
                          color: 'var(--text-primary)'
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
