import React from "react";
import FilterPanel from "../moles/FilterPanel";
import DatasetList from "../moles/DatasetList";
import ChartPanel from "../moles/ChartPanel";
import AIPanel from "../moles/AIPanel";
import DatasetDetails from "../moles/DatasetDetails";
import { DATETIME_STR } from "../../nonview/cons/VERSION";

const MOBILE_TABS = [
  ["search", "Search"],
  ["chart", "Chart"],
  ["ai", "AI"],
  ["details", "Details"],
];

export default function HomePageLayout({
  mobileTab,
  setMobileTab,
  metadataLoading,
  metadataError,
  datasetError,
  datasetLoading,
  filters,
  onFilterChange,
  onResetFilters,
  options,
  filteredMetadata,
  metadata,
  searchQuery,
  setSearchQuery,
  selectedMeta,
  setSelectedKey,
  mainSeries,
  chartType,
  setChartType,
  timeWindow,
  setTimeWindow,
  movingWindow,
  setMovingWindow,
  insights,
}) {
  return (
    <main className="app-shell">
      <header className="top-nav">
        <div>
          <h1>Sri Lanka Time Series</h1>
        </div>
        <div className="top-nav-right"></div>
      </header>
      <nav className="mobile-tabs" aria-label="Mobile panel tabs">
        {MOBILE_TABS.map(([value, label]) => (
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
      {metadataLoading && (
        <div className="global-message">Loading metadata catalog...</div>
      )}
      {metadataError && (
        <div className="global-message error">{metadataError}</div>
      )}
      {datasetError && (
        <div className="global-message error">{datasetError}</div>
      )}
      {datasetLoading && (
        <div className="global-message">Loading dataset time-series...</div>
      )}
      <div className="layout-grid">
        <div
          className={
            "layout-cell search-cell" +
            (mobileTab === "search" ? " mobile-show" : "")
          }
        >
          <FilterPanel
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onResetFilters}
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
          className={
            "layout-cell chart-cell" +
            (mobileTab === "chart" ? " mobile-show" : "")
          }
        >
          <ChartPanel
            selectedMeta={selectedMeta}
            mainSeries={mainSeries}
            chartType={chartType}
            onChartTypeChange={setChartType}
            timeWindow={timeWindow}
            onTimeWindowChange={setTimeWindow}
            movingWindow={movingWindow}
            onMovingWindowChange={setMovingWindow}
          />
        </div>
        <div
          className={
            "layout-cell details-cell" +
            (mobileTab === "details" ? " mobile-show" : "")
          }
        >
          <DatasetDetails meta={selectedMeta} />
        </div>
        <div
          className={
            "layout-cell ai-cell" + (mobileTab === "ai" ? " mobile-show" : "")
          }
        >
          <AIPanel insightLines={insights} />
        </div>
      </div>
      <footer className="footer-note">
        Metadata source: lanka_data_timeseries summary.json | Dataset URLs
        generated from source_id, sub_category, and frequency_name.
        <span className="footer-version">v{DATETIME_STR}</span>
      </footer>
    </main>
  );
}
