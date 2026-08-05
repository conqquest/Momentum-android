import React, { createContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, isRealFirebase, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

// Built-in Mindfulness Reads / E-books (from Kidory layout)
export const MINDFUL_BOOKS = [
  {
    id: 'mountain-bear',
    title: 'The Boy and The Mountain Bear',
    author: 'Paperpillar Studio',
    category: 'Fantasy',
    episodes: '8 Episodes',
    readCount: '1.2M',
    lovedCount: '2K',
    savedCount: '22',
    description: 'Read a joyous adventure between a boy and a mountain bear deep in a rural village!',
    coverUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=mountain-bear',
    content: `Long time ago, in a quiet village at foot of a tall mountain, there lived a cheerful boy who loved to wander and dream of adventures. He often gazed at the towering peak, wondering what secrets it held beyond the clouds.

One sunny morning, while exploring the forest, the boy heard a deep rumble. From behind the tall pines stepped a great Mountain Bear, its fur shining like snow and eyes glowing with kindness.

The boy's heart skipped, but instead of running away, he approached with an open hand. The bear nudged him gently, and from that day, they explored the mountain paths together, discovering secret valleys and ancient waterfalls.`
  },
  {
    id: 'little-hippo',
    title: 'My Little Hippo',
    author: 'Agus S',
    category: 'Fiction',
    episodes: '8 Episodes',
    readCount: '340K',
    lovedCount: '12K',
    savedCount: '150',
    description: 'Follow a small hippopotamus finding a way home through deep rivers.',
    coverUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=hippo',
    content: `In a cozy marsh where wild lotuses grew, a little hippo named Pip was playing hide-and-seek. Pip was very small, and sometimes he got lost in the high reeds. Today, he wanted to explore the great river path.

He swam past yellow fish and laughing frogs, feeling very brave. But as the sun began to dip, he realized he didn't know the way back!

In the twilight, he saw a glowing firefly. "Follow me," buzzed the firefly, and Pip swam happily home.`
  },
  {
    id: 'forest-bird',
    title: 'Bird In The Forest',
    author: 'Budi O',
    category: 'Mystery',
    episodes: '6 Episodes',
    readCount: '120K',
    lovedCount: '1K',
    savedCount: '80',
    description: 'Discover why the bird sings only when the moon is full.',
    coverUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=bird',
    content: `High in the canopy of the Whispering Woods, a silver bird sat in silence. All the forest animals wondered why the bird never chirped.

Then, one night, the moon rose large and golden. The silver bird spread its wings and sang a melody so sweet that the wind itself stopped to listen.

The secret of the song was simple: the bird only sang when it could reflect the full light of the moon, teaching the forest that sometimes, we need time to reflect and find our own voice.`
  }
];

// Prepopulate 30 days of daily reflections and habit completions for visual graphs
const generateMockLogs = () => {
  const mock = {};
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Emotion breakdown (must add to 100)
    const isHappyDay = Math.random() > 0.4;
    let happy = 40;
    let sad = 20;
    let calm = 20;
    let anxious = 20;

    if (isHappyDay) {
      happy = Math.floor(45 + Math.random() * 20);
      calm = Math.floor(20 + Math.random() * 15);
      sad = Math.floor(5 + Math.random() * 10);
      anxious = 100 - (happy + calm + sad);
    } else {
      sad = Math.floor(35 + Math.random() * 15);
      anxious = Math.floor(25 + Math.random() * 15);
      calm = Math.floor(15 + Math.random() * 10);
      happy = 100 - (sad + anxious + calm);
    }

    const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
    const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    
    const morningReflections = [
      "Woke up feeling refreshed. Grateful for the warm sun.",
      "A bit sleepy today, but eager to learn something new.",
      "Woke up from a strange dream. Intending to stay calm.",
      "Grateful for morning coffee and peaceful silent hours."
    ];
    
    const eveningReflections = [
      "Had a lovely dinner. Enjoyed social chat with mates.",
      "Productive workday. Relaxed with reading in the evening.",
      "Felt active. Completed a 5km run before sunset.",
      "Cozy movie night. Listened to peaceful background music."
    ];

    const momentText = morningReflections[Math.floor(Math.random() * morningReflections.length)] + 
      " " + eveningReflections[Math.floor(Math.random() * eveningReflections.length)];

    // Prepopulate square checkboxes habit completion metrics
    const habitsChecked = {
      workout: Math.random() > 0.4,
      water: Math.random() > 0.25,
      read: Math.random() > 0.35,
      meditation: Math.random() > 0.45,
      sleep: Math.random() > 0.3
    };

    mock[dateStr] = {
      weather,
      moodDetail: isHappyDay ? 'Happy' : 'Calm',
      momentText,
      morningReflect: morningReflections[Math.floor(Math.random() * morningReflections.length)],
      eveningReflect: eveningReflections[Math.floor(Math.random() * eveningReflections.length)],
      emotions: { happy, sad, calm, anxious },
      habitsChecked
    };
  }
  return mock;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('profile_name') || 'Jose Maria';
  });

  // Dynamic habits configurations
  const [habits, setHabits] = useState(() => {
    const local = localStorage.getItem('mindful_habits');
    return local ? JSON.parse(local) : DEFAULT_HABITS;
  });

  // Daily log state: { [date]: { weather, moodDetail, momentText, morningReflect, eveningReflect, emotions, habitsChecked } }
  const [logs, setLogs] = useState(() => {
    const local = localStorage.getItem('mindful_logs');
    if (local) {
      return JSON.parse(local);
    }
    const initialMock = generateMockLogs();
    localStorage.setItem('mindful_logs', JSON.stringify(initialMock));
    return initialMock;
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
            if (data.habits) setHabits(data.habits);
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
  }, [displayName]);

  useEffect(() => {
    localStorage.setItem('mindful_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('mindful_logs', JSON.stringify(logs));
  }, [logs]);

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
          habits,
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
  }, [logs, displayName, habits, user, loading]);

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
    setLogs({});
    setHabits(DEFAULT_HABITS);
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
        habits,
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
