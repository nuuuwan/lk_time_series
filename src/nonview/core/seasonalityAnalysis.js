const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_MS = 86_400_000;

function medianInterval(pts) {
  const ivs = [];
  for (let i = 1; i < pts.length; i++)
    ivs.push(pts[i].timeMs - pts[i - 1].timeMs);
  ivs.sort((a, b) => a - b);
  return ivs[Math.floor(ivs.length / 2)];
}

// Returns per-season-bucket mean % deviation from cycle (year) mean.
// For monthly data the cycle is a calendar year; same for quarterly.
// This normalises out long-run trend so the seasonal signal is isolated.
function bucketCycleDeviations(pts, groupFn, count) {
  // Step 1: compute the mean for each cycle (year)
  const cycleMap = {};
  for (const p of pts) {
    const yr = new Date(p.timeMs).getUTCFullYear();
    if (!cycleMap[yr]) cycleMap[yr] = [];
    cycleMap[yr].push(p.value);
  }
  const cycleMeans = {};
  for (const [yr, vals] of Object.entries(cycleMap)) {
    cycleMeans[yr] = vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  // Step 2: for each point, compute % deviation from its cycle mean
  const buckets = Array.from({ length: count }, () => []);
  for (const p of pts) {
    const cm = cycleMeans[new Date(p.timeMs).getUTCFullYear()];
    if (!cm || cm === 0) continue;
    buckets[groupFn(p)].push(((p.value - cm) / Math.abs(cm)) * 100);
  }
  if (buckets.some((b) => b.length < 2)) return null;

  const pctDeviations = buckets.map(
    (b) => b.reduce((s, v) => s + v, 0) / b.length,
  );

  const stdDevs = buckets.map((b, i) => {
    const mean = pctDeviations[i];
    const variance = b.reduce((s, v) => s + (v - mean) ** 2, 0) / b.length;
    return Math.sqrt(variance);
  });

  return { pctDeviations, stdDevs, cycleMeans };
}

function getSeasonConfig(pts) {
  const median = medianInterval(pts);
  if (median < 50 * DAY_MS) {
    return {
      count: 12,
      labels: MONTH_NAMES,
      periodLabel: "Monthly",
      groupFn: (p) => new Date(p.timeMs).getUTCMonth(),
    };
  } else if (median < 120 * DAY_MS) {
    return {
      count: 4,
      labels: ["Q1", "Q2", "Q3", "Q4"],
      periodLabel: "Quarterly",
      groupFn: (p) => Math.floor(new Date(p.timeMs).getUTCMonth() / 3),
    };
  }
  return null;
}

export function getSeasonalityInsightLines(series) {
  const pts = series.filter(
    (p) => Number.isFinite(p.timeMs) && Number.isFinite(p.value),
  );
  if (pts.length < 16) return [];

  const config = getSeasonConfig(pts);
  if (!config) return [];
  const { count, labels, groupFn, periodLabel } = config;

  const result = bucketCycleDeviations(pts, groupFn, count);
  if (!result) return [];
  const { pctDeviations } = result;

  const maxPct = Math.max(...pctDeviations);
  const minPct = Math.min(...pctDeviations);
  const amplitude = maxPct - minPct;

  if (amplitude < 5) return ["No significant seasonal pattern detected."];

  const peakLabel = labels[pctDeviations.indexOf(maxPct)];
  const troughLabel = labels[pctDeviations.indexOf(minPct)];

  return [
    `${periodLabel} seasonality detected (amplitude ±${(amplitude / 2).toFixed(0)}% around mean).`,
    `Peak: ${peakLabel} — +${maxPct.toFixed(1)}% above mean.`,
    `Trough: ${troughLabel} — ${minPct.toFixed(1)}% below mean.`,
  ];
}

export function getSeasonalityData(series) {
  const pts = series.filter(
    (p) => Number.isFinite(p.timeMs) && Number.isFinite(p.value),
  );
  if (pts.length < 16) return null;

  const config = getSeasonConfig(pts);
  if (!config) return null;
  const { count, labels, groupFn, periodLabel } = config;

  const result = bucketCycleDeviations(pts, groupFn, count);
  if (!result) return null;
  const { pctDeviations, stdDevs, cycleMeans } = result;

  const maxPct = Math.max(...pctDeviations);
  const minPct = Math.min(...pctDeviations);
  const amplitude = (maxPct - minPct) / 2;
  const hasPattern = amplitude >= 2.5;

  const meanStd = stdDevs.reduce((s, v) => s + v, 0) / stdDevs.length;
  const snr = meanStd > 0 ? amplitude / meanStd : 0;
  const confidence =
    snr >= 2.5 ? "high" : snr >= 1.5 ? "medium" : snr >= 0.75 ? "low" : "none";

  const allPoints = pts
    .map((p, i) => {
      const cm = cycleMeans[new Date(p.timeMs).getUTCFullYear()];
      if (!cm || cm === 0) return null;
      return {
        id: `pt-${i}`,
        x: groupFn(p),
        y: ((p.value - cm) / Math.abs(cm)) * 100,
      };
    })
    .filter(Boolean);

  return {
    periodLabel,
    labels,
    count,
    pctDeviations,
    stdDevs,
    allPoints,
    amplitude,
    hasPattern,
    confidence,
    peakLabel: labels[pctDeviations.indexOf(maxPct)],
    troughLabel: labels[pctDeviations.indexOf(minPct)],
    peakPct: maxPct,
    troughPct: minPct,
  };
}
