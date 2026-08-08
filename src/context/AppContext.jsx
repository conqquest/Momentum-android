import React, { createContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, isRealFirebase, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Preferences } from '@capacitor/preferences';

export const AppContext = createContext();

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Default habits configuration (square checkbox targets)
const DEFAULT_HABITS = [
  { id: 'workout', name: 'Morning Workout', category: 'Health' },
  { id: 'water', name: 'Drink 8 Cups Water', category: 'Health' },
  { id: 'read', name: 'Read 30 Mins', category: 'Mind' },
  { id: 'meditation', name: 'Mindfulness Practice', category: 'Mind' },
  { id: 'sleep', name: '7+ Hours Sleep', category: 'Health' }
];

// Replaced MINDFUL_BOOKS with Nutrition Tracker data

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [showJournalModal, setShowJournalModal] = useState(false);
  
  // Custom display profile settings
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('profile_name') || '';
  });

  const [gender, setGender] = useState(() => {
    return localStorage.getItem('profile_gender') || '';
  });

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('profile_theme') || 'default';
  });

  // Dynamic habits configurations
  const [habits, setHabits] = useState(() => {
    const local = localStorage.getItem('mindful_habits');
    return local ? JSON.parse(local) : DEFAULT_HABITS;
  });

  // Daily log state: { [date]: { weather, moodDetail, momentText, morningReflect, eveningReflect, emotions, habitsChecked } }
  const [logs, setLogs] = useState(() => {
    const local = localStorage.getItem('mindful_logs');
    return local ? JSON.parse(local) : {};
  });

  const [userStats, setUserStats] = useState(() => {
    const local = localStorage.getItem('profile_stats');
    return local ? JSON.parse(local) : { weight: 70, height: 170, age: 25 };
  });

  const [nutritionLogs, setNutritionLogs] = useState(() => {
    const local = localStorage.getItem('nutrition_logs');
    return local ? JSON.parse(local) : {};
  });

  // Subscribe to auth updates
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.displayName) {
        setDisplayName(currentUser.displayName);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch data from Firestore if active
  useEffect(() => {
    if (loading) return;

    const fetchUserData = async () => {
      if (user && isRealFirebase && db) {
        setSyncing(true);
        try {
          const userDocRef = doc(db, 'users', user.uid, 'data', 'mindful_journal');
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.logs) setLogs(data.logs);
            if (data.displayName) setDisplayName(data.displayName);
            if (data.gender) setGender(data.gender);
            if (data.themeColor) setThemeColor(data.themeColor);
            if (data.habits) setHabits(data.habits);
            if (data.userStats) setUserStats(data.userStats);
            if (data.nutritionLogs) setNutritionLogs(data.nutritionLogs);
            console.log('Mindful log fetched from Firestore');
          }
        } catch (err) {
          console.warn('Firestore fetch failed. Falling back to local cache:', err);
        } finally {
          setSyncing(false);
        }
      }
    };

    fetchUserData();
  }, [user, loading]);

  // Save changes locally
  useEffect(() => {
    localStorage.setItem('profile_name', displayName);
    localStorage.setItem('profile_gender', gender);
    localStorage.setItem('profile_theme', themeColor);
    localStorage.setItem('profile_stats', JSON.stringify(userStats));
  }, [displayName, gender, themeColor, userStats]);

  useEffect(() => {
    localStorage.setItem('mindful_logs', JSON.stringify(logs));
    localStorage.setItem('mindful_habits', JSON.stringify(habits));
    localStorage.setItem('nutrition_logs', JSON.stringify(nutritionLogs));
  }, [logs, habits, nutritionLogs]);

  // Sync today's habit completion status to SharedPreferences for native AppWidget access
  useEffect(() => {
    const syncWidgetData = async () => {
      try {
        const todayStr = getTodayDateString();
        const todayLog = logs[todayStr] || {};
        const checked = todayLog.habitsChecked || {};
        const completedCount = habits.filter(h => checked[h.id] === true).length;
        const totalCount = habits.length;

        // Save keys using Preferences so it registers in CapacitorStorage shared preference
        await Preferences.set({
          key: 'widget_habits_completed',
          value: String(completedCount)
        });
        await Preferences.set({
          key: 'widget_habits_total',
          value: String(totalCount)
        });
        
        // Also save today's date string to check freshness
        await Preferences.set({
          key: 'widget_last_update_date',
          value: todayStr
        });
      } catch (err) {
        console.warn('Preferences widget sync failed:', err);
      }
    };
    syncWidgetData();
  }, [logs, habits]);

  // Sync to Firestore
  useEffect(() => {
    if (loading || !user || !isRealFirebase || !db) return;

    const timer = setTimeout(async () => {
      setSyncing(true);
      try {
        const userDocRef = doc(db, 'users', user.uid, 'data', 'mindful_journal');
        await setDoc(userDocRef, {
          logs,
          displayName,
          gender,
          themeColor,
          habits,
          userStats,
          nutritionLogs,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        console.log('Mindful logs synced to Firestore.');
      } catch (err) {
        console.error('Mindful sync failed:', err);
      } finally {
        setSyncing(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [logs, displayName, gender, themeColor, habits, userStats, nutritionLogs, user, loading]);

  // Update a daily entry log
  const saveDailyEntry = (date, entryObj) => {
    setLogs((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        ...entryObj
      }
    }));
  };

  // Toggle habit checkbox (square checkbox) status
  const toggleHabit = (date, habitId) => {
    setLogs((prev) => {
      const dateLog = prev[date] || {
        weather: 'Sunny',
        moodDetail: 'Calm',
        momentText: '',
        emotions: { happy: 25, sad: 25, calm: 25, anxious: 25 },
        habitsChecked: {}
      };
      
      const currentChecked = dateLog.habitsChecked || {};
      const updatedChecked = {
        ...currentChecked,
        [habitId]: !currentChecked[habitId]
      };

      return {
        ...prev,
        [date]: {
          ...dateLog,
          habitsChecked: updatedChecked
        }
      };
    });
  };

  // Add custom habits
  const addHabit = (habit) => {
    setHabits((prev) => [...prev, habit]);
  };

  // Delete habit
  const removeHabit = (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  // Reset data
  const clearAllData = () => {
    localStorage.removeItem('mindful_logs');
    localStorage.removeItem('mindful_habits');
    localStorage.removeItem('profile_name');
    localStorage.removeItem('profile_gender');
    localStorage.removeItem('profile_theme');
    setLogs({});
    setHabits(DEFAULT_HABITS);
    setDisplayName('');
    setGender('');
    setThemeColor('default');
  };

  const saveFirebaseConfig = (config) => {
    if (config) {
      localStorage.setItem('firebase_config', JSON.stringify(config));
    } else {
      localStorage.removeItem('firebase_config');
    }
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        syncing,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        showJournalModal,
        setShowJournalModal,
        displayName,
        setDisplayName,
        gender,
        setGender,
        themeColor,
        setThemeColor,
        habits,
        setHabits,
        userStats,
        setUserStats,
        nutritionLogs,
        setNutritionLogs,
        logs,
        toggleHabit,
        addHabit,
        removeHabit,
        saveDailyEntry,
        clearAllData,
        saveFirebaseConfig,
        isRealFirebase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
