import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDataset } from "../../nonview/core/datasetApi";
import {
  applyMovingAverage,
  applyTimeWindow,
  parseSeriesFromRawData,
} from "../../nonview/core/timeSeriesUtils";

export default function useSelectedDataset(
  filteredMetadata,
  timeWindow,
  movingWindow,
) {
  const [selectedKeys, setSelectedKeys] = useState([]);
  // cache: key → raw payload
  const [cache, setCache] = useState({});
  const [datasetError, setDatasetError] = useState("");
  const [datasetLoading, setDatasetLoading] = useState(false);

  // Single primary key (first in list) for URL / detail panels
  const selectedKey = selectedKeys[0] || "";

  const setSelectedKey = useCallback((key) => {
    setSelectedKeys(key ? [key] : []);
  }, []);

  const toggleKey = useCallback((key) => {
    setSelectedKeys((prev) => {
      if (!key) return prev;
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  }, []);

  const selectedMetaList = useMemo(
    () =>
      selectedKeys
        .map((k) => filteredMetadata.find((item) => item.key === k))
        .filter(Boolean),
    [filteredMetadata, selectedKeys],
  );

  const selectedMeta = selectedMetaList[0] || null;

  // Load any keys not yet in cache
  useEffect(() => {
    const missing = selectedMetaList.filter((m) => !cache[m.key]);
    if (missing.length === 0) return;
    const load = async () => {
      try {
        setDatasetError("");
        setDatasetLoading(true);
        await Promise.all(
          missing.map(async (meta) => {
            const payload = await fetchDataset(meta);
            setCache((prev) => ({ ...prev, [meta.key]: payload }));
          }),
        );
      } catch (error) {
        setDatasetError(error.message);
      } finally {
        setDatasetLoading(false);
      }
    };
    load();
  }, [selectedKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build per-dataset series arrays
  const datasets = useMemo(
    () =>
      selectedMetaList.map((meta) => {
        const payload = cache[meta.key];
        if (!payload) return { meta, mainSeries: [], rawSeries: [] };
        const sourceData = payload.cleaned_data || payload.raw_data;
        const parsed = parseSeriesFromRawData(sourceData);
        const windowed = applyTimeWindow(parsed, timeWindow);
        const rawSeries = windowed;
        const mainSeries = applyMovingAverage(windowed, movingWindow);
        return { meta, mainSeries, rawSeries };
      }),
    [selectedMetaList, cache, timeWindow, movingWindow],
  );

  // Backward-compat single-dataset helpers (first dataset)
  const rawSeries = datasets[0]?.rawSeries ?? [];
  const mainSeries = datasets[0]?.mainSeries ?? [];

  return {
    selectedKey,
    selectedKeys,
    setSelectedKey,
    toggleKey,
    selectedMeta,
    datasets,
    rawSeries,
    mainSeries,
    datasetError,
    datasetLoading,
  };
}
