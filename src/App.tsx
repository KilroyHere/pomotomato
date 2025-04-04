import { useState, useEffect, useRef } from 'react';
import './App.css';
import { CogIcon } from '@heroicons/react/24/solid';
import { loadAppSettings, saveTimerSettings, TimerSettings } from './utils/storage';
import { 
  requestNotificationPermission, 
  initAudio, 
  showWorkCompleteNotification, 
  isAudioInitialized, 
  showBreakCompleteNotification,
  playNotificationSound 
} from './utils/notifications';
import AnimatedBackground from './components/AnimatedBackground';
import Timer from './components/Timer';
import SpotifyPlayer from './components/SpotifyPlayer';
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
  // Load settings from localStorage
  const initialSettings = loadAppSettings();
  // Enable Spotify for testing without changing auto behavior defaults
  initialSettings.spotifyEnabled = true;
  
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(initialSettings.timerSettings);
  
  // Timer state
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [pomodoroSequence, setPomodoroSequence] = useState<number>(0); // Track position in pomodoro sequence
  const timerRef = useRef<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [shouldAutoStart, setShouldAutoStart] = useState<boolean>(false);
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);
  const [isNotifying, setIsNotifying] = useState<boolean>(false); // Add flag to prevent duplicate notifications

  // Add Spotify state
  const [spotifyPlaying, setSpotifyPlaying] = useState<boolean>(false);

  // Request notification permission when the app loads
  useEffect(() => {
    requestNotificationPermission();
    // Check if audio is already initialized
    setAudioInitialized(isAudioInitialized());
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
    // Auto-start if needed - with a slight delay to ensure notification plays first
    if (shouldAutoStart) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setShouldAutoStart(false);
      }, 800); // Increased delay to ensure notification completes
      
      return () => clearTimeout(timer);
    } else {
      setIsActive(false);
    }
  }, [mode, shouldAutoStart]);

  // Effect to update document title based on timer state
  useEffect(() => {
    let title = 'Pomotomato';
    
    // Add current time to title when timer is active
    if (isActive) {
      if (mode === TimerMode.WORK) {
        title = `🍅 Focus - Pomotomato`;
      } else if (mode === TimerMode.SHORT_BREAK) {
        title = `☕ Short Break - Pomotomato`;
      } else {
        title = `🌴 Long Break - Pomotomato`;
      }
    } else if (completedPomodoros > 0) {
      // Show completed count when not active
      title = `${completedPomodoros} 🍅 - Pomotomato`;
    }
    
    document.title = title;
  }, [isActive, mode, completedPomodoros]);

  // Handle timer completion
  const handleTimerComplete = () => {
    // Prevent multiple notifications firing at the same time
    if (isNotifying) {
      return;
    }
    
    setIsNotifying(true);
    
    // Stop the timer first to prevent issues with mode changes
    setIsActive(false);
    
    // Use setTimeout to avoid React error about updating during render
    setTimeout(() => {
      // Play notification sound and show browser notification
      if (mode === TimerMode.WORK) {
        // Show work complete notification
        showWorkCompleteNotification();
        
        const newCompletedPomodoros = completedPomodoros + 1;
        setCompletedPomodoros(newCompletedPomodoros);
        
        // Update pomodoro sequence
        const newSequence = pomodoroSequence + 1;
        setPomodoroSequence(newSequence);
        
        // Determine which break to take based on sequence
        const shouldTakeLongBreak = newSequence % 4 === 0;
        const nextMode = shouldTakeLongBreak ? TimerMode.LONG_BREAK : TimerMode.SHORT_BREAK;
        
        // Auto-start break if enabled
        setShouldAutoStart(timerSettings.autoStartBreaks);
        
        // Change mode
        setMode(nextMode);
      } else {
        // Show break complete notification
        showBreakCompleteNotification();
        
        // Auto-start pomodoro if enabled
        setShouldAutoStart(timerSettings.autoStartPomodoros);
        
        // Change mode
        setMode(TimerMode.WORK);
      }
      
      // If auto-start is enabled, set isActive back to true after a delay
      if (shouldAutoStart) {
        setTimeout(() => {
          setIsActive(true);
        }, 500); // Increased to ensure mode change completes first
      }
      
      // Reset notification flag after all state updates
      setTimeout(() => {
        setIsNotifying(false);
      }, 1000);
    }, 0);
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
    // Initialize audio on user interaction
    initAudio().then(initialized => {
      if (initialized) {
        setAudioInitialized(true);
      }
    });
    
    // Toggle state
    setIsActive(!isActive);
  };

  // Handle Reset 
  const handleReset = () => {
    // Stop the timer
    setIsActive(false);
    
    // In case this is called during initialization before component mounts
    if (mode === undefined) {
      return;
    }
    
    // Force a re-render of the Timer component by changing currentMode
    // This ensures the timer is properly reset
    const currentMode = modeMapping[mode];
    setMode(reverseModeMapping[currentMode]);
  };

  return (
    <div className="app-container" onClick={initAudio}>
      <AnimatedBackground />
      
      <div className="fixed-header">
        <h1 className="app-title">pomotomato</h1>
        <button
          className="settings-button"
          onClick={() => {
            setShowSettings(true);
            initAudio(); // Initialize audio on settings click
          }}
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
      
      <SpotifyPlayer 
        isPlaying={spotifyPlaying} 
        setIsPlaying={setSpotifyPlaying} 
      />
      
      {showSettings && (
        <>
          <div className="modal-backdrop" onClick={() => setShowSettings(false)}></div>
          <div className="settings-modal">
            <h2>Timer Settings</h2>
            
            <div className="settings-section">
              <label className="block mb-2 font-medium">
                Pomodoro Duration
                <div className="time-input-container">
                  <input
                    type="number"
                    className="settings-input time-input"
                    defaultValue={Math.floor(timerSettings.workDuration / 60).toString()}
                    min="0"
                    max="60"
                    aria-label="Pomodoro minutes"
                  />
                  <span className="time-separator">minutes</span>
                  <input
                    type="number"
                    className="settings-input time-input"
                    defaultValue={(timerSettings.workDuration % 60).toString()}
                    min="0"
                    max="59"
                    aria-label="Pomodoro seconds"
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
                    aria-label="Short break minutes"
                  />
                  <span className="time-separator">minutes</span>
                  <input
                    type="number"
                    className="settings-input time-input"
                    defaultValue={(timerSettings.shortBreakDuration % 60).toString()}
                    min="0"
                    max="59"
                    aria-label="Short break seconds"
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
                    aria-label="Long break minutes"
                  />
                  <span className="time-separator">minutes</span>
                  <input
                    type="number"
                    className="settings-input time-input"
                    defaultValue={(timerSettings.longBreakDuration % 60).toString()}
                    min="0"
                    max="59"
                    aria-label="Long break seconds"
                  />
                  <span className="time-separator">seconds</span>
                </div>
              </label>
              
              <label className="flex items-center mb-4 settings-checkbox-label">
                <input
                  type="checkbox"
                  className="settings-checkbox"
                  defaultChecked={timerSettings.autoStartBreaks}
                  aria-label="Auto-start breaks"
                />
                <span>Auto-start breaks</span>
              </label>
              
              <label className="flex items-center mb-4 settings-checkbox-label">
                <input
                  type="checkbox"
                  className="settings-checkbox"
                  defaultChecked={timerSettings.autoStartPomodoros}
                  aria-label="Auto-start pomodoros"
                />
                <span>Auto-start pomodoros</span>
              </label>
              
              <div className="audio-test-section">
                <p className="audio-test-note">Some browsers block notification sounds until you interact with the page. Click the button below to test and enable notifications:</p>
                <button 
                  className={`audio-test-button ${audioInitialized ? 'initialized' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    initAudio().then(initialized => {
                      if (initialized) {
                        setAudioInitialized(true);
                        // Just play the sound without calling the notification function
                        playNotificationSound();
                      }
                    });
                  }}
                >
                  {audioInitialized ? 'Sound Enabled ✓' : 'Test Notification Sound'}
                </button>
              </div>
              
              <h3 className="settings-subheading">Spotify Integration</h3>
              <div className="spotify-settings-section">
                <p className="settings-description">
                  Connect your Spotify account to enjoy focus music while you work.
                  Control playback manually using the Spotify player controls below the timer.
                </p>
                                
                <button 
                  className="spotify-settings-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://www.spotify.com/account/apps/', '_blank');
                  }}
                >
                  Manage Spotify App Permissions
                </button>
              </div>
            </div>
            
            <div className="settings-actions center-actions">
              <button 
                className="cancel-button" 
                onClick={() => setShowSettings(false)}
                aria-label="Cancel changes"
              >
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={() => {
                  const timeInputs = document.querySelectorAll('.time-input') as NodeListOf<HTMLInputElement>;
                  
                  const workMinutes = parseInt(timeInputs[0]?.value || '25');
                  const workSeconds = parseInt(timeInputs[1]?.value || '0');
                  const shortBreakMinutes = parseInt(timeInputs[2]?.value || '5');
                  const shortBreakSeconds = parseInt(timeInputs[3]?.value || '0');
                  const longBreakMinutes = parseInt(timeInputs[4]?.value || '15');
                  const longBreakSeconds = parseInt(timeInputs[5]?.value || '0');
                  
                  const checkboxInputs = document.querySelectorAll('.settings-checkbox') as NodeListOf<HTMLInputElement>;
                  
                  const newSettings = {
                    ...timerSettings,
                    workDuration: (workMinutes * 60) + workSeconds,
                    shortBreakDuration: (shortBreakMinutes * 60) + shortBreakSeconds,
                    longBreakDuration: (longBreakMinutes * 60) + longBreakSeconds,
                    autoStartBreaks: checkboxInputs[0]?.checked || false,
                    autoStartPomodoros: checkboxInputs[1]?.checked || false,
                    longBreakInterval: timerSettings.longBreakInterval,
                    // Spotify settings
                    spotifyEnabled: true // Always enable Spotify when available
                  };
                  
                  handleSaveSettings(newSettings);
                  setShowSettings(false);
                }}
                aria-label="Save settings"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
