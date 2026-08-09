import React, { createContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, isRealFirebase } from '../firebase';
import { Preferences } from '@capacitor/preferences';

export const AppContext = createContext();

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_HABITS = [
  { id: 'workout', name: 'Morning Workout', category: 'Health' },
  { id: 'water', name: 'Drink 8 Cups Water', category: 'Health' },
  { id: 'read', name: 'Read 30 Mins', category: 'Mind' },
  { id: 'meditation', name: 'Mindfulness Practice', category: 'Mind' },
  { id: 'sleep', name: '7+ Hours Sleep', category: 'Health' }
];

const BACKEND_URL = 'https://momentum-backend-9fuq.onrender.com';

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [showJournalModal, setShowJournalModal] = useState(false);
  
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('auth_mode') === 'guest';
  });
  
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('profile_name') || '';
  });

  const [gender, setGender] = useState(() => {
    return localStorage.getItem('profile_gender') || '';
  });

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('profile_theme') || 'default';
  });

  const [habits, setHabits] = useState(() => {
    const local = localStorage.getItem('mindful_habits');
    return local ? JSON.parse(local) : DEFAULT_HABITS;
  });

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

  // API Request helper with Bearer Token auth using user.uid as token
  const apiRequest = async (endpoint, method = 'GET', body = null) => {
    if (!user) return null;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.uid}`
    };
    const options = {
      method,
      headers
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API request to ${endpoint} failed:`, err);
      throw err;
    }
  };

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

  // Fetch and Sync data from Backend when user is logged in
  useEffect(() => {
    if (loading || !user || isGuest) return;

    const fetchUserData = async () => {
      setSyncing(true);
      try {
        // 1. Sync User Profile details on login
        await apiRequest('/api/user/sync', 'POST', {
          email: user.email,
          displayName: displayName || user.displayName,
          gender,
          themeColor,
          weight: userStats.weight,
          height: userStats.height,
          age: userStats.age
        });

        // 2. Fetch User & Habits
        const userData = await apiRequest('/api/user', 'GET');
        if (userData) {
          if (userData.displayName) setDisplayName(userData.displayName);
          if (userData.gender) setGender(userData.gender);
          if (userData.themeColor) setThemeColor(userData.themeColor);
          if (userData.weight || userData.height || userData.age) {
            setUserStats({
              weight: userData.weight || 70,
              height: userData.height || 170,
              age: userData.age || 25
            });
          }
          if (userData.habits && userData.habits.length > 0) {
            setHabits(userData.habits);
          } else {
            // New user - seed default habits into backend database
            for (const h of DEFAULT_HABITS) {
              await apiRequest('/api/habits', 'POST', { name: h.name, category: h.category });
            }
            const refreshed = await apiRequest('/api/user', 'GET');
            if (refreshed && refreshed.habits) setHabits(refreshed.habits);
          }
        }

        // 3. Fetch History of Logs
        const history = await apiRequest('/api/logs/history', 'GET');
        if (history && Array.isArray(history)) {
          const parsedLogs = {};
          const parsedNutrition = {};

          history.forEach(log => {
            let habitsCheckedObj = {};
            try {
              const checkedArray = JSON.parse(log.habitsChecked || '[]');
              if (Array.isArray(checkedArray)) {
                checkedArray.forEach(id => {
                  habitsCheckedObj[id] = true;
                });
              } else if (typeof checkedArray === 'object' && checkedArray !== null) {
                habitsCheckedObj = checkedArray;
              }
            } catch (e) {
              console.error("Failed to parse habitsChecked:", e);
            }

            let emotionsObj = { happy: 25, sad: 25, calm: 25, anxious: 25 };
            try {
              if (log.emotions) {
                emotionsObj = JSON.parse(log.emotions);
              }
            } catch (e) {
              console.error("Failed to parse emotions:", e);
            }

            parsedLogs[log.date] = {
              morningReflect: log.morningReflect || '',
              eveningReflect: log.eveningReflect || '',
              momentText: log.momentText || '',
              moodDetail: log.moodDetail || 'Calm',
              habitsChecked: habitsCheckedObj,
              emotions: emotionsObj
            };

            parsedNutrition[log.date] = {
              protein: log.protein || 0,
              carbs: log.carbs || 0,
              fats: log.fats || 0,
              iron: log.iron || 0,
              steps: log.steps || 0
            };
          });

          setLogs(parsedLogs);
          setNutritionLogs(parsedNutrition);
        }
      } catch (err) {
        console.warn('Backend fetch failed. Using local storage cache as fallback.', err);
      } finally {
        setSyncing(false);
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

        await Preferences.set({
          key: 'widget_habits_completed',
          value: String(completedCount)
        });
        await Preferences.set({
          key: 'widget_habits_total',
          value: String(totalCount)
        });
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

  // Sync Profile updates to backend
  useEffect(() => {
    if (loading || !user || isGuest) return;

    const timer = setTimeout(async () => {
      setSyncing(true);
      try {
        await apiRequest('/api/user/sync', 'POST', {
          email: user.email,
          displayName,
          gender,
          themeColor,
          weight: userStats.weight,
          height: userStats.height,
          age: userStats.age
        });
      } catch (err) {
        console.error("Profile sync to backend failed:", err);
      } finally {
        setSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [displayName, gender, themeColor, userStats, user, loading]);

  // Sync Logs & Nutrition to backend (Debounced)
  useEffect(() => {
    if (loading || !user || isGuest) return;

    const timer = setTimeout(async () => {
      setSyncing(true);
      try {
        const datesToSync = Array.from(new Set([getTodayDateString(), selectedDate]));
        
        for (const date of datesToSync) {
          const currentLog = logs[date] || {};
          const currentNutrition = nutritionLogs[date] || {};
          
          const payload = {
            date,
            morningReflect: currentLog.morningReflect || null,
            eveningReflect: currentLog.eveningReflect || null,
            momentText: currentLog.momentText || null,
            moodDetail: currentLog.moodDetail || null,
            emotions: currentLog.emotions || null,
            protein: currentNutrition.protein || 0,
            carbs: currentNutrition.carbs || 0,
            fats: currentNutrition.fats || 0,
            iron: currentNutrition.iron || 0,
            steps: currentNutrition.steps || 0,
            habitsChecked: Object.keys(currentLog.habitsChecked || {}).filter(k => currentLog.habitsChecked[k] === true)
          };
          
          await apiRequest('/api/logs/daily', 'POST', payload);
        }
        console.log("Logs synced to Render PostgreSQL backend successfully.");
      } catch (err) {
        console.error("Failed to sync daily logs to backend:", err);
      } finally {
        setSyncing(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [logs, nutritionLogs, user, loading, selectedDate]);

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

  // Toggle habit checkbox
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

  // Add habit
  const addHabit = async (habit) => {
    if (isGuest) {
      setHabits((prev) => [...prev, habit]);
      return;
    }
    try {
      const savedHabit = await apiRequest('/api/habits', 'POST', {
        name: habit.name,
        category: habit.category
      });
      if (savedHabit) {
        setHabits((prev) => [...prev, savedHabit]);
      }
    } catch (err) {
      console.error("Failed to add habit to backend:", err);
      setHabits((prev) => [...prev, habit]);
    }
  };

  // Remove habit
  const removeHabit = async (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    if (isGuest) return;
    try {
      await apiRequest(`/api/habits/${id}`, 'DELETE');
    } catch (err) {
      console.error("Failed to delete habit from backend:", err);
    }
  };

  // Reset data
  const clearAllData = () => {
    localStorage.removeItem('mindful_logs');
    localStorage.removeItem('mindful_habits');
    localStorage.removeItem('profile_name');
    localStorage.removeItem('profile_gender');
    localStorage.removeItem('profile_theme');
    localStorage.removeItem('profile_stats');
    localStorage.removeItem('nutrition_logs');
    localStorage.removeItem('auth_mode');
    setLogs({});
    setHabits(DEFAULT_HABITS);
    setDisplayName('');
    setGender('');
    setThemeColor('default');
    setUserStats({ weight: 70, height: 170, age: 25 });
    setNutritionLogs({});
    setIsGuest(false);
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
        isRealFirebase,
        isGuest,
        setIsGuest
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
