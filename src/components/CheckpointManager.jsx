import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, Trash2, Shield } from 'lucide-react';

const CheckpointManager = () => {
  const { checkpoints, addCheckpoint, removeCheckpoint } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('binary');
  const [section, setSection] = useState('habits');
  const [unit, setUnit] = useState('');

  // Checkpoints cannot be duplicates
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if exists
    if (checkpoints.find((c) => c.id === id)) {
      alert('A tracker with a similar name already exists!');
      return;
    }

    const newCheckpoint = {
      id,
      name: name.trim(),
      type,
      section,
      ...(type === 'numeric' && { unit: unit.trim() || 'qty' }),
      ...(type === 'scale' && { min: 1, max: 10, default: 5 }),
      custom: true
    };

    addCheckpoint(newCheckpoint);
    setName('');
    setType('binary');
    setUnit('');
    setShowModal(false);
  };

  const groupCheckpoints = (sec) => checkpoints.filter((c) => c.section === sec);

  return (
    <div className="container">
      <div className="flex-row" style={{ marginBottom: '16px' }}>
        <h2>Configure Trackers</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '8px 14px' }}>
          <Plus size={16} />
          Add Custom
        </button>
      </div>

      {['vitals', 'habits', 'meds'].map((sec) => {
        const title = sec === 'vitals' ? 'Vitals & Sliders' : sec === 'habits' ? 'Daily Checkpoints' : 'Meds & Supplements';
        const list = groupCheckpoints(sec);

        return (
          <div key={sec} className="glass-card" style={{ marginBottom: '20px' }}>
            <h3>{title}</h3>
            {list.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0' }}>No trackers in this category.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {list.map((c) => (
                  <div
                    key={c.id}
                    className="flex-row"
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '500', fontSize: '14px', display: 'block' }}>{c.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {c.type} {c.unit ? `(${c.unit})` : ''}
                      </span>
                    </div>
                    {c.custom ? (
                      <button
                        onClick={() => removeCheckpoint(c.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 8px', minHeight: '32px', background: 'transparent', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span className="flex-center" style={{ color: 'var(--text-muted)' }} title="Built-in System Tracker">
                        <Shield size={14} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal Dialog for Adding Custom Checkpoint */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '16px' }}>Add Custom Tracker</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tracker Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cold Exposure, Meditation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Input Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px'
                  }}
                >
                  <option value="binary">Checkbox (Yes/No)</option>
                  <option value="scale">Rating Scale (1-10)</option>
                  <option value="numeric">Numeric Value</option>
                </select>
              </div>

              {type === 'numeric' && (
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. mins, kg, oz, cups"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Category Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-family)',
                    fontSize: '15px'
                  }}
                >
                  <option value="habits">Daily Checkpoints</option>
                  <option value="vitals">Vitals & Sliders</option>
                  <option value="meds">Meds & Supplements</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckpointManager;
