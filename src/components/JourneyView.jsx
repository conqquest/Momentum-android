import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Cloud, Sun, CloudRain, Wind, Snowflake, TrendingUp, BarChart3, Activity, Zap } from 'lucide-react';

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

const TIME_RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: '365d', label: '1Y', days: 365 }
];

/* ─── Helper: Generate chart data for N days ─── */
const getChartData = (logs, habits, days) => {
  const list = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const log = logs[dateStr] || null;

    let moodIndex = 0;
    let habitRatio = 0;
    let hasData = false;

    if (log) {
      hasData = true;
      const em = log.emotions || { happy: 25, sad: 25, calm: 25, anxious: 25 };
      moodIndex = Math.round(
        (em.happy ?? 25) * 1.0 + (em.calm ?? 25) * 0.75 + (em.anxious ?? 25) * 0.35 + (em.sad ?? 25) * 0.1
      );

      const checked = log.habitsChecked || {};
      let checkedCount = 0;
      habits.forEach(h => { if (checked[h.id] === true) checkedCount++; });
      habitRatio = habits.length > 0 ? checkedCount / habits.length : 0;
    }

    // Day label formatting
    let dayLabel;
    if (days <= 7) {
      dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
    } else if (days <= 30) {
      dayLabel = d.getDate().toString();
    } else if (days <= 90) {
      dayLabel = i % 7 === 0 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '\n') : '';
    } else {
      dayLabel = i % 30 === 0 ? d.toLocaleDateString('en-US', { month: 'short' }) : '';
    }

    list.push({ dateStr, dayLabel, moodIndex, habitRatio, hasData, date: d });
  }
  return list;
};

/* ─── Smooth SVG Path Builder (Catmull-Rom Spline) ─── */
const buildSmoothPath = (points) => {
  if (points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};

/* ─── Sparkline Chart Component ─── */
const SparklineChart = ({ data, valueKey, color, gradientId, showArea = false, height = 120 }) => {
  const viewW = 300;
  const viewH = 100;
  const padX = 8;
  const padTop = 8;
  const padBot = 18;
  const chartH = viewH - padTop - padBot;

  const values = data.map(d => d[valueKey]);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * (viewW - padX * 2),
    y: padTop + chartH - ((d[valueKey] - minVal) / range) * chartH
  }));

  const smoothPath = buildSmoothPath(points);
  const areaPath = smoothPath + ` L ${points[points.length - 1].x} ${viewH - padBot} L ${points[0].x} ${viewH - padBot} Z`;

  // Determine which label indices to show based on data length
  const labelIndices = [];
  if (data.length <= 7) {
    data.forEach((_, i) => labelIndices.push(i));
  } else if (data.length <= 30) {
    data.forEach((_, i) => { if (i % 5 === 0 || i === data.length - 1) labelIndices.push(i); });
  } else if (data.length <= 90) {
    data.forEach((_, i) => { if (i % 14 === 0 || i === data.length - 1) labelIndices.push(i); });
  } else {
    data.forEach((_, i) => { if (i % 60 === 0 || i === data.length - 1) labelIndices.push(i); });
  }

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <line key={i} x1={padX} y1={padTop + chartH * (1 - frac)} x2={viewW - padX} y2={padTop + chartH * (1 - frac)} 
            stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}

        {/* Area fill */}
        {showArea && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {/* Main line */}
        <path d={smoothPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points - show fewer dots for larger ranges */}
        {points.map((pt, i) => {
          if (data.length > 30 && i % Math.ceil(data.length / 15) !== 0 && i !== data.length - 1) return null;
          if (data.length > 7 && data.length <= 30 && i % 3 !== 0 && i !== data.length - 1) return null;
          return (
            <circle key={i} cx={pt.x} cy={pt.y} r={data.length <= 30 ? 3 : 2}
              fill="var(--bg-card)" stroke={color} strokeWidth="2" />
          );
        })}

        {/* X-axis labels */}
        {labelIndices.map((i) => (
          <text key={i} x={points[i].x} y={viewH - 2} textAnchor="middle"
            fontSize="7" fontWeight="700" fill="var(--text-muted)" fontFamily="var(--font-family)">
            {data[i].dayLabel}
          </text>
        ))}
      </svg>
    </div>
  );
};

