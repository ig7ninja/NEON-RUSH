export function circleRect(cx, cy, cr, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return (dx * dx + dy * dy) <= cr * cr;
}

export function circleCircle(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const r = r1 + r2;
  return (dx * dx + dy * dy) <= r * r;
}

export function pointInRect(px, py, r, pad = 0) {
  return px >= r.x - pad && px <= r.x + r.w + pad
    && py >= r.y - pad && py <= r.y + r.h + pad;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x
    && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}
