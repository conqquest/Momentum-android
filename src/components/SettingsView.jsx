import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { getSavedFirebaseConfig } from '../firebase';
import { Database, ShieldAlert, Key, Download, Upload, RefreshCw, User, Plus, Trash2 } from 'lucide-react';

const SettingsView = () => {
  const { 
    clearAllData, 
    saveFirebaseConfig, 
    logs, 
    isRealFirebase, 
    displayName, 
    setDisplayName,
    habits,
    addHabit,
    removeHabit
  } = useContext(AppContext);
  
  const [tempName, setTempName] = useState(displayName);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCat, setNewHabitCat] = useState('Health');

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

    addHabit({
      id,
      name: newHabitName.trim(),
      category: newHabitCat
    });

    setNewHabitName('');
    alert('Habit "' + newHabitName.trim() + '" added successfully!');
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!apiKey || !authDomain || !projectId) {
      alert('API Key, Auth Domain, and Project ID are minimum requirements!');
      return;
    }

    saveFirebaseConfig({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    });
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
    <div className="container">
      {/* Profile settings */}
      <div className="glass-card" style={{ borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <User size={18} color="var(--accent-color)" />
          <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>Profile Settings</h3>
        </div>
        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="e.g. Jose Maria"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: '16px' }}>
            Update Profile Name
          </button>
        </form>
      </div>

      {/* Habit Manager (Square Checkbox Configurations) */}
      <div className="glass-card" style={{ borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Plus size={18} color="var(--accent-color)" />
          <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>Manage Habit Trackers</h3>
        </div>

        {/* Existing Habits List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {habits.map((hbt) => (
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
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>{hbt.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{hbt.category}</span>
              </div>
              <button
                onClick={() => removeHabit(hbt.id)}
                className="btn btn-danger flex-center"
                style={{
                  width: '32px',
                  height: '32px',
                  minHeight: '32px',
                  padding: 0,
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger-color)'
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Habit Form */}
        <form onSubmit={handleCreateHabit} style={{ borderTop: '1.5px solid var(--border-color)', paddingTop: '16px' }}>
          <div className="form-group">
            <label>New Habit Name</label>
            <input
              type="text"
              placeholder="e.g. Read 30 Mins, Drink Tea"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={newHabitCat}
              onChange={(e) => setNewHabitCat(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 14px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="Health">Health / Physical</option>
              <option value="Mind">Mind / Focus</option>
              <option value="Work">Work / Creative</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: '16px', marginTop: '10px' }}>
            Add Habit
          </button>
        </form>
      </div>

      {/* Sync Mode Notification */}
      <div className="glass-card flex-row" style={{ gap: '12px', borderRadius: '24px' }}>
        <Database size={24} color={isRealFirebase ? 'var(--success-color)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: '700', fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>
            Sync Mode: {isRealFirebase ? 'Cloud Mode' : 'Local Offline Mode'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {isRealFirebase 
              ? 'Your data syncs in real-time to Firestore database.' 
              : 'Data is saved in local browser storage only.'
            }
          </span>
        </div>
      </div>

      {/* Firebase Config Section */}
      <div className="glass-card" style={{ borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Key size={18} color="var(--accent-color)" />
          <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>Google Login & Firebase Config</h3>
        </div>

        <form onSubmit={handleSaveConfig}>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              required
            />
          </div>

          <div className="form-group">
            <label>Auth Domain</label>
            <input
              type="text"
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
              placeholder="project-id.firebaseapp.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="project-id"
              required
            />
          </div>

          <div className="form-group">
            <label>Storage Bucket</label>
            <input
              type="text"
              value={storageBucket}
              onChange={(e) => setStorageBucket(e.target.value)}
              placeholder="project-id.appspot.com"
            />
          </div>

          <div className="form-group">
            <label>Messaging Sender ID</label>
            <input
              type="text"
              value={messagingSenderId}
              onChange={(e) => setMessagingSenderId(e.target.value)}
              placeholder="839401..."
            />
          </div>

          <div className="form-group">
            <label>App ID</label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="1:839401:web:..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {getSavedFirebaseConfig() && (
              <button type="button" className="btn btn-secondary" onClick={handleClearConfig} style={{ flex: 1, color: 'var(--danger-color)' }}>
                Remove config
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: '16px' }}>
              <RefreshCw size={12} />
              Save & Reload
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Restore */}
      <div className="glass-card" style={{ borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Download size={18} color="var(--accent-color)" />
          <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>Data Management</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={handleExportData} className="btn btn-secondary flex-center" style={{ width: '100%', borderRadius: '16px' }}>
            Export Data Backup (JSON)
          </button>

          <div>
            <label className="btn btn-secondary flex-center" style={{ width: '100%', cursor: 'pointer', borderRadius: '16px' }}>
              Import Data Backup (JSON)
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Reset Section */}
      <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldAlert size={18} color="var(--danger-color)" />
          <h3 style={{ color: 'var(--danger-color)', margin: 0, fontSize: '13px' }}>Danger Zone</h3>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Resetting the application will permanently wipe your journal history. Make sure to export a backup if you wish to keep your records.
        </p>
        <button onClick={handleResetApp} className="btn btn-danger" style={{ width: '100%', borderRadius: '16px' }}>
          Reset System Data
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
