# GitHub Pages Deployment Guide

## Overview

This guide explains how to deploy your portfolio to GitHub Pages using the included CI/CD pipeline.

## Prerequisites

- GitHub repository with your code
- GitHub account with Pages enabled
- Branch: `feature/complete-refactoring` (already pushed)

## Step-by-Step Deployment

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/A-RYAN-1/Portfolio-Website
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Build and deployment**, find **Source**
5. Change from "Deploy from a branch" to **"GitHub Actions"**
6. Click **Save**

### Step 2: Deploy Feature Branch (Testing)

Your feature branch is already pushed. The workflow will automatically deploy it.

1. Go to **Actions** tab in your repository
2. You'll see the workflow running: "Deploy Feature Branch to GitHub Pages"
3. Wait for it to complete (1-2 minutes)
4. Click on the workflow run to see details
5. At the bottom, you'll find the deployment URL

**Your site will be available at:**
```
https://a-ryan-1.github.io/Portfolio-Website/
```

### Step 3: Test Your Deployed Site

1. Open the deployment URL
2. Test all functionality:
   - Navigation between pages
   - Sidebar toggle on mobile
   - Project filtering
   - Testimonial modal
   - Skill animations
   - All links and images

### Step 4: Merge to Main (Production)

Once you're satisfied with the feature branch deployment:

```bash
# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/complete-refactoring

# Push to main
git push origin main
```

The main branch workflow will automatically deploy to production.

## How the CI/CD Pipeline Works

### Feature Branch Workflow (`.github/workflows/deploy-feature.yml`)

- **Triggers**: On push to any `feature/*` branch
- **Process**:
  1. Checks out your code
  2. Configures GitHub Pages
  3. Uploads all files as artifact
  4. Deploys to GitHub Pages
- **Result**: Your site is live for testing

### Main Branch Workflow (`.github/workflows/deploy.yml`)

- **Triggers**: On push to `main` branch
- **Process**: Same as feature branch
- **Result**: Your production site is updated

## Workflow Logs

To check deployment status:

1. Go to **Actions** tab
2. Click on the workflow run
3. View the logs for each step
4. If deployment fails, check error messages

## Troubleshooting

### Workflow Not Running

- Check if GitHub Pages is enabled in Settings
- Verify workflow files are in `.github/workflows/`
- Ensure branch name matches the trigger pattern

### Deployment Fails

- Check workflow logs for specific errors
- Verify file permissions are correct
- Ensure no syntax errors in workflow files

### Site Not Loading

- Wait 1-2 minutes for DNS propagation
- Clear browser cache
- Check if GitHub Pages is enabled
- Verify deployment completed successfully

### 404 Errors

- Check the repository name matches the URL
- Ensure the branch is deployed correctly
- Verify the workflow completed successfully

## Customization

### Change Deployment Branch

Edit the workflow files to change trigger branches:

```yaml
on:
  push:
    branches:
      - your-branch-name
```

### Add Custom Domain

1. Go to repository **Settings** → **Pages**
2. Under **Custom domain**, enter your domain
3. Configure DNS records as instructed
4. Enable **Enforce HTTPS**

### Environment Variables

Add secrets in repository Settings → Secrets and variables → Actions:

```yaml
env:
  CUSTOM_VAR: ${{ secrets.YOUR_SECRET }}
```

## Best Practices

1. **Test on feature branch first** before merging to main
2. **Keep workflows simple** - avoid complex logic
3. **Monitor workflow runs** - check for failures
4. **Use semantic versioning** for releases
5. **Document changes** in commit messages

## Alternative Deployment Methods

### Manual Deployment with gh-pages

```bash
# Install gh-pages
npm install -g gh-pages

# Deploy
gh-pages -d .
```

### Using GitHub CLI

```bash
# Install GitHub CLI
# Then deploy
gh repo view --web
# Enable Pages in settings
```

## Cost

GitHub Pages is **completely free** for:
- Public repositories
- Private repositories (with certain limits)
- Custom domains
- SSL certificates
- Unlimited bandwidth

## Summary

Your portfolio is now set up with automatic CI/CD deployment:

- ✅ Feature branches deploy automatically for testing
- ✅ Main branch deploys automatically for production
- ✅ No manual configuration needed after initial setup
- ✅ Free hosting on GitHub Pages
- ✅ SSL certificates included
- ✅ Custom domain support available

Just push your code and GitHub Actions handles the rest!
