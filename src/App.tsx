import { useState, useEffect, useRef } from 'react';
import './App.css';
import { CogIcon } from '@heroicons/react/24/solid';
import { loadAppSettings, saveTimerSettings, TimerSettings } from './utils/storage';
import { requestNotificationPermission } from './utils/notifications';
import AnimatedBackground from './components/AnimatedBackground';
import Timer from './components/Timer';
import { TimerMode as TimerComponentMode } from './timerTypes';

// Timer modes
enum TimerMode {
  WORK = 'work',
  SHORT_BREAK = 'shortBreak',
  LONG_BREAK = 'longBreak',
}

// Mode mapping between App modes and Timer component modes
const modeMapping = {
  [TimerMode.WORK]: TimerComponentMode.FOCUS,
  [TimerMode.SHORT_BREAK]: TimerComponentMode.SHORT_BREAK,
  [TimerMode.LONG_BREAK]: TimerComponentMode.LONG_BREAK
};

const reverseModeMapping = {
  [TimerComponentMode.FOCUS]: TimerMode.WORK,
  [TimerComponentMode.SHORT_BREAK]: TimerMode.SHORT_BREAK,
  [TimerComponentMode.LONG_BREAK]: TimerMode.LONG_BREAK
};

function App() {
  // Load settings from localStorage with Spotify enabled for testing
  const initialSettings = {
    ...loadAppSettings(),
    spotifyEnabled: true // Enable Spotify for testing
  };
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(initialSettings.timerSettings);
  
  // Timer state
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [pomodoroSequence, setPomodoroSequence] = useState<number>(0); // Track position in pomodoro sequence
  const timerRef = useRef<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [shouldAutoStart, setShouldAutoStart] = useState<boolean>(false);

  // Request notification permission when the app loads
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Effect for timer countdown - removed as the Timer component handles this
  useEffect(() => {
    // App.tsx no longer handles the timer countdown directly
    // When isActive changes, we simply sync with the Timer component
    
    if (!isActive && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  // Effect to reset timer when mode changes - this is a key function for auto-starting
  useEffect(() => {
    console.log("Mode changed to:", mode, "shouldAutoStart:", shouldAutoStart);
    
    // Auto-start if needed - with a slight delay to ensure notification plays first
    if (shouldAutoStart) {
      console.log("Auto-starting timer...");
      const timer = setTimeout(() => {
        setIsActive(true);
        setShouldAutoStart(false);
      }, 800); // Increased delay to ensure notification completes
      
      return () => clearTimeout(timer);
    } else {
      setIsActive(false);
    }
  }, [mode, shouldAutoStart]);

  // Handle timer completion
  const handleTimerComplete = () => {
    console.log("Timer completed handler called in App.tsx");
    // Play notification sound and show browser notification
    if (mode === TimerMode.WORK) {
      // Notification already handled in Timer component
      
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      // Update pomodoro sequence
      const newSequence = pomodoroSequence + 1;
      setPomodoroSequence(newSequence);
      
      // Determine which break to take based on sequence
      const shouldTakeLongBreak = newSequence % 4 === 0;
      const nextMode = shouldTakeLongBreak ? TimerMode.LONG_BREAK : TimerMode.SHORT_BREAK;
      
      console.log("Work completed - setting autoStart to:", timerSettings.autoStartBreaks);
      
      // Auto-start break if enabled
      setShouldAutoStart(timerSettings.autoStartBreaks);
      
      // Change mode
      setMode(nextMode);
    } else {
      // Notification already handled in Timer component
      console.log("Break completed - setting autoStart to:", timerSettings.autoStartPomodoros);
      
      // Auto-start pomodoro if enabled
      setShouldAutoStart(timerSettings.autoStartPomodoros);
      
      // Change mode
      setMode(TimerMode.WORK);
    }
  };

  // Custom mode change handler to preserve pomodoro sequence
  const handleModeChange = (newMode: TimerComponentMode) => {
    // If user manually changes mode, don't auto-start
    setShouldAutoStart(false);
    setMode(reverseModeMapping[newMode]);
  };

  // Handle settings save
  const handleSaveSettings = (newSettings: TimerSettings) => {
    setTimerSettings(newSettings);
    saveTimerSettings(newSettings);
    
    // Update timer duration with the new settings
    setShowSettings(false);
  };

  // Toggle timer
  const toggleTimer = () => {
    console.log("Toggling timer from App.tsx, current state:", isActive);
    
    // Toggle state
    setIsActive(!isActive);
  };

  // Handle Reset 
  const handleReset = () => {
    // Stop the timer
    setIsActive(false);
  };

  return (
    <div className="app-container">
      <AnimatedBackground />
      
      <div className="fixed-header">
        <h1 className="app-title">pomotomato</h1>
        <button
          className="settings-button"
          onClick={() => setShowSettings(true)}
        >
          <CogIcon className="h-8 w-8" />
        </button>
      </div>

      <div className="inspirational-quote mobile-friendly">🍅 tomato to the moon !</div>
      
      <Timer 
        initialMinutes={Math.floor(timerSettings.workDuration / 60)}
        workDuration={timerSettings.workDuration}
        shortBreakDuration={timerSettings.shortBreakDuration}
        longBreakDuration={timerSettings.longBreakDuration}
        onComplete={handleTimerComplete}
        onModeChange={handleModeChange}
        isRunning={isActive}
        onTimerToggle={toggleTimer}
        onReset={handleReset}
        currentMode={modeMapping[mode]}
      />
      
      <div className="spotify-container">
        <div className="h-8 w-8 flex items-center justify-center bg-black bg-opacity-20 rounded-full mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1.5-4.5l6-4.5-6-4.5v9z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">
            Connect to Spotify
          </div>
          <div className="text-xs opacity-70">
            Sign in to enjoy our playlists in full
          </div>
        </div>
        <button className="connect-spotify-button">
          Connect Spotify
        </button>
      </div>
      
      {showSettings && (
        <div className="settings-modal">
          <h2>Timer Settings</h2>
          
          <label className="block mb-2 font-medium">
            Pomodoro Duration
            <div className="time-input-container">
              <input
                type="number"
                className="settings-input time-input"
                defaultValue={Math.floor(timerSettings.workDuration / 60).toString()}
                min="0"
                max="60"
              />
              <span className="time-separator">minutes</span>
              <input
                type="number"
                className="settings-input time-input"
                defaultValue={(timerSettings.workDuration % 60).toString()}
                min="0"
                max="59"
              />
              <span className="time-separator">seconds</span>
            </div>
          </label>
          
          <label className="block mb-2 font-medium">
            Short Break Duration
            <div className="time-input-container">
              <input
                type="number"
                className="settings-input time-input"
                defaultValue={Math.floor(timerSettings.shortBreakDuration / 60).toString()}
                min="0"
                max="30"
              />
              <span className="time-separator">minutes</span>
              <input
                type="number"
                className="settings-input time-input"
                defaultValue={(timerSettings.shortBreakDuration % 60).toString()}
                min="0"
                max="59"
              />
              <span className="time-separator">seconds</span>
            </div>
          </label>
          
          <label className="block mb-2 font-medium">
            Long Break Duration
            <div className="time-input-container">
              <input
                type="number"
                className="settings-input time-input"
                defaultValue={Math.floor(timerSettings.longBreakDuration / 60).toString()}
                min="0"
                max="60"
              />
              <span className="time-separator">minutes</span>
              <input
                type="number"
                className="settings-input time-input"
                defaultValue={(timerSettings.longBreakDuration % 60).toString()}
                min="0"
                max="59"
              />
              <span className="time-separator">seconds</span>
            </div>
          </label>
          
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              className="settings-checkbox"
              defaultChecked={timerSettings.autoStartBreaks}
            />
            Auto-start breaks
          </label>
          
          <div className="settings-actions">
            <button className="cancel-button" onClick={() => setShowSettings(false)}>
              Cancel
            </button>
            <button className="save-button" onClick={() => {
              const timeInputs = document.querySelectorAll('.time-input') as NodeListOf<HTMLInputElement>;
              
              const workMinutes = parseInt(timeInputs[0]?.value || '25');
              const workSeconds = parseInt(timeInputs[1]?.value || '0');
              const shortBreakMinutes = parseInt(timeInputs[2]?.value || '5');
              const shortBreakSeconds = parseInt(timeInputs[3]?.value || '0');
              const longBreakMinutes = parseInt(timeInputs[4]?.value || '15');
              const longBreakSeconds = parseInt(timeInputs[5]?.value || '0');
              
              const autoStartInput = document.querySelector('.settings-checkbox') as HTMLInputElement;
              
              const newSettings = {
                ...timerSettings,
                workDuration: (workMinutes * 60) + workSeconds,
                shortBreakDuration: (shortBreakMinutes * 60) + shortBreakSeconds,
                longBreakDuration: (longBreakMinutes * 60) + longBreakSeconds,
                autoStartBreaks: autoStartInput?.checked || false,
                autoStartPomodoros: timerSettings.autoStartPomodoros,
                longBreakInterval: timerSettings.longBreakInterval
              };
              
              handleSaveSettings(newSettings);
              setShowSettings(false);
            }}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
