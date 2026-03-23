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

export default parseNumericValue;
