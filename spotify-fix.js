// This script fixes the env.js file for local testing
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The content we want to write
const content = `window._env_ = {
  SPOTIFY_CLIENT_ID: "de6bae16d5044c9b8350594ab1cb2c29"
};`;

// Paths to write to
const paths = [
  path.join(__dirname, 'dist', 'env.js'),
  path.join(__dirname, 'dist', 'assets', 'env.js'),
  path.join(__dirname, 'public', 'env.js'),
  path.join(__dirname, 'env.js')
];

// Write the content to each path
paths.forEach(filePath => {
  try {
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(filePath, content);
    console.log(`✅ Successfully wrote env.js to ${filePath}`);
  } catch (error) {
    console.error(`❌ Error writing to ${filePath}:`, error);
  }
});

console.log('Done! You can now run the app locally.'); 