import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Check, Flame, Zap, TrendingUp, Target } from 'lucide-react';

/* ── Circular Progress Ring (SVG) ────────────────── */
const ProgressRing = ({ pct, size = 80, stroke = 7, color = 'var(--accent-color)' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--border-color)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.175,0.885,0.32,1.275)' }}
      />
    </svg>
  );
};

const HomeView = () => {
  const {
    selectedDate,
    setSelectedDate,
    logs,
    habits,
    toggleHabit,
    setShowJournalModal,
  } = useContext(AppContext);

  /* ── Week strip ─────────────────────────────────── */
  const weeklyDates = useMemo(() => {
    const dates = [];
    const base = new Date(selectedDate);
    const dow = base.getDay();
    const distMon = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(base);
    monday.setDate(base.getDate() + distMon);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push({
        dateStr: `${y}-${m}-${day}`,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      });
    }
    return dates;
  }, [selectedDate]);

  const todayStr = new Date().toISOString().slice(0, 10);

  /* ── Today's data ───────────────────────────────── */
  const log = logs[selectedDate] || { habitsChecked: {} };
  const checked = log.habitsChecked || {};
  const completedCount = habits.filter(h => checked[h.id] === true).length;
  const totalCount = habits.length || 1;
  const pct = Math.round((completedCount / totalCount) * 100);

  /* ── Streak calc ────────────────────────────────── */
  const streak = useMemo(() => {
    let s = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      const l = logs[ds];
      if (!l || !l.habitsChecked) break;
      const any = Object.values(l.habitsChecked).some(Boolean);
      if (!any) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [logs]);

  return (
    <div className="container" style={{ paddingTop: 8 }}>

      {/* ── Week Date Strip ─────────────────────────── */}
      <div className="date-selector" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        {weeklyDates.map(item => (
          <div
            key={item.dateStr}
            className={`date-card ${selectedDate === item.dateStr ? 'active' : ''}`}
            onClick={() => setSelectedDate(item.dateStr)}
            style={{ flex: 1 }}
          >
            <span className="day-lbl">{item.dayName}</span>
            <span className="date-num">{item.dayNum}</span>
          </div>
        ))}
      </div>

      {/* ── Today's Progress Hero Card ──────────────── */}
      <div className="illust-card card-morning" style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 12 }}>
        {/* Progress ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ProgressRing pct={pct} size={82} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Text side */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Today's Progress
          </p>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginTop: 3, lineHeight: 1.2 }}>
            {completedCount}/{totalCount} habits done
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600, lineHeight: 1.4 }}>
            {pct === 100
              ? '🎉 Perfect day! All habits complete.'
              : pct >= 50
              ? 'Keep going — you\'re halfway there!'
              : 'Start your first habit of the day.'}
          </p>
        </div>
      </div>

      {/* ── Metric Grid ─────────────────────────────── */}
      <div className="metric-grid">
        {/* Streak */}
        <div className="metric-card">
          <div className="metric-icon">
            <Flame size={18} color="var(--accent-color)" />
          </div>
          <div className="metric-value">{streak}</div>
          <div className="metric-label">Day Streak</div>
          <div className="metric-sub">days in a row</div>
        </div>

        {/* Completion */}
        <div className="metric-card">
          <div className="metric-icon">
            <Target size={18} color="var(--accent-color)" />
          </div>
          <div className="metric-value">{pct}%</div>
          <div className="metric-label">Today</div>
          <div className="metric-sub">{completedCount} of {totalCount} done</div>
        </div>

        {/* Total habits */}
        <div className="metric-card">
          <div className="metric-icon">
            <Zap size={18} color="var(--accent-color)" />
          </div>
          <div className="metric-value">{habits.length}</div>
          <div className="metric-label">Habits</div>
          <div className="metric-sub">tracked daily</div>
        </div>

        {/* Week avg */}
        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={18} color="var(--accent-color)" />
          </div>
          <div className="metric-value">
            {(() => {
              let total = 0, days = 0;
              for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const ds = d.toISOString().slice(0, 10);
                const l = logs[ds];
                if (l?.habitsChecked && habits.length > 0) {
                  const c = habits.filter(h => l.habitsChecked[h.id] === true).length;
                  total += Math.round((c / habits.length) * 100);
                  days++;
                }
              }
              return days > 0 ? `${Math.round(total / days)}%` : '—';
            })()}
          </div>
          <div className="metric-label">7-Day Avg</div>
          <div className="metric-sub">completion rate</div>
        </div>
      </div>

      {/* ── Habit Checklist ──────────────────────────── */}
      <div className="section-header">
        <span className="section-title">My Habits</span>
        <span
          className="section-see-all"
          onClick={() => setShowJournalModal(true)}
        >
          Log Day
        </span>
      </div>

      {habits.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1.5px dashed var(--border-color)',
          borderRadius: 20, padding: '28px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
            No habits yet
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Go to Profile → Habits to add your first one
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {habits.map(hbt => {
            const done = checked[hbt.id] === true;
            return (
              <div
                key={hbt.id}
                className="habit-item"
                style={done ? {
                  background: 'var(--accent-light)',
                  borderLeftColor: 'var(--accent-color)',
                  borderColor: 'transparent',
                  opacity: 0.9,
                } : {}}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontWeight: 800, fontSize: 14,
                    color: done ? 'var(--accent-color)' : 'var(--text-primary)',
                    display: 'block',
                    textDecoration: done ? 'line-through' : 'none',
                    textDecorationColor: 'var(--accent-color)',
                  }}>
                    {hbt.name}
                  </span>
                  {hbt.category && (
                    <span style={{
                      fontSize: 11, color: 'var(--text-muted)',
                      fontWeight: 600, marginTop: 2, display: 'block',
                    }}>
                      {hbt.category}
                    </span>
                  )}
                </div>

                {/* Checkbox */}
                <div
                  className={`square-checkbox ${done ? 'checked' : ''}`}
                  onClick={() => toggleHabit(selectedDate, hbt.id)}
                  role="checkbox"
                  aria-checked={done}
                  style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 9 }}
                >
                  {done && <Check size={15} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Journal Prompts ─────────────────────── */}
      <div className="section-header">
        <span className="section-title">Quick Journal</span>
        <span className="section-see-all" onClick={() => setShowJournalModal(true)}>
          See all
        </span>
      </div>

      <div className="horizontal-scroll" style={{ marginBottom: 16 }}>
        {[
          {
            card: 'card-pink',
            emoji: '🌱',
            title: 'Pause & reflect',
            body: 'What are you grateful for today?',
            tags: ['Today', 'Personal'],
          },
          {
            card: 'card-purple',
            emoji: '☀️',
            title: 'Set Intentions',
            body: 'How do you want to feel today?',
            tags: ['Today', 'Mindset'],
          },
          {
            card: 'card-green',
            emoji: '💪',
            title: 'Evening wrap',
            body: "What was your biggest win today?",
            tags: ['Evening', 'Growth'],
          },
        ].map((p, i) => (
          <div
            key={i}
            className={`prompt-card ${p.card}`}
            onClick={() => setShowJournalModal(true)}
            style={{ flex: '0 0 190px', minHeight: 130 }}
          >
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                {p.emoji} {p.title}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600, lineHeight: 1.4 }}>
                {p.body}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
              {p.tags.map(t => (
                <span key={t} style={{
                  fontSize: 10, fontWeight: 700,
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(4px)',
                  color: 'var(--text-primary)',
                  padding: '3px 9px', borderRadius: 12,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default HomeView;
