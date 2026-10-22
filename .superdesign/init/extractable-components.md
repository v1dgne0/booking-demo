# Extractable components

## Layout components

### SiteHeader
- Source: `index.html` (`.site-header`), styles in `styles.css`, behavior in `script.js`
- Category: `layout`
- Description: Brand, numbered section navigation, profile action, and mobile menu.
- Extractable props: activeSection, profileCount, menuOpen
- Hardcoded: Russian labels, colors, SVG user icon, logo asset, CSS classes.

### SiteFooter
- Source: `index.html` (`.site-footer`)
- Category: `layout`
- Description: Brand mark, demo note, booking link, and year.
- Extractable props: year
- Hardcoded: Brand and demo copy.

## Basic components

### ProfileDialog
- Source: `index.html` (`#profile-dialog`), `script.js`, `styles.css`
- Category: `basic`
- Description: Browser-local client profile, phone lookup, and saved appointment list.
- Extractable props: clientProfile, bookings, onLookup, onClose
- Hardcoded: Russian demo copy, statuses, and palette.

### BookingWizard
- Source: `index.html` (`#booking`), `script.js`, `styles.css`
- Category: `basic`
- Description: Service, master, date, time, and contact selection with a local demo confirmation.
- Extractable props: services, masters, selectedDate, selectedTime, onSave
- Hardcoded: Three step labels, demo explanation, and form layout.

### ServiceRow
- Source: `script.js` (`renderServices`), `styles.css` (`.service-row`)
- Category: `basic`
- Description: Service name, duration, demo price, and booking action.
- Extractable props: service, onSelect
- Hardcoded: Number format, currency, and action label.
