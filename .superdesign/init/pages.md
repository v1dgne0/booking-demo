# Page dependency tree

## `/` — Home and demo booking

Entry: `index.html`

Dependencies:
- `styles.css` — site layout, responsive styles, profile dialog, and motion
- `script.js` — service data, date/slot selection, demo booking storage, profile lookup, and menu behavior
- `assets/hero.png` — hero illustration
- `assets/logo.svg` — brand mark and browser favicon

The booking data and client profile are limited to this browser's `localStorage`; there is no backend or real appointment service.
