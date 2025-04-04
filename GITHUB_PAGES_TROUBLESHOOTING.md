# GitHub Pages Troubleshooting

Common issues and solutions when deploying to GitHub Pages.

## Common GitHub Actions Errors

### Missing download info for actions/upload-artifact

If you see:
```
Error: Missing download info for actions/upload-artifact@v3
```

**Solution:** Update your workflow file with the latest action versions:
```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- uses: actions/configure-pages@v4
- uses: actions/upload-pages-artifact@v3
- uses: actions/deploy-pages@v4
```

### Deployment Stuck or Failing

1. **Check GitHub Actions permissions:**
   - Go to Settings > Actions > General
   - Make sure "Workflow permissions" is set to "Read and write permissions"

2. **Enable GitHub Pages:**
   - Go to Settings > Pages
   - Source should be set to "GitHub Actions"

3. **Verify branch is correct:**
   - The workflow should be triggered on the `main` branch
   - Make sure you're pushing to the correct branch

## Page Not Found (404) Issues

If your site is deployed but returns a 404:

1. **Check base path in vite.config.ts:**
   ```javascript
   export default defineConfig({
     base: '/pomotomato/',
     // ...
   })
   ```

2. **Verify index.html assets paths:**
   - Assets should be referenced with relative paths
   - Not starting with a slash (/) for GitHub Pages

3. **Check GitHub Pages URL:**
   - Correct format: `https://[username].github.io/pomotomato/`
   - Not `https://[username].github.io/`

## Environment Variables and Secrets

1. **Check Spotify Client ID is set:**
   - Repository Settings > Secrets > Actions
   - There should be a secret named `SPOTIFY_CLIENT_ID`

2. **Verify env.js is created in the workflow:**
   ```yaml
   - name: Create env.js
     run: |
       echo "window._env_ = {" > ./dist/env.js
       echo "  SPOTIFY_CLIENT_ID: \"${{ secrets.SPOTIFY_CLIENT_ID }}\"" >> ./dist/env.js
       echo "};" >> ./dist/env.js
   ```

3. **Test locally first:**
   - Run `npm run setup` to create env.js
   - Verify Spotify integration works locally

## Browser Console Errors

If you're getting console errors on the deployed site:

1. **Check CORS issues:**
   - Your Spotify app's Redirect URI must exactly match your GitHub Pages URL

2. **Verify Content Security Policy:**
   - Make sure the CSP in index.html allows Spotify domains

3. **Inspect Network tab:**
   - Check if env.js is loaded correctly
   - Check for 404 errors on other assets 