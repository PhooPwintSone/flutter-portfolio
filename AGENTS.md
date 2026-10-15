# AGENTS.md

## What this repo actually is

A **no-build static site**: `index.html`, `styles.css`, `script.js`, `README.md`. Open or serve it
directly — there is no bundler, framework, test runner, linter, or CI, and nothing is compiled.

The **only** npm artifacts are a vestigial `package.json` / `package-lock.json` declaring
`@vercel/analytics`, added by Vercel's analytics bot. No site file imports that package — Analytics is
loaded by the inline `<head>` snippet below — so you never need `npm install` or a build to run or
deploy this. **`node_modules/` is committed and there is no `.gitignore`;** don't "tidy" that away
unprompted, or you'll produce a huge deletion commit.

Despite the folder name, there is **no Flutter or Dart here** — no `pubspec.yaml`, no Dart files, no
Flutter tooling. It is a portfolio *for* a Flutter developer, built in plain HTML/CSS/JS. Don't go
looking for Dart or reach for `flutter pub`.

`script.js` is a single IIFE (no `import`/`export`), loaded as a classic script.

`index.html` is Prettier-formatted: 2-space indent, 80-column wrap, double-quoted attributes, and
**single quotes inside inline JS**. There is no Prettier config in the repo and no local install, and
Prettier's *defaults* do not reproduce the file — `npx prettier@3.3.3 --single-quote --check index.html`
is the honest check (`--single-quote` is the part that matters). It exits non-zero on exactly two
lines: the `…1+</b><span>Years experience</span>` and `…6+…GitHub Repositories` stat elements in the
`.stats` band (between the hero and `#about`), which run past 80 columns but are intentionally left
inline. Everything else is clean, so any *other* reported diff is yours. Match the surrounding style
by hand rather than running a whole-file `--write`, which would reformat unrelated lines and swamp the
change.

`script.js` must stay the last element in `<body>` and **must not** gain `defer`, since it binds to
nodes that don't exist until the body has parsed. A `defer`red tag is only safe in `<head>`.

Local storage goes through the `store` helper in §3 — never call `localStorage` directly. It throws
`SecurityError` over `file://` and in some privacy modes, and because the whole file is one unguarded
IIFE, a throw there aborts every later section and leaves every `.reveal` element stuck at
`opacity: 0`, i.e. a blank page below the nav.

Vercel Analytics is injected by a small inline block at the end of `<head>`, guarded by a
localhost/`127.0.0.1`/`::1` hostname regex. It has to be injected rather than written as a static
`<script src>`, because `/_vercel/insights/script.js` is served only by Vercel's edge: as a static tag
it 404s on every other host and in local dev, and that 404 was once mistaken for the cause of the
blank-page bug. The guard keeps local dev clean. It will still 404 if the site is deployed somewhere
other than Vercel — delete the block in that case. The `@vercel/analytics` entry in `package.json` is
*not* what loads this; that npm package is ESM and would need a bundler this repo deliberately lacks,
which is why the snippet is hand-rolled.

`test-chip-drag.js` is a headless integration test for the hero chips: it slices §12 straight out of
`script.js` and runs it against a DOM stub, so it exercises the shipped code rather than a copy.
Run it with `node test-chip-drag.js` after touching the drag code. It asserts the 4px arm threshold,
four-way movement, leash cap, viewport clamp, spring-back-to-zero and `is-dragging` cleanup.
There is otherwise no test setup in this repo — do not add a runner for it.

The test finds §12 by its literal `/* ---------- 12.` header and stops at `/* ---------- 13.`, so
**renumbering the script sections breaks it.** Add new sections at the end (the current last one is
§15) rather than renumbering or inserting. It also reads `script.js` via `__dirname`, so it works
wherever the folder lives — do not reintroduce an absolute path.

## Run it

```powershell
cd "D:\Mobile class\flutter_class\flutter-portfolio"
python -m http.server 8000   # then open http://localhost:8000
```

No install, no build, no build artifacts. Verification = open the page in a browser (plus
`node test-chip-drag.js` if you touched the drag code); there is nothing else to run. Deploy is
drag-and-drop to any static host, or push to `master` — the repo is wired to Vercel
(`flutter-portfolio-hazel.vercel.app`) and rebuilds automatically.

## The HTML ↔ JS contract (the real coupling)

All behaviour hangs off data attributes and IDs in `index.html`. There is no data file, no
templating, no JSON — content *is* the markup.

