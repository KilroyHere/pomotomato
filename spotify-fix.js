// This script sets up Spotify client ID for local development
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths where env.js is needed
const paths = [
  path.join(__dirname, 'dist', 'env.js'),
  path.join(__dirname, 'dist', 'assets', 'env.js'),
  path.join(__dirname, 'public', 'env.js')
];

// Helper to create directories and write file
const writeEnvFile = (clientId) => {
  const content = `window._env_ = {
  SPOTIFY_CLIENT_ID: "${clientId}"
};`;

  paths.forEach(filePath => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}`);
    } catch (error) {
      console.error(`❌ ${filePath}:`, error);
    }
  });
};

// Instructions for getting a Spotify Client ID
console.log('\n🎵 Spotify Integration Setup 🎵');
console.log('------------------------------');
console.log('To get a Spotify Client ID:');
console.log('1. Go to https://developer.spotify.com/dashboard/');
console.log('2. Create a new app');
console.log('3. Add these redirect URIs in your app settings:');
console.log('   - For local: http://localhost:5173');
console.log('   - For GitHub Pages: https://[username].github.io/pomotomato/');
console.log('------------------------------\n');

// Ask for Client ID
rl.question('Enter your Spotify Client ID (or press Enter to skip): ', (clientId) => {
  if (!clientId || clientId.trim() === '') {
    console.log('\n⚠️ No Client ID provided. Spotify integration will not work.');
    console.log('➡️ When you have a Client ID, run this script again.\n');
    rl.close();
    return;
  }

  writeEnvFile(clientId.trim());
  console.log('\n✓ Spotify Client ID set up successfully!');
  console.log('➡️ You can now run the app with "npm run dev"');
  rl.close();
}); 