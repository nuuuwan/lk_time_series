import React from "react";

const MOVING_WINDOW_OPTIONS = [
  { value: "365", label: "Year" },
  { value: "3650", label: "Decade" },
];

function ChartControls({
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
        <option value="none">No rolling window</option>
        {MOVING_WINDOW_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasData && (
        <button
          type="button"
          className="icon-btn"
          onClick={onDownload}
          title="Download chart as PNG"
        >
          ↓ PNG
        </button>
      )}
    </div>
  );
}

export default ChartControls;
