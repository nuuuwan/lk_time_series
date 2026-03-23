// Autoregressive (AR) forecast with ridge-regularised least squares.
// Features for each time step t: [y(t-1), y(t-2), ..., y(t-p)]
// Falls back to simple OLS trend when not enough data for AR.

// ── tiny linear-algebra helpers ──────────────────────────────────────────────

function matMul(A, B) {
  const rows = A.length,
    cols = B[0].length,
    inner = B.length;
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) =>
      Array.from({ length: inner }, (_, k) => A[i][k] * B[k][j]).reduce(
        (s, v) => s + v,
        0,
      ),
    ),
  );
}

function transpose(A) {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

// Gauss-Jordan in-place inversion (square matrix)
function invertMatrix(M) {
  const n = M.length;
  const aug = M.map((row, i) => {
    const id = Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const d = aug[col][col];
    if (Math.abs(d) < 1e-12) return null; // singular
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= d;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const f = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= f * aug[col][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

// ── AR forecast ───────────────────────────────────────────────────────────────

export function forecastLinear(series, steps) {
  const pts = series.filter(
    (p) =>
      Number.isFinite(p.timeMs) && p.value !== null && Number.isFinite(p.value),
  );
  if (pts.length < 4) return [];

  // Median time step
  const gaps = pts.slice(1).map((p, i) => p.timeMs - pts[i].timeMs);
  gaps.sort((a, b) => a - b);
  const medianGap = gaps[Math.floor(gaps.length / 2)];

  const ys = pts.map((p) => p.value);

  // How many lags to use (up to 24, but need at least lag+10 training rows)
  const maxLag = 24;
  const lag = Math.min(maxLag, Math.max(1, pts.length - 10));

  // Normalise y to mean=0 std=1 for numerical stability
  const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
  const std =
    Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / ys.length) || 1;
  const yn = ys.map((v) => (v - mean) / std);

  // Build lag feature matrix (one intercept column + lag columns)
  const X = [];
  const y = [];
  for (let t = lag; t < yn.length; t++) {
    X.push([1, ...Array.from({ length: lag }, (_, k) => yn[t - 1 - k])]);
    y.push(yn[t]);
  }

  if (X.length < lag + 1) return fallbackTrend(pts, steps, medianGap);

  const Xt = transpose(X);
  const XtX = matMul(Xt, X);

  // Ridge regularisation λ = 0.01 * trace/p to prevent over-fitting
  const trace = XtX.reduce((s, row, i) => s + row[i], 0);
  const lambda = (0.01 * trace) / (lag + 1);
  for (let i = 0; i < XtX.length; i++) XtX[i][i] += lambda;

  const XtXinv = invertMatrix(XtX);
  if (!XtXinv) return fallbackTrend(pts, steps, medianGap);

  const Xty = Xt.map((row) => row.reduce((s, v, i) => s + v * y[i], 0));
  const beta = XtXinv.map((row) => row.reduce((s, v, i) => s + v * Xty[i], 0));

  // Iterative multi-step forecast
  const window = yn.slice(-lag).reverse(); // [y(t-1), y(t-2), ..., y(t-lag)]
  const lastPt = pts[pts.length - 1];

  return Array.from({ length: steps }, (_, i) => {
    const features = [1, ...window.slice(0, lag)];
    const pred = features.reduce((s, v, k) => s + v * beta[k], 0);
    window.unshift(pred); // prepend so next step sees this as lag-1
    return {
      timeMs: lastPt.timeMs + (i + 1) * medianGap,
      value: pred * std + mean,
    };
  });
}

function fallbackTrend(pts, steps, medianGap) {
  const n = pts.length;
  const xs = pts.map((_, i) => i);
  const ys = pts.map((p) => p.value);
  const mx = (n - 1) / 2;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = my - slope * mx;
  const lastPt = pts[pts.length - 1];
  return Array.from({ length: steps }, (_, i) => ({
    timeMs: lastPt.timeMs + (i + 1) * medianGap,
    value: intercept + slope * (n + i),
  }));
}

// Returns metadata about the model used for the last forecast, for display purposes.
export function getForecastMeta(series) {
  const pts = series.filter(
    (p) =>
      Number.isFinite(p.timeMs) && p.value !== null && Number.isFinite(p.value),
  );
  if (pts.length < 4) return null;

  const maxLag = 24;
  const lag = Math.min(maxLag, Math.max(1, pts.length - 10));
  const steps = Math.max(5, Math.min(20, Math.round(pts.length * 0.1)));
  const usesAR = pts.length >= lag + 10 + 1;

  // Estimate median gap in days
  const gaps = pts.slice(1).map((p, i) => p.timeMs - pts[i].timeMs);
  gaps.sort((a, b) => a - b);
  const medianGapMs = gaps[Math.floor(gaps.length / 2)];
  const medianGapDays = Math.round(medianGapMs / 86_400_000);

  return { lag, steps, usesAR, nPoints: pts.length, medianGapDays };
}
