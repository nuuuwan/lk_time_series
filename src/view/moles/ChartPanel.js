import React, { useRef } from "react";
import { BarChart, LineChart, ChartsReferenceLine } from "@mui/x-charts";
import { toPng } from "html-to-image";
import StatChip from "../atoms/StatChip";
import ChartControls from "../atoms/ChartControls";
import { formatNumber } from "../../nonview/core/timeSeriesUtils";

function ChartPanel({
  selectedMeta,
  mainSeries,
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
  const allValues = mainData.filter((v) => v !== null && Number.isFinite(v));
  const maxAbsValue = allValues.reduce(
    (max, v) => Math.max(max, Math.abs(v)),
    0,
  );
  const dynamicLeft = Math.max(
    64,
    new Intl.NumberFormat().format(maxAbsValue).length * 8 + 20,
  );

  const finiteMain = mainData.filter((v) => v !== null && Number.isFinite(v));
  const maxVal = finiteMain.length ? Math.max(...finiteMain) : null;
  const minVal = finiteMain.length ? Math.min(...finiteMain) : null;
  const actualN = finiteMain.length;
  const actualMinDate = xData.length ? xData[0] : null;
  const actualMaxDate = xData.length ? xData[xData.length - 1] : null;

  const sharedProps = {
    height: 380,
    series,
    margin: { left: dynamicLeft, right: 24, top: 20, bottom: 64 },
    yAxis: [{ width: dynamicLeft }],
  };

  return (
    <section className="panel chart-panel">
      <div className="panel-head-row">
        <p className="panel-subtitle">
          {selectedMeta
            ? selectedMeta.sub_category
            : "Pick a dataset from the left panel."}
        </p>
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
          >
            {maxVal !== null && (
              <ChartsReferenceLine
                y={maxVal}
                label={`Max: ${formatNumber(maxVal)}`}
                lineStyle={{ stroke: "#0f766e", strokeDasharray: "4 3" }}
                labelStyle={{ fill: "#0f766e", fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
            {minVal !== null && (
              <ChartsReferenceLine
                y={minVal}
                label={`Min: ${formatNumber(minVal)}`}
                lineStyle={{ stroke: "#b45309", strokeDasharray: "4 3" }}
                labelStyle={{ fill: "#b45309", fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
          </BarChart>
        ) : (
          <LineChart
            {...sharedProps}
            xAxis={[{ data: xData, scaleType: "point", tickInterval }]}
          >
            {maxVal !== null && (
              <ChartsReferenceLine
                y={maxVal}
                label={`Max: ${formatNumber(maxVal)}`}
                lineStyle={{ stroke: "#0f766e", strokeDasharray: "4 3" }}
                labelStyle={{ fill: "#0f766e", fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
            {minVal !== null && (
              <ChartsReferenceLine
                y={minVal}
                label={`Min: ${formatNumber(minVal)}`}
                lineStyle={{ stroke: "#b45309", strokeDasharray: "4 3" }}
                labelStyle={{ fill: "#b45309", fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
          </LineChart>
        )}
      </div>
      <div className="stat-grid">
        <StatChip label="Points" value={formatNumber(actualN)} />
        <StatChip label="Min Date" value={actualMinDate} />
        <StatChip label="Max Date" value={actualMaxDate} />
        <StatChip label="Min Value" value={formatNumber(minVal)} />
        <StatChip label="Max Value" value={formatNumber(maxVal)} />
      </div>
    </section>
  );
}

export default ChartPanel;
