import React, { useState, useContext, useMemo, useCallback } from 'react';
import { AppContext } from '../context/AppContext';

/* ─── Constants ─── */
const FLOW_LEVELS = [
  { key: 'spotting', label: 'Spotting', icon: '·', color: '#fca5a5' },
  { key: 'light',    label: 'Light',    icon: '○', color: '#f87171' },
  { key: 'medium',   label: 'Medium',   icon: '●', color: '#ef4444' },
  { key: 'heavy',    label: 'Heavy',    icon: '◉', color: '#b91c1c' },
];

const SYMPTOMS = [
  { key: 'cramps',      label: 'Cramps',         emoji: '🤕' },
  { key: 'bloating',    label: 'Bloating',        emoji: '🫧' },
  { key: 'headache',    label: 'Headache',        emoji: '🤯' },
  { key: 'fatigue',     label: 'Fatigue',         emoji: '😴' },
  { key: 'acne',        label: 'Acne',            emoji: '🔴' },
  { key: 'breast_pain', label: 'Breast Pain',     emoji: '💢' },
  { key: 'backache',    label: 'Back Ache',       emoji: '🦴' },
  { key: 'nausea',      label: 'Nausea',          emoji: '🤢' },
];

const MOODS = [
  { key: 'happy',       label: 'Happy',       emoji: '😊' },
  { key: 'calm',        label: 'Calm',        emoji: '😌' },
  { key: 'irritable',   label: 'Irritable',   emoji: '😤' },
  { key: 'anxious',     label: 'Anxious',     emoji: '😰' },
  { key: 'sad',         label: 'Sad',         emoji: '😢' },
  { key: 'energetic',   label: 'Energetic',   emoji: '⚡' },
  { key: 'emotional',   label: 'Emotional',   emoji: '🥺' },
  { key: 'confident',   label: 'Confident',   emoji: '💪' },
];

const MUCUS_TYPES = [
  { key: 'dry',         label: 'Dry',          desc: 'No mucus' },
  { key: 'sticky',      label: 'Sticky',        desc: 'Crumbly/sticky' },
  { key: 'creamy',      label: 'Creamy',        desc: 'White/cloudy' },
  { key: 'watery',      label: 'Watery',        desc: 'Thin & wet' },
  { key: 'egg_white',   label: 'Egg White',     desc: 'Clear & stretchy' },
];

const TRACKING_GOALS = [
  { key: 'monitor',     label: 'Cycle Monitoring',    emoji: '📅' },
  { key: 'ttc',         label: 'Trying to Conceive',  emoji: '🌸' },
  { key: 'avoid',       label: 'Avoid Pregnancy',     emoji: '🛡️' },
  { key: 'perimenopause', label: 'Perimenopause',      emoji: '🌿' },
];

const TABS = ['Overview', 'Log Day', 'Calendar', 'Insights'];

/* ─── Helpers ─── */
const dateStr = (d) => {
  const dd = new Date(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
};

const addDays = (dateString, n) => {
  const d = new Date(dateString + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dateStr(d);
};

const daysBetween = (a, b) => {
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db - da) / 86400000);
};

const today = () => dateStr(new Date());

