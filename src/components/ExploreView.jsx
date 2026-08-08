import React, { useContext, useMemo } from 'react';
import { AppContext, getTodayDateString } from '../context/AppContext';
import { Capacitor } from '@capacitor/core';
import { CapacitorPedometer } from '@capgo/capacitor-pedometer';
import { 
  Activity, Scale, Ruler, User as UserIcon, Plus, Info, Zap
} from 'lucide-react';

const NutritionProgress = ({ label, current, target, unit, color }) => {
  const percentage = Math.min(100, Math.round((current / target) * 100)) || 0;
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', marginBottom: '6px' }}>
        <span>{label}</span>
        <span style={{ opacity: 0.7 }}>{current} / {target}{unit}</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${percentage}%`, 
            background: color,
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} 
        />
      </div>
    </div>
  );
};

const ExploreView = () => {
  const { userStats, setUserStats, nutritionLogs, setNutritionLogs, gender, themeColor } = useContext(AppContext);
  const today = getTodayDateString();
  const [trackingStatus, setTrackingStatus] = React.useState('idle');

  const todayLog = nutritionLogs[today] || {
    protein: 0,
    carbs: 0,
    fats: 0,
    iron: 0,
    steps: 0
  };

  React.useEffect(() => {
    let listener = null;
    const initTracking = async () => {
      if (trackingStatus === 'tracking' && Capacitor.isNativePlatform()) {
        try {
          await CapacitorPedometer.start();
          listener = await CapacitorPedometer.addListener('step', (data) => {
            // Data usually contains { steps: number }
            if (data && data.steps) {
              setNutritionLogs(prev => ({
                ...prev,
                [today]: {
                  ...(prev[today] || { protein: 0, carbs: 0, fats: 0, iron: 0, steps: 0 }),
                  steps: data.steps
                }
              }));
            }
          });
        } catch (e) {
          console.error("Pedometer error:", e);
        }
      }
    };
    initTracking();
    
    return () => {
      if (listener) listener.remove();
    };
  }, [trackingStatus, today, setNutritionLogs]);

  const handleUpdateStat = (field, value) => {
    setUserStats(prev => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const handleLogNutrition = (field, amount) => {
    setNutritionLogs(prev => ({
      ...prev,
      [today]: {
        ...(prev[today] || { protein: 0, carbs: 0, fats: 0, iron: 0, steps: 0 }),
        [field]: (prev[today]?.[field] || 0) + amount
      }
    }));
  };

  const requestPedometerPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert("Auto-tracking is only available on iOS/Android devices. Mocking approval for web testing.");
      setTrackingStatus('tracking');
      return;
    }
    
    try {
      const permission = await CapacitorPedometer.requestPermissions();
      if (permission.activity === 'granted') {
        setTrackingStatus('tracking');
      } else {
        setTrackingStatus('denied');
        alert("Permission denied. You can re-enable this in device settings.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const bmi = useMemo(() => {
    if (!userStats.weight || !userStats.height) return 0;
    const heightInMeters = userStats.height / 100;
    return (userStats.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }, [userStats]);

  const bmiStatus = useMemo(() => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#3b82f6' };
    if (bmi < 25) return { label: 'Normal', color: '#10b981' };
    if (bmi < 30) return { label: 'Overweight', color: '#f59e0b' };
    return { label: 'Obese', color: '#ef4444' };
  }, [bmi]);

  // Macro Calculations based on standard heuristic (for building "best body")
  const targetProtein = Math.round(userStats.weight * 1.8); // 1.8g per kg
  const targetCarbs = Math.round(userStats.weight * 3); // 3g per kg
  const targetFats = Math.round(userStats.weight * 0.8); // 0.8g per kg
  const targetIron = gender === 'Female' ? 18 : 8; // mg
  const targetSteps = 10000;

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>Body & Nutrition</h2>

      {/* Body Stats Input Card */}
      <div className="profile-section">
        <div className="profile-section-header" style={{ cursor: 'default' }}>
          <div className="profile-section-title">
            <div className="profile-section-icon">
              <UserIcon size={16} color="var(--accent-color)" />
            </div>
            <span>My Physical Profile</span>
          </div>
        </div>
        <div className="profile-section-body" style={{ display: 'flex', gap: '12px', padding: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Weight (kg)</label>
            <input 
              type="number" 
              value={userStats.weight || ''}
              onChange={(e) => handleUpdateStat('weight', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
            <input 
              type="number" 
              value={userStats.height || ''}
              onChange={(e) => handleUpdateStat('height', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Age</label>
            <input 
              type="number" 
              value={userStats.age || ''}
              onChange={(e) => handleUpdateStat('age', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* BMI Indicator */}
      <div className="profile-section" style={{ background: 'var(--accent-color)', color: 'var(--btn-text)', borderColor: 'var(--accent-color)' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase' }}>Current BMI</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: '900' }}>{bmi > 0 ? bmi : '--'}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', background: 'var(--bg-card)', color: bmiStatus.color, padding: '2px 8px', borderRadius: '12px' }}>
                {bmi > 0 ? bmiStatus.label : 'Enter Stats'}
              </span>
            </div>
          </div>
          <Activity size={48} style={{ opacity: 0.2 }} />
        </div>
      </div>

      {/* Nutrition Goals & Tracking */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', marginTop: '24px', color: 'var(--text-primary)' }}>Today's Nutrition Log</h2>
      
      <div className="profile-section" style={{ padding: '20px' }}>
        <NutritionProgress label="Protein (Muscle Growth)" current={todayLog.protein} target={targetProtein} unit="g" color="#3b82f6" />
        <NutritionProgress label="Carbohydrates (Energy)" current={todayLog.carbs} target={targetCarbs} unit="g" color="#f59e0b" />
        <NutritionProgress label="Fats (Hormone Health)" current={todayLog.fats} target={targetFats} unit="g" color="#ec4899" />
        <NutritionProgress label="Iron (Blood Health)" current={todayLog.iron} target={targetIron} unit="mg" color="#8b5cf6" />
      </div>

      {/* Quick Add Buttons */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', marginTop: '24px', color: 'var(--text-primary)' }}>Quick Log</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button 
          className="btn flex-center" 
          style={{ background: 'var(--bg-card)', color: '#3b82f6', border: '1px solid #3b82f6', gap: '6px' }}
          onClick={() => handleLogNutrition('protein', 20)}
        >
          <Plus size={16} /> 20g Protein
        </button>
        <button 
          className="btn flex-center" 
          style={{ background: 'var(--bg-card)', color: '#f59e0b', border: '1px solid #f59e0b', gap: '6px' }}
          onClick={() => handleLogNutrition('carbs', 30)}
        >
          <Plus size={16} /> 30g Carbs
        </button>
        <button 
          className="btn flex-center" 
          style={{ background: 'var(--bg-card)', color: '#ec4899', border: '1px solid #ec4899', gap: '6px' }}
          onClick={() => handleLogNutrition('fats', 10)}
        >
          <Plus size={16} /> 10g Fats
        </button>
        <button 
          className="btn flex-center" 
          style={{ background: 'var(--bg-card)', color: '#8b5cf6', border: '1px solid #8b5cf6', gap: '6px' }}
          onClick={() => handleLogNutrition('iron', 5)}
        >
          <Plus size={16} /> 5mg Iron
        </button>
      </div>

      <div className="profile-section" style={{ marginTop: '24px' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="var(--accent-color)" />
              <span style={{ fontSize: '14px', fontWeight: '800' }}>Daily Steps</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{todayLog.steps} / {targetSteps} steps</div>
          </div>
          
          {trackingStatus === 'tracking' ? (
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #10b981' }}>
              ● Live Sync
            </span>
          ) : (
            <button 
              className="btn btn-primary flex-center"
              onClick={requestPedometerPermission}
              style={{ padding: '8px 16px', fontSize: '11px', fontWeight: '800' }}
            >
              Auto-Track Steps
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default ExploreView;
