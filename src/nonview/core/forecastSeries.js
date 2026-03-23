// Linear regression extrapolation forward N steps.
// Uses the last portion of the series so short-term trend drives the forecast.
export function forecastLinear(series, steps) {
  const pts = series.filter(
    (p) =>
      Number.isFinite(p.timeMs) && p.value !== null && Number.isFinite(p.value),
  );
  if (pts.length < 2) return [];

  // Regression window: last 20 % of data, at least 10, at most 60 points
  const windowSize = Math.min(
    pts.length,
    Math.max(10, Math.round(pts.length * 0.2)),
  );
  const win = pts.slice(-windowSize);

  // Normalise time axis (seconds) to avoid floating-point precision loss
  const t0 = win[0].timeMs;
  const xs = win.map((p) => (p.timeMs - t0) / 1e9);
  const ys = win.map((p) => p.value);

  const n = xs.length;
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  // Detect typical step size (median gap)
  const gaps = [];
  for (let i = 1; i < pts.length; i++)
    gaps.push(pts[i].timeMs - pts[i - 1].timeMs);
  gaps.sort((a, b) => a - b);
  const medianGap = gaps[Math.floor(gaps.length / 2)];

  const lastPt = pts[pts.length - 1];
  return Array.from({ length: steps }, (_, i) => {
    const timeMs = lastPt.timeMs + (i + 1) * medianGap;
    const x = (timeMs - t0) / 1e9;
    return { timeMs, value: intercept + slope * x };
  });
}
