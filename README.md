# kiosk

A dead-simple PWA kiosk browser for tablets. Paste a URL, tap **Start Kiosk**, done.

## Features
- Paste a URL → shown full screen
- **Exit:** press & hold the top-right corner for 3 seconds (optional 4-digit PIN)
- Keeps the screen awake, blocks the back button
- Optional auto-refresh, auto-reload when the internet comes back
- Opens straight into the last website on launch (3 s countdown to change it)
- Installable, works offline (app shell)

## Run locally
```bash
npx serve .
```
Then open the shown URL. PWAs need **HTTPS** (or `localhost`) to install — deploy to GitHub Pages, Netlify or Vercel for use on a tablet.

## Install on the tablet
- **Android (Chrome):** open the site → menu → *Install app* / *Add to Home screen*
- **iPad (Safari):** Share → *Add to Home Screen*

## Note
Some websites (e.g. Google, Facebook) block being shown inside other apps (`X-Frame-Options`). Those will show as blank/refused — this is a restriction set by the website and can't be bypassed by a web app.