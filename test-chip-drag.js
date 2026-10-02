/* Integration test for the REAL chip-drag section extracted from script.js.
   Nothing is reimplemented: section 12 is sliced out of the shipped file and run
   against a minimal DOM stub, so a regression in the actual code fails here. */
const fs = require('fs');
const path = 'C:/Users/User/flutter-portfolio/script.js';
const src = fs.readFileSync(path, 'utf8');

// --- slice the real drag section out of the shipped file ---
const start = src.indexOf('/* ---------- 12.');
const end = src.indexOf('/* ---------- 13.');
if (start < 0 || end < 0 || end <= start) throw new Error('could not locate section 12');
const section = src.slice(start, end);
if (!section.includes('CHIP_RANGE') || !section.includes('leash')) throw new Error('slice looks wrong');

// --- DOM stub -------------------------------------------------------------
const listeners = new Map();          // element -> {type: [fn]}
const W = { innerWidth: 1440, innerHeight: 900 };

function makeEl(name, rect, offset, size, parent) {
  const el = {
    tagName: name,
    parentElement: parent,
    offsetLeft: offset.left, offsetTop: offset.top,
    offsetWidth: size.w, offsetHeight: size.h,
    style: { transform: '' },   // real DOM starts as '', not undefined
    _cls: new Set(),
    get classList() {
      const el = this;
      return {
        add: c => el._cls.add(c),
        remove: c => el._cls.delete(c),
        contains: c => el._cls.has(c)
      };
    },
    // no CSS animation running in the test, so the computed matrix is identity
    getBoundingClientRect: () => ({
      left: rect.left + (parseFloat((el.style.transform || '').match(/translate3d\((-?[\d.]+)px/)?.[1] || 0)),
      top: rect.top + (parseFloat((el.style.transform || '').match(/,(-?[\d.]+)px/)?.[1] || 0)),
      width: size.w, height: size.h
    }),
    addEventListener: (t, fn) => {
      if (!listeners.has(el)) listeners.set(el, {});
      (listeners.get(el)[t] ||= []).push(fn);
    },
    setPointerCapture: () => {}, releasePointerCapture: () => {}
  };
  return el;
}

// hero at ox=484, oy=90, 480x480 (desktop layout from styles.css)
const HERO = { left: 484, top: 90, w: 480, h: 480, clientWidth: 480, clientHeight: 480 };
const home = { getBoundingClientRect: () => ({ left: HERO.left, top: HERO.top, width: HERO.w, height: HERO.h }), clientWidth: HERO.w, clientHeight: HERO.h };

// three chips mirroring the real CSS positioning
const specs = [
  { id: 'chip-1', off: { left: 0, top: 38 },  size: { w: 96,  h: 33 } },  // top:8%; left:0
  { id: 'chip-2', off: { left: 389, top: 380 }, size: { w: 110, h: 33 } },  // bottom:14%; right:-4%
  { id: 'chip-3', off: { left: 409, top: 202 }, size: { w: 120, h: 33 } }   // top:42%; right:-6%
];
const chips = specs.map(s => makeEl('div',
  { left: HERO.left + s.off.left, top: HERO.top + s.off.top }, s.off, s.size, home));

global.document = { createElement: () => makeEl('div', { left:0, top:0 }, {left:0,top:0}, {w:0,h:0}, null) };
global.window = W;
global.getComputedStyle = () => ({ transform: 'none' });
global.DOMMatrixReadOnly = class { constructor(s) { const m = /translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(s || ''); this.m41 = m ? +m[1] : 0; this.m42 = m ? +m[2] : 0; } };
let clock = 0;
global.performance = { now: () => clock };
let frames = [];
global.requestAnimationFrame = (fn) => { frames.push(fn); return frames.length; };

// minimal shared helpers the section relies on
const $$ = (s) => (s === '.float-chip' ? chips : []);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const reduceMotion = false;

// section 12 declares its own clamp/leash/CIPH_* consts, so only the outer
// helpers and globals get injected.
new Function('$', '$$', 'reduceMotion', 'window', 'document', 'performance',
  'requestAnimationFrame', 'getComputedStyle', 'DOMMatrixReadOnly', section)(
  () => {}, $$, reduceMotion, W, global.document, global.performance,
  global.requestAnimationFrame, global.getComputedStyle, global.DOMMatrixReadOnly);

// --- helpers -------------------------------------------------------------
function fire(el, type, ev) { (listeners.get(el)?.[type] || []).forEach(fn => fn(ev)); }
function tick(ms = 16) {          // advance the clock and flush pending frames
  clock += ms;
  const pending = frames; frames = [];
  pending.forEach(fn => fn());
}
function settle(maxTicks = 400) { while (frames.length && maxTicks-- > 0) tick(16); }
function tf(el) {
  const m = /translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(el.style.transform || '');
  return m ? { x: +m[1], y: +m[2] } : { x: 0, y: 0 };
}
function drag(chip, fromX, fromY, toX, toY, steps = 6) {
  fire(chip, 'pointerdown', { button: 0, clientX: fromX, clientY: fromY, pointerId: 1 });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    clock += 16;
    fire(chip, 'pointermove', {
      clientX: fromX + (toX - fromX) * t, clientY: fromY + (toY - fromY) * t, pointerId: 1
    });
    tick(16);
  }
  const held = tf(chip);
  fire(chip, 'pointerup', { clientX: toX, clientY: toY, pointerId: 1 });
  settle();
  return { held, after: tf(chip), transform: chip.style.transform };
}

