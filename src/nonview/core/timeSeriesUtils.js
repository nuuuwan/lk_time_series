const parseNumericValue = (rawValue) => {
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : null;
  }

  if (typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const unquoted = trimmed.replace(/^['"](.*)['"]$/, "$1");

  const isBracketNegative = /^\(.+\)$/.test(unquoted);
  const cleaned = unquoted
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/\s+/g, "");

  const numericValue = Number(cleaned);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return isBracketNegative ? -numericValue : numericValue;
};

const parseTimeToMs = (timeLabel) => {
  if (typeof timeLabel !== "string") {
    return NaN;
  }

  const t = timeLabel.trim().replace(/^['"](.*)['"]$/, "$1");
  if (!t) {
    return NaN;
  }

  const quarterMatch = t.match(/^(\d{4})\s*-?\s*[Qq]([1-4])$/);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const quarter = Number(quarterMatch[2]);
    return new Date(Date.UTC(year, (quarter - 1) * 3, 1)).getTime();
  }

  const yearlyMatch = t.match(/^\d{4}$/);
  if (yearlyMatch) {
    return new Date(Date.UTC(Number(t), 0, 1)).getTime();
  }

  const monthlyMatch = t.match(/^(\d{4})-(\d{2})$/);
  if (monthlyMatch) {
    return new Date(
      Date.UTC(Number(monthlyMatch[1]), Number(monthlyMatch[2]) - 1, 1),
    ).getTime();
  }

  const compactMonthlyMatch = t.match(/^(\d{4})(\d{2})$/);
  if (compactMonthlyMatch) {
    return new Date(
      Date.UTC(
        Number(compactMonthlyMatch[1]),
        Number(compactMonthlyMatch[2]) - 1,
        1,
      ),
    ).getTime();
  }

  const monthNameMatch = t.match(/^([A-Za-z]{3,9})[\s-]+(\d{4})$/);
  if (monthNameMatch) {
    const directDate = new Date(
      `${monthNameMatch[1]} 1 ${monthNameMatch[2]}`,
    ).getTime();
    if (Number.isFinite(directDate)) {
      return directDate;
    }
  }

  const directDate = new Date(t).getTime();
  if (Number.isFinite(directDate)) {
    return directDate;
  }

  const yearAnywhereMatch = t.match(/(19|20)\d{2}/);
  if (yearAnywhereMatch) {
    return new Date(Date.UTC(Number(yearAnywhereMatch[0]), 0, 1)).getTime();
  }

  return NaN;
};

export const parseSeriesFromRawData = (rawData) => {
  if (!rawData || typeof rawData !== "object") {
    return [];
  }

  const entries = Array.isArray(rawData)
    ? rawData.map((item, index) => [String(item?.t ?? index), item?.value])
    : Object.entries(rawData);

  return entries
    .map(([t, value], index) => {
      const numericValue = parseNumericValue(value);
      const timeMs = parseTimeToMs(String(t));
      return {
        t: String(t),
        timeMs,
        value: numericValue,
        index,
      };
    })
    .filter((point) => point.value !== null)
    .sort((a, b) => {
      const aHasTime = Number.isFinite(a.timeMs);
      const bHasTime = Number.isFinite(b.timeMs);

      if (aHasTime && bHasTime) {
        return a.timeMs - b.timeMs;
      }

      if (aHasTime) {
        return -1;
      }
      if (bHasTime) {
        return 1;
      }

      return a.index - b.index;
    });
};

export const applyTimeWindow = (series, years) => {
  if (!Array.isArray(series) || years === "all") {
    return series;
  }

  const datedPoints = series.filter((point) => Number.isFinite(point.timeMs));
  const latest = datedPoints.at(-1);
  if (!latest) {
    return series;
  }

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

  return series.map((point, i) => {
    if (!Number.isFinite(point.timeMs)) {
      return point;
    }

    const windowStart = point.timeMs - windowMs;
    let sum = 0;
    let count = 0;

    for (let j = i; j >= 0; j--) {
      const p = series[j];
      if (!Number.isFinite(p.timeMs) || p.timeMs < windowStart) {
        break;
      }
      if (p.value !== null && Number.isFinite(p.value)) {
        sum += p.value;
        count++;
      }
    }

    return count > 0 ? { ...point, value: sum / count } : point;
  });
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
