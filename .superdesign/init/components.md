# Components

## Component system

This repository is a dependency-free static page. It has no JavaScript framework, component library, or reusable component source files. UI is authored directly in semantic HTML in `index.html`, enhanced by `script.js`, and styled in `styles.css`.

## Reusable UI patterns

- Header and footer brand: `.brand` in `index.html`, with the shared `assets/logo.svg` mark.
- Button styles: `.button`, `.button-small`, `.button-outline` in `styles.css`.
- Booking selectors: `#service-select`, `#master-select`, `#date-options`, and `#slot-options` in `index.html`; options are rendered by `script.js`.
- Client profile dialog: `#profile-dialog` in `index.html`; stored browser-local profile and booking records are rendered by `script.js`.

There is no component source to reproduce verbatim; these patterns are the repository's directly authored HTML and CSS primitives.
