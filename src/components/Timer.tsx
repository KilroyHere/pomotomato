import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { showWorkCompleteNotification, showBreakCompleteNotification } from '../utils/notifications';
import { TimerMode } from '../timerTypes';

interface TimerProps {
  initialMinutes?: number;
  onComplete?: () => void;
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  onModeChange?: (mode: TimerMode) => void;
  isRunning?: boolean;
  onTimerToggle?: () => void;
  onReset?: () => void;
  currentMode?: TimerMode;
}

// Component definition
const Timer: React.FC<TimerProps> = ({ 
  initialMinutes = 25, 
  onComplete,
  workDuration = 25 * 60,
  shortBreakDuration = 5 * 60,
  longBreakDuration = 15 * 60,
  onModeChange,
  isRunning: externalIsRunning,
  onTimerToggle,
  onReset,
  currentMode: externalMode
}) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [quote, setQuote] = useState('🍅 tomato to the moon !');
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);

  // Sync with external mode if provided
  useEffect(() => {
    if (externalMode !== undefined) {
      setMode(externalMode);
    }
  }, [externalMode]);

  // Sync with external isRunning state if provided
  useEffect(() => {
    if (externalIsRunning !== undefined) {
      console.log("Timer: Syncing from external isRunning state:", externalIsRunning);
      setIsRunning(externalIsRunning);
    }
  }, [externalIsRunning]);

  // Custom mode change handler
  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    // If onModeChange is provided, use it to maintain sequence in parent component
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Set timer based on mode
  useEffect(() => {
    // Don't stop the timer here - let the parent control running state
    switch(mode) {
      case TimerMode.FOCUS:
        setTimeLeft(workDuration);
        break;
      case TimerMode.SHORT_BREAK:
        setTimeLeft(shortBreakDuration);
        break;
      case TimerMode.LONG_BREAK:
        setTimeLeft(longBreakDuration);
        break;
    }
  }, [mode, workDuration, shortBreakDuration, longBreakDuration]);

  // Timer logic - simplify to use a single interval that runs consistently
  useEffect(() => {
    let interval: number | undefined;
    
    if (isRunning && timeLeft > 0) {
      console.log("Timer: Starting countdown, timeLeft:", timeLeft);
      
      interval = window.setInterval(() => {
        console.log("Timer tick");
        setTimeLeft((prev) => {
          // When we reach 1, this will set it to 0 and trigger completion
          if (prev <= 1) {
            // Clear interval right away to prevent further ticks
            clearInterval(interval);
            
            // Handle timer completion inside this effect
            if (mode === TimerMode.FOCUS) {
              showWorkCompleteNotification();
            } else {
              showBreakCompleteNotification();
            }
            
            // Notify parent
            onComplete?.();
            
            // Set to exactly 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Clear interval when component unmounts or isRunning changes
    return () => {
      if (interval) {
        console.log("Timer: Clearing interval");
        clearInterval(interval);
      }
    };
  }, [isRunning, mode, onComplete]); // Removed timeLeft to prevent re-creating interval on every tick

  // Extra effect to ensure the timer stops when it hits 0
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      console.log("Timer: Setting isRunning to false because timeLeft is 0");
      setIsRunning(false);
    }
  }, [timeLeft]);
  
  // Format time as MM:SS
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const toggleTimer = () => {
    // If we have external control, just call the parent toggle handler
    if (onTimerToggle) {
      onTimerToggle();
    } else {
      // Otherwise manage state internally
      setIsRunning(!isRunning);
    }
  };
  
  const resetTimer = () => {
    // Use parent's reset handler if available
    if (onReset) {
      onReset();
      return;
    }
    
    // Otherwise handle reset internally
    // Stop the timer
    if (onTimerToggle && isRunning) {
      onTimerToggle(); // Toggle off if running
    } else {
      setIsRunning(false);
    }
    
    // Reset to the current mode's duration
    switch(mode) {
      case TimerMode.FOCUS:
        setTimeLeft(workDuration);
        break;
      case TimerMode.SHORT_BREAK:
        setTimeLeft(shortBreakDuration);
        break;
      case TimerMode.LONG_BREAK:
        setTimeLeft(longBreakDuration);
        break;
    }
  };

  // Update timeLeft when durations change
  useEffect(() => {
    if (!isRunning) {
      switch(mode) {
        case TimerMode.FOCUS:
          setTimeLeft(workDuration);
          break;
        case TimerMode.SHORT_BREAK:
          setTimeLeft(shortBreakDuration);
          break;
        case TimerMode.LONG_BREAK:
          setTimeLeft(longBreakDuration);
          break;
      }
    }
  }, [mode, workDuration, shortBreakDuration, longBreakDuration, isRunning]);

  return (
    <div className="timer-container">
      {/* Quote div moved outside of the timer container for better positioning */}
      
      <div className="mode-selector">
        <button 
          className={`mode-button ${mode === TimerMode.FOCUS ? 'active' : ''}`}
          onClick={() => handleModeChange(TimerMode.FOCUS)}
        >
          Focus
        </button>
        <button 
          className={`mode-button ${mode === TimerMode.SHORT_BREAK ? 'active' : ''}`}
          onClick={() => handleModeChange(TimerMode.SHORT_BREAK)}
        >
          Short
        </button>
        <button 
          className={`mode-button ${mode === TimerMode.LONG_BREAK ? 'active' : ''}`}
          onClick={() => handleModeChange(TimerMode.LONG_BREAK)}
        >
          Long
        </button>
      </div>
      
      <div className="timer-display">
        {formatTime()}
      </div>
      
      <div className="timer-controls">
        <button className="control-button" onClick={toggleTimer}>
          {isRunning ? <PauseIcon className="h-5 w-5 mr-2" /> : <PlayIcon className="h-5 w-5 mr-2" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>
        <button className="reset-button" onClick={resetTimer}>
          <ArrowPathIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

// Export component as default
export default Timer;