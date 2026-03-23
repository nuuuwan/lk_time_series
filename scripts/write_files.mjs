import { writeFileSync } from "fs";
import { join } from "path";

const root =
  "/Users/nuwansenaratna/Not-Dropbox/_CODING/js_react/lk_time_series/src";

const files = {
  "view/moles/FilterPanel.js": `import React from "react";
import MultiCheckList from "../atoms/MultiCheckList";

function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  options,
  resultCount,
  datasetCount,
  searchQuery,
  onSearchQueryChange,
}) {
  const isFiltered =
    searchQuery ||
    filters.sources !== null ||
    filters.categories !== null ||
    filters.frequencies !== null;

  return (
    <section className="panel filter-panel">
      <div className="panel-head-row">
        <div>
          <h2>Discovery</h2>
          <p className="panel-subtitle">Filter and search across the full catalog.</p>
        </div>
        {isFiltered && (
          <button type="button" className="reset-btn" onClick={onReset}>Reset</button>
        )}
      </div>
      <label className="field-label" htmlFor="search-input">Global Search</label>
      <input
        id="search-input"
        className="text-input"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder="Search source, category, sub-category, frequency"
      />
      <div className="filter-section-header">
        <label className="field-label">Source</label>
      </div>
      <MultiCheckList
        items={options.sources}
        selected={filters.sources}
        onChange={(val) => onFilterChange("sources", val)}
        renderItem={(source) => (
          <span className="source-check-item">
            {source.image && (
              <img src={source.image} alt={source.label} className="source-check-img" />
            )}
            <span>{source.label}</span>
          </span>
        )}
      />
      <div className="filter-section-header">
        <label className="field-label">Category</label>
      </div>
      <MultiCheckList
        items={options.categories}
        selected={filters.categories}
        onChange={(val) => onFilterChange("categories", val)}
      />
      <div className="filter-section-header">
        <label className="field-label">Frequency</label>
      </div>
      <MultiCheckList
        items={options.frequencies}
        selected={filters.frequencies}
        onChange={(val) => onFilterChange("frequencies", val)}
      />
      <div className="result-meta">
        <span>{resultCount.toLocaleString()} matched</span>
        <span>{datasetCount.toLocaleString()} total</span>
      </div>
    </section>
  );
}

export default FilterPanel;
`,

  "view/atoms/MetaField.js": `import React from "react";

function MetaField({ label, value }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <strong className="detail-value">{value}</strong>
    </div>
  );
}

export default MetaField;
`,

  "view/atoms/ChartControls.js": `import React from "react";

const MOVING_WINDOW_OPTIONS = [
  { value: "none", label: "No smoothing" },
  { value: "7", label: "Week" },
  { value: "30", label: "Month" },
  { value: "91", label: "Quarter" },
  { value: "365", label: "Year" },
  { value: "3650", label: "Decade" },
];

function ChartControls({
  chartType,
  onChartTypeChange,
  timeWindow,
  onTimeWindowChange,
  movingWindow,
  onMovingWindowChange,
  onDownload,
  hasData,
}) {
  return (
    <div className="chart-controls">
      <select
        className="select-input compact"
        value={chartType}
        onChange={(e) => onChartTypeChange(e.target.value)}
      >
        <option value="line">Line Chart</option>
        <option value="area">Area Chart</option>
        <option value="bar">Bar Chart</option>
      </select>
      <select
        className="select-input compact"
        value={timeWindow}
        onChange={(e) => onTimeWindowChange(e.target.value)}
      >
        <option value="all">All data</option>
        <option value="25">25Y</option>
        <option value="10">10Y</option>
        <option value="5">5Y</option>
        <option value="1">1Y</option>
      </select>
      <select
        className="select-input compact"
        value={movingWindow}
        onChange={(e) => onMovingWindowChange(e.target.value)}
      >
        {MOVING_WINDOW_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hasData && (
        <button type="button" className="icon-btn" onClick={onDownload} title="Download chart as PNG">
          ↓ PNG
        </button>
      )}
    </div>
  );
}

export default ChartControls;
`,

  "view/moles/ChartPanel.js": `import React, { useRef } from "react";
import { BarChart, LineChart } from "@mui/x-charts";
import { toPng } from "html-to-image";
import StatChip from "../atoms/StatChip";
import ChartControls from "../atoms/ChartControls";
import { formatDate, formatNumber } from "../../nonview/core/timeSeriesUtils";

function ChartPanel({
  selectedMeta, mainSeries, compareSeries, compareMeta,
  chartType, onChartTypeChange,
  timeWindow, onTimeWindowChange,
  movingWindow, onMovingWindowChange,
}) {
  const chartWrapRef = useRef(null);

  function downloadChart() {
    const node = chartWrapRef.current;
    if (!node) return;
    const label = selectedMeta?.sub_category || "chart";
    const filename = label.replace(/[^a-z0-9]/gi, "_") + ".png";
    toPng(node, { backgroundColor: "#ffffff", pixelRatio: 2, skipFonts: true }).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    });
  }

  const xData = mainSeries.map((point, i) =>
    Number.isFinite(point.timeMs)
      ? new Date(point.timeMs).toISOString().slice(0, 10)
      : point.t || ("Point " + (i + 1)),
  );
  const mainData = mainSeries.map((p) => p.value);
  const compareData = compareSeries
    ? mainSeries.map((p) => { const m = compareSeries.find((c) => c.t === p.t); return m ? m.value : null; })
    : null;

  const isArea = chartType === "area";
  const series = [
    { data: mainData, label: selectedMeta?.sub_category || "Selected Series",
      showMark: false, curve: "linear", color: "#0f766e", ...(isArea ? { area: true } : {}) },
  ];
  if (compareData && compareMeta) {
    series.push({ data: compareData, label: compareMeta.sub_category,
      showMark: false, curve: "linear", color: "#b45309", ...(isArea ? { area: true } : {}) });
  }

  const stat = selectedMeta?.summary_statistics || {};
  const MAX_X_TICKS = 7;
  const n = xData.length;
  const shownTickIndices = (() => {
    if (n <= MAX_X_TICKS) return new Set(Array.from({ length: n }, (_, i) => i));
    const inner = MAX_X_TICKS - 2;
    const indices = new Set([0, n - 1]);
    for (let i = 1; i <= inner; i++) indices.add(Math.round((i * (n - 1)) / (inner + 1)));
    return indices;
  })();
  const tickInterval = (_v, index) => shownTickIndices.has(index);
  const allValues = [...mainData, ...(compareData || [])].filter((v) => v !== null && Number.isFinite(v));
  const maxAbsValue = allValues.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
  const dynamicLeft = Math.max(64, new Intl.NumberFormat().format(maxAbsValue).length * 8 + 20);
  const sharedProps = {
    height: 380, series,
    margin: { left: dynamicLeft, right: 24, top: 20, bottom: 64 },
    yAxis: [{ width: dynamicLeft }],
  };

  return (
    <section className="panel chart-panel">
      <div className="panel-head-row">
        <div>
          <h2>Visualization</h2>
          <p className="panel-subtitle">{selectedMeta ? selectedMeta.sub_category : "Pick a dataset from the left panel."}</p>
        </div>
        <ChartControls
          chartType={chartType} onChartTypeChange={onChartTypeChange}
          timeWindow={timeWindow} onTimeWindowChange={onTimeWindowChange}
          movingWindow={movingWindow} onMovingWindowChange={onMovingWindowChange}
          onDownload={downloadChart} hasData={mainSeries.length > 0}
        />
      </div>
      <div className="chart-wrap" ref={chartWrapRef}>
        {mainSeries.length === 0 ? (
          <div className="empty-state">No chart points available for this dataset.</div>
        ) : chartType === "bar" ? (
          <BarChart {...sharedProps} xAxis={[{ data: xData, scaleType: "band", tickInterval }]} />
        ) : (
          <LineChart {...sharedProps} xAxis={[{ data: xData, scaleType: "point", tickInterval }]} />
        )}
      </div>
      <div className="stat-grid">
        <StatChip label="Points" value={formatNumber(stat.n)} />
        <StatChip label="Min Date" value={formatDate(stat.min_t)} />
        <StatChip label="Max Date" value={formatDate(stat.max_t)} />
        <StatChip label="Min Value" value={formatNumber(stat.min_value)} />
        <StatChip label="Max Value" value={formatNumber(stat.max_value)} />
      </div>
    </section>
  );
}

export default ChartPanel;
`,

  "view/moles/DatasetDetails.js": `import React from "react";
import { buildDatasetGithubUrl, buildDatasetRawUrl } from "../../nonview/core/datasetApi";
import { formatDate, formatNumber } from "../../nonview/core/timeSeriesUtils";
import { getSourceLabel, getSourceImage } from "../../nonview/cons/DATA_SOURCE_IDX";
import MetaField from "../atoms/MetaField";

function DatasetDetails({ meta }) {
  if (!meta) {
    return (
      <section className="panel dataset-details-panel">
        <h2>Dataset Details</h2>
        <div className="empty-state">Select a dataset to view details.</div>
      </section>
    );
  }
  const stat = meta.summary_statistics || {};
  return (
    <section className="panel dataset-details-panel">
      <div className="details-source-row">
        {getSourceImage(meta.source_id) && (
          <img src={getSourceImage(meta.source_id)} alt={getSourceLabel(meta.source_id)} className="details-source-logo" />
        )}
        <span className="details-source-name">{getSourceLabel(meta.source_id)}</span>
      </div>
      <h2 className="details-title">{meta.sub_category}</h2>
      <p className="details-category">{meta.category}</p>
      <div className="details-stat-row">
        <div className="details-stat">
          <span className="details-stat-label">Data Points</span>
          <strong className="details-stat-value">{formatNumber(stat.n)}</strong>
        </div>
        <div className="details-stat">
          <span className="details-stat-label">Date Range</span>
          <strong className="details-stat-value">{formatDate(stat.min_t)} – {formatDate(stat.max_t)}</strong>
        </div>
        <div className="details-stat">
          <span className="details-stat-label">Value Range</span>
          <strong className="details-stat-value">{formatNumber(stat.min_value)} – {formatNumber(stat.max_value)}</strong>
        </div>
      </div>
      <div className="details-grid">
        <MetaField label="Frequency" value={meta.frequency_name} />
        <MetaField label="Unit" value={meta.unit || "N/A"} />
        <MetaField label="Scale" value={meta.scale || "N/A"} />
        <MetaField label="Last Updated" value={formatDate(meta.last_updated_time_str)} />
      </div>
      <div className="link-row">
        <a className="link-btn" href={buildDatasetRawUrl(meta)} target="_blank" rel="noreferrer">Raw JSON</a>
        <a className="link-btn link-btn-secondary" href={buildDatasetGithubUrl(meta)} target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </section>
  );
}

export default DatasetDetails;
`,

  "view/pages/useMetadata.js": `import { useEffect, useMemo, useState } from "react";
import { fetchSummaryMetadata } from "../../nonview/core/datasetApi";
import DATA_SOURCE_IDX from "../../nonview/cons/DATA_SOURCE_IDX";

export default function useMetadata(searchQuery, filters) {
  const [metadata, setMetadata] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setMetadataLoading(true);
        const list = await fetchSummaryMetadata();
        setMetadata(list);
      } catch (error) {
        setMetadataError(error.message);
      } finally {
        setMetadataLoading(false);
      }
    };
    load();
  }, []);

  const options = useMemo(() => {
    const categories = [...new Set(metadata.map((item) => item.category).filter(Boolean))].sort();
    const sources = [...new Set(metadata.map((item) => item.source_id).filter(Boolean))]
      .sort()
      .map((sourceId) => ({
        id: sourceId,
        label: DATA_SOURCE_IDX[sourceId]?.label || sourceId,
        image: DATA_SOURCE_IDX[sourceId]?.image || null,
      }));
    const frequencies = [...new Set(metadata.map((item) => item.frequency_name).filter(Boolean))].sort();
    return { categories, sources, frequencies };
  }, [metadata]);

  const filteredMetadata = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return metadata.filter((item) => {
      if (filters.sources !== null && !filters.sources.includes(item.source_id)) return false;
      if (filters.categories !== null && !filters.categories.includes(item.category)) return false;
      if (filters.frequencies !== null && !filters.frequencies.includes(item.frequency_name)) return false;
      if (!q) return true;
      const haystack = [item.source_id, item.category, item.sub_category, item.frequency_name]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [metadata, searchQuery, filters]);

  return { metadata, metadataLoading, metadataError, options, filteredMetadata };
}
`,

  "view/pages/useSelectedDataset.js": `import { useEffect, useMemo, useState } from "react";
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
`,

  "view/pages/useCompareDataset.js": `import { useEffect, useMemo, useState } from "react";
import { fetchDataset } from "../../nonview/core/datasetApi";
import { applyMovingAverage, applyTimeWindow, parseSeriesFromRawData } from "../../nonview/core/timeSeriesUtils";

export default function useCompareDataset(filteredMetadata, selectedMeta, compareEnabled, timeWindow, movingWindow) {
  const [compareKey, setCompareKey] = useState("");
  const [compareDataset, setCompareDataset] = useState(null);

  const compareCandidates = useMemo(
    () => filteredMetadata.filter((item) => item.key !== selectedMeta?.key),
    [filteredMetadata, selectedMeta],
  );

  const compareMeta = useMemo(
    () => compareCandidates.find((item) => item.key === compareKey) || compareCandidates[0],
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
`,

  "view/pages/HomePageLayout.js": `import React from "react";
import FilterPanel from "../moles/FilterPanel";
import DatasetList from "../moles/DatasetList";
import ChartPanel from "../moles/ChartPanel";
import AIPanel from "../moles/AIPanel";
import DatasetDetails from "../moles/DatasetDetails";

const MOBILE_TABS = [["search", "Search"], ["chart", "Chart"], ["ai", "AI"], ["details", "Details"]];

export default function HomePageLayout({
  mobileTab, setMobileTab,
  compareEnabled, setCompareEnabled,
  compareMeta, compareCandidates, setCompareKey,
  metadataLoading, metadataError, datasetError, datasetLoading,
  filters, onFilterChange, onResetFilters, options, filteredMetadata, metadata,
  searchQuery, setSearchQuery, selectedMeta, setSelectedKey,
  mainSeries, compareSeries, chartType, setChartType,
  timeWindow, setTimeWindow, movingWindow, setMovingWindow, insights,
}) {
  return (
    <main className="app-shell">
      <header className="top-nav">
        <div>
          <h1>Sri Lanka Time Series</h1>
          <p>Search, visualize, and compare 3500+ public datasets.</p>
        </div>
        <div className="top-nav-right">
          <label className="toggle-label">
            <input type="checkbox" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} />
            Compare mode
          </label>
          {compareEnabled && (
            <select className="select-input" value={compareMeta?.key || ""} onChange={(e) => setCompareKey(e.target.value)}>
              {compareCandidates.map((item) => (
                <option key={item.key} value={item.key}>{item.sub_category} ({item.frequency_name})</option>
              ))}
            </select>
          )}
        </div>
      </header>
      <nav className="mobile-tabs" aria-label="Mobile panel tabs">
        {MOBILE_TABS.map(([value, label]) => (
          <button key={value} type="button" className={mobileTab === value ? "active" : ""} onClick={() => setMobileTab(value)}>{label}</button>
        ))}
      </nav>
      {metadataLoading && <div className="global-message">Loading metadata catalog...</div>}
      {metadataError && <div className="global-message error">{metadataError}</div>}
      {datasetError && <div className="global-message error">{datasetError}</div>}
      {datasetLoading && <div className="global-message">Loading dataset time-series...</div>}
      <div className="layout-grid">
        <div className={"layout-cell search-cell" + (mobileTab === "search" ? " mobile-show" : "")}>
          <FilterPanel filters={filters} onFilterChange={onFilterChange} onReset={onResetFilters}
            options={options} resultCount={filteredMetadata.length} datasetCount={metadata.length}
            searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
          <DatasetList datasets={filteredMetadata} selectedKey={selectedMeta?.key || ""} onSelectDataset={setSelectedKey} />
        </div>
        <div className={"layout-cell chart-cell" + (mobileTab === "chart" ? " mobile-show" : "")}>
          <ChartPanel selectedMeta={selectedMeta} mainSeries={mainSeries}
            compareSeries={compareEnabled ? compareSeries : null} compareMeta={compareEnabled ? compareMeta : null}
            chartType={chartType} onChartTypeChange={setChartType}
            timeWindow={timeWindow} onTimeWindowChange={setTimeWindow}
            movingWindow={movingWindow} onMovingWindowChange={setMovingWindow} />
        </div>
        <div className={"layout-cell details-cell" + (mobileTab === "details" ? " mobile-show" : "")}>
          <DatasetDetails meta={selectedMeta} />
        </div>
        <div className={"layout-cell ai-cell" + (mobileTab === "ai" ? " mobile-show" : "")}>
          <AIPanel insightLines={insights} />
        </div>
      </div>
      <footer className="footer-note">
        Metadata source: lanka_data_timeseries summary.json | Dataset URLs generated from source_id, sub_category, and frequency_name.
      </footer>
    </main>
  );
}
`,

  "view/pages/HomePage.js": `import React, { useState } from "react";
import { getDeterministicInsightLines } from "../../nonview/core/timeSeriesUtils";
import useMetadata from "./useMetadata";
import useSelectedDataset from "./useSelectedDataset";
import useCompareDataset from "./useCompareDataset";
import HomePageLayout from "./HomePageLayout";

function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ sources: null, categories: null, frequencies: null });
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [chartType, setChartType] = useState("line");
  const [timeWindow, setTimeWindow] = useState("all");
  const [movingWindow, setMovingWindow] = useState("none");
  const [mobileTab, setMobileTab] = useState("search");

  const { metadata, metadataLoading, metadataError, options, filteredMetadata } =
    useMetadata(searchQuery, filters);
  const { setSelectedKey, selectedMeta, mainSeries, datasetError, datasetLoading } =
    useSelectedDataset(filteredMetadata, timeWindow, movingWindow);
  const { compareCandidates, compareMeta, setCompareKey, compareSeries } =
    useCompareDataset(filteredMetadata, selectedMeta, compareEnabled, timeWindow, movingWindow);

  const insights = getDeterministicInsightLines(mainSeries);
  const onFilterChange = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
  const onResetFilters = () => {
    setSearchQuery("");
    setFilters({ sources: null, categories: null, frequencies: null });
  };

  return (
    <HomePageLayout
      mobileTab={mobileTab} setMobileTab={setMobileTab}
      compareEnabled={compareEnabled} setCompareEnabled={setCompareEnabled}
      compareMeta={compareMeta} compareCandidates={compareCandidates} setCompareKey={setCompareKey}
      metadataLoading={metadataLoading} metadataError={metadataError}
      datasetError={datasetError} datasetLoading={datasetLoading}
      filters={filters} onFilterChange={onFilterChange} onResetFilters={onResetFilters}
      options={options} filteredMetadata={filteredMetadata} metadata={metadata}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      selectedMeta={selectedMeta} setSelectedKey={setSelectedKey}
      mainSeries={mainSeries} compareSeries={compareSeries}
      chartType={chartType} setChartType={setChartType}
      timeWindow={timeWindow} setTimeWindow={setTimeWindow}
      movingWindow={movingWindow} setMovingWindow={setMovingWindow}
      insights={insights}
    />
  );
}

export default HomePage;
`,
};

for (const [relPath, content] of Object.entries(files)) {
  writeFileSync(join(root, relPath), content);
  const lines = content.split("\n").length;
  console.log(`wrote ${relPath} (${lines} lines)`);
}