| Markup | Consumed by | Notes |
| --- | --- | --- |
| `.reveal` + optional `data-delay="1"`…`"5"` | script.js §4 | CSS starts these at `opacity: 0`; only JS adding `.in` makes them visible, so **no JS** (or an early throw in the IIFE) leaves the page blank below the nav. A missing `IntersectionObserver` is *not* a problem: the §4 `else` branch adds `.in` to all of them. |
| `[data-count="42"]`, `[data-suffix="M+"]` | §6 | `textContent` is overwritten. Inner text in HTML is ignored. |
| `.meter[data-level="95"]` | §7 | JS writes the width onto the child `.meter-fill` and adds `.done`. The `<b>95%</b>` label is *static HTML* — nothing syncs it to `data-level`, so update both by hand. |
| `.project[data-cat="mobile\|web\|package"]` | §9 | Must match a `.filter[data-filter=...]` button. A new category needs the button **and** every card's value. |
| `.projects-grid#projectsGrid` | §9 | Filter clicks toggle `.filtered` on the **grid**, not just the cards. The bento span (`.wide`) and the desktop split are scoped to `.projects-grid:not(.filtered)`, so dropping the id or the class reflows every filtered view. |
| `.nav-link[href="#id"]` | §5 scroll spy | Section ids with no nav link are invisible to the spy. `#home` has no nav link, so nothing is active at the top of the page. |
| `#typed` | §8 | Empty element; the hero phrases live in `script.js`, not the HTML. |
| `#greeting` | §14 | The phone mockup's kicker; JS overwrites it with a time-of-day phrase from the visitor's clock and re-checks every minute. Guarded, so a rename is harmless — the static `Good morning` in the HTML is the no-JS fallback. |
| `.copy-btn[data-copy]` | §15 | Copies its own `data-copy` value. Falls back to a hidden `<textarea>` + `execCommand` when `navigator.clipboard` is unavailable (non-secure context, e.g. `file://`). Guarded like `#typed`/`#greeting`, so a missing button is harmless. |

New non-active filter buttons must ship with `aria-selected="false"` (the script only toggles it
after the first click).

The cards are a **bento grid**, not a uniform one. `.projects-grid` is `repeat(3, minmax(0, 1fr))`
on desktop; `Yomi Board` carries `.wide` (`grid-column: span 2`) and `.split` (copy left, visual
right — swapped with `order` inside a `min-width: 961px` query). Tablet (`≤960px`) drops to two
columns with `.wide` still full-width; mobile (`≤780px`) is one column and `.wide` resets to `auto`.

Filter state therefore also lives on the grid: script.js §9 adds `.filtered` to `#projectsGrid`
whenever a non-`all` filter is active. `.projects-grid.filtered` switches to
`repeat(auto-fit, minmax(290px, 380px))` with `justify-content: center`, so a lone or paired card
centres instead of stretching across the container.

Every thumbnail shows **real app screenshots** except one. `.project-thumb.is-shots` hides the
`::after` vignette and lays a `.thumb-shots` overlay of `<img>`s over the card's `.t-N` backdrop.
The base `.thumb-shots` is a bottom-flush shelf (Weather's three shots, Mari's three);
`.thumb-shots.is-mixed` stacks two wide web shots over two phone shots (Mini-Blog); and
`.thumb-shots.is-fan` is a tilting, overlapping deck of three that only applies inside the desktop
split query (Yomi) — everywhere else `.is-fan` falls back to the plain shelf. curved_toggle_tabs has
no app UI worth shooting, so it keeps the one remaining **coded HTML/CSS mockup**,
`.mock.mock-tabs` (a folder tab bar whose indicator morphs on card hover). The `.thumb-glyph` rules
and the old kanban/duo/mari scenes are gone.

`.t-1`…`.t-5` are still required — one per card — but they are now **dark tinted radial backdrops**
rather than the old bright linear gradients, so the mockup and the screenshots read clearly.
A card with no `.t-N` renders an unstyled panel, so every card needs one; the next free class is
`.t-6`. The class travels with the **project**, not its grid position: `.t-1` Yomi, `.t-2` Mari,
`.t-3` Mini-Blog, `.t-4` curved_toggle_tabs, `.t-5` Weather.

