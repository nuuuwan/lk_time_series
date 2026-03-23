import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSeasonalityInsightLines } from "../../nonview/core/timeSeriesUtils";
import useMetadata from "./useMetadata";
import useSelectedDataset from "./useSelectedDataset";
import HomePageLayout from "./HomePageLayout";

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  // When metadata loads and a slug is in the URL, resolve it to a key
  useEffect(() => {
    if (!datasetKey || metadata.length === 0) return;
    const match = metadata.find((m) => toSlug(m.sub_category) === datasetKey);
    if (match) setSelectedKey(match.key);
  }, [datasetKey, metadata]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the selected dataset changes, update the URL to its kebab-case name
  useEffect(() => {
    if (!selectedMeta?.sub_category) return;
    const slug = toSlug(selectedMeta.sub_category);
    if (datasetKey !== slug) {
      navigate(`/${slug}`, { replace: true });
    }
    if (mobileTab === "search") setMobileTab("chart");
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
