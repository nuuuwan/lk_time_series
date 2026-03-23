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

function bucketMeans(pts, groupFn, count) {
  const buckets = Array.from({ length: count }, () => []);
  for (const p of pts) buckets[groupFn(p)].push(p.value);
  if (buckets.some((b) => b.length < 2)) return null;
  return buckets.map((b) => b.reduce((s, v) => s + v, 0) / b.length);
}

export function getSeasonalityInsightLines(series) {
  const pts = series.filter(
    (p) => Number.isFinite(p.timeMs) && Number.isFinite(p.value),
  );
  if (pts.length < 16) return [];

  const median = medianInterval(pts);
  let count, labels, groupFn, periodLabel;

  if (median < 50 * DAY_MS) {
    count = 12;
    labels = MONTH_NAMES;
    periodLabel = "Monthly";
    groupFn = (p) => new Date(p.timeMs).getUTCMonth();
  } else if (median < 120 * DAY_MS) {
    count = 4;
    labels = ["Q1", "Q2", "Q3", "Q4"];
    periodLabel = "Quarterly";
    groupFn = (p) => Math.floor(new Date(p.timeMs).getUTCMonth() / 3);
  } else {
    return [];
  }

  const means = bucketMeans(pts, groupFn, count);
  if (!means) return [];

  const overallMean = means.reduce((s, v) => s + v, 0) / means.length;
  if (overallMean === 0) return [];

  const maxVal = Math.max(...means);
  const minVal = Math.min(...means);
  const amplitude = ((maxVal - minVal) / Math.abs(overallMean)) * 100;

  if (amplitude < 5) return ["No significant seasonal pattern detected."];

  const peakLabel = labels[means.indexOf(maxVal)];
  const troughLabel = labels[means.indexOf(minVal)];
  const peakPct = ((maxVal - overallMean) / Math.abs(overallMean)) * 100;
  const troughPct = ((minVal - overallMean) / Math.abs(overallMean)) * 100;

  return [
    `${periodLabel} seasonality detected (amplitude ±${amplitude.toFixed(0)}% around mean).`,
    `Peak: ${peakLabel} — +${peakPct.toFixed(1)}% above mean.`,
    `Trough: ${troughLabel} — ${troughPct.toFixed(1)}% below mean.`,
  ];
}

export function getSeasonalityData(series) {
  const pts = series.filter(
    (p) => Number.isFinite(p.timeMs) && Number.isFinite(p.value),
  );
  if (pts.length < 16) return null;

  const median = medianInterval(pts);
  let count, labels, groupFn, periodLabel;

  if (median < 50 * DAY_MS) {
    count = 12;
    labels = MONTH_NAMES;
    periodLabel = "Monthly";
    groupFn = (p) => new Date(p.timeMs).getUTCMonth();
  } else if (median < 120 * DAY_MS) {
    count = 4;
    labels = ["Q1", "Q2", "Q3", "Q4"];
    periodLabel = "Quarterly";
    groupFn = (p) => Math.floor(new Date(p.timeMs).getUTCMonth() / 3);
  } else {
    return null;
  }

  const means = bucketMeans(pts, groupFn, count);
  if (!means) return null;

  const overallMean = means.reduce((s, v) => s + v, 0) / means.length;
  if (overallMean === 0) return null;

  const pctDeviations = means.map(
    (v) => ((v - overallMean) / Math.abs(overallMean)) * 100,
  );
  const amplitude =
    (Math.max(...pctDeviations) - Math.min(...pctDeviations)) / 2;

  if (amplitude < 2.5) return null;

  const maxPct = Math.max(...pctDeviations);
  const minPct = Math.min(...pctDeviations);

  return {
    periodLabel,
    labels,
    pctDeviations,
    amplitude,
    peakLabel: labels[pctDeviations.indexOf(maxPct)],
    troughLabel: labels[pctDeviations.indexOf(minPct)],
    peakPct: maxPct,
    troughPct: minPct,
  };
}
