# Layouts

## Site shell

`index.html` is the only page and contains its shared shell: `.site-header` with `.brand` and `#main-nav`, the `<main id="main">` landmark with anchored sections, and `.site-footer`. All page layout and responsive behavior live in `styles.css`; there are no layout components or framework wrappers.

## Profile overlay

The client profile is a native `<dialog id="profile-dialog">` in the header. `script.js` opens it with `showModal()` and closes it with the close button, backdrop, or native Escape behavior.

## Responsive navigation

The header includes `button.menu-toggle` controlling `nav#main-nav` via `aria-expanded` and `aria-controls`. Desktop shows numbered section links and profile/booking actions; the narrow-screen layout turns them into a two-column link grid and paired actions.
