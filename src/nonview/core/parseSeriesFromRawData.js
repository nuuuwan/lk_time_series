import parseNumericValue from "./parseNumericValue";
import parseTimeToMs from "./parseTimeToMs";

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
      return { t: String(t), timeMs, value: numericValue, index };
    })
    .filter((point) => point.value !== null)
    .sort((a, b) => {
      const aHasTime = Number.isFinite(a.timeMs);
      const bHasTime = Number.isFinite(b.timeMs);
      if (aHasTime && bHasTime) return a.timeMs - b.timeMs;
      if (aHasTime) return -1;
      if (bHasTime) return 1;
      return a.index - b.index;
    });
};