Mockup colours are **literal, never theme tokens**. The tab mockup depicts dark app UI, and the
light theme repoints `--mint`, `--flutter` and `--text-faint` to dark values that would disappear
on it; `.p-badge` text is fixed for the same reason. Each card carries a `.p-badges` cluster in the
top-right of its visual header and a `.project-links` footer: `.pl-primary` (filled pill) on the
Mini-Blog Live Demo and the curved_toggle_tabs pub.dev page, `.pl-src` (arrow slides on hover) on
every Source link.

Image assets live under `images/`, in three subfolders — `icons/` (favicon + touch icons), `logo/`
(logo derivatives) and one folder per app (`weather_app/` holds the project-card screenshots). The
logo derivatives are all generated from `logo.jpg`:

| File | Size | Used by |
| --- | --- | --- |
| `images/logo/logo.jpg` | 2048×2048, ~1 MB | Source only — **never referenced**, too heavy to ship |
| `images/logo/logo-128.jpg` | 128×128, ~6 KB | The `.brand-mark` `<img>` in the nav (displayed at 38×38) |
| `images/logo/logo-alpha-64.png` | 64×64, ~5 KB | Base64-embedded **inside `images/icons/favicon.svg`** |
| `images/icons/favicon.svg` | ~7.5 KB | `<link rel="icon" type="image/svg+xml">` — primary |
| `images/icons/favicon-32.png` | 32×32, ~1.5 KB | PNG fallback for browsers without SVG favicons |
| `images/icons/apple-touch-icon.png` | 180×180, ~23 KB | `<link rel="apple-touch-icon">` |

`logo.jpg` is an opaque **photo on a white background**, not a transparent logo — the art fills 88%
of the frame and the corners are pure white. That is why the tab icon needed a plate: white art on
a light tab strip is invisible. `images/icons/favicon.svg` is self-contained (data-URI image, no
external reference, as SVG-as-image forbids them) and switches the plate with `prefers-color-scheme` —
`#0b1020` by default and under a **light** scheme so the logo is framed and legible, `fill: none`
under a **dark** scheme so there is no visible frame on a dark tab. The raster fallbacks cannot react
to a media query, so `favicon-32.png` and `apple-touch-icon.png` bake the dark plate in permanently.
Regenerate all four derivatives together whenever `logo.jpg` changes, or the tab icon and nav mark
drift apart. Because the SVG embeds its bitmap as a data URI and nothing references the logo files by
path except the nav `<img>`, the whole `images/` tree can be reorganised freely — just update that
`src` and the three `<link>` hrefs in `<head>`.

The `.marquee-track` scrolls with `translateX(-50%)`, so its two halves must stay **byte-identical**
or the loop visibly jumps. It cycles 12 technologies (matching the skill cards) and `animation: slide`
is `56s`; scale that duration with the item count to keep the scroll speed constant (it was `28s` when
there were 6).

## script.js fragility

`#nav`, `#menuBtn`, `#navLinks`, `#themeToggle`, `#contactForm`, `#name`, `#email`, `#message`,
`#formMsg` and `#year` are queried and used **without null checks**, inside one IIFE with no
try/catch. Rename or remove any of those IDs and the script throws — everything after that line
silently dies (theme toggle, reveals, counters, meters, typing, filters, form, year). Guarded, so safe
to rename: `#typed` (§8), `#cursorGlow` (§11), `#greeting` (§14) and `.copy-btn` (§15).

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

The README's "Make it yours" table is the map of what is editable. The persona itself is real — name,
email, GitHub, LinkedIn, the project repos and `resume.pdf` are all genuine, so don't rewrite *those*
as placeholders. Change any of it only when asked.

The `#experience` entries (e.g. "Digital Base") match the real GitHub profile, so treat them as real
content and **confirm before editing or reordering** rather than assuming placeholder. Project cards
carry no year field.

The contact form (§10) is wired to **FormSubmit** (`https://formsubmit.co/ajax/<address>`) — a
no-signup relay, so the site still has no backend. Two FormSubmit behaviours the handler exists to
absorb, and which will bite anyone who "simplifies" it: it answers **HTTP 200 even when it refuses**,
and it reports success as the **string** `"true"` — so `if (res.ok)` or `if (data.success)` both
report a false success, because `"false"` is truthy. The first submission ever made triggers a
confirmation email to the owner; until that link is clicked the relay keeps refusing with
`success:"false"`. Swapping `CONTACT_ENDPOINT` for Formspree or Web3Forms needs no other change.

`README.md` is the user-facing doc for content and theming; keep it in sync if you change where
things live.
