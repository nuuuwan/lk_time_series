export const applyTimeWindow = (series, years) => {
  if (!Array.isArray(series) || years === "all") {
    return series;
  }
  const datedPoints = series.filter((point) => Number.isFinite(point.timeMs));
  const latest = datedPoints.at(-1);
  if (!latest) return series;
  const threshold = new Date(latest.timeMs);
  threshold.setFullYear(threshold.getFullYear() - Number(years));
  return series.filter(
    (point) =>
      !Number.isFinite(point.timeMs) || point.timeMs >= threshold.getTime(),
  );
};

export const applyMovingAverage = (series, windowDays) => {
  if (
    !windowDays ||
    windowDays === "none" ||
    !Array.isArray(series) ||
    series.length === 0
  ) {
    return series;
  }
  const windowMs = Number(windowDays) * 24 * 60 * 60 * 1000;
  const firstValidTimeMs = series.find((p) =>
    Number.isFinite(p.timeMs),
  )?.timeMs;
  return series.map((point, i) => {
    if (!Number.isFinite(point.timeMs)) return point;
    const windowStart = point.timeMs - windowMs;
    // Require a full window's worth of data before drawing the smoothed line
    if (firstValidTimeMs !== undefined && windowStart < firstValidTimeMs) {
      return { ...point, value: null };
    }
    let sum = 0;
    let count = 0;
    for (let j = i; j >= 0; j--) {
      const p = series[j];
      if (!Number.isFinite(p.timeMs) || p.timeMs < windowStart) break;
      if (p.value !== null && Number.isFinite(p.value)) {
        sum += p.value;
        count++;
      }
    }
    return count > 0
      ? { ...point, value: sum / count }
      : { ...point, value: null };
  });
};

export const normalizeSeries = (series) => {
  if (!Array.isArray(series) || series.length === 0) return [];
  const base = series[0].value;
  if (!Number.isFinite(base) || base === 0) {
    return series.map((point) => ({ ...point, normalizedValue: null }));
  }
  return series.map((point) => ({
    ...point,
    normalizedValue: (point.value / base) * 100,
  }));
};
