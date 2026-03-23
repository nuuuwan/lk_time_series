export const parseSeriesFromRawData = (rawData) => {
  if (!rawData || typeof rawData !== "object") {
    return [];
  }

  return Object.entries(rawData)
    .map(([t, value]) => {
      const numericValue = Number(value);
      const timeMs = new Date(t).getTime();
      return {
        t,
        timeMs,
        value: Number.isFinite(numericValue) ? numericValue : null,
      };
    })
    .filter((point) => Number.isFinite(point.timeMs) && point.value !== null)
    .sort((a, b) => a.timeMs - b.timeMs);
};

export const applyTimeWindow = (series, years) => {
  if (!Array.isArray(series) || years === "all") {
    return series;
  }

  const latest = series.at(-1);
  if (!latest) {
    return series;
  }

  const threshold = new Date(latest.timeMs);
  threshold.setFullYear(threshold.getFullYear() - Number(years));

  return series.filter((point) => point.timeMs >= threshold.getTime());
};

export const normalizeSeries = (series) => {
  if (!Array.isArray(series) || series.length === 0) {
    return [];
  }

  const base = series[0].value;
  if (!Number.isFinite(base) || base === 0) {
    return series.map((point) => ({ ...point, normalizedValue: null }));
  }

  return series.map((point) => ({
    ...point,
    normalizedValue: (point.value / base) * 100,
  }));
};

export const formatNumber = (value) => {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return new Intl.NumberFormat().format(value);
};

export const formatDate = (isoDate) => {
  if (!isoDate) {
    return "N/A";
  }

  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getDeterministicInsightLines = (series) => {
  if (!series || series.length < 2) {
    return ["Not enough points to produce insight lines yet."];
  }

  const first = series[0];
  const last = series[series.length - 1];
  const delta = last.value - first.value;
  const deltaPct = first.value !== 0 ? (delta / first.value) * 100 : null;

  const minPoint = series.reduce((min, point) =>
    point.value < min.value ? point : min,
  );
  const maxPoint = series.reduce((max, point) =>
    point.value > max.value ? point : max,
  );

  return [
    `Series starts at ${formatNumber(first.value)} (${first.t}) and ends at ${formatNumber(last.value)} (${last.t}).`,
    `Net change across period: ${delta >= 0 ? "+" : ""}${formatNumber(delta)}${
      deltaPct === null ? "" : ` (${deltaPct.toFixed(1)}%)`
    }.`,
    `Peak value: ${formatNumber(maxPoint.value)} on ${maxPoint.t}.`,
    `Lowest value: ${formatNumber(minPoint.value)} on ${minPoint.t}.`,
  ];
};
