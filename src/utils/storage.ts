// Types
export interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  longBreakInterval: number;
  spotifyEnabled: boolean;
  autoPauseOnBreak: boolean;
  autoPlayOnFocus: boolean;
}

export interface AppSettings {
  timerSettings: TimerSettings;
  spotifyEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Default settings
export const defaultTimerSettings: TimerSettings = {
  workDuration: 25 * 60, // 25 minutes in seconds
  shortBreakDuration: 5 * 60, // 5 minutes in seconds
  longBreakDuration: 15 * 60, // 15 minutes in seconds
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  spotifyEnabled: false,
  autoPauseOnBreak: false,
  autoPlayOnFocus: false
};

export const defaultAppSettings: AppSettings = {
  timerSettings: defaultTimerSettings,
  spotifyEnabled: false,
  notificationsEnabled: true,
  theme: 'system'
};

// Storage keys
const SETTINGS_STORAGE_KEY = 'pomodoro_app_settings';

// Save settings to localStorage
export const saveAppSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

// Load settings from localStorage
export const loadAppSettings = (): AppSettings => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!storedSettings) {
      return defaultAppSettings;
    }
    
    const parsedSettings = JSON.parse(storedSettings) as AppSettings;
    return {
      ...defaultAppSettings,
      ...parsedSettings,
      timerSettings: {
        ...defaultTimerSettings,
        ...parsedSettings.timerSettings
      }
    };
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return defaultAppSettings;
  }
};

// Save timer settings specifically
export const saveTimerSettings = (settings: TimerSettings): void => {
  const appSettings = loadAppSettings();
  saveAppSettings({
    ...appSettings,
    timerSettings: settings
  });
}; 