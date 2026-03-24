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
import CircularProgress from "@mui/material/CircularProgress";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [detailKey, setDetailKey] = useState(null);

  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 800);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // When a dataset is toggled from the list, update which key shows in the detail panel
  function handleToggleDataset(key) {
    toggleKey(key);
    setDetailKey(key);
  }

  // When clicking the row body (not the toggle button), show details for that key
  function handleSelectForDetail(key) {
    setDetailKey(key);
  }

  // Find meta + series for the detail panel
  const detailDataset =
    datasets.find((d) => d.meta.key === detailKey) ?? datasets[0] ?? null;
  const detailMeta = detailDataset?.meta ?? selectedMeta;
  const detailSeries = detailDataset?.mainSeries ?? mainSeries;

  function handleDice() {
    const pool = metadata.length > 0 ? metadata : filteredMetadata;
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelectedKey(pick.key);
    setDetailKey(pick.key);
  }

  return (
    <>
      <AppBar position="sticky" className="app-bar">
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
            className="app-bar-dice-btn"
            onClick={handleDice}
            aria-label="Random dataset"
            title="Surprise me — open a random dataset"
            size="small"
            disabled={metadata.length === 0}
          >
            {/* Dice face showing 6 dots */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="16" height="16" rx="3" />
              <circle
                cx="6.5"
                cy="6.5"
                r="1"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="13.5"
                cy="6.5"
                r="1"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="6.5"
                cy="10"
                r="1"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="13.5"
                cy="10"
                r="1"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="6.5"
                cy="13.5"
                r="1"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="13.5"
                cy="13.5"
                r="1"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </IconButton>
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

      <div className="page-body">
        {/* ── Collapsible Sidebar ── */}
        <aside
          className={`sidebar${sidebarCollapsed ? " sidebar-collapsed" : ""}`}
        >
          <div className="sidebar-inner">
            {!sidebarCollapsed && (
              <>
                {isNarrow && (
                  <Alert severity="warning" className="narrow-screen-alert">
                    This tool is designed for wide desktop screens.
                  </Alert>
                )}
                {metadataLoading && (
                  <div className="global-loading">
                    <CircularProgress size={18} thickness={5} />
                    <span>Loading catalog…</span>
                  </div>
                )}
                {metadataError && (
                  <div className="global-message error">{metadataError}</div>
                )}
                {datasetError && (
                  <div className="global-message error">{datasetError}</div>
                )}
                {datasetLoading && (
                  <div className="global-loading">
                    <CircularProgress size={18} thickness={5} />
                    <span>Loading dataset…</span>
                  </div>
                )}
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
                  selectedUnit={datasets[0]?.meta?.unit ?? null}
                  selectedScale={datasets[0]?.meta?.scale ?? null}
                  onToggleDataset={handleToggleDataset}
                  onSelectForDetail={handleSelectForDetail}
                />
              </>
            )}
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon fontSize="small" />
            ) : (
              <ChevronLeftIcon fontSize="small" />
            )}
          </button>
        </aside>

        {/* ── Main chart area ── */}
        <main className="chart-main">
          <ChartPanel
            datasets={datasets}
            timeWindow={timeWindow}
            onTimeWindowChange={setTimeWindow}
            movingWindow={movingWindow}
            onMovingWindowChange={setMovingWindow}
            onClose={
              datasets.length > 0 ? () => setSelectedKey(null) : undefined
            }
          />
          <footer className="footer-note">
            <span className="footer-version">v{DATETIME_STR}</span>
          </footer>
        </main>

        {/* ── Persistent Right Sidebar ── */}
        <aside
          className={`right-sidebar${rightSidebarCollapsed ? " right-sidebar-collapsed" : ""}`}
        >
          <button
            className="right-sidebar-collapse-btn"
            onClick={() => setRightSidebarCollapsed((v) => !v)}
            aria-label={
              rightSidebarCollapsed
                ? "Expand details panel"
                : "Collapse details panel"
            }
          >
            {rightSidebarCollapsed ? (
              <ChevronLeftIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </button>
          <div className="right-sidebar-inner">
            <details className="sidebar-accordion" open>
              <summary className="sidebar-accordion-summary">
                Dataset Details
              </summary>
              <div className="sidebar-accordion-body">
                <DatasetDetails meta={detailMeta} mainSeries={detailSeries} />
              </div>
            </details>
            <details className="sidebar-accordion">
              <summary className="sidebar-accordion-summary">
                Seasonality
              </summary>
              <div className="sidebar-accordion-body">
                <SeasonalityPanel mainSeries={detailSeries} />
              </div>
            </details>
            <details className="sidebar-accordion">
              <summary className="sidebar-accordion-summary">Forecast</summary>
              <div className="sidebar-accordion-body">
                <ForecastPanel mainSeries={detailSeries} />
              </div>
            </details>
          </div>
        </aside>
      </div>
    </>
  );
}
