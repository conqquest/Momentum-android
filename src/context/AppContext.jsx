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
    localStorage.setItem('profile_gender', gender);
  }, [gender]);

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
          gender,
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
  }, [logs, displayName, gender, habits, user, loading]);

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
    setLogs({});
    setHabits(DEFAULT_HABITS);
    setDisplayName('');
    setGender('');
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
