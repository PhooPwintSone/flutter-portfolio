# AGENTS.md

## What this repo actually is

A **dependency-free, no-build static site**: `index.html`, `styles.css`, `script.js`, `README.md`.

Despite the folder name, there is **no Flutter or Dart here** — no `pubspec.yaml`, no Dart files, no
Flutter tooling. It is a portfolio *for* a Flutter developer, built in plain HTML/CSS/JS. Don't go
looking for Dart or reach for `flutter pub`.

There is **no `package.json`, bundler, framework, test runner, linter, formatter, or CI**. Don't add
one unprompted. `script.js` is a single IIFE (no `import`/`export`), loaded as a classic script.

## Run it

```powershell
cd C:\Users\User\flutter-portfolio
python -m http.server 8000   # then open http://localhost:8000
```

No install, no build, no build artifacts. Verification = open the page in a browser; there is nothing
to run beyond that. Deploy is drag-and-drop to any static host.

## The HTML ↔ JS contract (the real coupling)

All behaviour hangs off data attributes and IDs in `index.html`. There is no data file, no
templating, no JSON — content *is* the markup.

| Markup | Consumed by | Notes |
| --- | --- | --- |
| `.reveal` + optional `data-delay="1"`…`"5"` | script.js §4 | CSS starts these at `opacity: 0`; only JS adding `.in` makes them visible. **No JS or no IntersectionObserver ⇒ content stays invisible.** |
| `[data-count="42"]`, `[data-suffix="M+"]` | §6 | `textContent` is overwritten. Inner text in HTML is ignored. |
| `.meter[data-level="95"]` | §7 | JS writes the width onto the child `.meter-fill` and adds `.done`. The `<b>95%</b>` label is *static HTML* — nothing syncs it to `data-level`, so update both by hand. |
| `.project[data-cat="mobile\|web\|package"]` | §9 | Must match a `.filter[data-filter=...]` button. A new category needs the button **and** every card's value. |
| `.nav-link[href="#id"]` | §5 scroll spy | Section ids with no nav link are invisible to the spy. `#home` has no nav link, so nothing is active at the top of the page. |
| `#typed` | §8 | Empty element; the hero phrases live in `script.js`, not the HTML. |

New non-active filter buttons must ship with `aria-selected="false"` (the script only toggles it
after the first click).

Project thumbnails are **CSS gradients on `.t-1`…`.t-6` plus an emoji glyph** — no image files are
involved. Only `.t-1`–`.t-3` are currently used (three projects); adding a card that reuses `.t-4`…`.t-6`
is fine, but a card with no `.t-N` class renders an unstyled blank thumbnail.

The **only** image assets are the logo derivatives, all generated from `logo.jpg`:

| File | Size | Used by |
| --- | --- | --- |
| `logo.jpg` | 2048×2048, ~1.05 MB | Source only — **never referenced by the markup**, too heavy to ship |
| `logo-128.jpg` | 128×128, ~6 KB | The `.brand-mark` `<img>` in the nav (displayed at 38×38) |
| `favicon-32.png` | 32×32, ~1.5 KB | `<link rel="icon">` |
| `apple-touch-icon.png` | 180×180, ~19 KB | `<link rel="apple-touch-icon">` |

`logo.jpg` is an opaque **photo on a white background**, not a transparent logo — the art only fills
88% of the frame and the corners are pure white. The derivatives are therefore cropped to the
content bounding box, and the two PNGs get a `#0B1020` plate behind the art so they stay visible on
light browser chrome. Regenerate with the crop script rather than hand-scaling: a plain
`DrawImage` to the full 2048 frame paints over the plate and yields a white square. If `logo.jpg` is
ever replaced, all three derivatives must be regenerated together or the tab icon and nav mark
disagree.

The `.marquee-track` scrolls with `translateX(-50%)`, so its two halves must stay **byte-identical**
or the loop visibly jumps. Same for the `.year` span, which is now unused (no project carries one)
but whose CSS rule is still in `styles.css`.

## script.js fragility

`#nav`, `#menuBtn`, `#navLinks`, `#themeToggle`, `#contactForm`, `#name`, `#email`, `#message`,
`#formMsg` and `#year` are queried and used **without null checks**, inside one IIFE with no
try/catch. Rename or remove any of those IDs and the script throws — everything after that line
silently dies (theme toggle, reveals, counters, meters, typing, filters, form, year). Only `#typed`
and `#cursorGlow` are guarded.

The script tag is the last element in `<body>` with no `defer`. Moving it into `<head>` requires
adding `defer` or nothing will bind.

The filter handler deliberately does `remove('in'); void el.offsetWidth; add('in')` (§9) to force a
reflow and replay the reveal transition on newly shown cards. Don't "clean that up".

`reduceMotion` is read once at the top of the IIFE (`prefers-reduced-motion`) and gates reveal,
typing and the cursor glow; `styles.css` has a matching `@media` block. If animations look broken,
check that emulation first.

## Theming

`:root` in `styles.css` defines every colour, the gradient, both font stacks, `--radius` and
`--nav-h`. Light mode is a single `html[data-theme="light"]` override — the only dark-specific rules
are sun/moon icon swaps and the code-card background.

`--nav-h` also drives `scroll-padding-top` and the mobile menu's offset, so anchor links stay clear
of the fixed nav automatically.

`<html data-theme="dark">` is hardcoded as the default, but §3 overrides it from
`localStorage.getItem('theme')` on load. So the persisted value beats the markup — that is the usual
cause of "the theme I set in HTML isn't showing", and it also means the localStorage read is on the
critical path (serve over HTTP rather than `file://`).

## Content is intentionally placeholder

Most of the biography is **placeholder content for a fictional persona** (the invented employers in
`#experience` and the `.year` styling) per the README's "Make it yours" table. The persona itself
is real — name, email, GitHub, LinkedIn, the three project repos and `resume.pdf` are all genuine,
so don't rewrite *those* as placeholders. Change any of it only when asked.

The contact form (§10) validates and then says it isn't wired up. It never sends a request. Wiring
it up means replacing that handler body — see the README's Formspree snippet.

`README.md` is the user-facing doc for content and theming; keep it in sync if you change where
things live.
