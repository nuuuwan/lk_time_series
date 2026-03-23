import React, { useEffect, useMemo, useState } from "react";
import {
  fetchDataset,
  fetchSummaryMetadata,
} from "../../nonview/core/datasetApi";
import {
  applyTimeWindow,
  getDeterministicInsightLines,
  normalizeSeries,
  parseSeriesFromRawData,
} from "../../nonview/core/timeSeriesUtils";
import FilterPanel from "../moles/FilterPanel";
import DatasetList from "../moles/DatasetList";
import ChartPanel from "../moles/ChartPanel";
import AIPanel from "../moles/AIPanel";
import DatasetDetails from "../moles/DatasetDetails";

function HomePage() {
  const [metadata, setMetadata] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    source: "all",
    category: "all",
    frequency: "all",
  });

  const [selectedKey, setSelectedKey] = useState("");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareKey, setCompareKey] = useState("");

  const [chartType, setChartType] = useState("line");
  const [timeWindow, setTimeWindow] = useState("all");
  const [normalize, setNormalize] = useState(false);
  const [mobileTab, setMobileTab] = useState("search");

  const [mainDataset, setMainDataset] = useState(null);
  const [compareDataset, setCompareDataset] = useState(null);
  const [datasetError, setDatasetError] = useState("");
  const [datasetLoading, setDatasetLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setMetadataLoading(true);
        const list = await fetchSummaryMetadata();
        setMetadata(list);
        setSelectedKey(list[0]?.key || "");
      } catch (error) {
        setMetadataError(error.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    load();
  }, []);

  const options = useMemo(() => {
    const categories = [
      ...new Set(metadata.map((item) => item.category).filter(Boolean)),
    ].sort();
    const sources = [
      ...new Set(metadata.map((item) => item.source_id).filter(Boolean)),
    ].sort();
    const frequencies = [
      ...new Set(metadata.map((item) => item.frequency_name).filter(Boolean)),
    ].sort();

    return { categories, sources, frequencies };
  }, [metadata]);

  const filteredMetadata = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return metadata.filter((item) => {
      if (filters.source !== "all" && item.source_id !== filters.source) {
        return false;
      }
      if (filters.category !== "all" && item.category !== filters.category) {
        return false;
      }
      if (
        filters.frequency !== "all" &&
        item.frequency_name !== filters.frequency
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack = [
        item.source_id,
        item.category,
        item.sub_category,
        item.frequency_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [metadata, searchQuery, filters]);

  const selectedMeta = useMemo(
    () =>
      filteredMetadata.find((item) => item.key === selectedKey) ||
      filteredMetadata[0],
    [filteredMetadata, selectedKey],
  );

  useEffect(() => {
    if (selectedMeta && selectedMeta.key !== selectedKey) {
      setSelectedKey(selectedMeta.key);
    }
  }, [selectedMeta, selectedKey]);

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
    if (!compareEnabled) {
      setCompareDataset(null);
      return;
    }

    if (!compareMeta) {
      setCompareDataset(null);
      return;
    }

    const loadCompare = async () => {
      try {
        const payload = await fetchDataset(compareMeta);
        setCompareDataset(payload);
      } catch (error) {
        setDatasetError(error.message);
      }
    };

    loadCompare();
  }, [compareEnabled, compareMeta]);

  useEffect(() => {
    if (!selectedMeta) {
      return;
    }

    const loadDataset = async () => {
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

    loadDataset();
  }, [selectedMeta]);

  const mainSeries = useMemo(() => {
    if (!selectedMeta || !mainDataset) {
      return [];
    }

    const parsed = parseSeriesFromRawData(mainDataset?.raw_data);
    const windowed = applyTimeWindow(parsed, timeWindow);
    return normalize ? normalizeSeries(windowed) : windowed;
  }, [selectedMeta, mainDataset, timeWindow, normalize]);

  const compareSeries = useMemo(() => {
    if (!compareEnabled || !compareMeta || !compareDataset) {
      return null;
    }

    const parsed = parseSeriesFromRawData(compareDataset.raw_data);
    const windowed = applyTimeWindow(parsed, timeWindow);
    return normalize ? normalizeSeries(windowed) : windowed;
  }, [compareEnabled, compareMeta, compareDataset, timeWindow, normalize]);

  const insights = useMemo(
    () => getDeterministicInsightLines(mainSeries),
    [mainSeries],
  );

  const onFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <main className="app-shell">
      <header className="top-nav">
        <div>
          <h1>Sri Lanka Time Series</h1>
          <p>Search, visualize, and compare 3500+ public datasets.</p>
        </div>

        <div className="top-nav-right">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={compareEnabled}
              onChange={(event) => setCompareEnabled(event.target.checked)}
            />
            Compare mode
          </label>

          {compareEnabled && (
            <select
              className="select-input"
              value={compareMeta?.key || ""}
              onChange={(event) => setCompareKey(event.target.value)}
            >
              {compareCandidates.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.sub_category} ({item.frequency_name})
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <nav className="mobile-tabs" aria-label="Mobile panel tabs">
        {[
          ["search", "Search"],
          ["chart", "Chart"],
          ["ai", "AI"],
          ["details", "Details"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={mobileTab === value ? "active" : ""}
            onClick={() => setMobileTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {metadataLoading ? (
        <div className="global-message">Loading metadata catalog...</div>
      ) : null}
      {metadataError ? (
        <div className="global-message error">{metadataError}</div>
      ) : null}
      {datasetError ? (
        <div className="global-message error">{datasetError}</div>
      ) : null}
      {datasetLoading ? (
        <div className="global-message">Loading dataset time-series...</div>
      ) : null}

      <div className="layout-grid">
        <div
          className={`layout-cell search-cell ${mobileTab === "search" ? "mobile-show" : ""}`}
        >
          <FilterPanel
            filters={filters}
            onFilterChange={onFilterChange}
            options={options}
            resultCount={filteredMetadata.length}
            datasetCount={metadata.length}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />

          <DatasetList
            datasets={filteredMetadata}
            selectedKey={selectedMeta?.key || ""}
            onSelectDataset={setSelectedKey}
          />
        </div>

        <div
          className={`layout-cell chart-cell ${mobileTab === "chart" ? "mobile-show" : ""}`}
        >
          <ChartPanel
            selectedMeta={selectedMeta}
            mainSeries={mainSeries}
            compareSeries={compareEnabled ? compareSeries : null}
            compareMeta={compareEnabled ? compareMeta : null}
            chartType={chartType}
            onChartTypeChange={setChartType}
            timeWindow={timeWindow}
            onTimeWindowChange={setTimeWindow}
            normalize={normalize}
            onNormalizeChange={setNormalize}
          />
        </div>

        <div
          className={`layout-cell ai-cell ${mobileTab === "ai" ? "mobile-show" : ""}`}
        >
          <AIPanel insightLines={insights} />
        </div>

        <div
          className={`layout-cell details-cell ${mobileTab === "details" ? "mobile-show" : ""}`}
        >
          <DatasetDetails meta={selectedMeta} />
        </div>
      </div>

      <footer className="footer-note">
        Metadata source: lanka_data_timeseries summary.json | Dataset URLs
        generated from source_id, sub_category, and frequency_name.
      </footer>
    </main>
  );
}

export default HomePage;
