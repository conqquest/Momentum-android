/**
 * NotificationService.js
 * Manages all local push notifications for Momentum using @capacitor/local-notifications
 * 
 * Features:
 *  - Repeating every-4-hour habit reminders
 *  - Custom notification titles/bodies based on completion status
 *  - Permission request flow
 *  - Enable/disable toggle persisted to localStorage
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NOTIFICATION_IDS = {
  HABIT_REMINDER_BASE: 1000, // IDs 1000-1005 reserved for the 4-hour reminders
};

const PREF_KEY = 'notifications_enabled';
const INTERVAL_HOURS = 4;

// Motivational notification messages rotated through
const REMINDER_MESSAGES = [
  {
    title: '⏰ Time to check your habits!',
    body: 'A few minutes of tracking keeps your momentum going. Tap to log now.',
  },
  {
    title: '🔥 Keep the streak alive!',
    body: "Don't let today slip by — mark off your habits and stay on track.",
  },
  {
    title: '✨ Momentum check-in',
    body: 'Small steps every day lead to big changes. How are your habits going?',
  },
  {
    title: '💪 You\'ve got this!',
    body: 'A quick habit check-in takes less than 30 seconds. Let\'s go!',
  },
  {
    title: '🌱 Build your best self',
    body: 'Consistency is the key. Open Momentum and log your progress.',
  },
  {
    title: '📊 Daily progress reminder',
    body: "It's a great time to update your habits and see how you're doing today.",
  },
];

/**
 * Check whether we are on a native platform.
 * Notifications only work on Android/iOS — gracefully no-op on web.
 */
const isNative = () => Capacitor.isNativePlatform();

/**
 * Returns true if the user has enabled notifications (from localStorage).
 */
export const areNotificationsEnabled = () =>
  localStorage.getItem(PREF_KEY) === 'true';

/**
 * Request notification permission from the OS.
 * Returns 'granted' | 'denied' | 'prompt'.
 */
export const requestNotificationPermission = async () => {
  if (!isNative()) {
    console.log('[Notifications] Not on native — skipping permission request.');
    return 'granted'; // Simulate granted on web for dev
  }
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return 'granted';

    const result = await LocalNotifications.requestPermissions();
    return result.display; // 'granted' | 'denied' | 'prompt'
  } catch (err) {
    console.error('[Notifications] Permission request failed:', err);
    return 'denied';
  }
};

/**
 * Cancel ALL scheduled habit reminder notifications.
 */
export const cancelHabitReminders = async () => {
  if (!isNative()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications
      .filter(n => n.id >= NOTIFICATION_IDS.HABIT_REMINDER_BASE && n.id < NOTIFICATION_IDS.HABIT_REMINDER_BASE + 10)
      .map(n => ({ id: n.id }));

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
      console.log(`[Notifications] Cancelled ${toCancel.length} reminders.`);
    }
  } catch (err) {
    console.error('[Notifications] Failed to cancel reminders:', err);
  }
};

/**
 * Schedule 6 repeating habit reminders spaced 4 hours apart.
 * On Android, Capacitor's local-notifications doesn't support true "repeat every N hours"
 * natively in all versions, so we schedule the next 6 reminders (covering 24 hours)
 * and reschedule each time the app opens.
 *
 * @param {number} completedToday - Number of habits completed today (for personalisation)
 * @param {number} totalHabits    - Total number of habits
 */
export const scheduleHabitReminders = async (completedToday = 0, totalHabits = 0) => {
  if (!isNative()) {
    console.log('[Notifications] Web mode — not scheduling native notifications.');
    return;
  }

  // First cancel any existing reminders to avoid duplicates
  await cancelHabitReminders();

  const notifications = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const fireAt = new Date(now.getTime() + (i + 1) * INTERVAL_HOURS * 60 * 60 * 1000);

    // Pick a message — rotate through the list
    const msgIdx = i % REMINDER_MESSAGES.length;
    const msg = REMINDER_MESSAGES[msgIdx];

    // Personalise body if we know completion status
    let body = msg.body;
    if (totalHabits > 0) {
      const remaining = totalHabits - completedToday;
      if (completedToday === totalHabits) {
        body = `🏆 Amazing! You completed all ${totalHabits} habits today. Keep it up tomorrow!`;
      } else if (remaining > 0) {
        body = `You have ${remaining} habit${remaining !== 1 ? 's' : ''} left today. Tap to complete them now!`;
      }
    }

    notifications.push({
      id: NOTIFICATION_IDS.HABIT_REMINDER_BASE + i,
      title: msg.title,
      body,
      schedule: { at: fireAt },
      sound: 'default',
      smallIcon: 'ic_launcher_round',
      iconColor: '#EC4899',
      channelId: 'momentum_reminders',
      extra: { type: 'habit_reminder' },
    });
  }

  try {
    // Create the notification channel (Android 8+)
    await LocalNotifications.createChannel({
      id: 'momentum_reminders',
      name: 'Habit Reminders',
      description: 'Reminds you to check in on your habits every 4 hours',
      importance: 4, // HIGH
      visibility: 1, // PUBLIC
      vibration: true,
      sound: 'default',
    });

    await LocalNotifications.schedule({ notifications });
    console.log(`[Notifications] Scheduled ${notifications.length} reminders every ${INTERVAL_HOURS}h.`);
  } catch (err) {
    console.error('[Notifications] Scheduling failed:', err);
    throw err;
  }
};

/**
 * Master toggle: enable or disable all notifications.
 * Call this from the Settings UI.
 *
 * @param {boolean} enable
 * @param {number}  completedToday
 * @param {number}  totalHabits
 * @returns {Promise<'granted'|'denied'|'already_off'>}
 */
export const setNotificationsEnabled = async (enable, completedToday = 0, totalHabits = 0) => {
  if (enable) {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return 'denied';

    localStorage.setItem(PREF_KEY, 'true');
    await scheduleHabitReminders(completedToday, totalHabits);
    return 'granted';
  } else {
    localStorage.setItem(PREF_KEY, 'false');
    await cancelHabitReminders();
    return 'already_off';
  }
};

/**
 * Initialise on app launch:
 * If notifications are enabled, re-schedule them (refreshes the next 24h window)
 * and register the action tap handler.
 */
export const initNotifications = async (completedToday = 0, totalHabits = 0) => {
  if (!areNotificationsEnabled()) return;

  await scheduleHabitReminders(completedToday, totalHabits);

  if (isNative()) {
    // Listen for notification taps and navigate to home
    await LocalNotifications.addListener('localNotificationActionPerformed', () => {
      console.log('[Notifications] User tapped habit reminder notification.');
      // The app opens automatically when tapped — no extra navigation needed
    });
  }
};
