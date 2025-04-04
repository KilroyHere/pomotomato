# Setting Up GitHub Pages for a Private Repository

When using a private GitHub repository, there are a few additional steps needed to properly deploy to GitHub Pages.

## Step 1: Update Repository Settings

1. Go to your repository's **Settings** tab
2. Scroll down to the **Pages** section
3. Under **Build and deployment**, make sure:
   - **Source** is set to "GitHub Actions"
   - NOT "Deploy from a branch"

## Step 2: Check that workflow uses proper method

The `.github/workflows/deploy.yml` file should use GitHub's official Pages actions:

```yaml
jobs:
  build-and-deploy:
    # ...
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    # ...
    steps:
      # ...
      - name: Setup Pages
        uses: actions/configure-pages@v3
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './dist'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

This replaces the older `JamesIves/github-pages-deploy-action` which doesn't work as well with private repositories.

## Step 3: Make sure proper permissions are set

In your workflow file, ensure these permissions are set:

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
  deployments: write
```

## Step 4: Check Actions Logs

If deployment is still failing:

1. Go to the **Actions** tab in your repository
2. Click on the latest workflow run
3. Check the logs for any error messages
4. Common issues include:
   - Missing secrets
   - Incorrect environment configuration
   - Build errors

## Step 5: Verifying Deployment

After a successful deployment:

1. Your site should be available at: `https://[your-username].github.io/pomotomato/`
2. Make sure to update your Spotify app's redirect URI to match this URL
3. Test the Spotify authentication to ensure everything works properly

## Troubleshooting

If you continue to have issues:

1. **Enable Publishing**: Go to Settings > Actions > General > Workflow permissions and ensure "Read and write permissions" is selected
2. **Check Branch Protection**: If you have branch protection rules, they might interfere with the GitHub Actions deployment
3. **Review GitHub Status**: Check [GitHub Status](https://www.githubstatus.com/) to make sure GitHub Pages is operational 