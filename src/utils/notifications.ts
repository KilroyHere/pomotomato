// Audio context for notification sounds
let audioContext: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;
let audioInitialized = false;

// Debounce variables to prevent duplicate notifications
let lastWorkNotificationTime = 0;
let lastBreakNotificationTime = 0;
const NOTIFICATION_DEBOUNCE_MS = 1000; // 1 second debounce

// Check if browser notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission and initialize audio
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  const permission = await Notification.requestPermission();
  
  // Try to initialize audio (likely won't work until user interaction)
  initAudio();
  
  return permission === 'granted';
};

// Initialize audio system - must be called after user interaction
export const initAudio = async (): Promise<boolean> => {
  if (audioInitialized) return true;
  
  try {
    // Preload audio file with Audio element to ensure it's cached
    const audioElement = new Audio('/notification.mp3');
    audioElement.load(); // This will preload the audio file
    
    // Create audio context
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load notification sound
    const response = await fetch('/notification.mp3');
    const arrayBuffer = await response.arrayBuffer();
    
    if (audioContext) {
      notificationBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioInitialized = true;
      console.log('Audio system initialized successfully');
      
      // Test a silent audio play to unlock audio on iOS
      const silentSource = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.01; // Nearly silent

      if (notificationBuffer) {
        silentSource.buffer = notificationBuffer;
        silentSource.connect(gainNode);
        gainNode.connect(audioContext.destination);
        silentSource.start(0);
        silentSource.stop(0.001); // Stop after a very short time
      }
      
      return true;
    }
  } catch (err) {
    console.error('Failed to initialize audio system:', err);
  }
  
  return false;
};

// Check if audio is initialized
export const isAudioInitialized = (): boolean => {
  return audioInitialized;
};

// Check if notification permission is granted
export const hasNotificationPermission = (): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  return Notification.permission === 'granted';
};

// Play notification sound
export const playNotificationSound = (): void => {
  // First try using AudioContext if available
  if (audioContext && notificationBuffer) {
    try {
      // Resume audio context if suspended (browsers often suspend until user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Create sound source
      const source = audioContext.createBufferSource();
      source.buffer = notificationBuffer;
      
      // Connect to output
      source.connect(audioContext.destination);
      
      // Play the sound
      source.start(0);
      console.log('Playing notification sound via AudioContext');
      return; // Return early if successful
    } catch (err) {
      console.error('Failed to play notification sound with AudioContext:', err);
      // Fall through to fallback method
    }
  }
  
  // Fallback method using Audio element
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 1.0;
    
    // Force play by adding user interaction event handler
    const playWithUserGesture = () => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Failed to play notification sound (fallback):', err);
          
          // Try once more with a reduced volume which sometimes helps
          audio.volume = 0.5;
          audio.play().catch(err => {
            console.error('Final attempt to play notification sound failed:', err);
          });
        });
      }
    };
    
    // Try to play immediately first
    playWithUserGesture();
    
  } catch (err) {
    console.error('Error with notification sound (fallback):', err);
  }
};

// Show notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  console.log(`Showing notification: "${title}" at ${new Date().toISOString()}`);
  console.trace('Notification call stack');
  
  // Don't play sound if the page is not visible/in focus
  if (document.visibilityState === 'hidden') {
    console.log('Page not visible, playing notification sound when tab regains focus');
    
    // Add event listener to play sound when user returns to the page
    const playWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        playNotificationSound();
        document.removeEventListener('visibilitychange', playWhenVisible);
      }
    };
    
    document.addEventListener('visibilitychange', playWhenVisible);
  } else {
    // Always play notification sound regardless of notification permission
    // if the page is visible
    playNotificationSound();
  }
  
  // Only show visual browser notification if permission granted
  if (hasNotificationPermission()) {
    try {
      new Notification(title, options);
    } catch (err) {
      console.error('Failed to show notification:', err);
    }
  } else {
    console.log('Notifications not permitted, but sound played:', title);
  }
};

// Timer-specific notifications
export const showWorkCompleteNotification = (): void => {
  // Debounce to prevent duplicate notifications
  const now = Date.now();
  if (now - lastWorkNotificationTime < NOTIFICATION_DEBOUNCE_MS) {
    console.log('Work notification debounced - too soon after previous notification');
    return;
  }
  lastWorkNotificationTime = now;
  
  // Use the showNotification function which already plays sound
  showNotification('Work session complete!', {
    body: 'Time for a break.',
    icon: '/favicon.ico'
  });
};

export const showBreakCompleteNotification = (): void => {
  // Debounce to prevent duplicate notifications
  const now = Date.now();
  if (now - lastBreakNotificationTime < NOTIFICATION_DEBOUNCE_MS) {
    console.log('Break notification debounced - too soon after previous notification');
    return;
  }
  lastBreakNotificationTime = now;
  
  // Use the showNotification function which already plays sound
  showNotification('Break time over', {
    body: 'Ready to focus again?',
    icon: '/favicon.ico'
  });
}; 