import React, { useState } from "react";
import { getDeterministicInsightLines } from "../../nonview/core/timeSeriesUtils";
import useMetadata from "./useMetadata";
import useSelectedDataset from "./useSelectedDataset";
import useCompareDataset from "./useCompareDataset";
import HomePageLayout from "./HomePageLayout";

function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sources: null,
    categories: null,
    frequencies: null,
  });
  const [compareEnabled, setCompareEnabled] = useState(false);
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
  const { compareCandidates, compareMeta, setCompareKey, compareSeries } =
    useCompareDataset(
      filteredMetadata,
      selectedMeta,
      compareEnabled,
      timeWindow,
      movingWindow,
    );

  const insights = getDeterministicInsightLines(mainSeries);
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
      compareEnabled={compareEnabled}
      setCompareEnabled={setCompareEnabled}
      compareMeta={compareMeta}
      compareCandidates={compareCandidates}
      setCompareKey={setCompareKey}
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
      compareSeries={compareSeries}
      chartType={chartType}
      setChartType={setChartType}
      timeWindow={timeWindow}
      setTimeWindow={setTimeWindow}
      movingWindow={movingWindow}
      setMovingWindow={setMovingWindow}
      insights={insights}
    />
  );
}

export default HomePage;
