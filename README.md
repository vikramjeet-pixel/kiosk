# kiosk

A simple PWA kiosk browser for tablets.

## How it works
- **Display** (`index.html`): shows your website full screen. Nothing else.
- **Admin** (`admin.html`): set the website, reload interval and an optional 4-digit PIN.
- From the display, **press and hold the top-right corner for 3 seconds** to open admin.
- Keeps the screen on, blocks the back button, reloads when the internet comes back.
- Settings are stored on the tablet itself.

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