import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSeasonalityInsightLines } from "../../nonview/core/timeSeriesUtils";
import useMetadata from "./useMetadata";
import useSelectedDataset from "./useSelectedDataset";
import HomePageLayout from "./HomePageLayout";

function HomePage() {
  const { datasetKey } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sources: null,
    categories: null,
    frequencies: null,
  });
  const [timeWindow, setTimeWindow] = useState("all");
  const [movingWindow, setMovingWindow] = useState("none");
  const [mobileTab, setMobileTab] = useState("search");

  const {
    metadata,
    metadataLoading,
    metadataError,
    options,
    filteredMetadata,
  } = useMetadata(searchQuery, filters);
  const {
    setSelectedKey,
    selectedMeta,
    rawSeries,
    mainSeries,
    datasetError,
    datasetLoading,
  } = useSelectedDataset(filteredMetadata, timeWindow, movingWindow);

  // On mount / URL change: push URL key into selection state
  useEffect(() => {
    if (datasetKey) {
      setSelectedKey(decodeURIComponent(datasetKey));
    }
  }, [datasetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the selected dataset changes, update the URL
  useEffect(() => {
    if (selectedMeta?.key) {
      const encoded = encodeURIComponent(selectedMeta.key);
      const target = `/${encoded}`;
      if (decodeURIComponent(datasetKey || "") !== selectedMeta.key) {
        navigate(target, { replace: true });
      }
      if (mobileTab === "search") setMobileTab("chart");
    }
  }, [selectedMeta?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const seasonalityLines = getSeasonalityInsightLines(mainSeries);
  const onFilterChange = (field, value) =>
    setFilters((prev) => ({ ...prev, [field]: value }));
  const onResetFilters = () => {
    setSearchQuery("");
    setFilters({ sources: null, categories: null, frequencies: null });
  };

  return (
    <HomePageLayout
      mobileTab={mobileTab}
      setMobileTab={setMobileTab}
      metadataLoading={metadataLoading}
      metadataError={metadataError}
      datasetError={datasetError}
      datasetLoading={datasetLoading}
      filters={filters}
      onFilterChange={onFilterChange}
      onResetFilters={onResetFilters}
      options={options}
      filteredMetadata={filteredMetadata}
      metadata={metadata}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedMeta={selectedMeta}
      setSelectedKey={setSelectedKey}
      mainSeries={mainSeries}
      rawSeries={rawSeries}
      timeWindow={timeWindow}
      setTimeWindow={setTimeWindow}
      movingWindow={movingWindow}
      setMovingWindow={setMovingWindow}
      seasonalityLines={seasonalityLines}
    />
  );
}

export default HomePage;
