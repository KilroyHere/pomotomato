import { useState, useEffect } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon, PauseIcon, PlayIcon, ForwardIcon, ClockIcon } from '@heroicons/react/24/solid';
import * as spotifyAPI from '../utils/spotify';

interface SpotifyPlayerProps {
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ isPlaying, setIsPlaying }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [user, setUser] = useState<spotifyAPI.SpotifyUser | null>(null);
  const [isFirstPlay, setIsFirstPlay] = useState<boolean>(true);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0);
  
  // Only have one playlist - fruit loops
  const fruitLoopsPlaylist = spotifyAPI.FOCUS_PLAYLISTS[0];

  // Handle rate limit countdown
  useEffect(() => {
    let timer: number | null = null;
    
    if (isRateLimited && rateLimitCountdown > 0) {
      timer = window.setInterval(() => {
        setRateLimitCountdown(prev => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isRateLimited, rateLimitCountdown]);

  // On component mount, check if user is authenticated with Spotify
  useEffect(() => {
    const checkAuthentication = async () => {
      const authenticated = spotifyAPI.isAuthenticated();
      setIsConnected(authenticated);
      
      if (authenticated) {
        try {
          // Fetch user data
          const userData = await spotifyAPI.getCurrentUser();
          setUser(userData);
          
          // Get current playback state if available
          const playerState = await spotifyAPI.getPlayerState();
          if (playerState && playerState.item) {
            setIsPlaying(playerState.is_playing);
            if (playerState.is_playing) {
              setIsFirstPlay(false); // Already playing something
            }
          }
        } catch (error) {
          console.error('Error fetching Spotify data:', error);
        }
      }
    };
    
    checkAuthentication();
  }, [setIsPlaying]);
  
  // Connect to Spotify
  const connectToSpotify = () => {
    window.location.href = spotifyAPI.getAuthUrl();
  };
  
  // Handle rate limiting errors
  const handleRateLimitError = (error: Error) => {
    const message = error.message;
    if (message.includes('Rate limit exceeded')) {
      // Extract the wait time
      const waitTimeMatch = message.match(/Please wait (\d+) seconds/);
      const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1], 10) : 10;
      
      setIsRateLimited(true);
      setRateLimitCountdown(waitTime);
      console.log(`Rate limited, waiting for ${waitTime} seconds`);
      return true;
    }
    return false;
  };
  
  // Toggle play/pause
  const togglePlayback = async () => {
    if (!isConnected) {
      connectToSpotify();
      return;
    }
    
    // Don't allow actions during rate limiting
    if (isRateLimited) {
      return;
    }
    
    try {
      if (isPlaying) {
        try {
          await spotifyAPI.pause();
          setIsPlaying(false);
        } catch (pauseError) {
          console.error('Error pausing playback:', pauseError);
          const errorMessage = pauseError instanceof Error ? pauseError.message : 'Unknown error';
          
          // Check for rate limiting
          if (pauseError instanceof Error && handleRateLimitError(pauseError)) {
            return;
          }
          
          // For empty response or parse errors, update UI anyway
          if (errorMessage.includes('Invalid JSON') || errorMessage.includes('Empty response')) {
            console.log('Ignoring pause error and updating UI state anyway');
            setIsPlaying(false);
          } else if (errorMessage.includes('No active device found')) {
            // No need to open Spotify if we're just trying to pause
            alert("No active Spotify player found. Open Spotify manually and try again.");
            setIsPlaying(false);
          } else {
            alert(`Spotify pause error: ${errorMessage}`);
          }
        }
      } else {
        console.log('Playing fruit loops playlist:', fruitLoopsPlaylist.uri);
        try {
          if (isFirstPlay) {
            // First time playing - start the playlist from beginning
            await spotifyAPI.play(fruitLoopsPlaylist.uri, false);
            setIsFirstPlay(false);
          } else {
            // Resume playback without specifying URI to avoid restarting
            await spotifyAPI.play(fruitLoopsPlaylist.uri, true);
          }
          setIsPlaying(true);
        } catch (error) {
          console.error('Error playing playlist:', error);
          
          // Check for rate limiting
          if (error instanceof Error && handleRateLimitError(error)) {
            return;
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // If no active device found, open Spotify web player
          if (errorMessage.includes('No active device found')) {
            alert("Opening Spotify in browser - please click play in the Spotify web player");
            spotifyAPI.openSpotifyPlayer(fruitLoopsPlaylist.uri);
            setIsFirstPlay(false); // We've now started a session
          } else {
            alert(`Spotify playback error: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
      
      // Check for rate limiting
      if (error instanceof Error && handleRateLimitError(error)) {
        return;
      }
      
      // Show error for debugging
      alert(`Spotify playback error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Skip to next track
  const handleSkipNext = async () => {
    if (!isConnected || isRateLimited) {
      return;
    }
    
    try {
      await spotifyAPI.skipToNext();
      // Update playing state to reflect we're now playing
      setIsPlaying(true);
      console.log('Successfully skipped to next track, updated UI to playing state');
    } catch (error) {
      console.error('Error skipping to next track:', error);
      
      // Check for rate limiting
      if (error instanceof Error && handleRateLimitError(error)) {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('No active device found')) {
        alert("No active Spotify player found. Open Spotify manually and try again.");
      } else {
        alert(`Error skipping to next track: ${errorMessage}`);
      }
    }
  };
  
  // Toggle mute
  const toggleMute = async () => {
    if (isRateLimited) return;
    
    try {
      if (isMuted) {
        await spotifyAPI.setVolume(volume);
      } else {
        await spotifyAPI.setVolume(0);
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error changing volume:', error);
      
      // Check for rate limiting
      if (error instanceof Error) {
        handleRateLimitError(error);
      }
    }
  };
  
  // Update UI only when volume slider is moving
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    
    // Always update UI immediately for responsiveness
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
  };
  
  // Send volume update to Spotify only when slider is released
  const handleVolumeCommit = async () => {
    // Don't try to update Spotify if rate limited
    if (isRateLimited) return;
    
    console.log('Volume slider released, sending volume update:', volume);
    
    try {
      await spotifyAPI.setVolume(volume);
    } catch (error) {
      console.error('Error setting volume:', error);
      
      // Check for rate limiting
      if (error instanceof Error) {
        handleRateLimitError(error);
      }
    }
  };
  
  // Logout from Spotify
  const logoutFromSpotify = () => {
    spotifyAPI.logout();
    setIsConnected(false);
    setUser(null);
    setIsPlaying(false);
    setIsFirstPlay(true);
    setIsRateLimited(false);
  };

  return (
    <div className={`spotify-container ${isRateLimited ? 'rate-limited' : ''}`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {isRateLimited ? (
            <div className="spotify-rate-limit">
              <ClockIcon className="h-7 w-7 text-yellow-400" />
              <span className="ml-2 text-yellow-400">{rateLimitCountdown}s</span>
            </div>
          ) : (
            <>
              <button
                onClick={togglePlayback}
                className="spotify-button"
                aria-label={isPlaying ? 'Pause Spotify playback' : 'Play Spotify playback'}
                disabled={isRateLimited}
              >
                {isPlaying ? (
                  <PauseIcon className="h-7 w-7" />
                ) : (
                  <PlayIcon className="h-7 w-7" />
                )}
              </button>

              {isConnected && (
                <button
                  onClick={handleSkipNext}
                  className="spotify-button ml-2"
                  aria-label="Skip to next track"
                  disabled={isRateLimited}
                >
                  <ForwardIcon className="h-7 w-7" />
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex-1 mx-4">
          <div className="text-sm font-medium">
            {isRateLimited ? 
              'Rate limit reached - waiting' : 
              (isConnected ? 'fruit loops' : 'Connect to Spotify')
            }
          </div>
          <div className="text-xs opacity-70">
            {isRateLimited ?
              `Please wait ${rateLimitCountdown} seconds` :
              (isConnected 
                ? (user ? `Connected as ${user.display_name}` : 'Jazz Fruits Music') 
                : 'Sign in to play fruit loops playlist')
            }
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center">
            <button
              onClick={toggleMute}
              className="volume-button"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              disabled={isRateLimited}
            >
              {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon className="h-6 w-6" />
              ) : (
                <SpeakerWaveIcon className="h-6 w-6" />
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              onMouseUp={handleVolumeCommit}
              onTouchEnd={handleVolumeCommit}
              className="volume-slider"
              aria-label="Volume"
              disabled={isRateLimited}
            />
            
            <button
              onClick={logoutFromSpotify}
              className="spotify-logout-button ml-3"
              aria-label="Logout from Spotify"
              disabled={isRateLimited}
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            className="connect-spotify-button" 
            onClick={connectToSpotify}
            disabled={isRateLimited}
          >
            Connect Spotify
          </button>
        )}
      </div>
    </div>
  );
};

export default SpotifyPlayer; 