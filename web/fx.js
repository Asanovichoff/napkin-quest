// Penny the envelope (mascot) + celebration confetti.

const EYES = {
  idle: `<ellipse cx="46" cy="58" rx="5" ry="6.5" class="ink"/><ellipse cx="74" cy="58" rx="5" ry="6.5" class="ink"/><circle cx="47.5" cy="55.5" r="1.8" fill="#fff"/><circle cx="75.5" cy="55.5" r="1.8" fill="#fff"/>`,
  think: `<ellipse cx="49" cy="55" rx="5" ry="6.5" class="ink"/><ellipse cx="77" cy="55" rx="5" ry="6.5" class="ink"/><circle cx="51" cy="52" r="1.8" fill="#fff"/><circle cx="79" cy="52" r="1.8" fill="#fff"/><path d="M68 44 q8 -5 15 -1" class="stroke"/>`,
  great: `<path d="M39 60 q7 -10 14 0" class="stroke"/><path d="M67 60 q7 -10 14 0" class="stroke"/>`,
  good: `<ellipse cx="46" cy="58" rx="5" ry="6" class="ink"/><ellipse cx="74" cy="58" rx="5" ry="6" class="ink"/><path d="M39 48 l12 2" class="stroke"/><path d="M81 48 l-12 2" class="stroke"/>`,
  off: `<path d="M40 52 l11 11 M51 52 l-11 11" class="stroke"/><path d="M69 52 l11 11 M80 52 l-11 11" class="stroke"/>`,
};
const MOUTH = {
  idle: `<path d="M52 72 q8 7 16 0" class="stroke"/>`,
  think: `<path d="M54 74 h12" class="stroke"/>`,
  great: `<path d="M48 69 q12 16 24 0 z" class="ink"/><path d="M53 73 q7 5 14 0" fill="#ff8fa3"/>`,
  good: `<path d="M51 72 q9 6 18 0" class="stroke"/>`,
  off: `<path d="M50 77 q5 -6 10 0 q5 6 10 0" class="stroke"/>`,
};

export function mascotSvg(mood = "idle", size = 120) {
  return `<svg viewBox="0 0 120 112" width="${size}" height="${size * 112 / 120}" class="penny mood-${mood}" aria-hidden="true">
    <ellipse cx="60" cy="106" rx="34" ry="5" class="shadow"/>
    <g class="penny-body">
      <g class="arm arm-l"><path d="M14 64 q-10 -4 -10 -16" class="stroke thick"/></g>
      <g class="arm arm-r"><path d="M106 64 q10 -4 10 -16" class="stroke thick"/></g>
      <path d="M44 96 v8 h-6 M76 96 v8 h6" class="stroke thick"/>
      <rect x="12" y="26" width="96" height="70" rx="10" class="paper"/>
      <path d="M14 30 L60 62 L106 30" class="flap"/>
      <rect x="86" y="32" width="14" height="16" rx="2" class="stamp"/>
      <circle cx="34" cy="70" r="6" class="cheek"/><circle cx="86" cy="70" r="6" class="cheek"/>
      ${EYES[mood] || EYES.idle}${MOUTH[mood] || MOUTH.idle}
    </g>
  </svg>`;
}

export function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas");
  cv.className = "confetti";
  document.body.appendChild(cv);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
  const ctx = cv.getContext("2d");
  const colors = ["#ffd23f", "#ff5c7a", "#5ee0c8", "#7cc6fe", "#b8a1ff"];
  const parts = Array.from({ length: 90 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 16 * dpr, vy: (-Math.random() * 14 - 6) * dpr,
    s: (6 + Math.random() * 6) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (t) => {
    const k = (t - start) / 1400;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.45 * dpr; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
}

/* World icons (simple, original line art) */
export const ICONS = {
  units: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="18" width="36" height="12" rx="3" class="ic"/><path d="M12 18v6M18 18v4M24 18v6M30 18v4M36 18v6" class="ic-s"/></svg>`,
  traffic: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 34h32M8 24h22M8 14h12" class="ic-s"/><path d="M36 20l6 4-6 4M26 10l6 4-6 4" class="ic-s"/></svg>`,
  storage: `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="12" rx="14" ry="5" class="ic"/><path d="M10 12v24c0 3 6 5 14 5s14-2 14-5V12M10 24c0 3 6 5 14 5s14-2 14-5" class="ic-s"/></svg>`,
  network: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="34" r="4" class="ic"/><path d="M14 26a14 14 0 0 1 20 0M8 19a22 22 0 0 1 32 0" class="ic-s"/></svg>`,
  latency: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="27" r="14" class="ic"/><path d="M24 27V18M20 8h8M24 8v5" class="ic-s"/></svg>`,
  capacity: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="8" width="28" height="9" rx="2" class="ic"/><rect x="10" y="20" width="28" height="9" rx="2" class="ic"/><rect x="10" y="32" width="28" height="9" rx="2" class="ic"/><circle cx="16" cy="12.5" r="1.5" class="dot"/><circle cx="16" cy="24.5" r="1.5" class="dot"/><circle cx="16" cy="36.5" r="1.5" class="dot"/></svg>`,
  mix: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" class="ic"/></svg>`,
  blitz: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M27 4L10 27h12l-3 17 19-25H26z" class="ic"/></svg>`,
};
