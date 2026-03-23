import React, { useRef } from "react";
import { BarChart, LineChart, ChartsReferenceLine } from "@mui/x-charts";
import { toPng } from "html-to-image";
import ChartControls from "../atoms/ChartControls";
import { formatNumber } from "../../nonview/core/timeSeriesUtils";

function ChartPanel({
  selectedMeta,
  mainSeries,
  rawSeries,
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
  const isSmoothed =
    rawSeries &&
    rawSeries.length > 0 &&
    movingWindow &&
    movingWindow !== "none";
  const rawData = isSmoothed ? rawSeries.map((p) => p.value) : null;
  const datasetName = selectedMeta?.sub_category || "Selected Series";
  const WINDOW_LABELS = {
    7: "7-day avg",
    30: "30-day avg",
    91: "91-day avg",
    365: "1-year avg",
    3650: "10-year avg",
  };
  const smoothLabel = WINDOW_LABELS[movingWindow] || `${movingWindow}-day avg`;

  const isArea = chartType === "area";
  const series = [
    ...(isSmoothed && rawData
      ? [
          {
            id: "raw",
            data: rawData,
            label: datasetName,
            showMark: false,
            curve: "linear",
            color: "#0f766e",
            valueFormatter: () => "",
          },
        ]
      : []),
    {
      id: "main",
      data: mainData,
      label: isSmoothed ? smoothLabel : datasetName,
      showMark: false,
      curve: "linear",
      color: isSmoothed ? "#e07b39" : "#0f766e",
      ...(isArea && !isSmoothed ? { area: true } : {}),
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
  const lineColor = isSmoothed ? "#e07b39" : "#0f766e";

  const smoothSx = isSmoothed
    ? {
        "& .MuiLineElement-series-raw": {
          strokeDasharray: "4 3",
          strokeOpacity: 0.4,
        },
      }
    : {};

  const sharedProps = {
    height: 360,
    series,
    margin: { left: dynamicLeft, right: 24, top: 12, bottom: 64 },
    yAxis: [{ width: dynamicLeft }],
    sx: smoothSx,
    slotProps: { legend: { hidden: true } },
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
                lineStyle={{ stroke: lineColor, strokeDasharray: "4 3" }}
                labelStyle={{ fill: lineColor, fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
            {minVal !== null && (
              <ChartsReferenceLine
                y={minVal}
                label={`Min: ${formatNumber(minVal)}`}
                lineStyle={{ stroke: lineColor, strokeDasharray: "4 3" }}
                labelStyle={{ fill: lineColor, fontSize: 11, fontWeight: 600 }}
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
                lineStyle={{ stroke: lineColor, strokeDasharray: "4 3" }}
                labelStyle={{ fill: lineColor, fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
            {minVal !== null && (
              <ChartsReferenceLine
                y={minVal}
                label={`Min: ${formatNumber(minVal)}`}
                lineStyle={{ stroke: lineColor, strokeDasharray: "4 3" }}
                labelStyle={{ fill: lineColor, fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
          </LineChart>
        )}
      </div>
      <div className="chart-legend">
        {isSmoothed ? (
          <>
            <span className="chart-legend-item" style={{ opacity: 0.5 }}>
              <svg width="36" height="10">
                <line
                  x1="0" y1="5" x2="36" y2="5"
                  stroke="#0f766e" strokeWidth="2"
                  style={{ strokeDasharray: "6 4" }}
                />
              </svg>
              {datasetName}
            </span>
            <span className="chart-legend-item">
              <svg width="36" height="10">
                <line x1="0" y1="5" x2="36" y2="5" stroke="#e07b39" strokeWidth="2" />
              </svg>
              {smoothLabel}
            </span>
          </>
        ) : (
          <span className="chart-legend-item">
            <svg width="36" height="10">
              <line x1="0" y1="5" x2="36" y2="5" stroke="#0f766e" strokeWidth="2" />
            </svg>
            {datasetName}
          </span>
        )}
      </div>
    </section>
  );
}

export default ChartPanel;
