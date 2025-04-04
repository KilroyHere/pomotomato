// Constants
declare global {
  interface Window {
    _env_?: {
      SPOTIFY_CLIENT_ID?: string;
    };
  }
}

// Use Vite env variables in development or window._env_ in production
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || window._env_?.SPOTIFY_CLIENT_ID || '';
/* 
To make Spotify integration work, you need to provide your own Spotify Client ID:

1. Create an app at https://developer.spotify.com/dashboard/
2. Add the redirect URI in your Spotify app settings:
   - For local development: http://localhost:5173 (or your Vite dev server port)
   - For GitHub Pages: https://[your-username].github.io/pomotomato/

3. Option A - For local development:
   - Create a .env file in your project root with:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   ```
   - This file should NOT be committed to your repo (.gitignore should include .env)
   
4. Option B - For production deployment:
   - Create env.js in your public folder (add this to .gitignore!)
   - Add this content to env.js:
   ```javascript
   window._env_ = {
     SPOTIFY_CLIENT_ID: "your_actual_client_id_here"
   }
   ```
   - Add a reference to this file in your index.html:
   ```html
   <script src="%PUBLIC_URL%/env.js"></script>
   ```
   
SECURITY NOTE: Never commit any file containing your actual Client ID. 
Use the methods above to keep it out of version control.
*/

// Get the current origin, handling GitHub Pages path if needed
const REDIRECT_URI = window.location.origin + (window.location.pathname.includes('/pomotomato') ? '/pomotomato/' : '/');
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPE = 'streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state';

// Local storage keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';

// Types
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{url: string}>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    images: Array<{url: string}>;
    name: string;
  };
  artists: Array<{name: string}>;
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: Array<{url: string}>;
  description: string;
  tracks: {
    total: number;
  };
  uri: string;
}

// Spotify Authentication
export const getAuthUrl = (): string => {
  // Log the current origin and redirect URI for debugging
  console.log('Current origin:', window.location.origin);
  console.log('Pathname:', window.location.pathname);
  console.log('Using redirect URI:', REDIRECT_URI);

  // Check if CLIENT_ID is available
  if (!CLIENT_ID) {
    console.error('Missing Spotify Client ID. Please add it to your environment variables.');
    // Add a fallback client ID for GitHub Pages deployment
    const fallbackClientId = 'de6bae16d5044c9b8350594ab1cb2c29';
    console.warn('Using fallback client ID for demo purposes only.');
    
    const authUrl = `${AUTH_ENDPOINT}?client_id=${fallbackClientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&response_type=${RESPONSE_TYPE}&show_dialog=true`;
    return authUrl;
  }
  
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&response_type=${RESPONSE_TYPE}&show_dialog=true`;
  console.log('Generated auth URL:', authUrl);
  return authUrl;
};

export const getAccessToken = (): string | null => {
  // Check if we have a token in localStorage
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  // If token exists and is not expired, return it
  if (token && expiry && parseInt(expiry) > Date.now()) {
    console.log('Using existing Spotify token from localStorage');
    return token;
  }
  
  // If we don't have a token in localStorage, check the URL hash
  if (window.location.hash) {
    console.log('Found hash in URL, attempting to extract token');
    const params = window.location.hash.substring(1).split('&');
    let tokenObj: Record<string, string> = {};
    
    params.forEach(param => {
      const [key, value] = param.split('=');
      tokenObj[key] = value;
    });
    
    if (tokenObj.access_token) {
      console.log('Successfully extracted access_token from URL');
      // Calculate token expiry time (token expires in 3600 seconds)
      const expiryTime = Date.now() + (parseInt(tokenObj.expires_in) || 3600) * 1000;
      
      // Store token and expiry time in localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, tokenObj.access_token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Remove the hash from the URL to avoid exposing the token
      window.history.pushState({}, document.title, window.location.pathname);
      
      return tokenObj.access_token;
    } else {
      console.error('Hash found but no access_token:', tokenObj);
    }
  }
  
  return null;
};

export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

export const logout = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// API Calls

// Base API call function
const apiCall = async (endpoint: string, method: string = 'GET', body?: object): Promise<any> => {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }
  
  try {
    console.log(`Calling Spotify API: ${method} ${endpoint}`);
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Handle 204 No Content response (success with no body)
    if (response.status === 204) {
      console.log(`Success: ${method} ${endpoint} returned 204 No Content`);
      return null;
    }
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Spotify session expired. Please log in again.');
    }
    
    if (response.status === 429) {
      // Rate limiting error
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) : 10;
      console.warn(`Rate limit exceeded, need to wait ${waitTime} seconds`);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before making more requests.`);
    }
    
    if (!response.ok) {
      // Check for empty response first
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Error ${response.status}: Non-JSON response`);
      }
      
      try {
        const errorText = await response.text();
        if (!errorText) {
          throw new Error(`Error ${response.status}: Empty response`);
        }
        
        const error = JSON.parse(errorText);
        throw new Error(error.error?.message || `Error ${response.status}`);
      } catch (parseError) {
        if (parseError instanceof SyntaxError) {
          throw new Error(`Error ${response.status}: Invalid JSON response`);
        }
        throw parseError;
      }
    }
    
    // For successful responses, also handle empty bodies safely
    if (method === 'PUT' || method === 'DELETE') {
      // These methods often return empty responses
      try {
        const text = await response.text();
        return text ? JSON.parse(text) : null;
      } catch (e) {
        console.log('No content in response, returning null');
        return null;
      }
    }
    
    // For other methods, parse normally
    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async (): Promise<SpotifyUser> => {
  return await apiCall('/me');
};

// Get focus music playlists
export const getFocusPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  const response = await apiCall('/browse/categories/focus/playlists');
  return response.playlists.items;
};

// Get a specific playlist with its tracks
export const getPlaylist = async (playlistId: string): Promise<{playlist: SpotifyPlaylist, tracks: SpotifyTrack[]}> => {
  const playlist = await apiCall(`/playlists/${playlistId}`);
  const tracks = playlist.tracks.items.map((item: any) => item.track);
  
  return {
    playlist,
    tracks
  };
};

// Play a specific track or playlist
export const play = async (uri: string, resumeOnly: boolean = false): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }
    
    console.log(`Attempting to ${resumeOnly ? 'resume' : 'play'}: ${uri}`);
    
    // For resume only, don't specify a URI to just resume current track
    const endpoint = 'https://api.spotify.com/v1/me/player/play';
    let bodyContent = null;
    
    if (!resumeOnly) {
      // Prepare the request body based on URI type
      bodyContent = uri.includes('playlist') 
        ? JSON.stringify({ context_uri: uri }) 
        : JSON.stringify({ uris: [uri] });
    }
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: bodyContent
    });
    
    // Success with no content
    if (response.status === 204) {
      console.log(`${resumeOnly ? 'Resume' : 'Play'} command successful`);
      return;
    }
    
    // Handle errors
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No active device found');
      }
      
      if (response.status === 429) {
        // Rate limiting error
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) : 10;
        console.warn(`Rate limit exceeded, need to wait ${waitTime} seconds`);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before making more requests.`);
      }
      
      // Try to get error message but don't rely on JSON parsing
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `Error ${response.status}`);
        } else {
          throw new Error(`Error ${response.status}`);
        }
      } catch (parseError) {
        // If parsing fails, just use the status code
        throw new Error(`Error ${response.status} playing track/playlist`);
      }
    }
  } catch (error) {
    console.error('Error in play function:', error);
    throw error;
  }
};

