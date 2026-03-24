import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useMetadata from "./useMetadata";
import useSelectedDataset from "./useSelectedDataset";
import HomePageLayout from "./HomePageLayout";

function toSlug(meta) {
  const name = meta.sub_category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const freq = (meta.frequency_name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return freq
    ? `${meta.source_id}-${name}-${freq}`
    : `${meta.source_id}-${name}`;
}

function HomePage() {
  const { datasetKey } = useParams();
  const navigate = useNavigate();
  // True when no URL slug is present, or the slug has already been resolved to a key.
  // Prevents the default-selection from overwriting the URL before resolution completes.
  const slugResolved = useRef(!datasetKey);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sources: null,
    categories: null,
    frequencies: null,
  });
  const [timeWindow, setTimeWindow] = useState("all");
  const [movingWindow, setMovingWindow] = useState("none");

  const {
    metadata,
    metadataLoading,
    metadataError,
    options,
    filteredMetadata,
  } = useMetadata(searchQuery, filters);
  const {
    setSelectedKey,
    toggleKey,
    selectedMeta,
    datasets,
    rawSeries,
    mainSeries,
    datasetError,
    datasetLoading,
  } = useSelectedDataset(filteredMetadata, timeWindow, movingWindow);

  // When metadata loads and a slug is in the URL, resolve it to a key
  useEffect(() => {
    if (metadata.length === 0) return;
    if (datasetKey) {
      // Resolve slug from URL
      const match = metadata.find((m) => toSlug(m) === datasetKey);
      if (match) setSelectedKey(match.key);
    } else {
      // No slug: select the dataset with the most recent max_t
      const normalize = (t) => {
        if (!t) return "";
        const s = String(t);
        return /^\d{4}$/.test(s) ? s + "-12-31" : s;
      };
      const mostRecent = [...metadata].sort((a, b) =>
        normalize(b.summary_statistics?.max_t).localeCompare(
          normalize(a.summary_statistics?.max_t),
        ),
      )[0];
      if (mostRecent) setSelectedKey(mostRecent.key);
    }
    slugResolved.current = true;
  }, [metadata]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the selected dataset changes, update the URL to its kebab-case name
  useEffect(() => {
    if (!selectedMeta?.sub_category) return;
    if (!slugResolved.current) return; // wait until URL slug is resolved first
    const slug = toSlug(selectedMeta);
    if (datasetKey !== slug) {
      navigate(`/${slug}`, { replace: true });
    }
    setTimeWindow("all"); // reset time window for the new dataset
  }, [selectedMeta?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFilterChange = (field, value) =>
    setFilters((prev) => ({ ...prev, [field]: value }));
  const onResetFilters = () => {
    setSearchQuery("");
    setFilters({ sources: null, categories: null, frequencies: null });
  };

  return (
    <HomePageLayout
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
      toggleKey={toggleKey}
      datasets={datasets}
      mainSeries={mainSeries}
      rawSeries={rawSeries}
      timeWindow={timeWindow}
      setTimeWindow={setTimeWindow}
      movingWindow={movingWindow}
      setMovingWindow={setMovingWindow}
    />
  );
}

export default HomePage;
