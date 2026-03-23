import React, { useRef } from "react";
import { BarChart, LineChart } from "@mui/x-charts";
import { toPng } from "html-to-image";
import StatChip from "../atoms/StatChip";
import { formatDate, formatNumber } from "../../nonview/core/timeSeriesUtils";

const MOVING_WINDOW_OPTIONS = [
  { value: "none", label: "No smoothing" },
  { value: "7", label: "Week" },
  { value: "30", label: "Month" },
  { value: "91", label: "Quarter" },
  { value: "365", label: "Year" },
  { value: "3650", label: "Decade" },
];

function ChartPanel({
  selectedMeta,
  mainSeries,
  compareSeries,
  compareMeta,
  chartType,
  onChartTypeChange,
  timeWindow,
  onTimeWindowChange,
  movingWindow,
  onMovingWindowChange,
  normalize,
  onNormalizeChange,
}) {
  const chartWrapRef = useRef(null);

  function downloadChart() {
    const node = chartWrapRef.current;
    if (!node) return;
    const label = selectedMeta?.sub_category || "chart";
    const filename = `${label.replace(/[^a-z0-9]/gi, "_")}.png`;
    toPng(node, { backgroundColor: "#ffffff", pixelRatio: 2, skipFonts: true }).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    });
  }
  const xData = mainSeries.map((point, index) => {
    if (Number.isFinite(point.timeMs)) {
      return new Date(point.timeMs).toISOString().slice(0, 10);
    }
    return point.t || `Point ${index + 1}`;
  });
  const mainData = mainSeries.map((point) =>
    normalize ? point.normalizedValue : point.value,
  );

  const compareData = compareSeries
    ? mainSeries.map((point) => {
        const match = compareSeries.find(
          (candidate) => candidate.t === point.t,
        );
        if (!match) {
          return null;
        }
        return normalize ? match.normalizedValue : match.value;
      })
    : null;

  const series = [
    {
      data: mainData,
      label: selectedMeta?.sub_category || "Selected Series",
      showMark: false,
      curve: "linear",
      color: "#0f766e",
    },
  ];

  if (compareData && compareMeta) {
    series.push({
      data: compareData,
      label: compareMeta.sub_category,
      showMark: false,
      curve: "linear",
      color: "#b45309",
    });
  }

  const stat = selectedMeta?.summary_statistics || {};

  // Build a Set of indices to show as ticks: always include first and last,
  // then fill up to MAX_X_TICKS - 2 equally-spaced indices between them.
  const MAX_X_TICKS = 7;
  const n = xData.length;
  const shownTickIndices = (() => {
    if (n <= MAX_X_TICKS) {
      return new Set(Array.from({ length: n }, (_, i) => i));
    }
    const inner = MAX_X_TICKS - 2; // slots between first and last
    const indices = new Set([0, n - 1]);
    for (let i = 1; i <= inner; i++) {
      indices.add(Math.round((i * (n - 1)) / (inner + 1)));
    }
    return indices;
  })();
  const tickInterval = (_value, index) => shownTickIndices.has(index);

  // Compute left margin wide enough to fit the longest Y-axis label.
  // Each character is ~8px wide; add 20px padding.
  const allValues = [...mainData, ...(compareData || [])].filter(
    (v) => v !== null && Number.isFinite(v),
  );
  const maxAbsValue = allValues.reduce(
    (max, v) => Math.max(max, Math.abs(v)),
    0,
  );
  const longestLabel = new Intl.NumberFormat().format(maxAbsValue);
  const dynamicLeft = Math.max(64, longestLabel.length * 8 + 20);

  const sharedChartProps = {
    height: 380,
    series,
    margin: { left: dynamicLeft, right: 24, top: 20, bottom: 64 },
    yAxis: [{ width: dynamicLeft }],
  };

  return (
    <section className="panel chart-panel">
      <div className="panel-head-row">
        <div>
          <h2>Visualization</h2>
          <p className="panel-subtitle">
            {selectedMeta
              ? selectedMeta.sub_category
              : "Pick a dataset from the left panel."}
          </p>
        </div>

        <div className="chart-controls">
          <select
            className="select-input compact"
            value={chartType}
            onChange={(event) => onChartTypeChange(event.target.value)}
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
          </select>

          <select
            className="select-input compact"
            value={timeWindow}
            onChange={(event) => onTimeWindowChange(event.target.value)}
          >
            <option value="all">All</option>
            <option value="25">25Y</option>
            <option value="10">10Y</option>
            <option value="5">5Y</option>
            <option value="1">1Y</option>
          </select>

          <select
            className="select-input compact"
            value={movingWindow}
            onChange={(event) => onMovingWindowChange(event.target.value)}
          >
            {MOVING_WINDOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={normalize}
              onChange={(event) => onNormalizeChange(event.target.checked)}
            />
            Normalize
          </label>

          {mainSeries.length > 0 && (
            <button
              type="button"
              className="icon-btn"
              onClick={downloadChart}
              title="Download chart as PNG"
            >
              ↓ PNG
            </button>
          )}
        </div>
      </div>

      <div className="chart-wrap" ref={chartWrapRef}>
        {mainSeries.length === 0 ? (
          <div className="empty-state">
            No chart points available for this dataset.
          </div>
        ) : chartType === "bar" ? (
          <BarChart
            {...sharedChartProps}
            xAxis={[{ data: xData, scaleType: "band", tickInterval }]}
          />
        ) : (
          <LineChart
            {...sharedChartProps}
            xAxis={[{ data: xData, scaleType: "point", tickInterval }]}
          />
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
