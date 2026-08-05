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
            Completed {completedHabitsCount} out of {totalHabitTasks} habits tracked this month.
          </span>
          {/* Progress bar track */}
          <div style={{ width: '100%', height: '6px', background: '#f3eae3', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${habitCompletionRate}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '3px' }}></div>
          </div>
        </div>
      </div>

      {/* Emotions Panel with Vertical Pill Bars */}
      <div className="glass-card" style={{ borderRadius: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '800' }}>Emotions Breakdown</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>
          Your average emotional states mapped from entries.
        </p>

        <div className="emotion-container">
          {/* Happy Bar */}
          <div className="emotion-column">
            <div className="emotion-track">
              <div className="emotion-fill fill-happy" style={{ height: `${avgHappy}%` }}>
                <span className="emotion-pct">{avgHappy}%</span>
              </div>
            </div>
            <span className="emotion-lbl">Happy</span>
          </div>

          {/* Sad Bar */}
          <div className="emotion-column">
            <div className="emotion-track">
              <div className="emotion-fill fill-sad" style={{ height: `${avgSad}%` }}>
                <span className="emotion-pct">{avgSad}%</span>
              </div>
            </div>
            <span className="emotion-lbl">Sad</span>
          </div>

          {/* Calm Bar */}
          <div className="emotion-column">
            <div className="emotion-track">
              <div className="emotion-fill fill-calm" style={{ height: `${avgCalm}%` }}>
                <span className="emotion-pct">{avgCalm}%</span>
              </div>
            </div>
            <span className="emotion-lbl">Calm</span>
          </div>

          {/* Anxious Bar */}
          <div className="emotion-column">
            <div className="emotion-track">
              <div className="emotion-fill fill-anxious" style={{ height: `${avgAnxious}%` }}>
                <span className="emotion-pct">{avgAnxious}%</span>
              </div>
            </div>
            <span className="emotion-lbl">Anxious</span>
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