/* ─── Prediction Engine ─── */
const computePredictions = (cycles) => {
  if (cycles.length < 1) return null;
  const sorted = [...cycles].sort((a, b) => a.start.localeCompare(b.start));
  const last = sorted[sorted.length - 1];

  // Average cycle length from completed cycles
  let avgCycle = 28;
  let avgPeriod = 5;

  if (sorted.length >= 2) {
    const lengths = [];
    for (let i = 1; i < sorted.length; i++) {
      lengths.push(daysBetween(sorted[i - 1].start, sorted[i].start));
    }
    avgCycle = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    avgCycle = Math.max(21, Math.min(45, avgCycle)); // clamp
  }

  if (sorted.filter(c => c.end).length >= 1) {
    const durations = sorted.filter(c => c.end).map(c => daysBetween(c.start, c.end) + 1);
    avgPeriod = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    avgPeriod = Math.max(2, Math.min(10, avgPeriod));
  }

  const nextPeriodStart = addDays(last.start, avgCycle);
  const nextPeriodEnd = addDays(nextPeriodStart, avgPeriod - 1);
  const ovulationDay = addDays(last.start, avgCycle - 14);
  const fertileStart = addDays(ovulationDay, -5);
  const fertileEnd = addDays(ovulationDay, 1);
  const pmsStart = addDays(nextPeriodStart, -7);

  // Current phase
  const t = today();
  let phase = 'follicular';
  let phaseDay = 1;

  if (last.start <= t && (!last.end || last.end >= t)) {
    phase = 'menstrual';
    phaseDay = daysBetween(last.start, t) + 1;
  } else if (t >= fertileStart && t <= fertileEnd) {
    phase = 'fertile';
    phaseDay = daysBetween(fertileStart, t) + 1;
  } else if (t === ovulationDay) {
    phase = 'ovulation';
    phaseDay = 1;
  } else if (t >= pmsStart && t < nextPeriodStart) {
    phase = 'pms';
    phaseDay = daysBetween(pmsStart, t) + 1;
  } else {
    phaseDay = daysBetween(last.start, t) + 1;
  }

  const daysUntilNext = daysBetween(t, nextPeriodStart);

  return {
    avgCycle, avgPeriod,
    nextPeriodStart, nextPeriodEnd,
    ovulationDay, fertileStart, fertileEnd,
    pmsStart, phase, phaseDay,
    daysUntilNext: Math.max(0, daysUntilNext),
  };
};

/* ─── Phase Info ─── */
const PHASE_INFO = {
  menstrual:  { label: 'Period',     color: '#ef4444', bg: '#fee2e2', emoji: '🔴', tip: 'Rest, use warmth for cramps, stay hydrated.' },
  follicular: { label: 'Follicular', color: '#3b82f6', bg: '#dbeafe', emoji: '🌱', tip: 'Energy rising — great time for new challenges.' },
  fertile:    { label: 'Fertile',    color: '#10b981', bg: '#d1fae5', emoji: '🌸', tip: 'Peak fertility window. Ovulation approaching.' },
  ovulation:  { label: 'Ovulation',  color: '#8b5cf6', bg: '#ede9fe', emoji: '✨', tip: 'Peak energy & confidence — seize the day!' },
  pms:        { label: 'PMS',        color: '#f59e0b', bg: '#fef3c7', emoji: '🌙', tip: 'Be gentle with yourself. Rest and self-care.' },
};

