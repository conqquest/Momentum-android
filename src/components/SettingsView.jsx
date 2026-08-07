import React, { useContext, useState, useMemo } from 'react';
import { AppContext, getTodayDateString } from '../context/AppContext';
import { getSavedFirebaseConfig, loginWithGoogle } from '../firebase';
import { 
  Database, ShieldAlert, Key, Download, Upload, RefreshCw, 
  User, Plus, Trash2, ChevronDown, ChevronUp, Flame, Target,
  CalendarDays, TrendingUp, LogIn, Cloud, CloudOff, FileDown, 
  FileUp, Settings, Sparkles, Award, Palette
} from 'lucide-react';

/* ─── Contribution Heatmap Component ─── */
const ContributionHeatmap = ({ logs, habits }) => {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const weeks = 26; // ~6 months
    const cells = [];
    const monthLabels = [];

    // Calculate the start date (weeks * 7 days ago, aligned to Sunday)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7) - startDate.getDay());

    let lastMonth = -1;
    
    for (let week = 0; week <= weeks; week++) {
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + (week * 7) + day);
        
        if (cellDate > today) continue;

        const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
        const log = logs[dateStr];
        let level = 0;

        if (log && log.habitsChecked) {
          const checked = Object.values(log.habitsChecked).filter(Boolean).length;
          const total = habits.length || 1;
          const ratio = checked / total;
          if (ratio > 0) level = 1;
          if (ratio >= 0.25) level = 1;
          if (ratio >= 0.5) level = 2;
          if (ratio >= 0.75) level = 3;
          if (ratio >= 1) level = 4;
        }

        // Track month labels
        if (cellDate.getMonth() !== lastMonth && day === 0) {
          monthLabels.push({
            week,
            label: cellDate.toLocaleDateString('en-US', { month: 'short' })
          });
          lastMonth = cellDate.getMonth();
        }

        cells.push({ week, day, level, dateStr });
      }
    }

    return { cells, monthLabels, weeks };
  }, [logs, habits]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const cellSize = 11;
  const cellGap = 3;
  const labelWidth = 28;
  const topPadding = 18;
  const svgWidth = labelWidth + (heatmapData.weeks + 1) * (cellSize + cellGap) + 10;
  const svgHeight = topPadding + 7 * (cellSize + cellGap) + 4;

  return (
    <div className="heatmap-wrapper">
      <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="heatmap-svg">
        {/* Month labels */}
        {heatmapData.monthLabels.map((m, i) => (
          <text
            key={i}
            x={labelWidth + m.week * (cellSize + cellGap)}
            y={12}
            className="heatmap-month-label"
          >
            {m.label}
          </text>
        ))}

        {/* Day labels */}
        {dayLabels.map((label, i) => (
          label && (
            <text
              key={i}
              x={0}
              y={topPadding + i * (cellSize + cellGap) + cellSize - 1}
              className="heatmap-day-label"
            >
              {label}
            </text>
          )
        ))}

        {/* Grid cells */}
        {heatmapData.cells.map((cell, i) => (
          <rect
            key={i}
            x={labelWidth + cell.week * (cellSize + cellGap)}
            y={topPadding + cell.day * (cellSize + cellGap)}
            width={cellSize}
            height={cellSize}
            rx={2.5}
            ry={2.5}
            className={`heatmap-cell heatmap-level-${cell.level}`}
          >
            <title>{cell.dateStr}: Level {cell.level}</title>
          </rect>
        ))}
      </svg>

      {/* Legend */}
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`heatmap-legend-cell heatmap-level-${level}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

/* ─── Collapsible Section Component ─── */
const CollapsibleSection = ({ icon: Icon, title, iconColor, children, defaultOpen = false, danger = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`profile-section ${danger ? 'profile-section-danger' : ''}`}>
      <button
        className="profile-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="profile-section-title">
          <div className="profile-section-icon" style={{ background: danger ? 'rgba(239,68,68,0.1)' : undefined }}>
            <Icon size={16} color={iconColor || 'var(--accent-color)'} />
          </div>
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </button>
      {isOpen && <div className="profile-section-body">{children}</div>}
    </div>
  );
};


/* ─── Main Settings/Profile View ─── */
const SettingsView = () => {
  const { 
    clearAllData, 
    saveFirebaseConfig, 
    logs, 
    isRealFirebase, 
    displayName, 
    setDisplayName,
    gender,
    user,
    habits,
    addHabit,
    removeHabit,
    themeColor,
    setThemeColor
  } = useContext(AppContext);
  
  const [tempName, setTempName] = useState(displayName);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCat, setNewHabitCat] = useState('Health');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  // Load existing configs
  useState(() => {
    const existing = getSavedFirebaseConfig();
    if (existing) {
      setApiKey(existing.apiKey || '');
      setAuthDomain(existing.authDomain || '');
      setProjectId(existing.projectId || '');
      setStorageBucket(existing.storageBucket || '');
      setMessagingSenderId(existing.messagingSenderId || '');
      setAppId(existing.appId || '');
    }
  });

  /* ─── Stats Computation ─── */
  const stats = useMemo(() => {
    const today = getTodayDateString();
    const logDates = Object.keys(logs).sort();
    let totalActiveDays = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalCompleted = 0;
    let totalPossible = 0;

    // Calculate from all log dates
    logDates.forEach((dateStr) => {
      const log = logs[dateStr];
      if (log && log.habitsChecked) {
        const checked = Object.values(log.habitsChecked).filter(Boolean).length;
        if (checked > 0) {
          totalActiveDays++;
          totalCompleted += checked;
        }
        totalPossible += habits.length;
      }
    });

    // Calculate streaks (going backwards from today)
    const todayDate = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const log = logs[ds];
      if (log && log.habitsChecked) {
        const checked = Object.values(log.habitsChecked).filter(Boolean).length;
        if (checked > 0) {
          tempStreak++;
          if (i <= 1 || currentStreak > 0) currentStreak = tempStreak;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          if (i === 0) { /* today might not be done yet */ }
          else { tempStreak = 0; }
        }
      } else {
        if (i > 0) tempStreak = 0;
      }
    }

    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return { totalActiveDays, currentStreak, bestStreak, completionRate };
  }, [logs, habits]);

  /* ─── Avatar ─── */
  const avatarSeed = gender === 'Female' ? 'Aria' : (gender === 'Non-Binary' ? 'Riley' : 'Felix');
  const avatarUrl = user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${displayName || 'User'}-${avatarSeed}`;

  /* ─── Handlers ─── */
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      setDisplayName(tempName.trim());
      alert('Profile name updated! Hi, ' + tempName.trim());
    }
  };

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const id = newHabitName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (habits.find(h => h.id === id)) {
      alert('A habit with this name already exists!');
      return;
    }
    addHabit({ id, name: newHabitName.trim(), category: newHabitCat });
    setNewHabitName('');
    alert('Habit "' + newHabitName.trim() + '" added successfully!');
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      alert('Sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!apiKey || !authDomain || !projectId) {
      alert('API Key, Auth Domain, and Project ID are minimum requirements!');
      return;
    }
    saveFirebaseConfig({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId });
  };

  const handleClearConfig = () => {
    if (confirm('Clear Firebase config and return to Local Offline Mode?')) {
      saveFirebaseConfig(null);
    }
  };

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `mindful_backup_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      alert('Data export failed.');
    }
  };

  const handleImportData = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && typeof parsed === 'object') {
          localStorage.setItem('mindful_logs', JSON.stringify(parsed));
          alert('Backup data successfully loaded! Refreshing...');
          window.location.reload();
        } else {
          alert('Invalid file format. Backup must be a JSON object.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON.');
      }
    };
  };

  const handleResetApp = () => {
    if (confirm('CAUTION: This will delete ALL logged history and custom configurations. This cannot be undone. Proceed?')) {
      clearAllData();
      alert('All system data cleared. Refreshing page...');
      window.location.reload();
    }
  };

  return (
    <div className="container profile-container">

      {/* ═══ Profile Hero Card ═══ */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-avatar-section">
          <div className="profile-avatar-ring">
            <img src={avatarUrl} alt="Profile" className="profile-hero-avatar" />
          </div>
          <h2 className="profile-hero-name">{displayName}</h2>
          <div className="profile-hero-badge">
            <Sparkles size={12} />
            <span>{gender || 'Adventurer'}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-stats-row">
          <div className="profile-stat">
            <div className="profile-stat-value">{stats.totalActiveDays}</div>
            <div className="profile-stat-label">Active Days</div>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <div className="profile-stat-value">
              <Flame size={14} className="stat-icon flame" />
              {stats.currentStreak}
            </div>
            <div className="profile-stat-label">Current Streak</div>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <div className="profile-stat-value">
              <Award size={14} className="stat-icon award" />
              {stats.bestStreak}
            </div>
            <div className="profile-stat-label">Best Streak</div>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <div className="profile-stat-value">{stats.completionRate}%</div>
            <div className="profile-stat-label">Completion</div>
          </div>
        </div>
      </div>

      {/* ═══ Contribution Heatmap ═══ */}
      <div className="profile-section">
        <div className="profile-section-header" style={{ cursor: 'default' }}>
          <div className="profile-section-title">
            <div className="profile-section-icon">
              <CalendarDays size={16} color="var(--accent-color)" />
            </div>
            <span>Activity Overview</span>
          </div>
        </div>
        <div className="profile-section-body" style={{ paddingTop: '4px' }}>
          <ContributionHeatmap logs={logs} habits={habits} />
        </div>
      </div>

      {/* ═══ Theme Colors ═══ */}
      <div className="profile-section">
        <div className="profile-section-header" style={{ cursor: 'default' }}>
          <div className="profile-section-title">
            <div className="profile-section-icon">
              <Palette size={16} color="var(--accent-color)" />
            </div>
            <span>Appearance Theme</span>
          </div>
        </div>
        <div className="profile-section-body" style={{ paddingTop: '12px', paddingBottom: '16px' }}>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '4px 18px 8px 18px' }}>
            {[
              { id: 'default', color: 'var(--text-primary)' },
              { id: 'blue', color: '#3b82f6' },
              { id: 'purple', color: '#8b5cf6' },
              { id: 'green', color: '#10b981' },
              { id: 'rose', color: '#f43f5e' },
              { id: 'amber', color: '#fbbf24' },
              { id: 'teal', color: '#14b8a6' },
              { id: 'orange', color: '#f97316' },
              { id: 'pink', color: '#ec4899' }
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => setThemeColor(theme.id)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: theme.color,
                  border: themeColor === theme.id ? '2px solid var(--bg-card)' : '2px solid transparent',
                  boxShadow: themeColor === theme.id ? '0 0 0 2px var(--text-primary)' : '0 2px 8px rgba(0,0,0,0.12)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  margin: '2px', /* Crucial to prevent clipping of the 2px box-shadow */
                  transition: 'all 0.2s ease'
                }}
                aria-label={`Select ${theme.id} theme`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Sync & Google Login ═══ */}
      <div className="profile-section">
        <div className="profile-section-body" style={{ padding: '16px 18px' }}>
          {/* Sync Status */}
          <div className="profile-sync-row">
            {isRealFirebase ? (
              <Cloud size={20} color="var(--color-calm)" />
            ) : (
              <CloudOff size={20} color="var(--text-muted)" />
            )}
            <div className="profile-sync-info">
              <span className="profile-sync-title">
                {isRealFirebase ? 'Cloud Sync Active' : 'Local Offline Mode'}
              </span>
              <span className="profile-sync-sub">
                {isRealFirebase 
                  ? 'Data syncs in real-time to Firestore.' 
                  : 'Data is saved in local browser storage.'
                }
              </span>
            </div>
          </div>

          {/* Continue with Google Button */}
          <button
            className="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
        </div>
      </div>

      {/* ═══ Edit Profile ═══ */}
      <CollapsibleSection icon={User} title="Edit Profile" defaultOpen={false}>
        <form onSubmit={handleSaveProfile}>
          <div className="profile-form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="e.g. Jose Maria"
              required
              className="profile-input"
            />
          </div>
          <button type="submit" className="profile-btn profile-btn-primary">
            Update Profile
          </button>
        </form>
      </CollapsibleSection>

      {/* ═══ Manage Habits ═══ */}
      <CollapsibleSection icon={Target} title="Manage Habits" defaultOpen={false}>
        {/* Existing Habits */}
        <div className="profile-habits-list">
          {habits.map((hbt) => (
            <div key={hbt.id} className="profile-habit-item">
              <div>
                <span className="profile-habit-name">{hbt.name}</span>
                <span className="profile-habit-cat">{hbt.category}</span>
              </div>
              <button
                onClick={() => removeHabit(hbt.id)}
                className="profile-habit-delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Habit */}
        <form onSubmit={handleCreateHabit} className="profile-add-habit-form">
          <div className="profile-form-group">
            <label>New Habit Name</label>
            <input
              type="text"
              placeholder="e.g. Read 30 Mins"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              required
              className="profile-input"
            />
          </div>
          <div className="profile-form-group">
            <label>Category</label>
            <select
              value={newHabitCat}
              onChange={(e) => setNewHabitCat(e.target.value)}
              className="profile-input profile-select"
            >
              <option value="Health">Health / Physical</option>
              <option value="Mind">Mind / Focus</option>
              <option value="Work">Work / Creative</option>
            </select>
          </div>
          <button type="submit" className="profile-btn profile-btn-primary">
            <Plus size={16} />
            Add Habit
          </button>
        </form>
      </CollapsibleSection>

      {/* ═══ Data & Backup ═══ */}
      <CollapsibleSection icon={Download} title="Data & Backup" defaultOpen={false}>
        <div className="profile-data-actions">
          <button onClick={handleExportData} className="profile-btn profile-btn-outline">
            <FileDown size={16} />
            Export Backup (JSON)
          </button>
          <label className="profile-btn profile-btn-outline" style={{ cursor: 'pointer' }}>
            <FileUp size={16} />
            Import Backup (JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* ═══ Firebase Config (Advanced) ═══ */}
      <CollapsibleSection icon={Key} title="Firebase Config (Advanced)" defaultOpen={false}>
        <form onSubmit={handleSaveConfig}>
          {[
            { label: 'API Key', value: apiKey, setter: setApiKey, placeholder: 'AIzaSy...', required: true },
            { label: 'Auth Domain', value: authDomain, setter: setAuthDomain, placeholder: 'project-id.firebaseapp.com', required: true },
            { label: 'Project ID', value: projectId, setter: setProjectId, placeholder: 'project-id', required: true },
            { label: 'Storage Bucket', value: storageBucket, setter: setStorageBucket, placeholder: 'project-id.appspot.com' },
            { label: 'Messaging Sender ID', value: messagingSenderId, setter: setMessagingSenderId, placeholder: '839401...' },
            { label: 'App ID', value: appId, setter: setAppId, placeholder: '1:839401:web:...' }
          ].map((field) => (
            <div className="profile-form-group" key={field.label}>
              <label>{field.label}</label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="profile-input"
              />
            </div>
          ))}
          <div className="profile-config-actions">
            {getSavedFirebaseConfig() && (
              <button type="button" className="profile-btn profile-btn-outline" onClick={handleClearConfig} style={{ color: 'var(--danger-color, #ef4444)' }}>
                Remove Config
              </button>
            )}
            <button type="submit" className="profile-btn profile-btn-primary">
              <RefreshCw size={14} />
              Save & Reload
            </button>
          </div>
        </form>
      </CollapsibleSection>

      {/* ═══ Danger Zone ═══ */}
      <CollapsibleSection icon={ShieldAlert} title="Danger Zone" iconColor="#ef4444" danger={true}>
        <p className="profile-danger-text">
          Resetting the application will permanently wipe your journal history. 
          Make sure to export a backup if you wish to keep your records.
        </p>
        <button onClick={handleResetApp} className="profile-btn profile-btn-danger">
          <ShieldAlert size={16} />
          Reset All Data
        </button>
      </CollapsibleSection>

      {/* Version Footer */}
      <div className="profile-footer">
        <span>Momentum v1.0.0</span>
        <span>Made with ♡</span>
      </div>
    </div>
  );
};

export default SettingsView;
