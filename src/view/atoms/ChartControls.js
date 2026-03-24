import React from "react";

const MOVING_WINDOW_OPTIONS = [
  { value: "365", label: "Year avg", minYears: 2 },
  { value: "3650", label: "Decade avg", minYears: 12 },
];

function ChartControls({
  movingWindow,
  onMovingWindowChange,
  onDownload,
  hasData,
  dataSpanYears,
}) {
  const availableMovingWindows = MOVING_WINDOW_OPTIONS.filter(
    (opt) => dataSpanYears >= opt.minYears,
  );

  return (
    <div className="chart-controls">
      <select
        className="select-input compact"
        value={movingWindow}
        onChange={(e) => onMovingWindowChange(e.target.value)}
      >
        <option value="none">No avg</option>
        {availableMovingWindows.map((opt) => (
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