/* ─── Phase Ring ─── */
const PhaseRing = ({ phase, phaseDay, daysUntilNext, avgCycle }) => {
  const info = PHASE_INFO[phase] || PHASE_INFO.follicular;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const progress = Math.min(1, (phaseDay) / (avgCycle || 28));
  const strokeDash = `${progress * circ} ${circ}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 16px' }}>
      <div style={{ position: 'relative', width: 170, height: 170 }}>
        <svg width="170" height="170" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="85" cy="85" r={radius} fill="none" stroke="var(--border-color)" strokeWidth="10" />
          <circle
            cx="85" cy="85" r={radius} fill="none"
            stroke={info.color} strokeWidth="10"
            strokeDasharray={strokeDash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
          <span style={{ fontSize: 30 }}>{info.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: info.color }}>{info.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Day {phaseDay}</span>
        </div>
      </div>

      <div style={{
        marginTop: 16, padding: '10px 20px',
        background: info.bg, borderRadius: 14,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        maxWidth: 300,
      }}>
        {daysUntilNext > 0 ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: info.color }}>
            🗓️ Next period in {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''}
          </span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>🔴 Period may be starting</span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>{info.tip}</span>
      </div>
    </div>
  );
};

/* ─── Calendar View ─── */
const CycleCalendar = ({ cycles, predictions, dayLogs }) => {
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const days = useMemo(() => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [viewMonth]);

  const getDayMeta = useCallback((ds) => {
    if (!ds) return {};
    const meta = {};
    // Actual period days
    for (const c of cycles) {
      if (c.start <= ds && (!c.end || c.end >= ds)) {
        meta.period = true;
        meta.flow = dayLogs[ds]?.flow;
      }
    }
    // Predicted period
    if (predictions) {
      if (ds >= predictions.nextPeriodStart && ds <= predictions.nextPeriodEnd) meta.predictedPeriod = true;
      if (ds >= predictions.fertileStart && ds <= predictions.fertileEnd) meta.fertile = true;
      if (ds === predictions.ovulationDay) meta.ovulation = true;
      if (ds >= predictions.pmsStart && ds < predictions.nextPeriodStart) meta.pms = true;
    }
    if (ds === today()) meta.isToday = true;
    if (dayLogs[ds]?.symptoms?.length) meta.hasSymptom = true;
    return meta;
  }, [cycles, predictions, dayLogs]);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
        <button onClick={() => setViewMonth(v => {
          const d = new Date(v.year, v.month - 1, 1);
          return { year: d.getFullYear(), month: d.getMonth() };
        })} style={navBtnStyle}>‹</button>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
          {monthNames[viewMonth.month]} {viewMonth.year}
        </span>
        <button onClick={() => setViewMonth(v => {
          const d = new Date(v.year, v.month + 1, 1);
          return { year: d.getFullYear(), month: d.getMonth() };
        })} style={navBtnStyle}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {days.map((ds, i) => {
          const meta = getDayMeta(ds);
          let bg = 'transparent';
          let color = 'var(--text-primary)';
          let border = 'none';

          if (meta.period) { bg = '#fca5a5'; color = '#7f1d1d'; }
          else if (meta.predictedPeriod) { bg = '#fee2e2'; color = '#ef4444'; border = '1px dashed #ef4444'; }
          else if (meta.ovulation) { bg = '#a78bfa'; color = '#ffffff'; }
          else if (meta.fertile) { bg = '#bbf7d0'; color = '#065f46'; }
          else if (meta.pms) { bg = '#fef08a'; color = '#713f12'; }

          return (
            <div
              key={i}
              style={{
                height: 38, borderRadius: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: bg, color,
                border: meta.isToday ? '2px solid var(--accent-color)' : border,
                fontSize: 12, fontWeight: meta.isToday ? 800 : 500,
                position: 'relative', cursor: ds ? 'pointer' : 'default',
                boxShadow: meta.period ? '0 2px 6px rgba(239,68,68,0.15)' : 'none',
              }}
            >
              {ds ? new Date(ds + 'T12:00:00').getDate() : ''}
              {meta.hasSymptom && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b', position: 'absolute', bottom: 3 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: 16, padding: '0 4px' }}>
        {[
          { color: '#fca5a5', label: 'Period' },
          { color: '#fee2e2', label: 'Predicted', dashed: true },
          { color: '#bbf7d0', label: 'Fertile' },
          { color: '#a78bfa', label: 'Ovulation' },
          { color: '#fef08a', label: 'PMS' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: l.dashed ? '1px dashed #ef4444' : 'none' }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const navBtnStyle = {
  width: 36, height: 36, borderRadius: '50%',
  border: '1.5px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)', fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontWeight: 700,
};

/* ─── Chip selector ─── */
const ChipGrid = ({ options, selected, onToggle, multiSelect = true }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {options.map(o => {
      const active = multiSelect ? (selected || []).includes(o.key) : selected === o.key;
      return (
        <button
          key={o.key}
          onClick={() => onToggle(o.key)}
          style={{
            padding: '8px 14px', borderRadius: 20,
            border: active ? '2px solid var(--accent-color)' : '1.5px solid var(--border-color)',
            background: active ? 'var(--accent-light)' : 'var(--bg-card)',
            color: active ? 'var(--accent-color)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.15s ease',
          }}
        >
          {o.emoji && <span>{o.emoji}</span>}
          {o.label}
        </button>
      );
    })}
  </div>
);

/* ─── Insight Card ─── */
const InsightCard = ({ emoji, title, value, sub, color }) => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: 18,
    border: '1.5px solid var(--border-color)',
    padding: '16px 18px',
    display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 14,
      background: color + '22',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, flexShrink: 0,
    }}>{emoji}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

/* ─── Section wrapper ─── */
const Section = ({ title, children, style }) => (
  <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1.5px solid var(--border-color)', padding: '18px 16px', marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', ...style }}>
    {title && <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>{title}</h3>}
    {children}
  </div>
);

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const PeriodTracker = () => {
  const { gender } = useContext(AppContext);

  // All period data stored in localStorage
  const [cycles, setCycles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pt_cycles') || '[]'); } catch { return []; }
  });
  const [dayLogs, setDayLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pt_daylogs') || '{}'); } catch { return {}; }
  });
  const [trackingGoal, setTrackingGoal] = useState(() =>
    localStorage.getItem('pt_goal') || 'monitor'
  );

  const [activeTab, setActiveTab] = useState('Overview');
  const [logDate, setLogDate] = useState(today());
  const [logFlow, setLogFlow] = useState('');
  const [logSymptoms, setLogSymptoms] = useState([]);
  const [logMoods, setLogMoods] = useState([]);
  const [logMucus, setLogMucus] = useState('');
  const [logBBT, setLogBBT] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [showPeriodStart, setShowPeriodStart] = useState(false);

  // Preload today's log when switching to Log Day tab
  const loadDayLog = useCallback((ds) => {
    const existing = dayLogs[ds] || {};
    setLogFlow(existing.flow || '');
    setLogSymptoms(existing.symptoms || []);
    setLogMoods(existing.moods || []);
    setLogMucus(existing.mucus || '');
    setLogBBT(existing.bbt || '');
    setLogNotes(existing.notes || '');
  }, [dayLogs]);

  const saveDayLog = () => {
    const updated = {
      ...dayLogs,
      [logDate]: { flow: logFlow, symptoms: logSymptoms, moods: logMoods, mucus: logMucus, bbt: logBBT, notes: logNotes },
    };
    setDayLogs(updated);
    localStorage.setItem('pt_daylogs', JSON.stringify(updated));
    // If flow logged, check if we need to open/update a cycle
    if (logFlow && logFlow !== '') {
      // Check if this date falls in an existing cycle
      const inCycle = cycles.find(c => c.start <= logDate && (!c.end || c.end >= logDate));
      if (!inCycle) {
        setShowPeriodStart(true);
      }
    }
    alert('Day logged! ✓');
  };

  const startPeriod = (startDate) => {
    const newCycle = { id: Date.now(), start: startDate, end: null };
    const updated = [...cycles, newCycle];
    setCycles(updated);
    localStorage.setItem('pt_cycles', JSON.stringify(updated));
    setShowPeriodStart(false);
  };

  const endPeriod = (cycleId, endDate) => {
    const updated = cycles.map(c => c.id === cycleId ? { ...c, end: endDate } : c);
    setCycles(updated);
    localStorage.setItem('pt_cycles', JSON.stringify(updated));
  };

  const predictions = useMemo(() => computePredictions(cycles), [cycles]);

  const sortedCycles = useMemo(() =>
    [...cycles].sort((a, b) => b.start.localeCompare(a.start)), [cycles]
  );

  const activeCycle = useMemo(() =>
    cycles.find(c => c.start <= today() && !c.end), [cycles]
  );

  // Pattern insights
  const insights = useMemo(() => {
    if (cycles.length < 2) return [];
    const tips = [];
    const allDays = Object.entries(dayLogs);

    // Pre-period symptom patterns
    const prePeriodSymptomDays = [];
    for (const c of cycles) {
      for (let i = 1; i <= 7; i++) {
        const ds = addDays(c.start, -i);
        if (dayLogs[ds]?.symptoms?.length) {
          prePeriodSymptomDays.push({ days: i, symptoms: dayLogs[ds].symptoms });
        }
      }
    }
    if (prePeriodSymptomDays.length >= 2) {
      const avgDays = Math.round(prePeriodSymptomDays.reduce((a, b) => a + b.days, 0) / prePeriodSymptomDays.length);
      const allSymptoms = prePeriodSymptomDays.flatMap(d => d.symptoms);
      const topSymptom = [...new Set(allSymptoms)].sort((a, b) =>
        allSymptoms.filter(x => x === b).length - allSymptoms.filter(x => x === a).length
      )[0];
      const symptomLabel = SYMPTOMS.find(s => s.key === topSymptom)?.label;
      if (symptomLabel) {
        tips.push(`You typically log ${symptomLabel} ${avgDays} day${avgDays !== 1 ? 's' : ''} before your period.`);
      }
    }

    // Cycle regularity
    if (predictions && predictions.avgCycle) {
      const lengths = [];
      const sorted = [...cycles].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < sorted.length; i++) {
        lengths.push(daysBetween(sorted[i - 1].start, sorted[i].start));
      }
      if (lengths.length >= 2) {
        const variance = Math.max(...lengths) - Math.min(...lengths);
        if (variance <= 3) {
          tips.push(`Your cycles are very regular (avg ${predictions.avgCycle} days). Great for prediction accuracy.`);
        } else if (variance <= 7) {
          tips.push(`Your cycles vary by ~${variance} days. Normal range — predictions may shift slightly.`);
        } else {
          tips.push(`Your cycles are irregular (${variance}-day range). Consider tracking more details for better insights.`);
        }
      }
    }

    return tips;
  }, [cycles, dayLogs, predictions]);

  const exportCSV = () => {
    const headers = 'Date,Flow,Symptoms,Moods,Mucus,BBT,Notes\n';
    const rows = Object.entries(dayLogs).sort().map(([ds, log]) =>
      `${ds},${log.flow || ''},${(log.symptoms || []).join('|')},${(log.moods || []).join('|')},${log.mucus || ''},${log.bbt || ''},"${(log.notes || '').replace(/"/g, '""')}"`
    ).join('\n');
    const csv = headers + rows;
    const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const a = document.createElement('a');
    a.href = uri;
    a.download = `cycle_export_${today()}.csv`;
    a.click();
  };

  if (gender !== 'Female') return null;

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)',
        borderRadius: 24,
        padding: '20px 20px 0',
        marginBottom: 16,
        border: '1.5px solid #f8bbd9',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(236,72,153,0.08)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#831843', letterSpacing: '-0.5px' }}>
              🌸 Cycle Tracker
            </h2>
            <p style={{ fontSize: 13, color: '#9d174d', marginTop: 4, fontWeight: 500 }}>
              Your personal wellness companion
            </p>
          </div>
          {/* Quick start/end period button */}
          {activeCycle ? (
            <button
              onClick={() => { if (confirm('End period today?')) endPeriod(activeCycle.id, today()); }}
              style={{
                padding: '8px 14px', borderRadius: 12,
                background: '#ef4444', color: '#fff',
                border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}
            >
              End Period
            </button>
          ) : (
            <button
              onClick={() => startPeriod(today())}
              style={{
                padding: '8px 14px', borderRadius: 12,
                background: '#ec4899', color: '#fff',
                border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}
            >
              + Start Period
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 18, overflowX: 'auto' }} className="hide-scrollbar">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                if (t === 'Log Day') loadDayLog(logDate);
              }}
              style={{
                padding: '10px 16px', borderRadius: '14px 14px 0 0',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                background: activeTab === t ? 'var(--bg-main)' : 'transparent',
                color: activeTab === t ? '#9d174d' : '#9d174d99',
                transition: 'all 0.15s ease',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'Overview' && (
        <>
          {predictions ? (
            <PhaseRing
              phase={predictions.phase}
              phaseDay={predictions.phaseDay}
              daysUntilNext={predictions.daysUntilNext}
              avgCycle={predictions.avgCycle}
            />
          ) : (
            <Section>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌸</div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Start tracking your cycle</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tap <strong>"+ Start Period"</strong> above when your period begins to unlock predictions.</p>
              </div>
            </Section>
          )}

          {/* Stats row */}
          {predictions && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <InsightCard emoji="📅" title="Avg Cycle" value={`${predictions.avgCycle}d`} color="#ec4899" />
              <InsightCard emoji="🩸" title="Avg Period" value={`${predictions.avgPeriod}d`} color="#ef4444" />
              <InsightCard emoji="🌸" title="Ovulation" value={predictions.ovulationDay.slice(5)} sub="Predicted date" color="#8b5cf6" />
              <InsightCard emoji="🌿" title="Fertile Window" value={`${predictions.fertileStart.slice(5)} – ${predictions.fertileEnd.slice(5)}`} color="#10b981" />
            </div>
          )}

          {/* Tracking goal */}
          <Section title="My Goal">
            <ChipGrid
              options={TRACKING_GOALS}
              selected={trackingGoal}
              onToggle={(k) => { setTrackingGoal(k); localStorage.setItem('pt_goal', k); }}
              multiSelect={false}
            />
          </Section>

          {/* Cycle history */}
          {sortedCycles.length > 0 && (
            <Section title="Recent Cycles">
              {sortedCycles.slice(0, 4).map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < Math.min(sortedCycles.length, 4) - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      🩸 {c.start} {c.end ? `→ ${c.end}` : '→ ongoing'}
                    </div>
                    {c.end && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {daysBetween(c.start, c.end) + 1} days long
                      </div>
                    )}
                  </div>
                  {!c.end && (
                    <button
                      onClick={() => { if (confirm('End this period today?')) endPeriod(c.id, today()); }}
                      style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--accent-light)', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--accent-color)', cursor: 'pointer' }}
                    >End</button>
                  )}
                </div>
              ))}
            </Section>
          )}
        </>
      )}

      {/* ── LOG DAY TAB ── */}
      {activeTab === 'Log Day' && (
        <>
          <Section title="Date">
            <input
              type="date"
              value={logDate}
              max={today()}
              onChange={e => { setLogDate(e.target.value); loadDayLog(e.target.value); }}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-family)',
              }}
            />
          </Section>

          <Section title="🩸 Flow Intensity">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {FLOW_LEVELS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setLogFlow(logFlow === f.key ? '' : f.key)}
                  style={{
                    padding: '12px 4px', borderRadius: 14, textAlign: 'center',
                    border: logFlow === f.key ? `2px solid ${f.color}` : '1.5px solid var(--border-color)',
                    background: logFlow === f.key ? f.color + '22' : 'var(--bg-card)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 18, color: f.color }}>{f.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: logFlow === f.key ? f.color : 'var(--text-secondary)', marginTop: 4 }}>{f.label}</div>
                </button>
              ))}
            </div>
          </Section>

          <Section title="😣 Symptoms">
            <ChipGrid
              options={SYMPTOMS}
              selected={logSymptoms}
              onToggle={k => setLogSymptoms(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
            />
          </Section>

          <Section title="💭 Mood">
            <ChipGrid
              options={MOODS}
              selected={logMoods}
              onToggle={k => setLogMoods(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
            />
          </Section>

          <Section title="💧 Cervical Mucus">
            <ChipGrid
              options={MUCUS_TYPES}
              selected={logMucus}
              onToggle={k => setLogMucus(prev => prev === k ? '' : k)}
              multiSelect={false}
            />
            <div style={{ marginTop: 8 }}>
              {logMucus && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{MUCUS_TYPES.find(m => m.key === logMucus)?.desc}</p>}
            </div>
          </Section>

          <Section title="🌡️ Basal Body Temperature (°C)">
            <input
              type="number"
              step="0.01"
              min="35"
              max="42"
              placeholder="e.g. 36.6"
              value={logBBT}
              onChange={e => setLogBBT(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                fontSize: 15, fontFamily: 'var(--font-family)',
              }}
            />
          </Section>

          <Section title="📝 Notes">
            <textarea
              placeholder="How are you feeling today? Any observations..."
              value={logNotes}
              onChange={e => setLogNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                fontSize: 14, resize: 'none', fontFamily: 'var(--font-family)',
              }}
            />
          </Section>

          <button
            onClick={saveDayLog}
            style={{
              width: '100%', padding: '16px', borderRadius: 18,
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: '#fff', border: 'none',
              fontSize: 16, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(236,72,153,0.3)',
              transition: 'all 0.15s',
            }}
          >
            Save Day Log ✓
          </button>
        </>
      )}

      {/* ── CALENDAR TAB ── */}
      {activeTab === 'Calendar' && (
        <Section>
          <CycleCalendar cycles={cycles} predictions={predictions} dayLogs={dayLogs} />
        </Section>
      )}

      {/* ── INSIGHTS TAB ── */}
      {activeTab === 'Insights' && (
        <>
          {insights.length > 0 ? (
            <Section title="🔍 Your Patterns">
              {insights.map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: i < insights.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{ fontSize: 20, flexShrink: 0 }}>💡</div>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{tip}</p>
                </div>
              ))}
            </Section>
          ) : (
            <Section>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Not enough data yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Log at least 2 cycles and daily symptoms to unlock personalized insights.</p>
              </div>
            </Section>
          )}

          {/* Symptom frequency breakdown */}
          {Object.keys(dayLogs).length > 0 && (() => {
            const freq = {};
            Object.values(dayLogs).forEach(log => {
              (log.symptoms || []).forEach(s => { freq[s] = (freq[s] || 0) + 1; });
            });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
            if (!sorted.length) return null;
            const maxCount = sorted[0][1];
            return (
              <Section title="📈 Symptom Frequency">
                {sorted.map(([key, count]) => {
                  const sym = SYMPTOMS.find(s => s.key === key);
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{sym?.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{sym?.label}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{count}x</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(count / maxCount) * 100}%`, background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Section>
            );
          })()}

          {/* Export */}
          <Section title="📤 Export Data">
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              Download your cycle data as a CSV file to share with your healthcare provider.
            </p>
            <button
              onClick={exportCSV}
              style={{
                width: '100%', padding: '13px', borderRadius: 14,
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              📥 Export as CSV
            </button>
          </Section>

          {/* Privacy note */}
          <div style={{
            padding: '14px 16px', borderRadius: 16,
            background: '#f0fdf4', border: '1.5px solid #bbf7d0',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 3 }}>100% Private & Local</p>
              <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>All cycle data is stored only on this device. Nothing is uploaded to any server or shared with third parties.</p>
            </div>
          </div>
        </>
      )}

      {/* Confirm period start modal */}
      {showPeriodStart && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)', zIndex: 5000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 24,
            padding: '28px 24px', maxWidth: 340, width: '100%',
            border: '1.5px solid var(--border-color)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🩸</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Start new period?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              You logged flow for <strong>{logDate}</strong>. Would you like to mark this as the start of a new period?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPeriodStart(false)} style={{ flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Not Now</button>
              <button onClick={() => startPeriod(logDate)} style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: '#ec4899', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Yes, Start</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodTracker;
