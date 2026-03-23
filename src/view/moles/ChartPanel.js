import React from "react";
import { BarChart, LineChart } from "@mui/x-charts";
import StatChip from "../atoms/StatChip";
import { formatDate, formatNumber } from "../../nonview/core/timeSeriesUtils";

function ChartPanel({
  selectedMeta,
  mainSeries,
  compareSeries,
  compareMeta,
  chartType,
  onChartTypeChange,
  timeWindow,
  onTimeWindowChange,
  normalize,
  onNormalizeChange,
}) {
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

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={normalize}
              onChange={(event) => onNormalizeChange(event.target.checked)}
            />
            Normalize
          </label>
        </div>
      </div>

      <div className="chart-wrap">
        {mainSeries.length === 0 ? (
          <div className="empty-state">
            No chart points available for this dataset.
          </div>
        ) : chartType === "bar" ? (
          <BarChart
            height={360}
            xAxis={[
              {
                data: xData,
                scaleType: "band",
              },
            ]}
            series={series}
            margin={{ left: 70, right: 20, top: 20, bottom: 60 }}
          />
        ) : (
          <LineChart
            height={360}
            xAxis={[
              {
                data: xData,
                scaleType: "point",
              },
            ]}
            series={series}
            margin={{ left: 70, right: 20, top: 20, bottom: 60 }}
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
