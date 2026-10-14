# Flutter Developer Portfolio — One Page Website

A single-page, dependency-free portfolio site for a Flutter developer.
Dark/light theme, scroll animations, filterable project grid and a working contact form.

## Files

```
flutter-portfolio/
├── index.html          # all content & sections
├── styles.css          # theme variables live in :root
├── script.js           # reveal, counters, filters, typing, form, copy-email
├── favicon.svg         # + favicon-32.png, apple-touch-icon.png, logo-128.jpg
├── resume.pdf          # linked from the hero
├── AGENTS.md           # notes for AI agents and future you
├── test-chip-drag.js   # headless test for the hero chips: node test-chip-drag.js
└── README.md
```

## Run it

Double-click `index.html`, or serve it locally (recommended, keeps localStorage behaviour clean):

```powershell
cd "D:\Mobile class\flutter_class\flutter-portfolio"
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
| Copy-email button | `index.html` — the `.contact-email` card. `data-copy` on `.copy-btn` must match the `mailto:` address |
| Colours, fonts, spacing | `styles.css` — `:root` custom properties |
| Form submission | `script.js` — the `CONTACT_ENDPOINT` constant, section 10 |

### The contact form

It is already wired: `script.js` (section 10) POSTs the three fields to **FormSubmit**, a free
no-signup relay that emails you the submission — which is how the site stays backend-free.

**One-time step:** the *first* submission triggers a confirmation email to your address. Click the
link in it. Until you do, the relay refuses every submission and the form shows its error message.
After confirming, FormSubmit offers a random alias you can use instead of your raw address — swap it
into `CONTACT_ENDPOINT` to keep your address out of the source.

`success` comes back as the **string** `"true"`, and FormSubmit answers HTTP 200 even when it
refuses. Compare with `String(data.success) !== 'true'` (as the handler does) — `if (res.ok)` would
show a false success, because `"false"` is truthy in JS.

To use a different service, change the one `CONTACT_ENDPOINT` constant; the rest is unchanged:

| Service | Endpoint |
| --- | --- |
| FormSubmit (current) | `https://formsubmit.co/ajax/you@example.com` |
| Formspree | `https://formspree.io/f/<your-id>` |
| Web3Forms | `https://api.web3forms.com/submit` (add your `access_key` to the body) |

### Re-theme

Edit the `:root` block at the top of `styles.css` — every colour, the gradient and both
font stacks are defined there. The light theme is a single `html[data-theme="light"]` override.

## Deploy

It's a static site — no build step. This copy is deployed on **Vercel**, wired to the
[`PhooPwintSone/flutter-portfolio`](https://github.com/PhooPwintSone/flutter-portfolio) repo: push to
`master` and Vercel rebuilds. Live at <https://flutter-portfolio-hazel.vercel.app/>.

Any other static host works too (GitHub Pages, Netlify, Cloudflare Pages) — just drop the folder in.
The one host-specific piece is the Vercel Analytics snippet at the end of `<head>`: it is guarded on
`location.hostname` so it no-ops elsewhere, but delete the block if you move off Vercel.
