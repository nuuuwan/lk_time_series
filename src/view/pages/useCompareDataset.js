import { useEffect, useMemo, useState } from "react";
import { fetchDataset } from "../../nonview/core/datasetApi";
import {
  applyMovingAverage,
  applyTimeWindow,
  parseSeriesFromRawData,
} from "../../nonview/core/timeSeriesUtils";

export default function useCompareDataset(
  filteredMetadata,
  selectedMeta,
  compareEnabled,
  timeWindow,
  movingWindow,
) {
  const [compareKey, setCompareKey] = useState("");
  const [compareDataset, setCompareDataset] = useState(null);

  const compareCandidates = useMemo(
    () => filteredMetadata.filter((item) => item.key !== selectedMeta?.key),
    [filteredMetadata, selectedMeta],
  );

  const compareMeta = useMemo(
    () =>
      compareCandidates.find((item) => item.key === compareKey) ||
      compareCandidates[0],
    [compareCandidates, compareKey],
  );

  useEffect(() => {
    if (!compareEnabled || !compareMeta) {
      setCompareDataset(null);
      return;
    }
    const load = async () => {
      try {
        const payload = await fetchDataset(compareMeta);
        setCompareDataset(payload);
      } catch (_) {}
    };
    load();
  }, [compareEnabled, compareMeta]);

  const compareSeries = useMemo(() => {
    if (!compareEnabled || !compareMeta || !compareDataset) return null;
    const sourceData = compareDataset?.cleaned_data || compareDataset?.raw_data;
    const parsed = parseSeriesFromRawData(sourceData);
    const windowed = applyTimeWindow(parsed, timeWindow);
    return applyMovingAverage(windowed, movingWindow);
  }, [compareEnabled, compareMeta, compareDataset, timeWindow, movingWindow]);

  return { compareCandidates, compareMeta, setCompareKey, compareSeries };
}