/* ─── Bar Chart Component ─── */
const BarChart = ({ data, valueKey, color, gradientId, height = 130 }) => {
  const viewW = 300;
  const viewH = 110;
  const padX = 6;
  const padTop = 8;
  const padBot = 22;
  const chartH = viewH - padTop - padBot;

  const maxBars = Math.min(data.length, data.length);
  // For large ranges, aggregate into buckets
  let barData;
  if (data.length <= 14) {
    barData = data;
  } else {
    const bucketSize = Math.ceil(data.length / 14);
    barData = [];
    for (let i = 0; i < data.length; i += bucketSize) {
      const slice = data.slice(i, i + bucketSize);
      const avg = slice.reduce((sum, d) => sum + d[valueKey], 0) / slice.length;
      barData.push({ 
        ...slice[Math.floor(slice.length / 2)],
        [valueKey]: avg,
        dayLabel: slice[0].dayLabel || slice[Math.floor(slice.length / 2)].dayLabel
      });
    }
  }

  const maxVal = Math.max(...barData.map(d => d[valueKey]), 0.01);
  const barW = Math.min(16, (viewW - padX * 2) / barData.length * 0.65);
  const gap = (viewW - padX * 2 - barW * barData.length) / (barData.length - 1 || 1);

  // Show labels for every Nth bar
  const labelEvery = barData.length <= 7 ? 1 : barData.length <= 14 ? 2 : 3;

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${viewW} ${viewH}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <filter id={`${gradientId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac, i) => (
          <line key={i} x1={padX} y1={padTop + chartH * (1 - frac)} x2={viewW - padX} y2={padTop + chartH * (1 - frac)}
            stroke="var(--border-color)" strokeWidth="0.4" strokeDasharray="3,3" opacity="0.5" />
        ))}

        {barData.map((d, i) => {
          const x = padX + i * (barW + gap);
          const barH = Math.max(2, (d[valueKey] / maxVal) * chartH);
          const y = padTop + chartH - barH;
          return (
            <g key={i}>
              {/* Track background */}
              <rect x={x} y={padTop} width={barW} height={chartH} rx={barW / 2} fill="var(--border-color)" opacity="0.3" />
              {/* Active bar */}
              <rect x={x} y={y} width={barW} height={barH} rx={barW / 2}
                fill={`url(#${gradientId})`} filter={`url(#${gradientId}-glow)`} />
              {/* Label */}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={viewH - 4} textAnchor="middle"
                  fontSize="7" fontWeight="700" fill="var(--text-muted)" fontFamily="var(--font-family)">
                  {d.dayLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};


/* ─── Main Journey View ─── */
const JourneyView = () => {
  const { logs, habits, setShowJournalModal } = useContext(AppContext);
  const [neonTheme, setNeonTheme] = useState('emerald');
  const [timeRange, setTimeRange] = useState('7d');

  const activeTheme = THEMES[neonTheme] || THEMES.emerald;
  const activeDays = TIME_RANGES.find(r => r.key === timeRange)?.days || 7;

  // Generate chart data for selected time range
  const chartData = useMemo(() => getChartData(logs, habits, activeDays), [logs, habits, activeDays]);

  // Compute range-specific stats
  const rangeStats = useMemo(() => {
    let totalChecked = 0, totalPossible = 0;
    let sumHappy = 0, sumSad = 0, sumCalm = 0, sumAnxious = 0;
    let activeDaysCount = 0;

    chartData.forEach(d => {
      if (!d.hasData) return;
      activeDaysCount++;
      const log = logs[d.dateStr];
      if (!log) return;

      const em = log.emotions || { happy: 25, sad: 25, calm: 25, anxious: 25 };
      sumHappy += em.happy ?? 25;
      sumSad += em.sad ?? 25;
      sumCalm += em.calm ?? 25;
      sumAnxious += em.anxious ?? 25;

      const checked = log.habitsChecked || {};
      habits.forEach(h => {
        totalPossible++;
        if (checked[h.id] === true) totalChecked++;
      });
    });

    const totalEmotionSum = sumHappy + sumSad + sumCalm + sumAnxious;
    const avgHappy = totalEmotionSum > 0 ? Math.round((sumHappy / totalEmotionSum) * 100) : 25;
    const avgSad = totalEmotionSum > 0 ? Math.round((sumSad / totalEmotionSum) * 100) : 25;
    const avgCalm = totalEmotionSum > 0 ? Math.round((sumCalm / totalEmotionSum) * 100) : 25;
    const avgAnxious = 100 - (avgHappy + avgSad + avgCalm);

    const completionRate = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0;

    // Best day
    let bestDay = null, bestScore = 0;
    chartData.forEach(d => {
      if (d.hasData && d.habitRatio > bestScore) {
        bestScore = d.habitRatio;
        bestDay = d.date;
      }
    });

    return {
      activeDaysCount, totalChecked, totalPossible, completionRate,
      avgHappy, avgSad, avgCalm, avgAnxious,
      bestDay, bestScore: Math.round(bestScore * 100)
    };
  }, [chartData, logs, habits]);

  // Donut chart properties
  const radius = 48;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  // Journal entries
  const loggedDates = Object.keys(logs).sort().reverse();

  return (
    <div className="container">

      {/* ═══ Hero Stats Banner ═══ */}
      <div className="journey-hero">
        <div className="journey-hero-left">
          <span className="journey-hero-label">YOUR JOURNEY</span>
          <h2 className="journey-hero-value">{rangeStats.completionRate}%</h2>
          <span className="journey-hero-sub">
            {rangeStats.totalChecked} of {rangeStats.totalPossible} check-ins
          </span>
        </div>
        <div className="journey-hero-stats">
          <div className="journey-mini-stat">
            <Zap size={14} color="var(--accent-color)" />
            <div>
              <span className="journey-mini-val">{rangeStats.activeDaysCount}</span>
              <span className="journey-mini-label">Active</span>
            </div>
          </div>
          <div className="journey-mini-stat">
            <TrendingUp size={14} color="#10b981" />
            <div>
              <span className="journey-mini-val">{rangeStats.bestScore}%</span>
              <span className="journey-mini-label">Best Day</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Time Range Selector ═══ */}
      <div className="time-range-selector">
        {TIME_RANGES.map(r => (
          <button
            key={r.key}
            className={`time-range-btn ${timeRange === r.key ? 'active' : ''}`}
            onClick={() => setTimeRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ═══ Mood Trend Line Chart ═══ */}
      <div className="journey-chart-card">
        <div className="journey-chart-header">
          <div className="journey-chart-title-row">
            <div className="journey-chart-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <Activity size={16} color="var(--accent-color)" />
            </div>
            <div>
              <h3 className="journey-chart-title">Mood Index</h3>
              <span className="journey-chart-sub">Emotional wellness score over time</span>
            </div>
          </div>
        </div>
        <SparklineChart
          data={chartData}
          valueKey="moodIndex"
          color="var(--accent-color)"
          gradientId="moodGrad"
          showArea={true}
          height={140}
        />
      </div>

      {/* ═══ Habit Completion Bar Chart ═══ */}
      <div className="journey-chart-card">
        <div className="journey-chart-header">
          <div className="journey-chart-title-row">
            <div className="journey-chart-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <BarChart3 size={16} color="#10b981" />
            </div>
            <div>
              <h3 className="journey-chart-title">Habit Completion</h3>
              <span className="journey-chart-sub">Daily check-in ratios</span>
            </div>
          </div>
        </div>
        <BarChart
          data={chartData}
          valueKey="habitRatio"
          color="#10b981"
          gradientId="habitBarGrad"
          height={140}
        />
      </div>

      {/* ═══ Emotion Breakdown Donut ═══ */}
      <div className="journey-chart-card">
        <div className="journey-chart-header">
          <div className="journey-chart-title-row">
            <div className="journey-chart-icon" style={{ background: 'rgba(244,63,94,0.12)' }}>
              <span style={{ fontSize: '14px' }}>🧠</span>
            </div>
            <div>
              <h3 className="journey-chart-title">Emotion Splits</h3>
              <span className="journey-chart-sub">Averaged across {rangeStats.activeDaysCount} logged days</span>
            </div>
          </div>
        </div>
        <div className="journey-donut-section">
          {/* Donut */}
          <div className="journey-donut-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border-color)" strokeWidth={strokeWidth} />
              {rangeStats.avgHappy > 0 && (
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-happy)" strokeWidth={strokeWidth}
                  strokeDasharray={circumference} strokeDashoffset={circumference - (rangeStats.avgHappy / 100) * circumference}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }} />
              )}
              {rangeStats.avgCalm > 0 && (
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-calm)" strokeWidth={strokeWidth}
                  strokeDasharray={circumference} strokeDashoffset={circumference - (rangeStats.avgCalm / 100) * circumference}
                  strokeLinecap="round" style={{ transformOrigin: 'center', transform: `rotate(${(rangeStats.avgHappy / 100) * 360}deg)`, transition: 'stroke-dashoffset 0.8s ease-in-out' }} />
              )}
              {rangeStats.avgSad > 0 && (
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-sad)" strokeWidth={strokeWidth}
                  strokeDasharray={circumference} strokeDashoffset={circumference - (rangeStats.avgSad / 100) * circumference}
                  strokeLinecap="round" style={{ transformOrigin: 'center', transform: `rotate(${((rangeStats.avgHappy + rangeStats.avgCalm) / 100) * 360}deg)`, transition: 'stroke-dashoffset 0.8s ease-in-out' }} />
              )}
              {rangeStats.avgAnxious > 0 && (
                <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-anxious)" strokeWidth={strokeWidth}
                  strokeDasharray={circumference} strokeDashoffset={circumference - (rangeStats.avgAnxious / 100) * circumference}
                  strokeLinecap="round" style={{ transformOrigin: 'center', transform: `rotate(${((rangeStats.avgHappy + rangeStats.avgCalm + rangeStats.avgSad) / 100) * 360}deg)`, transition: 'stroke-dashoffset 0.8s ease-in-out' }} />
              )}
            </svg>
            <div className="journey-donut-center">
              <span className="journey-donut-val">{rangeStats.activeDaysCount}</span>
              <span className="journey-donut-lbl">ENTRIES</span>
            </div>
          </div>

          {/* Legend */}
          <div className="journey-donut-legend">
            {[
              { label: 'Happy', pct: rangeStats.avgHappy, cssVar: 'var(--color-happy)' },
              { label: 'Calm', pct: rangeStats.avgCalm, cssVar: 'var(--color-calm)' },
              { label: 'Sad', pct: rangeStats.avgSad, cssVar: 'var(--color-sad)' },
              { label: 'Anxious', pct: rangeStats.avgAnxious, cssVar: 'var(--color-anxious)' }
            ].map((item) => (
              <div key={item.label} className="journey-legend-item">
                <div className="journey-legend-dot" style={{ background: item.cssVar }} />
                <span className="journey-legend-label">{item.label}</span>
                <span className="journey-legend-pct">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Widget Studio ═══ */}
      <div className="widget-studio-container">
        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>Widget Studio</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#71717a', fontWeight: '600' }}>
          Customize neon-glowing widgets for your home screen.
        </p>

        {/* Theme selectors */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '700', marginRight: '6px' }}>THEME:</span>
          {Object.keys(THEMES).map(tKey => {
            const th = THEMES[tKey];
            return (
              <button key={tKey} onClick={() => setNeonTheme(tKey)}
                className={`theme-btn ${neonTheme === tKey ? 'active' : ''}`}
                style={{ backgroundColor: th.color, color: th.color }} title={th.name} />
            );
          })}
        </div>

        {/* Hyper Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Card 1: Habit Bar Chart */}
          <div className="hyper-widget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="hyper-widget-title" style={{ color: '#a1a1aa' }}>Habit Progress</span>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTheme.color, boxShadow: `0 0 8px ${activeTheme.color}` }}></div>
            </div>
            <h4 className="hyper-widget-val">{rangeStats.completionRate}%</h4>
            <span className="hyper-widget-sub" style={{ color: activeTheme.color, fontWeight: '700' }}>
              ✦ {rangeStats.totalChecked} check-ins total
            </span>

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
                {chartData.slice(-7).map((d, idx) => {
                  const val = d.habitRatio * 100;
                  const x = 12 + idx * 26;
                  const barHeight = Math.max(2, (val / 100) * 60);
                  const y = 70 - barHeight;
                  return (
                    <g key={idx}>
                      <rect className="widget-bar-bg" x={x} y="10" width="14" height="60" />
                      <rect className="widget-bar" x={x} y={y} width="14" height={barHeight}
                        fill={`url(#neonGrad-${neonTheme})`} filter={`url(#neonGlow-${neonTheme})`} />
                      <text x={x + 7} y="82" fill="#71717a" fontSize="7" textAnchor="middle" fontWeight="bold">
                        {d.dayLabel || ['M','T','W','T','F','S','S'][idx]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Card 2: Mood Wave */}
          <div className="hyper-widget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="hyper-widget-title" style={{ color: '#a1a1aa' }}>Mindfulness Wave</span>
              <span style={{ fontSize: '9px', color: activeTheme.color, fontWeight: '800', textShadow: `0 0 6px ${activeTheme.color}` }}>LIVE</span>
            </div>
            <h4 className="hyper-widget-val">{rangeStats.activeDaysCount} Logs</h4>
            <span className="hyper-widget-sub" style={{ color: '#71717a' }}>Calm State Rating Trend</span>

            <div style={{ marginTop: '16px', height: '90px' }}>
              <svg width="100%" height="100%" viewBox="0 0 200 90">
                <defs>
                  <linearGradient id={`areaGrad-${neonTheme}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeTheme.color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={activeTheme.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const last7 = chartData.slice(-7);
                  const pts = last7.map((d, i) => ({
                    x: 10 + (i / 6) * 180,
                    y: 70 - d.moodIndex * 0.55
                  }));
                  const linePath = buildSmoothPath(pts);
                  const areaP = linePath + ` L ${pts[pts.length - 1].x} 70 L ${pts[0].x} 70 Z`;
                  return (
                    <>
                      <path d={areaP} fill={`url(#areaGrad-${neonTheme})`} />
                      <path d={linePath} fill="none" stroke={activeTheme.color} strokeWidth="2.5" filter={`url(#neonGlow-${neonTheme})`} />
                      {pts.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke={activeTheme.color} strokeWidth="2" />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Widget Instructions */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #1c1c24', paddingTop: '16px' }}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
            📲 HOW TO ADD THE HOME SCREEN WIDGET:
          </span>
          <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#71717a', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Compile the APK via GitHub Actions and install it on your Android phone.</li>
            <li>Long-press an empty space on your phone's home screen, then tap <b>Widgets</b>.</li>
            <li>Scroll down, tap <b>Momentum</b>, and drag the widget onto your home screen.</li>
            <li>Any habit changes inside the app will instantly update your home screen progress bar!</li>
          </ol>
        </div>
      </div>

      {/* ═══ Create Journal CTA ═══ */}
      <button 
        onClick={() => setShowJournalModal(true)} 
        className="btn btn-primary flex-center"
        style={{ width: '100%', borderRadius: '20px', fontSize: '15px', fontWeight: '800', marginBottom: '24px' }}
      >
        Create a New Journal
      </button>

      {/* ═══ Journal Entries Timeline ═══ */}
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
                      <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px',
                        backgroundColor: log.moodDetail === 'Happy' ? 'var(--accent-light)' : 'var(--border-color)',
                        color: 'var(--text-primary)' }}>
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
