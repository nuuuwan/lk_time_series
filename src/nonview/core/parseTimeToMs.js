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
    const d = new Date(`${monthNameMatch[1]} 1 ${monthNameMatch[2]}`).getTime();
    if (Number.isFinite(d)) return d;
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

export default parseTimeToMs;
