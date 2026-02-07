# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EvansLinks is a client-side URL shortener that runs entirely in the browser using localStorage. There is no backend database - all link data is stored locally in the user's browser.

## Development

**Local development server:**
```bash
python server.py
# Runs at http://localhost:3000
```

No build process required - edit HTML/CSS/JS files directly.

## Architecture

### Core Flow
1. User enters URL in `index.html` → `app.js` (`ShortLinkPro` class) generates 3-character short code
2. Link data stored in localStorage under key `evansLinks_links`
3. Short URLs display as `evanlinks.com/{code}` but redirect via `redirect.html#{code}`
4. `redirect.html` reads localStorage, increments click count, performs redirect after 5-second countdown

### Key Files
- **app.js**: Main application logic via `ShortLinkPro` class - handles URL shortening, validation, localStorage persistence, theme management
- **redirect.html**: Self-contained redirect handler with inline JS/CSS - reads short code from URL hash, looks up destination in localStorage
- **server.py**: Simple Python dev server that routes short codes to `handler.html#{code}`

### Data Model
Links stored as array in localStorage (`evansLinks_links`):
```javascript
{
  id: string,           // timestamp-based ID
  originalUrl: string,
  shortCode: string,    // 3-char alphanumeric
  shortUrl: string,     // display URL
  createdAt: string,    // ISO date
  clicks: number
}
```

### Theme System
Theme preference stored in localStorage as `evansLinks_theme` (values: `light`/`dark`). Applied via `data-theme` attribute on `<html>` element.

## Deployment

Deploy to GitHub Pages - see `DEPLOYMENT.md` for full instructions. After deployment, update `generateShortUrl()` in `app.js` to use `${window.location.origin}` instead of hardcoded `evanlinks.com`.
