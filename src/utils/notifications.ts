// Check if browser notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Check if notification permission is granted
export const hasNotificationPermission = (): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  return Notification.permission === 'granted';
};

// Show notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  // Play notification sound only once
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 1.0;
    
    // Use a play/catch pattern to handle autoplay restrictions
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error('Failed to play notification sound:', err);
        // Don't retry playing to prevent loops
      });
    }
  } catch (err) {
    console.error('Error with notification sound:', err);
  }
  
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