// --- assertions ----------------------------------------------------------
let fail = 0;
const ok = (name, cond, detail) => {
  if (!cond) { fail++; console.log(`  FAIL  ${name}${detail ? '  ' + detail : ''}`); }
  else console.log(`  pass  ${name}${detail ? '  ' + detail : ''}`);
};

const cx = c => HERO.left + specs[chips.indexOf(c)].off.left;
const cy = c => HERO.top  + specs[chips.indexOf(c)].off.top;

console.log('grab threshold (must not arm on a click):');
{
  const c = chips[0];
  fire(c, 'pointerdown', { button: 0, clientX: cx(c) + 10, clientY: cy(c) + 10, pointerId: 1 });
  fire(c, 'pointermove', { clientX: cx(c) + 12, clientY: cy(c) + 10, pointerId: 1 });  // 2px < 4px
  ok('2px jitter does not arm or move', c.style.transform === '' && !c.classList.contains('is-dragging'));
  fire(c, 'pointerup', { clientX: cx(c) + 12, clientY: cy(c) + 10, pointerId: 1 });
}

for (const c of chips) {
  const name = specs[chips.indexOf(c)].id;
  console.log(`\n${name}:`);

  const hx = cx(c), hy = cy(c);
  const L = drag(c, hx + 20, hy + 10, hx - 400, hy + 10);
  ok('moves left',  L.held.x < -60, `x=${L.held.x.toFixed(1)}`);
  ok('springs home', L.after.x === 0 && L.after.y === 0 && c.style.transform === '', `after=${JSON.stringify(L.after)}`);

  const R = drag(c, hx + 20, hy + 10, hx + 400, hy + 10);
  ok('moves right', R.held.x > 60, `x=${R.held.x.toFixed(1)}`);
  ok('springs home', R.after.x === 0 && R.after.y === 0 && c.style.transform === '');

  const U = drag(c, hx + 20, hy + 10, hx + 20, hy - 400);
  ok('moves up',    Math.abs(U.held.y) > 20, `y=${U.held.y.toFixed(1)}`);
  ok('springs home', U.after.y === 0);

  const D = drag(c, hx + 20, hy + 10, hx + 20, hy + 400);
  ok('moves down',  D.held.y > 20, `y=${D.held.y.toFixed(1)}`);
  ok('springs home', D.after.y === 0);

  const diag = drag(c, hx + 20, hy + 10, hx + 400, hy + 400);
  const dist = Math.hypot(diag.held.x, diag.held.y);
  ok('leash caps travel at 2x CHIP_RANGE', dist <= 78 * 2 + 0.5, `dist=${dist.toFixed(1)} <= 156`);
  ok('never leaves viewport', (() => {
    // chip's home client-left is cx(c) itself; adding off.left again double-counts
    const x = cx(c) + diag.held.x;
    const y = cy(c) + diag.held.y;
    return x >= 12 - 0.01 && x + c.offsetWidth <= W.innerWidth - 12 + 0.01 &&
           y >= 12 - 0.01 && y + c.offsetHeight <= W.innerHeight - 12 + 0.01;
  })());
  ok('is-dragging cleared after release', !c.classList.contains('is-dragging'));
  ok('transform fully cleared', c.style.transform === '');
}

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);