// Pause playback
export const pause = async (): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }
    
    console.log('Attempting to pause playback');
    const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    // Success with no content
    if (response.status === 204) {
      console.log('Pause command successful');
      return;
    }
    
    // Handle errors
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No active device found');
      }
      
      if (response.status === 429) {
        // Rate limiting error
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) : 10;
        console.warn(`Rate limit exceeded, need to wait ${waitTime} seconds`);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before making more requests.`);
      }
      
      throw new Error(`Error ${response.status} pausing playback`);
    }
  } catch (error) {
    console.error('Error in pause function:', error);
    throw error;
  }
};

// Get player state
export const getPlayerState = async (): Promise<any> => {
  return await apiCall('/me/player');
};

// Search for playlists
export const searchPlaylists = async (query: string): Promise<SpotifyPlaylist[]> => {
  const response = await apiCall(`/search?q=${encodeURIComponent(query)}&type=playlist&limit=5`);
  return response.playlists.items;
};

// Control volume
export const setVolume = async (volumePercent: number): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }
    
    console.log(`Setting volume to ${volumePercent}%`);
    const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    // Success with no content
    if (response.status === 204) {
      console.log('Volume change successful');
      return;
    }
    
    // Handle errors without trying to parse JSON
    if (!response.ok) {
      throw new Error(`Error ${response.status} setting volume`);
    }
  } catch (error) {
    console.error('Error setting volume:', error);
    // Don't throw the error - just log it to prevent UI disruption
  }
};

// Open Spotify web player in a new tab or existing app
export const openSpotifyPlayer = (playlistUri: string): void => {
  // Convert uri (spotify:playlist:xxx) to web format
  const playlistId = playlistUri.split(':').pop();
  const spotifyWebUrl = `https://open.spotify.com/playlist/${playlistId}`;
  
  // Open in a new tab
  window.open(spotifyWebUrl, '_blank');
};

// Predefined focus playlists for when API fails or for quick access
export const FOCUS_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: '7LAZHtK5BPjA50SwNK5E3D',
    name: 'fruit loops',
    description: 'Jazz Fruits Music - A personal collection of relaxing jazz beats.',
    images: [],
    tracks: { total: 30 },
    uri: 'spotify:playlist:7LAZHtK5BPjA50SwNK5E3D'
  }
];

// Skip to next track
export const skipToNext = async (): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }
    
    console.log('Attempting to skip to next track');
    const response = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    // Success with no content
    if (response.status === 204) {
      console.log('Skip to next track successful');
      return;
    }
    
    // Handle errors
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No active device found');
      }
      
      if (response.status === 429) {
        // Rate limiting error
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) : 10;
        console.warn(`Rate limit exceeded, need to wait ${waitTime} seconds`);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before making more requests.`);
      }
      
      throw new Error(`Error ${response.status} skipping to next track`);
    }
  } catch (error) {
    console.error('Error in skipToNext function:', error);
    throw error;
  }
}; 