import React, { useState, useContext, useMemo, useCallback } from 'react';
import { AppContext } from '../context/AppContext';

/* ─── Design Tokens ─── */
const T = {
  sage: '#6B8F71',
  sageDark: '#4a6b4f',
  sageLight: '#e8f0e8',
  amber: '#D4A574',
  amberDark: '#b8895a',
  cream: '#f7f3ee',
  forest: '#3d4f3e',
  forestMuted: '#5a6b5b',
  card: 'var(--bg-card)',
  border: 'var(--border-color)',
  bgMain: 'var(--bg-main)',
  text: 'var(--text-primary)',
  textSec: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  radius: 22,
  radiusSm: 14,
  shadow: '0 4px 20px rgba(0,0,0,0.06)',
  shadowLg: '0 8px 32px rgba(0,0,0,0.08)',
};

/* ─── Constants ─── */
const FLOW_LEVELS = [
  { key: 'spotting', label: 'Spotting', icon: '·', color: '#d4a574' },
  { key: 'light',    label: 'Light',    icon: '○', color: '#c0784a' },
  { key: 'medium',   label: 'Medium',   icon: '●', color: '#a0522d' },
  { key: 'heavy',    label: 'Heavy',    icon: '◉', color: '#6b3a1f' },
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
  let avgCycle = 28;
  let avgPeriod = 5;
  if (sorted.length >= 2) {
    const lengths = [];
    for (let i = 1; i < sorted.length; i++) lengths.push(daysBetween(sorted[i - 1].start, sorted[i].start));
    avgCycle = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    avgCycle = Math.max(21, Math.min(45, avgCycle));
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
  const t = today();
  let phase = 'follicular';
  let phaseDay = 1;
  if (last.start <= t && (!last.end || last.end >= t)) { phase = 'menstrual'; phaseDay = daysBetween(last.start, t) + 1; }
  else if (t >= fertileStart && t <= fertileEnd) { phase = 'fertile'; phaseDay = daysBetween(fertileStart, t) + 1; }
  else if (t === ovulationDay) { phase = 'ovulation'; phaseDay = 1; }
  else if (t >= pmsStart && t < nextPeriodStart) { phase = 'pms'; phaseDay = daysBetween(pmsStart, t) + 1; }
  else { phaseDay = daysBetween(last.start, t) + 1; }
  const daysUntilNext = daysBetween(t, nextPeriodStart);
  return { avgCycle, avgPeriod, nextPeriodStart, nextPeriodEnd, ovulationDay, fertileStart, fertileEnd, pmsStart, phase, phaseDay, daysUntilNext: Math.max(0, daysUntilNext) };
};

/* ─── Phase Info ─── */
const PHASE_INFO = {
  menstrual:  { label: 'Period',     color: '#c0392b', bg: '#fde8e5', emoji: '🔴', tip: 'Rest, use warmth for cramps, stay hydrated.' },
  follicular: { label: 'Follicular', color: '#2980b9', bg: '#d6eaf8', emoji: '🌱', tip: 'Energy rising — great time for new challenges.' },
  fertile:    { label: 'Fertile',    color: '#27ae60', bg: '#d5f5e3', emoji: '🌿', tip: 'Peak fertility window. Ovulation approaching.' },
  ovulation:  { label: 'Ovulation',  color: '#8e44ad', bg: '#ebdef0', emoji: '✨', tip: 'Peak energy & confidence — seize the day!' },
  pms:        { label: 'PMS',        color: '#d4a574', bg: '#fdf2e9', emoji: '🌙', tip: 'Be gentle with yourself. Rest and self-care.' },
};

/* ══════════════════════════════════════════
   PREMIUM UI COMPONENTS
══════════════════════════════════════════ */

/* ─── Glassmorphic Card ─── */
const Card = ({ children, style, glow, noPad }) => (
  <div style={{
    background: T.card,
    borderRadius: T.radius,
    border: `1px solid ${T.border}`,
    padding: noPad ? 0 : '20px 18px',
    marginBottom: 14,
    boxShadow: glow || T.shadow,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

/* ─── Section Label ─── */
const SectionLabel = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: T.sageLight,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15,
    }}>{icon}</div>
    <span style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{text}</span>
  </div>
);

/* ─── Metric Pill ─── */
const MetricPill = ({ emoji, label, value, sub, color }) => (
  <div style={{
    background: T.card,
    borderRadius: 18,
    border: `1px solid ${T.border}`,
    padding: '16px 14px',
    boxShadow: T.shadow,
    display: 'flex', flexDirection: 'column', gap: 6,
    position: 'relative', overflow: 'hidden',
  }}>
    {/* Accent bar top */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '18px 18px 0 0' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: '-0.5px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, fontWeight: 500 }}>{sub}</div>}
  </div>
);

/* ─── Premium Phase Ring ─── */
const PhaseRing = ({ phase, phaseDay, daysUntilNext, avgCycle }) => {
  const info = PHASE_INFO[phase] || PHASE_INFO.follicular;
  const R = 78;
  const circ = 2 * Math.PI * R;
  const progress = Math.min(1, phaseDay / (avgCycle || 28));
  const dash = `${progress * circ} ${circ}`;

  return (
    <Card style={{ padding: '28px 18px 22px', textAlign: 'center' }} glow={`0 8px 40px ${info.color}15`}>
      {/* Decorative blurred circle */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: info.color, opacity: 0.06,
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {/* Ring */}
        <div style={{ position: 'relative', width: 186, height: 186, marginBottom: 18 }}>
          <svg width="186" height="186" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="93" cy="93" r={R} fill="none" stroke={T.border} strokeWidth="8" opacity="0.5" />
            <circle
              cx="93" cy="93" r={R} fill="none"
              stroke={info.color} strokeWidth="8"
              strokeDasharray={dash}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1)', filter: `drop-shadow(0 0 8px ${info.color}44)` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 38, lineHeight: 1 }}>{info.emoji}</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: info.color, letterSpacing: '-0.02em' }}>{info.label}</span>
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>Day {phaseDay}</span>
          </div>
        </div>

        {/* Next period countdown */}
        <div style={{
          padding: '12px 24px',
          background: info.bg, borderRadius: 16,
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          border: `1px solid ${info.color}22`,
        }}>
          {daysUntilNext > 0 ? (
            <span style={{ fontSize: 14, fontWeight: 800, color: info.color }}>
              🗓️ Next period in <span style={{ fontSize: 18 }}>{daysUntilNext}</span> day{daysUntilNext !== 1 ? 's' : ''}
            </span>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 800, color: '#c0392b' }}>🔴 Period may be starting</span>
          )}
          <span style={{ fontSize: 12, color: T.textSec, textAlign: 'center', maxWidth: 260, lineHeight: 1.4 }}>{info.tip}</span>
        </div>
      </div>
    </Card>
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
    for (const c of cycles) {
      if (c.start <= ds && (!c.end || c.end >= ds)) { meta.period = true; meta.flow = dayLogs[ds]?.flow; }
    }
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

  const navBtn = {
    width: 36, height: 36, borderRadius: 12,
    border: `1px solid ${T.border}`,
    background: T.card, color: T.text,
    fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontWeight: 700, boxShadow: T.shadow,
  };

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button onClick={() => setViewMonth(v => { const d = new Date(v.year, v.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={navBtn}>‹</button>
        <span style={{ fontWeight: 900, fontSize: 16, color: T.text, letterSpacing: '-0.02em' }}>
          {monthNames[viewMonth.month]} {viewMonth.year}
        </span>
        <button onClick={() => setViewMonth(v => { const d = new Date(v.year, v.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={navBtn}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: T.textMuted, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((ds, i) => {
          const meta = getDayMeta(ds);
          let bg = 'transparent'; let color = T.text; let border = 'none';
          if (meta.period) { bg = '#e8c4b8'; color = '#5c3d2e'; }
          else if (meta.predictedPeriod) { bg = '#f5e6dc'; color = '#c0784a'; border = '1.5px dashed #c0784a'; }
          else if (meta.ovulation) { bg = '#d7bfee'; color = '#fff'; }
          else if (meta.fertile) { bg = '#c8e6d0'; color = '#1b5e38'; }
          else if (meta.pms) { bg = '#fdf2e9'; color = '#8b6f47'; }
          return (
            <div key={i} style={{
              height: 40, borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: bg, color,
              border: meta.isToday ? `2.5px solid ${T.sage}` : border,
              fontSize: 13, fontWeight: meta.isToday ? 900 : 500,
              position: 'relative', cursor: ds ? 'pointer' : 'default',
              boxShadow: meta.period ? '0 2px 8px rgba(192,120,74,0.15)' : 'none',
              transition: 'all 0.15s ease',
            }}>
              {ds ? new Date(ds + 'T12:00:00').getDate() : ''}
              {meta.hasSymptom && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.amber, position: 'absolute', bottom: 3 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px', marginTop: 18 }}>
        {[
          { color: '#e8c4b8', label: 'Period' },
          { color: '#f5e6dc', label: 'Predicted', dashed: true },
          { color: '#c8e6d0', label: 'Fertile' },
          { color: '#d7bfee', label: 'Ovulation' },
          { color: '#fdf2e9', label: 'PMS' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 5, background: l.color, border: l.dashed ? '1.5px dashed #c0784a' : 'none' }} />
            <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
            padding: '9px 16px', borderRadius: 50,
            border: active ? `2px solid ${T.sage}` : `1.5px solid ${T.border}`,
            background: active ? T.sageLight : T.card,
            color: active ? T.sage : T.textSec,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: active ? `0 2px 12px ${T.sage}22` : 'none',
          }}
        >
          {o.emoji && <span style={{ fontSize: 15 }}>{o.emoji}</span>}
          {o.label}
        </button>
      );
    })}
  </div>
);

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const PeriodTracker = () => {
  const { gender } = useContext(AppContext);
  const [cycles, setCycles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pt_cycles') || '[]'); } catch { return []; }
  });
  const [dayLogs, setDayLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pt_daylogs') || '{}'); } catch { return {}; }
  });
  const [trackingGoal, setTrackingGoal] = useState(() => localStorage.getItem('pt_goal') || 'monitor');

  const [activeTab, setActiveTab] = useState('Overview');
  const [logDate, setLogDate] = useState(today());
  const [logFlow, setLogFlow] = useState('');
  const [logSymptoms, setLogSymptoms] = useState([]);
  const [logMoods, setLogMoods] = useState([]);
  const [logMucus, setLogMucus] = useState('');
  const [logBBT, setLogBBT] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [showPeriodStart, setShowPeriodStart] = useState(false);
  const [toast, setToast] = useState('');

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
    const updated = { ...dayLogs, [logDate]: { flow: logFlow, symptoms: logSymptoms, moods: logMoods, mucus: logMucus, bbt: logBBT, notes: logNotes } };
    setDayLogs(updated);
    localStorage.setItem('pt_daylogs', JSON.stringify(updated));
    if (logFlow && logFlow !== '') {
      const inCycle = cycles.find(c => c.start <= logDate && (!c.end || c.end >= logDate));
      if (!inCycle) setShowPeriodStart(true);
    }
    alert('Day logged! ✓');
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const startPeriod = (startDate) => {
    const newCycle = { id: Date.now(), start: startDate, end: null };
    const updated = [...cycles, newCycle];
    setCycles(updated);
    localStorage.setItem('pt_cycles', JSON.stringify(updated));
    setShowPeriodStart(false);
    showToast('🩸 Period started — tracking begun!');
  };

  const endPeriod = (cycleId, endDate) => {
    const updated = cycles.map(c => c.id === cycleId ? { ...c, end: endDate } : c);
    setCycles(updated);
    localStorage.setItem('pt_cycles', JSON.stringify(updated));
    showToast('✅ Period ended — cycle recorded!');
  };

  const predictions = useMemo(() => computePredictions(cycles), [cycles]);
  const sortedCycles = useMemo(() => [...cycles].sort((a, b) => b.start.localeCompare(a.start)), [cycles]);
  const activeCycle = useMemo(() => cycles.find(c => c.start <= today() && !c.end), [cycles]);

  const insights = useMemo(() => {
    if (cycles.length < 2) return [];
    const tips = [];
    const prePeriodSymptomDays = [];
    for (const c of cycles) {
      for (let i = 1; i <= 7; i++) {
        const ds = addDays(c.start, -i);
        if (dayLogs[ds]?.symptoms?.length) prePeriodSymptomDays.push({ days: i, symptoms: dayLogs[ds].symptoms });
      }
    }
    if (prePeriodSymptomDays.length >= 2) {
      const avgDays = Math.round(prePeriodSymptomDays.reduce((a, b) => a + b.days, 0) / prePeriodSymptomDays.length);
      const allSymptoms = prePeriodSymptomDays.flatMap(d => d.symptoms);
      const topSymptom = [...new Set(allSymptoms)].sort((a, b) => allSymptoms.filter(x => x === b).length - allSymptoms.filter(x => x === a).length)[0];
      const symptomLabel = SYMPTOMS.find(s => s.key === topSymptom)?.label;
      if (symptomLabel) tips.push(`You typically log ${symptomLabel} ${avgDays} day${avgDays !== 1 ? 's' : ''} before your period.`);
    }
    if (predictions && predictions.avgCycle) {
      const lengths = [];
      const sorted = [...cycles].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < sorted.length; i++) lengths.push(daysBetween(sorted[i - 1].start, sorted[i].start));
      if (lengths.length >= 2) {
        const variance = Math.max(...lengths) - Math.min(...lengths);
        if (variance <= 3) tips.push(`Your cycles are very regular (avg ${predictions.avgCycle} days). Great for prediction accuracy.`);
        else if (variance <= 7) tips.push(`Your cycles vary by ~${variance} days. Normal range — predictions may shift slightly.`);
        else tips.push(`Your cycles are irregular (${variance}-day range). Consider tracking more details for better insights.`);
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

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          background: T.forest, color: '#fff',
          padding: '12px 24px', borderRadius: 50,
          fontSize: 14, fontWeight: 700, zIndex: 9999,
          boxShadow: T.shadowLg, whiteSpace: 'nowrap',
          animation: 'slideUpFade 0.25s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        background: `linear-gradient(145deg, ${T.sageLight} 0%, #f0ead6 50%, ${T.cream} 100%)`,
        borderRadius: 26,
        padding: '22px 20px 0',
        marginBottom: 18,
        border: `1px solid #c5d5c088`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 6px 28px rgba(107,143,113,0.1)',
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: -30, right: -20, width: 140, height: 140, borderRadius: '50%', background: T.sage, opacity: 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: T.amber, opacity: 0.06, filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: T.forest, letterSpacing: '-0.5px', margin: 0 }}>
              🌿 Cycle Tracker
            </h2>
            <p style={{ fontSize: 13, color: T.forestMuted, marginTop: 5, fontWeight: 500, margin: '5px 0 0' }}>
              Your personal wellness companion
            </p>
          </div>
          {activeCycle ? (
            <button
              onClick={() => { if (window.confirm('Mark period as ended today?')) endPeriod(activeCycle.id, today()); }}
              style={{
                padding: '11px 18px', borderRadius: 14,
                background: '#c0392b', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', touchAction: 'manipulation',
                boxShadow: '0 4px 14px rgba(192,57,43,0.3)',
                position: 'relative', zIndex: 5,
              }}
            >
              🛑 End Period
            </button>
          ) : (
            <button
              onClick={() => startPeriod(today())}
              style={{
                padding: '11px 18px', borderRadius: 14,
                background: `linear-gradient(135deg, ${T.sage}, ${T.sageDark})`,
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', touchAction: 'manipulation',
                boxShadow: `0 4px 14px ${T.sage}55`,
                position: 'relative', zIndex: 5,
              }}
            >
              + Start Period
            </button>
          )}
        </div>

        {/* Pill Tab Bar */}
        <div style={{
          display: 'flex', gap: 4, marginTop: 20,
          background: 'rgba(255,255,255,0.5)',
          borderRadius: '16px 16px 0 0',
          padding: '4px 4px 0',
          position: 'relative', zIndex: 2,
        }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); if (t === 'Log Day') loadDayLog(logDate); }}
              style={{
                flex: 1,
                padding: '11px 8px',
                borderRadius: '12px 12px 0 0',
                border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                fontSize: 12, fontWeight: activeTab === t ? 800 : 600,
                whiteSpace: 'nowrap',
                background: activeTab === t ? T.bgMain : 'transparent',
                color: activeTab === t ? T.forest : `${T.forest}88`,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === t ? '0 -2px 8px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
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
            <Card style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🌿</div>
              <p style={{ fontWeight: 800, color: T.text, marginBottom: 8, fontSize: 16 }}>Start tracking your cycle</p>
              <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>Tap <strong>"+ Start Period"</strong> above when your period begins to unlock predictions.</p>
            </Card>
          )}

          {/* Stats Grid */}
          {predictions && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <MetricPill emoji="📅" label="Avg Cycle" value={`${predictions.avgCycle}d`} color={T.sage} />
              <MetricPill emoji="🩸" label="Avg Period" value={`${predictions.avgPeriod}d`} color="#c0392b" />
              <MetricPill emoji="✨" label="Ovulation" value={predictions.ovulationDay.slice(5)} sub="Predicted date" color="#8e44ad" />
              <MetricPill emoji="🌿" label="Fertile" value={`${predictions.fertileStart.slice(5)} – ${predictions.fertileEnd.slice(5)}`} color="#27ae60" />
            </div>
          )}

          {/* Goal */}
          <Card>
            <SectionLabel icon="🎯" text="My Goal" />
            <ChipGrid
              options={TRACKING_GOALS}
              selected={trackingGoal}
              onToggle={(k) => { setTrackingGoal(k); localStorage.setItem('pt_goal', k); }}
              multiSelect={false}
            />
          </Card>

          {/* Recent cycles */}
          {sortedCycles.length > 0 && (
            <Card>
              <SectionLabel icon="📋" text="Recent Cycles" />
              {sortedCycles.slice(0, 4).map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: i < Math.min(sortedCycles.length, 4) - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                      {c.start} {c.end ? `→ ${c.end}` : '→ ongoing'}
                    </div>
                    {c.end && (
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                        {daysBetween(c.start, c.end) + 1} days long
                      </div>
                    )}
                  </div>
                  {!c.end && (
                    <button
                      onClick={() => { if (confirm('End this period today?')) endPeriod(c.id, today()); }}
                      style={{
                        padding: '7px 14px', borderRadius: 10,
                        background: T.sageLight, border: 'none',
                        fontSize: 12, fontWeight: 700, color: T.sage, cursor: 'pointer',
                      }}
                    >End</button>
                  )}
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {/* ═══ LOG DAY TAB ═══ */}
      {activeTab === 'Log Day' && (
        <>
          <Card>
            <SectionLabel icon="📅" text="Date" />
            <input
              type="date" value={logDate} max={today()}
              onChange={e => { setLogDate(e.target.value); loadDayLog(e.target.value); }}
              style={{
                width: '100%', padding: '14px', borderRadius: T.radiusSm,
                border: `1.5px solid ${T.border}`,
                background: T.bgMain, color: T.text,
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-family)',
              }}
            />
          </Card>

          <Card>
            <SectionLabel icon="💧" text="Flow Intensity" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {FLOW_LEVELS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setLogFlow(logFlow === f.key ? '' : f.key)}
                  style={{
                    padding: '14px 4px', borderRadius: 16, textAlign: 'center',
                    border: logFlow === f.key ? `2.5px solid ${f.color}` : `1.5px solid ${T.border}`,
                    background: logFlow === f.key ? f.color + '18' : T.card,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: logFlow === f.key ? `0 3px 12px ${f.color}25` : 'none',
                  }}
                >
                  <div style={{ fontSize: 22, color: f.color, lineHeight: 1 }}>{f.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: logFlow === f.key ? f.color : T.textSec, marginTop: 6 }}>{f.label}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel icon="😣" text="Symptoms" />
            <ChipGrid
              options={SYMPTOMS}
              selected={logSymptoms}
              onToggle={k => setLogSymptoms(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
            />
          </Card>

          <Card>
            <SectionLabel icon="💭" text="Mood" />
            <ChipGrid
              options={MOODS}
              selected={logMoods}
              onToggle={k => setLogMoods(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
            />
          </Card>

          <Card>
            <SectionLabel icon="💧" text="Cervical Mucus" />
            <ChipGrid
              options={MUCUS_TYPES}
              selected={logMucus}
              onToggle={k => setLogMucus(prev => prev === k ? '' : k)}
              multiSelect={false}
            />
            {logMucus && (
              <p style={{ fontSize: 12, color: T.textMuted, marginTop: 10, fontStyle: 'italic' }}>
                {MUCUS_TYPES.find(m => m.key === logMucus)?.desc}
              </p>
            )}
          </Card>

          <Card>
            <SectionLabel icon="🌡️" text="Basal Body Temp (°C)" />
            <input
              type="number" step="0.01" min="35" max="42"
              placeholder="e.g. 36.6"
              value={logBBT} onChange={e => setLogBBT(e.target.value)}
              style={{
                width: '100%', padding: '14px', borderRadius: T.radiusSm,
                border: `1.5px solid ${T.border}`,
                background: T.bgMain, color: T.text,
                fontSize: 15, fontFamily: 'var(--font-family)',
              }}
            />
          </Card>

          <Card>
            <SectionLabel icon="📝" text="Notes" />
            <textarea
              placeholder="How are you feeling today? Any observations..."
              value={logNotes} onChange={e => setLogNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '14px', borderRadius: T.radiusSm,
                border: `1.5px solid ${T.border}`,
                background: T.bgMain, color: T.text,
                fontSize: 14, resize: 'none', fontFamily: 'var(--font-family)',
              }}
            />
          </Card>

          <button
            onClick={saveDayLog}
            style={{
              width: '100%', padding: '16px', borderRadius: 18,
              background: `linear-gradient(135deg, ${T.sage} 0%, ${T.sageDark} 100%)`,
              color: '#fff', border: 'none',
              fontSize: 16, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 6px 20px ${T.sage}40`,
              transition: 'all 0.2s ease',
              marginBottom: 14,
            }}
          >
            Save Day Log ✓
          </button>
        </>
      )}

      {/* ═══ CALENDAR TAB ═══ */}
      {activeTab === 'Calendar' && (
        <Card>
          <CycleCalendar cycles={cycles} predictions={predictions} dayLogs={dayLogs} />
        </Card>
      )}

      {/* ═══ INSIGHTS TAB ═══ */}
      {activeTab === 'Insights' && (
        <>
          {insights.length > 0 ? (
            <Card>
              <SectionLabel icon="🔍" text="Your Patterns" />
              {insights.map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '14px 0',
                  borderBottom: i < insights.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#fdf2e9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>💡</div>
                  <p style={{ fontSize: 14, color: T.text, lineHeight: 1.5, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </Card>
          ) : (
            <Card style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📊</div>
              <p style={{ fontWeight: 800, color: T.text, marginBottom: 8, fontSize: 16 }}>Not enough data yet</p>
              <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>Log at least 2 cycles and daily symptoms to unlock personalized insights.</p>
            </Card>
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
              <Card>
                <SectionLabel icon="📈" text="Symptom Frequency" />
                {sorted.map(([key, count]) => {
                  const sym = SYMPTOMS.find(s => s.key === key);
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: T.sageLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0,
                      }}>{sym?.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{sym?.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted }}>{count}x</span>
                        </div>
                        <div style={{ height: 7, background: T.border, borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(count / maxCount) * 100}%`,
                            background: `linear-gradient(90deg, ${T.sage}, ${T.amber})`,
                            borderRadius: 10,
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })()}

          {/* Export */}
          <Card>
            <SectionLabel icon="📤" text="Export Data" />
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 14, lineHeight: 1.5 }}>
              Download your cycle data as a CSV file to share with your healthcare provider.
            </p>
            <button
              onClick={exportCSV}
              style={{
                width: '100%', padding: '14px', borderRadius: T.radiusSm,
                border: `1.5px solid ${T.border}`,
                background: T.bgMain, color: T.text,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              📥 Export as CSV
            </button>
          </Card>

          {/* Privacy */}
          <div style={{
            padding: '16px 18px', borderRadius: T.radius,
            background: '#f0f7f1', border: '1px solid #c8e6d0',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            boxShadow: T.shadow,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#d5f5e3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>🔒</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1b5e38', marginBottom: 4 }}>100% Private & Local</p>
              <p style={{ fontSize: 12, color: '#2d7a4a', lineHeight: 1.5, margin: 0 }}>All cycle data is stored only on this device. Nothing is uploaded to any server or shared with third parties.</p>
            </div>
          </div>
        </>
      )}

      {/* Confirm period start modal */}
      {showPeriodStart && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 5000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: T.card, borderRadius: 28,
            padding: '32px 24px', maxWidth: 340, width: '100%',
            border: `1px solid ${T.border}`,
            textAlign: 'center',
            boxShadow: T.shadowLg,
          }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🩸</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, marginBottom: 10, letterSpacing: '-0.3px' }}>Start new period?</h3>
            <p style={{ fontSize: 14, color: T.textSec, marginBottom: 28, lineHeight: 1.5 }}>
              You logged flow for <strong>{logDate}</strong>. Would you like to mark this as the start of a new period?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPeriodStart(false)} style={{
                flex: 1, padding: '14px', borderRadius: 14,
                border: `1.5px solid ${T.border}`, background: 'transparent',
                color: T.textSec, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Not Now</button>
              <button onClick={() => startPeriod(logDate)} style={{
                flex: 1, padding: '14px', borderRadius: 14,
                border: 'none', background: T.sage, color: '#fff',
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                boxShadow: `0 4px 14px ${T.sage}44`,
              }}>Yes, Start</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodTracker;
