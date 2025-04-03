import { useState, useEffect } from 'react';
import { MusicalNoteIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

interface SpotifyPlayerProps {
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

// This is a placeholder component for the Spotify integration
// In a real implementation, you would use the Spotify Web Playback SDK
const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ isPlaying, setIsPlaying }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<string>('');
  const [volume, setVolume] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // This would be replaced with actual Spotify API calls
  const connectToSpotify = () => {
    // Simulate connecting to Spotify
    setIsConnected(true);
    setCurrentTrack('Lofi Study Beats');
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (isConnected) {
      setIsPlaying(!isPlaying);
    } else {
      connectToSpotify();
      setIsPlaying(true);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  return (
    <div className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg">
      <button
        onClick={togglePlayback}
        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
        aria-label={isPlaying ? 'Pause Spotify playback' : 'Play Spotify playback'}
      >
        <MusicalNoteIcon className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800">
          {isConnected ? currentTrack : 'Connect to Spotify'}
        </div>
        <div className="text-xs text-gray-500">
          {isConnected ? (isPlaying ? 'Now playing' : 'Paused') : 'Not connected'}
        </div>
      </div>

      <div className="flex items-center">
        <button
          onClick={toggleMute}
          className="p-1 text-gray-600 hover:text-gray-800"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <SpeakerXMarkIcon className="h-5 w-5" />
          ) : (
            <SpeakerWaveIcon className="h-5 w-5" />
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 mx-2"
          aria-label="Volume"
        />
      </div>
    </div>
  );
};

export default SpotifyPlayer; 