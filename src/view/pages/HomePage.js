import React, { useState } from "react";
import { getSeasonalityInsightLines } from "../../nonview/core/timeSeriesUtils";
import useMetadata from "./useMetadata";
import useSelectedDataset from "./useSelectedDataset";
import HomePageLayout from "./HomePageLayout";

function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sources: null,
    categories: null,
    frequencies: null,
  });
  const [chartType, setChartType] = useState("line");
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
    mainSeries,
    datasetError,
    datasetLoading,
  } = useSelectedDataset(filteredMetadata, timeWindow, movingWindow);
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
      chartType={chartType}
      setChartType={setChartType}
      timeWindow={timeWindow}
      setTimeWindow={setTimeWindow}
      movingWindow={movingWindow}
      setMovingWindow={setMovingWindow}
      seasonalityLines={seasonalityLines}
    />
  );
}

export default HomePage;
