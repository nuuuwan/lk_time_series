import React, { useState, useEffect } from "react";
import FilterPanel from "../moles/FilterPanel";
import DatasetList from "../moles/DatasetList";
import ChartPanel from "../moles/ChartPanel";
import SeasonalityPanel from "../moles/SeasonalityPanel";
import ForecastPanel from "../moles/ForecastPanel";
import DatasetDetails from "../moles/DatasetDetails";
import { DATETIME_STR } from "../../nonview/cons/VERSION";
import DATA_SOURCE_IDX from "../../nonview/cons/DATA_SOURCE_IDX";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";

export default function HomePageLayout({
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
  toggleKey,
  datasets,
  mainSeries,
  rawSeries,
  timeWindow,
  setTimeWindow,
  movingWindow,
  setMovingWindow,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 800);

  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 800);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <>
      <AppBar position="static" className="app-bar">
        <Toolbar className="app-bar-toolbar" disableGutters>
          <div className="app-bar-left">
            <div className="top-nav-title-row">
              <span className="app-bar-title">Sri Lanka Time Series</span>
              <div className="top-nav-source-icons">
                {Object.values(DATA_SOURCE_IDX).map((src) =>
                  src.image ? (
                    <img
                      key={src.label}
                      src={src.image}
                      alt={src.label}
                      title={src.label}
                      className="top-nav-source-img"
                    />
                  ) : null,
                )}
              </div>
            </div>
            {metadata.length > 0 && (
              <p className="app-bar-subtitle">
                Search and visualize {metadata.length.toLocaleString()} public
                datasets from {Object.keys(DATA_SOURCE_IDX).length} sources.
              </p>
            )}
          </div>
          <IconButton
            className="app-bar-menu-btn"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="More options"
            size="small"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              component="a"
              href="https://github.com/nuuuwan/lk_time_series"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuAnchor(null)}
            >
              GitHub
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <main className="app-shell">
        {isNarrow && (
          <Alert severity="warning" className="narrow-screen-alert">
            This tool is designed for wide desktop screens and is not optimised
            for mobile or narrow viewports.
          </Alert>
        )}
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
          <div className="layout-cell search-cell">
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
              selectedKeys={datasets.map((d) => d.meta.key)}
              onToggleDataset={toggleKey}
            />
          </div>
          <div className="layout-cell chart-cell">
            <ChartPanel
              datasets={datasets}
              timeWindow={timeWindow}
              onTimeWindowChange={setTimeWindow}
              movingWindow={movingWindow}
              onMovingWindowChange={setMovingWindow}
              onClose={datasets.length > 0 ? () => setSelectedKey(null) : undefined}
            />
          </div>
          <div className="layout-right-col">
            <div className="layout-cell details-cell">
              <DatasetDetails meta={selectedMeta} mainSeries={mainSeries} />
            </div>
            <div className="layout-cell ai-cell">
              <SeasonalityPanel mainSeries={mainSeries} />
              <ForecastPanel mainSeries={mainSeries} />
            </div>
          </div>
        </div>
        <footer className="footer-note">
          <span className="footer-version">v{DATETIME_STR}</span>
        </footer>
      </main>
    </>
  );
}
