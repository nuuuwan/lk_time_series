import { useEffect, useMemo, useState } from "react";
import { fetchDataset } from "../../nonview/core/datasetApi";
import { applyMovingAverage, applyTimeWindow, parseSeriesFromRawData } from "../../nonview/core/timeSeriesUtils";

export default function useSelectedDataset(filteredMetadata, timeWindow, movingWindow) {
  const [selectedKey, setSelectedKey] = useState("");
  const [mainDataset, setMainDataset] = useState(null);
  const [datasetError, setDatasetError] = useState("");
  const [datasetLoading, setDatasetLoading] = useState(false);

  const selectedMeta = useMemo(
    () => filteredMetadata.find((item) => item.key === selectedKey) || filteredMetadata[0],
    [filteredMetadata, selectedKey],
  );

  useEffect(() => {
    if (selectedMeta && selectedMeta.key !== selectedKey) {
      setSelectedKey(selectedMeta.key);
    }
  }, [selectedMeta, selectedKey]);

  useEffect(() => {
    if (!selectedMeta) return;
    const load = async () => {
      try {
        setDatasetError("");
        setDatasetLoading(true);
        const payload = await fetchDataset(selectedMeta);
        setMainDataset(payload);
      } catch (error) {
        setDatasetError(error.message);
      } finally {
        setDatasetLoading(false);
      }
    };
    load();
  }, [selectedMeta]);

  const mainSeries = useMemo(() => {
    if (!selectedMeta || !mainDataset) return [];
    const sourceData = mainDataset?.cleaned_data || mainDataset?.raw_data;
    const parsed = parseSeriesFromRawData(sourceData);
    const windowed = applyTimeWindow(parsed, timeWindow);
    return applyMovingAverage(windowed, movingWindow);
  }, [selectedMeta, mainDataset, timeWindow, movingWindow]);

  return { selectedKey, setSelectedKey, selectedMeta, mainSeries, datasetError, datasetLoading };
}
