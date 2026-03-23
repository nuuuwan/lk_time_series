import React, { useRef } from "react";
import { BarChart, LineChart } from "@mui/x-charts";
import { toPng } from "html-to-image";
import StatChip from "../atoms/StatChip";
import ChartControls from "../atoms/ChartControls";
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
  movingWindow,
  onMovingWindowChange,
}) {
  const chartWrapRef = useRef(null);

  function downloadChart() {
    const node = chartWrapRef.current;
    if (!node) return;
    const label = selectedMeta?.sub_category || "chart";
    const filename = label.replace(/[^a-z0-9]/gi, "_") + ".png";
    toPng(node, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      skipFonts: true,
    }).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    });
  }

  const xData = mainSeries.map((point, i) =>
    Number.isFinite(point.timeMs)
      ? new Date(point.timeMs).toISOString().slice(0, 10)
      : point.t || "Point " + (i + 1),
  );
  const mainData = mainSeries.map((p) => p.value);
  const compareData = compareSeries
    ? mainSeries.map((p) => {
        const m = compareSeries.find((c) => c.t === p.t);
        return m ? m.value : null;
      })
    : null;

  const isArea = chartType === "area";
  const series = [
    {
      data: mainData,
      label: selectedMeta?.sub_category || "Selected Series",
      showMark: false,
      curve: "linear",
      color: "#0f766e",
      ...(isArea ? { area: true } : {}),
    },
  ];
  if (compareData && compareMeta) {
    series.push({
      data: compareData,
      label: compareMeta.sub_category,
      showMark: false,
      curve: "linear",
      color: "#b45309",
      ...(isArea ? { area: true } : {}),
    });
  }

  const stat = selectedMeta?.summary_statistics || {};
  const n = xData.length;
  const shownTickIndices = (() => {
    if (n <= 7) return new Set(Array.from({ length: n }, (_, i) => i));
    const inner = 5;
    const indices = new Set([0, n - 1]);
    for (let i = 1; i <= inner; i++)
      indices.add(Math.round((i * (n - 1)) / (inner + 1)));
    return indices;
  })();
  const tickInterval = (_v, index) => shownTickIndices.has(index);
  const allValues = [...mainData, ...(compareData || [])].filter(
    (v) => v !== null && Number.isFinite(v),
  );
  const maxAbsValue = allValues.reduce(
    (max, v) => Math.max(max, Math.abs(v)),
    0,
  );
  const dynamicLeft = Math.max(
    64,
    new Intl.NumberFormat().format(maxAbsValue).length * 8 + 20,
  );
  const sharedProps = {
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
        <ChartControls
          chartType={chartType}
          onChartTypeChange={onChartTypeChange}
          timeWindow={timeWindow}
          onTimeWindowChange={onTimeWindowChange}
          movingWindow={movingWindow}
          onMovingWindowChange={onMovingWindowChange}
          onDownload={downloadChart}
          hasData={mainSeries.length > 0}
        />
      </div>
      <div className="chart-wrap" ref={chartWrapRef}>
        {mainSeries.length === 0 ? (
          <div className="empty-state">
            No chart points available for this dataset.
          </div>
        ) : chartType === "bar" ? (
          <BarChart
            {...sharedProps}
            xAxis={[{ data: xData, scaleType: "band", tickInterval }]}
          />
        ) : (
          <LineChart
            {...sharedProps}
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
