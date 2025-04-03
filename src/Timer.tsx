const formatTime = () => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

return (
  <div className="timer-container">
    <div className="inspirational-quote mobile-friendly">🍅 tomato to the moon !</div>
    
    // ... existing code ...
  </div>
); 