# Flutter Developer Portfolio — One Page Website

A single-page, dependency-free portfolio site for a Flutter developer.
Dark/light theme, scroll animations, filterable project grid and a demo contact form.

## Files

```
flutter-portfolio/
├── index.html   # all content & sections
├── styles.css   # theme variables live in :root
├── script.js    # reveal, counters, filters, typing effect, form
└── README.md
```

## Run it

Double-click `index.html`, or serve it locally (recommended, keeps localStorage behaviour clean):

```powershell
cd C:\Users\User\flutter-portfolio
python -m http.server 8000
# open http://localhost:8000
```

## Make it yours

| What | Where |
| --- | --- |
| Name, title, socials | `index.html` — `<title>`, hero `<h1>`, `.social-row` |
| Bio, stats, experience | `index.html` — `#about`, `.stats`, `#experience` |
| Projects | `index.html` — `.project` cards. `data-cat="mobile\|web\|package"` drives the filters |
| Skill bars | `index.html` — `data-level="95"` on each `.meter` |
| Contact details | `index.html` — `#contact` |
| Colours, fonts, spacing | `styles.css` — `:root` custom properties |
| Form submission | `script.js` — the submit handler, section 10 |

### Connect the contact form

Replace the submit handler body in `script.js` (section 10) with a real request, e.g.:

```js
fetch('https://formspree.io/f/your-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.fromEntries(new FormData(form)))
});
```

### Re-theme

Edit the `:root` block at the top of `styles.css` — every colour, the gradient and both
font stacks are defined there. The light theme is a single `html[data-theme="light"]` override.

## Deploy

It's a static site — drag the folder into [Netlify Drop](https://app.netlify.com/drop),
GitHub Pages, Vercel, or any static host. No build step.
