// Audio context for notification sounds
let audioContext: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;
let audioInitialized = false;

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
    // Create audio context
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load notification sound
    const response = await fetch('/notification.mp3');
    const arrayBuffer = await response.arrayBuffer();
    
    if (audioContext) {
      notificationBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioInitialized = true;
      console.log('Audio system initialized successfully');
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
const playNotificationSound = (): void => {
  if (!audioContext || !notificationBuffer) {
    // Fallback to the old method if audio context isn't initialized
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Failed to play notification sound (fallback):', err);
        });
      }
    } catch (err) {
      console.error('Error with notification sound (fallback):', err);
    }
    return;
  }
  
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
  } catch (err) {
    console.error('Failed to play notification sound:', err);
  }
};

// Show notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  // Play notification sound
  playNotificationSound();
  
  // Show browser notification if permission granted
  if (hasNotificationPermission()) {
    try {
      new Notification(title, options);
    } catch (err) {
      console.error('Failed to show notification:', err);
    }
  }
};

// Timer-specific notifications
export const showWorkCompleteNotification = (): void => {
  showNotification('Work session complete!', {
    body: 'Time for a break.',
    icon: '/favicon.ico'
  });
};

export const showBreakCompleteNotification = (): void => {
  showNotification('Break time over', {
    body: 'Ready to focus again?',
    icon: '/favicon.ico'
  });
}; 