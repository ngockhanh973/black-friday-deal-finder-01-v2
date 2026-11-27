// The Price Elevator: an area chart of a deal's verified price history.
// Unlike a bare sparkline it carries a real Y axis in dollars, a dashed
// line at the 90-day floor (the lowest price a source reported), date
// labels under each point, and a red dot on today's price with its date.
// It only ever plots prices the deal carries in history — nothing is
// interpolated or invented between them.

import { money } from "./scores.js";

function niceTicks(lo, hi, count) {
  const span = hi - lo || 1;
  const raw = span / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = raw / mag <= 1 ? mag : raw / mag <= 2 ? 2 * mag : raw / mag <= 5 ? 5 * mag : 10 * mag;
  const start = Math.floor(lo / step) * step;
  const ticks = [];
  for (let v = start; v <= hi + step * 0.5; v += step) ticks.push(v);
  return ticks;
}

export function elevatorChart(deal, width, height) {
  const pts = deal.history && deal.history.length >= 2 ? deal.history : [deal.usual, deal.sale];
  const labels = deal.dates && deal.dates.length === pts.length ? deal.dates : pts.map((_, i) => (i === 0 ? "List" : i === pts.length - 1 ? "Today" : ""));
  const w = width || 560;
  const h = height || 220;
  const left = 52;
  const right = 14;
  const top = 12;
  const bottom = 30;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const pad = (hi - lo) * 0.12 || 1;
  const yMin = Math.max(0, lo - pad);
  const yMax = hi + pad;
  const xs = pts.map((_, i) => left + (i * (w - left - right)) / (pts.length - 1));
  const ys = pts.map((p) => top + (1 - (p - yMin) / (yMax - yMin)) * (h - top - bottom));
  const floorY = top + (1 - (lo - yMin) / (yMax - yMin)) * (h - top - bottom);
  const line = pts.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${(h - bottom).toFixed(1)} L${xs[0].toFixed(1)},${(h - bottom).toFixed(1)} Z`;
  const ticks = niceTicks(yMin, yMax, 4);
  const grid = ticks
    .map((t) => {
      const y = top + (1 - (t - yMin) / (yMax - yMin)) * (h - top - bottom);
      return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${w - right}" y2="${y.toFixed(1)}" stroke="#e3ddd0" stroke-width="1"/>` +
        `<text x="${left - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6b655a">${money(t)}</text>`;
    })
    .join("");
  const dots = pts
    .map((p, i) => {
      const last = i === pts.length - 1;
      return `<circle cx="${xs[i].toFixed(1)}" cy="${ys[i].toFixed(1)}" r="${last ? 6 : 3.5}" fill="${last ? "#c81e1e" : "#8a8378"}" stroke="#fff" stroke-width="1.5"/>`;
    })
    .join("");
  const dateLabels = labels
    .map((d, i) => `<text x="${xs[i].toFixed(1)}" y="${(h - 8).toFixed(1)}" text-anchor="middle" font-size="11" fill="#6b655a">${d}</text>`)
    .join("");
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  const tagX = Math.min(Math.max(lastX - 70, left), w - right - 140);
  return (
    `<svg viewBox="0 0 ${w} ${h}" width="100%" height="auto" role="img" ` +
    `aria-label="Price history for ${deal.name}: list ${money(deal.usual)}, today ${money(deal.sale)}">` +
    grid +
    `<line x1="${left}" y1="${floorY.toFixed(1)}" x2="${w - right}" y2="${floorY.toFixed(1)}" stroke="#0a6b2d" stroke-width="1.5" stroke-dasharray="5 4"/>` +
    `<text x="${left + 4}" y="${(floorY - 5).toFixed(1)}" text-anchor="start" font-size="11" fill="#0a6b2d">90-day floor ${money(lo)}</text>` +
    `<path d="${area}" fill="#0a4d9e" fill-opacity="0.12"/>` +
    `<path d="${line}" fill="none" stroke="#1c1a17" stroke-width="2.5"/>` +
    dots +
    `<rect x="${tagX}" y="${Math.max(2, lastY - 30)}" width="140" height="20" rx="4" fill="#c81e1e"/>` +
    `<text x="${tagX + 70}" y="${Math.max(2, lastY - 30) + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Today ${money(deal.sale)}</text>` +
    dateLabels +
    `</svg>`
  );
}

// Slim version for a grid card: same points, no axis, small footprint.
export function miniChart(deal, width, height) {
  const pts = deal.history && deal.history.length >= 2 ? deal.history : [deal.usual, deal.sale];
  const w = width || 220;
  const h = height || 40;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  const pad = 4;
  const xs = pts.map((_, i) => pad + (i * (w - pad * 2)) / (pts.length - 1));
  const ys = pts.map((p) => pad + (1 - (p - lo) / span) * (h - pad * 2 - 6));
  const line = pts.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${(h - 4).toFixed(1)} L${xs[0].toFixed(1)},${(h - 4).toFixed(1)} Z`;
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  return (
    `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" ` +
    `aria-label="Price history: list ${money(deal.usual)}, today ${money(deal.sale)}">` +
    `<path d="${area}" fill="#0a4d9e" fill-opacity="0.10"/>` +
    `<path d="${line}" fill="none" stroke="#1c1a17" stroke-width="2"/>` +
    `<circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4.5" fill="#c81e1e"/>` +
    `<circle cx="${xs[0].toFixed(1)}" cy="${ys[0].toFixed(1)}" r="3" fill="#8a8378"/>` +
    `</svg>`
  );
}
