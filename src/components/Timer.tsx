import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { initAudio } from '../utils/notifications';
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
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>(externalMode || TimerMode.FOCUS);
  const lastTimeRef = useRef<number | null>(null);
  const lastModeRef = useRef<TimerMode>(TimerMode.FOCUS);
  const isInitializedRef = useRef(false);
  
  // Initialize timeLeft based on current mode and provided durations
  const getInitialTimeLeft = () => {
    if (externalMode === TimerMode.FOCUS) return workDuration;
    if (externalMode === TimerMode.SHORT_BREAK) return shortBreakDuration;
    if (externalMode === TimerMode.LONG_BREAK) return longBreakDuration;
    return initialMinutes * 60;
  };
  
  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());
  
  // Make sure the timer initializes with correct values on first mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      // console.log("Timer: Initial load - setting duration based on mode", externalMode);
      
      if (externalMode) {
        setMode(externalMode);
        
        switch(externalMode) {
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
    }
  }, []);

  // Keep track of mode changes to prevent timeLeft resetting on pause
  useEffect(() => {
    lastModeRef.current = mode;
  }, [mode]);

  // Sync with external mode if provided
  useEffect(() => {
    if (externalMode !== undefined && externalMode !== mode) {
      // console.log("Timer: External mode changed to:", externalMode);
      setMode(externalMode);
      
      // Reset timer when mode changes externally
      switch(externalMode) {
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
      
      // Clear any saved time reference
      lastTimeRef.current = null;
    }
  }, [externalMode, workDuration, shortBreakDuration, longBreakDuration]);

  // Sync with external isRunning state if provided
  useEffect(() => {
    if (externalIsRunning !== undefined) {
      // console.log("Timer: Syncing from external isRunning state:", externalIsRunning);
      setIsRunning(externalIsRunning);
      
      // When the timer pauses, save the current time
      if (!externalIsRunning) {
        lastTimeRef.current = timeLeft;
      }
    }
  }, [externalIsRunning]);

  // Custom mode change handler
  const handleModeChange = (newMode: TimerMode) => {
    // Initialize audio on user interaction
    initAudio();
    
    setMode(newMode);
    // If onModeChange is provided, use it to maintain sequence in parent component
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Set timer based on mode - only when the mode actually changes
  useEffect(() => {
    // Don't reset the timer if it's just being paused
    if (lastModeRef.current !== mode) {
      // console.log("Timer: Mode changed, resetting timer");
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
      // Reset the stored time when mode changes
      lastTimeRef.current = null;
    } else if (lastTimeRef.current !== null && !isRunning) {
      // Restore the saved time when un-pausing with the same mode
      // console.log("Timer: Resuming from saved time:", lastTimeRef.current);
      setTimeLeft(lastTimeRef.current);
    }
  }, [mode, workDuration, shortBreakDuration, longBreakDuration, isRunning]);

  // Timer logic - simplify to use a single interval that runs consistently
  useEffect(() => {
    let interval: number | undefined;
    
    if (isRunning && timeLeft > 0) {
      // console.log("Timer: Starting countdown, timeLeft:", timeLeft);
      
      interval = window.setInterval(() => {
        // console.log("Timer tick");
        setTimeLeft((prev) => {
          // When we reach 1, this will set it to 0 and trigger completion
          if (prev <= 1) {
            // Clear interval right away to prevent further ticks
            clearInterval(interval);
            
            // Notify parent - let parent handle the notifications
            if (onComplete) {
              // console.log("Timer: Calling onComplete");
              onComplete();
            }
            
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
        // console.log("Timer: Clearing interval");
        clearInterval(interval);
      }
    };
  }, [isRunning, onComplete]);

  // Extra effect to ensure the timer stops when it hits 0
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      // console.log("Timer: Setting isRunning to false because timeLeft is 0");
      setIsRunning(false);
      // Reset the stored time when timer completes
      lastTimeRef.current = null;
    }
  }, [timeLeft, isRunning]);
  
  // Always update lastTimeRef when timeLeft changes
  useEffect(() => {
    // Only store non-zero times to avoid saving when at 0
    if (timeLeft > 0) {
      lastTimeRef.current = timeLeft;
      // console.log("Timer: Updated saved time to", timeLeft);
    }
  }, [timeLeft]);
  
  // Handle reset in a separate effect to avoid conditions in parent component
  useEffect(() => {
    // If timeLeft is 0 and we're not running, reset to current mode duration
    if (timeLeft === 0 && !isRunning && lastTimeRef.current === null) {
      // console.log("Timer: Resetting from 0 to appropriate duration");
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
  }, [timeLeft, isRunning, mode, workDuration, shortBreakDuration, longBreakDuration]);
  
  // Format time as MM:SS
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const toggleTimer = () => {
    // Initialize audio on user interaction
    initAudio();
    
    // When resuming from zero, reset to the appropriate duration first
    if (!isRunning && timeLeft === 0) {
      // console.log("Timer: Resuming from 0, resetting to initial duration");
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
    
    // If we have external control, just call the parent toggle handler
    if (onTimerToggle) {
      // Store the current time before pausing
      if (isRunning) {
        lastTimeRef.current = timeLeft;
      }
      onTimerToggle();
    } else {
      // Otherwise manage state internally
      if (isRunning) {
        lastTimeRef.current = timeLeft;
      }
      setIsRunning(!isRunning);
    }
  };
  
  const resetTimer = () => {
    // Initialize audio on user interaction
    initAudio();
    
    // Reset the stored time reference
    lastTimeRef.current = null;
    
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

  // Update timer when settings change (like durations)
  useEffect(() => {
    // console.log("Timer: Settings changed, checking if we need to update timer");
    
    // Only update the timer if we're not running
    if (!isRunning) {
      // Update the timer based on current mode
      switch(mode) {
        case TimerMode.FOCUS:
          if (timeLeft === 0 || timeLeft === lastTimeRef.current) {
            // console.log("Timer: Updating work duration to", workDuration);
            setTimeLeft(workDuration);
          }
          break;
        case TimerMode.SHORT_BREAK:
          if (timeLeft === 0 || timeLeft === lastTimeRef.current) {
            // console.log("Timer: Updating short break duration to", shortBreakDuration);
            setTimeLeft(shortBreakDuration);
          }
          break;
        case TimerMode.LONG_BREAK:
          if (timeLeft === 0 || timeLeft === lastTimeRef.current) {
            // console.log("Timer: Updating long break duration to", longBreakDuration);
            setTimeLeft(longBreakDuration);
          }
          break;
      }
    }
  }, [workDuration, shortBreakDuration, longBreakDuration, isRunning, mode]);

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