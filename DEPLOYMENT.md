# GitHub Pages Deployment Guide for EvansLinks

## Prerequisites
- GitHub account
- Git installed on your computer
- EvansLinks project files ready

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the "+" button in the top right corner
3. Select "New repository"
4. Set repository name: `evanlinks.github.io` (exactly this format)
   - Replace "evanlinks" with your GitHub username
   - Example: if username is "johnsmith", use `johnsmith.github.io`
5. Choose "Public" repository
6. Click "Create repository"

## Step 2: Initialize Git Repository

1. Open Command Prompt/PowerShell
2. Navigate to your EvansLinks folder:
   ```bash
   cd "C:\Users\user\Documents\new app 2"
   ```

3. Initialize Git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - EvansLinks URL shortener"
   ```

## Step 3: Connect to GitHub Repository

1. Add remote repository (replace with your details):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
   ```
   Example: `git remote add origin https://github.com/evanlinks/evanlinks.github.io.git`

2. Push to GitHub:
   ```bash
   git push -u origin main
   ```

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll to "Pages" section
4. Under "Build and deployment", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

## Step 5: Wait for Deployment

- GitHub Pages will take 1-10 minutes to deploy
- You'll see your site at: `https://YOUR_USERNAME.github.io`
- Check the "Pages" section for deployment status

## Step 6: Update URLs in Your Code

Since your site will now be at `username.github.io`, update these references:

### Update app.js:
```javascript
// Find this line in generateShortUrl method:
return `evanlinks.com/${shortCode}`;

// Change to:
return `${window.location.origin}/${shortCode}`;
```

### Update redirect.html:
```javascript
// Update localStorage key from 'evansLinks_links' to work with your domain
```

## Alternative: Use Custom Domain Setup

If you want to keep `evanlinks.com` branding:

### Option A: Add Custom Domain to GitHub Pages
1. In repository Settings → Pages, click "Add custom domain"
2. Enter `evanlinks.com` (requires you own this domain)
3. Configure DNS records (CNAME)

### Option B: Use GitHub Username URL
Keep the `username.github.io` format and update branding accordingly.

## Step 7: Test Your Live Site

1. Visit `https://YOUR_USERNAME.github.io`
2. Test URL shortening
3. Test redirects using the redirect.html format
4. Verify all features work as expected

## Troubleshooting

### Common Issues:

**Site doesn't load:**
- Wait 10-15 minutes for GitHub Pages deployment
- Check that your repository name is exactly `username.github.io`
- Verify your files are in the main branch

**404 errors:**
- Ensure all files are committed and pushed
- Check file names match exactly (case-sensitive)
- Verify your HTML file references are correct

**Redirects don't work:**
- Make sure redirect.html is uploaded
- Check that localStorage is accessible on your domain
- Test with `your-domain.github.io/redirect.html#testcode`

**Theme doesn't persist:**
- GitHub Pages serves files over HTTPS, localStorage works fine
- Check your theme initialization code
- Ensure no mixed content issues

## Next Steps After Deployment

### 1. Custom Domain (Optional)
- Purchase a domain name
- Configure CNAME record with GitHub Pages
- Update all branding in your code

### 2. SSL Certificate
- GitHub Pages provides automatic SSL
- Your site will work over HTTPS

### 3. Analytics (Optional)
- Add Google Analytics or similar
- Track usage and popular links

### 4. Performance Optimization
- Compress images
- Minify CSS/JS
- Enable GitHub Pages caching

## Maintenance

### To Update Your Site:
1. Make changes to local files
2. Commit changes: `git add . && git commit -m "Update description"`
3. Push to GitHub: `git push`
4. Changes will automatically deploy

### Backup Your Data:
Since your links are stored in localStorage:
- Regularly export your links using the export feature
- Save the JSON file locally as backup
- Consider implementing server-side storage for production

## Final URL Structure

Once deployed, your EvansLinks will be accessible at:
`https://YOUR_USERNAME.github.io`

- Main app: `https://YOUR_USERNAME.github.io/index.html`
- Redirect page: `https://YOUR_USERNAME.github.io/redirect.html#code`
- Privacy: `https://YOUR_USERNAME.github.io/privacy.html`
- Terms: `https://YOUR_USERNAME.github.io/terms.html`
- API: `https://YOUR_USERNAME.github.io/api.html`

## Success! 🎉

Your EvansLinks URL shortener is now live and accessible to anyone on the internet!