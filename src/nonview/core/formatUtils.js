export const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat().format(value);
};

export const formatDate = (isoDate) => {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return String(isoDate);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getDeterministicInsightLines = (series) => {
  if (!series || series.length < 2) {
    return ["Not enough points to produce insight lines yet."];
  }
  const first = series[0];
  const last = series[series.length - 1];
  const delta = last.value - first.value;
  const deltaPct = first.value !== 0 ? (delta / first.value) * 100 : null;
  const minPoint = series.reduce((min, p) => (p.value < min.value ? p : min));
  const maxPoint = series.reduce((max, p) => (p.value > max.value ? p : max));
  return [
    `Series starts at ${formatNumber(first.value)} (${first.t}) and ends at ${formatNumber(last.value)} (${last.t}).`,
    `Net change across period: ${delta >= 0 ? "+" : ""}${formatNumber(delta)}${
      deltaPct === null ? "" : ` (${deltaPct.toFixed(1)}%)`
    }.`,
    `Peak value: ${formatNumber(maxPoint.value)} on ${maxPoint.t}.`,
    `Lowest value: ${formatNumber(minPoint.value)} on ${minPoint.t}.`,
  ];
};
