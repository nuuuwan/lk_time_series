import React, { useRef, useState, useEffect } from "react";
import { LineChart, ChartsReferenceLine } from "@mui/x-charts";
import { Slider } from "@mui/material";
import { toPng } from "html-to-image";
import ChartControls from "../atoms/ChartControls";
import {
  formatNumber,
  formatDateByFrequency,
} from "../../nonview/core/timeSeriesUtils";
import { forecastLinear } from "../../nonview/core/forecastSeries";

function parseYear(t) {
  const m = String(t || "").match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

function ChartPanel({
  selectedMeta,
  mainSeries,
  rawSeries,
  timeWindow,
  onTimeWindowChange,
  movingWindow,
  onMovingWindowChange,
}) {
  const panelRef = useRef(null);

  function downloadChart() {
    const node = panelRef.current;
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
  const timeMsValues = mainSeries.map((p) => p.timeMs).filter(Number.isFinite);
  const dataSpanYears =
    timeMsValues.length >= 2
      ? (Math.max(...timeMsValues) - Math.min(...timeMsValues)) /
        (365.25 * 24 * 3600 * 1000)
      : 0;

  // Full dataset range for slider (from metadata, not windowed series)
  const now = new Date().getFullYear();
  const fullMinYear =
    parseYear(selectedMeta?.summary_statistics?.min_t) ?? now - 10;
  const fullMaxYear = parseYear(selectedMeta?.summary_statistics?.max_t) ?? now;

  // Derive committed slider value from timeWindow prop
  const committedSlider = Array.isArray(timeWindow)
    ? [
        new Date(timeWindow[0]).getUTCFullYear(),
        new Date(timeWindow[1]).getUTCFullYear(),
      ]
    : timeWindow === "all" || !timeWindow
      ? [fullMinYear, fullMaxYear]
      : [Math.max(fullMinYear, fullMaxYear - Number(timeWindow)), fullMaxYear];

  const [localSlider, setLocalSlider] = useState(committedSlider);

  // Sync slider when dataset changes (timeWindow resets externally)
  useEffect(() => {
    setLocalSlider(committedSlider);
  }, [timeWindow, fullMinYear, fullMaxYear]); // eslint-disable-line

  const yearSpan = fullMaxYear - fullMinYear;
  const markStep =
    yearSpan > 30 ? 10 : yearSpan > 15 ? 5 : yearSpan > 7 ? 2 : 1;
  const sliderMarks = [];
  const firstMark = Math.ceil(fullMinYear / markStep) * markStep;
  for (let y = firstMark; y <= fullMaxYear; y += markStep) {
    sliderMarks.push({ value: y, label: String(y) });
  }

  const handleRangeCommit = (_, [startYear, endYear]) => {
    if (startYear <= fullMinYear && endYear >= fullMaxYear) {
      onTimeWindowChange("all");
    } else {
      onTimeWindowChange([
        new Date(startYear, 0, 1).getTime(),
        new Date(endYear, 11, 31, 23, 59, 59, 999).getTime(),
      ]);
    }
  };
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

  // Forecast
  const forecastSteps = Math.max(
    5,
    Math.min(20, Math.round(mainSeries.length * 0.1)),
  );
  const forecastPoints =
    mainSeries.length >= 2 ? forecastLinear(mainSeries, forecastSteps) : [];
  const hasForecast = forecastPoints.length > 0;
  const forecastXData = forecastPoints.map((p) =>
    new Date(p.timeMs).toISOString().slice(0, 10),
  );
  const forecastValues = forecastPoints.map((p) => p.value);
  const lastActualValue = mainData.length
    ? mainData[mainData.length - 1]
    : null;
  const fullXData = hasForecast ? [...xData, ...forecastXData] : xData;

  // Scale factor to reduce trailing zeros on Y axis
  const allValues = mainData.filter((v) => v !== null && Number.isFinite(v));
  const maxAbsValue = allValues.reduce(
    (max, v) => Math.max(max, Math.abs(v)),
    0,
  );
  let scaleFactor = 1;
  let scalePrefix = "";
  if (maxAbsValue >= 1e9) {
    scaleFactor = 1e9;
    scalePrefix = "Billions";
  } else if (maxAbsValue >= 1e6) {
    scaleFactor = 1e6;
    scalePrefix = "Millions";
  } else if (maxAbsValue >= 1e4) {
    scaleFactor = 1e3;
    scalePrefix = "Thousands";
  }
  const rawUnit = selectedMeta?.unit || "";
  const unitScale =
    rawUnit && scalePrefix
      ? `${rawUnit} (${scalePrefix})`
      : rawUnit || scalePrefix || "";
  const yAxisLabel = unitScale
    ? `${datasetName} [${unitScale}]`
    : datasetName || undefined;
  const xAxisLabel = selectedMeta?.frequency_name || undefined;
  const xTickFormatter = (v) =>
    formatDateByFrequency(v, selectedMeta?.frequency_name);
  const scale = (v) => (v !== null && Number.isFinite(v) ? v / scaleFactor : v);

  const scaledMainData = mainData.map(scale);
  const scaledRawData = rawData ? rawData.map(scale) : null;
  const scaledForecastValues = forecastValues.map(scale);
  const scaledLastActualValue = scale(lastActualValue);

  const scaledPad = hasForecast ? Array(forecastSteps).fill(null) : [];
  const scaledHistPad = hasForecast
    ? [...Array(xData.length - 1).fill(null), scaledLastActualValue]
    : [];

  const scaledMaxAbs = allValues.reduce(
    (max, v) => Math.max(max, Math.abs(v / scaleFactor)),
    0,
  );
  const dynamicLeft = Math.max(
    64,
    new Intl.NumberFormat().format(scaledMaxAbs).length * 8 + 20,
  );

  const finiteMain = mainData.filter((v) => v !== null && Number.isFinite(v));
  const maxVal = finiteMain.length ? Math.max(...finiteMain) : null;
  const minVal = finiteMain.length ? Math.min(...finiteMain) : null;
  const scaledMaxVal = scale(maxVal);
  const scaledMinVal = scale(minVal);
  const maxDate = maxVal !== null ? xData[mainData.indexOf(maxVal)] : null;
  const minDate = minVal !== null ? xData[mainData.indexOf(minVal)] : null;

  const series = [
    ...(isSmoothed && scaledRawData
      ? [
          {
            id: "raw",
            data: [...scaledRawData, ...scaledPad],
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
      data: [...scaledMainData, ...scaledPad],
      label: isSmoothed ? smoothLabel : datasetName,
      showMark: true,
      curve: "linear",
      color: isSmoothed ? "#e07b39" : "#0f766e",
      valueFormatter: (v) =>
        v !== null ? `${formatNumber(v)}${rawUnit ? " " + rawUnit : ""}` : "",
    },
    ...(hasForecast
      ? [
          {
            id: "forecast",
            data: [...scaledHistPad, ...scaledForecastValues],
            label: "Forecast",
            showMark: false,
            curve: "linear",
            color: "#94a3b8",
            valueFormatter: (v) =>
              v !== null
                ? `${formatNumber(v)}${rawUnit ? " " + rawUnit : ""} ★`
                : "",
          },
        ]
      : []),
  ];

  const n = fullXData.length;
  const shownTickIndices = (() => {
    if (n <= 7) return new Set(Array.from({ length: n }, (_, i) => i));
    const inner = 5;
    const indices = new Set([0, n - 1]);
    for (let i = 1; i <= inner; i++)
      indices.add(Math.round((i * (n - 1)) / (inner + 1)));
    return indices;
  })();
  const tickInterval = (_v, index) => shownTickIndices.has(index);
  const lineColor = isSmoothed ? "#e07b39" : "#0f766e";

  const smoothSx = {
    ...(isSmoothed
      ? {
          "& .MuiLineElement-series-raw": {
            strokeDasharray: "4 3",
            strokeOpacity: 0.4,
          },
        }
      : {}),
    ...(hasForecast
      ? {
          "& .MuiLineElement-series-forecast": {
            strokeDasharray: "6 4",
          },
        }
      : {}),
  };

  const sharedProps = {
    height: 360,
    series,
    margin: { left: dynamicLeft, right: 48, top: 12, bottom: 72 },
    yAxis: [
      {
        width: dynamicLeft,
        label: yAxisLabel,
        valueFormatter: (v) => formatNumber(v),
      },
    ],
    sx: {
      ...smoothSx,
      "& text": { fontFamily: '"Lato", system-ui, sans-serif' },
      "& tspan": { fontFamily: '"Lato", system-ui, sans-serif' },
    },
    hideLegend: true,
  };

  return (
    <section className="panel chart-panel" ref={panelRef}>
      <div className="panel-head-row">
        <p className="panel-subtitle">
          {selectedMeta
            ? selectedMeta.sub_category
            : "Pick a dataset from the left panel."}
        </p>
        <ChartControls
          movingWindow={movingWindow}
          onMovingWindowChange={onMovingWindowChange}
          onDownload={downloadChart}
          hasData={mainSeries.length > 0}
          dataSpanYears={dataSpanYears}
        />
      </div>
      <div className="chart-wrap">
        {mainSeries.length === 0 ? (
          <div className="empty-state">
            No chart points available for this dataset.
          </div>
        ) : (
          <LineChart
            {...sharedProps}
            xAxis={[
              {
                data: fullXData,
                scaleType: "point",
                tickInterval,
                label: xAxisLabel,
                valueFormatter: xTickFormatter,
              },
            ]}
          >
            {scaledMaxVal !== null && (
              <ChartsReferenceLine
                y={scaledMaxVal}
                label={`Max: ${formatNumber(scaledMaxVal)}${rawUnit ? " " + rawUnit : ""} (${maxDate})`}
                lineStyle={{ stroke: lineColor, strokeDasharray: "4 3" }}
                labelStyle={{ fill: lineColor, fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
            {scaledMinVal !== null && (
              <ChartsReferenceLine
                y={scaledMinVal}
                label={`Min: ${formatNumber(scaledMinVal)}${rawUnit ? " " + rawUnit : ""} (${minDate})`}
                lineStyle={{ stroke: lineColor, strokeDasharray: "4 3" }}
                labelStyle={{ fill: lineColor, fontSize: 11, fontWeight: 600 }}
                labelAlign="end"
              />
            )}
          </LineChart>
        )}
      </div>
      {mainSeries.length > 0 && fullMinYear < fullMaxYear && (
        <div
          className="chart-range-slider"
          style={{ paddingLeft: dynamicLeft, paddingRight: 48 }}
        >
          <Slider
            value={localSlider}
            min={fullMinYear}
            max={fullMaxYear}
            step={1}
            marks={sliderMarks}
            onChange={(_, v) => setLocalSlider(v)}
            onChangeCommitted={handleRangeCommit}
            valueLabelDisplay="auto"
            disableSwap
            size="small"
            sx={{
              color: "#0f766e",
              "& .MuiSlider-markLabel": {
                fontSize: "0.68rem",
                fontFamily: '"Lato", system-ui, sans-serif',
              },
              "& .MuiSlider-valueLabel": {
                fontSize: "0.7rem",
                fontFamily: '"Lato", system-ui, sans-serif',
              },
            }}
          />
        </div>
      )}
      <div className="chart-legend">
        {isSmoothed ? (
          <>
            <span className="chart-legend-item" style={{ opacity: 0.5 }}>
              <svg width="36" height="10">
                <line
                  x1="0"
                  y1="5"
                  x2="36"
                  y2="5"
                  stroke="#0f766e"
                  strokeWidth="2"
                  style={{ strokeDasharray: "6 4" }}
                />
              </svg>
              {datasetName}
            </span>
            <span className="chart-legend-item">
              <svg width="36" height="10">
                <line
                  x1="0"
                  y1="5"
                  x2="36"
                  y2="5"
                  stroke="#e07b39"
                  strokeWidth="2"
                />
              </svg>
              {smoothLabel}
            </span>
          </>
        ) : (
          <span className="chart-legend-item">
            <svg width="36" height="10">
              <line
                x1="0"
                y1="5"
                x2="36"
                y2="5"
                stroke="#0f766e"
                strokeWidth="2"
              />
            </svg>
            {datasetName}
          </span>
        )}
        {hasForecast && (
          <span className="chart-legend-item" style={{ opacity: 0.7 }}>
            <svg width="36" height="10">
              <line
                x1="0"
                y1="5"
                x2="36"
                y2="5"
                stroke="#94a3b8"
                strokeWidth="2"
                style={{ strokeDasharray: "6 4" }}
              />
            </svg>
            Forecast
          </span>
        )}
      </div>
    </section>
  );
}

export default ChartPanel;
