import React, { useRef, useState, useEffect } from "react";
import { LineChart } from "@mui/x-charts";
import { Slider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toPng } from "html-to-image";
import ChartControls from "../atoms/ChartControls";
import {
  formatNumber,
  formatDateByFrequency,
} from "../../nonview/core/timeSeriesUtils";

// Contrasting palette (colorblind-friendly)
const PALETTE = [
  "#0f766e", // teal
  "#c2410c", // orange-red
  "#1d4ed8", // blue
  "#7e22ce", // purple
  "#065f46", // dark green
  "#92400e", // amber-brown
  "#0c4a6e", // navy
  "#be123c", // rose
  "#3f6212", // olive
  "#6b21a8", // violet
];

function parseYear(t) {
  const m = String(t || "").match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

function ChartPanel({
  datasets = [],
  timeWindow,
  onTimeWindowChange,
  movingWindow,
  onMovingWindowChange,
  onClose,
}) {
  const panelRef = useRef(null);

  // Derive primary meta from first dataset
  const primaryMeta = datasets[0]?.meta ?? null;
  const primarySeries = datasets[0]?.mainSeries ?? [];

  function downloadChart() {
    const node = panelRef.current;
    if (!node) return;
    const label = primaryMeta?.sub_category || "chart";
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

  // Build a unified sorted x-axis (union of all date strings)
  const allDates = (() => {
    const set = new Set();
    datasets.forEach(({ mainSeries }) =>
      mainSeries.forEach((p) => {
        if (Number.isFinite(p.timeMs)) {
          set.add(new Date(p.timeMs).toISOString().slice(0, 10));
        }
      }),
    );
    return [...set].sort();
  })();

  const timeMsValues = primarySeries
    .map((p) => p.timeMs)
    .filter(Number.isFinite);
  const dataSpanYears =
    timeMsValues.length >= 2
      ? (Math.max(...timeMsValues) - Math.min(...timeMsValues)) /
        (365.25 * 24 * 3600 * 1000)
      : 0;

  // Slider: use primary dataset metadata
  const now = new Date().getFullYear();
  const fullMinYear =
    parseYear(primaryMeta?.summary_statistics?.min_t) ?? now - 10;
  const fullMaxYear = parseYear(primaryMeta?.summary_statistics?.max_t) ?? now;

  const committedSlider = Array.isArray(timeWindow)
    ? [
        new Date(timeWindow[0]).getUTCFullYear(),
        new Date(timeWindow[1]).getUTCFullYear(),
      ]
    : timeWindow === "all" || !timeWindow
      ? [fullMinYear, fullMaxYear]
      : [Math.max(fullMinYear, fullMaxYear - Number(timeWindow)), fullMaxYear];

  const [localSlider, setLocalSlider] = useState(committedSlider);

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

  // Build per-dataset scale factors independently so each normalises cleanly
  const seriesList = datasets.map(({ meta, mainSeries }, i) => {
    const color = PALETTE[i % PALETTE.length];
    const values = mainSeries
      .map((p) => p.value)
      .filter((v) => v !== null && Number.isFinite(v));
    const maxAbs = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

    let sf = 1;
    let prefix = "";
    if (maxAbs >= 1e9) {
      sf = 1e9;
      prefix = "B";
    } else if (maxAbs >= 1e6) {
      sf = 1e6;
      prefix = "M";
    } else if (maxAbs >= 1e4) {
      sf = 1e3;
      prefix = "K";
    }

    const scale = (v) => (v !== null && Number.isFinite(v) ? v / sf : v);
    const rawUnit = meta?.unit || "";
    const label = meta?.sub_category || `Series ${i + 1}`;
    const unitTag = prefix
      ? `${rawUnit ? rawUnit + " " : ""}(${prefix})`
      : rawUnit;
    const seriesLabel = unitTag ? `${label} [${unitTag}]` : label;

    // Map date → scaled value for quick lookup
    const dateMap = new Map(
      mainSeries
        .filter((p) => Number.isFinite(p.timeMs))
        .map((p) => [
          new Date(p.timeMs).toISOString().slice(0, 10),
          scale(p.value),
        ]),
    );
    const data = allDates.map((d) => dateMap.get(d) ?? null);

    return {
      id: `ds-${i}`,
      data,
      label: seriesLabel,
      color,
      showMark: true,
      curve: "linear",
      valueFormatter: (v) =>
        v !== null ? `${formatNumber(v)}${rawUnit ? " " + rawUnit : ""}` : "",
    };
  });

  const n = allDates.length;
  const markRadius = Math.max(0.5, Math.min(4, 120 / Math.max(n, 1)));

  const hasData = allDates.length > 0;

  // Y-axis label: single dataset shows full label, multiple shows "Multiple datasets"
  const yAxisLabel =
    datasets.length === 1
      ? (() => {
          const meta = datasets[0].meta;
          const values = datasets[0].mainSeries
            .map((p) => p.value)
            .filter((v) => v !== null && Number.isFinite(v));
          const maxAbs = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
          let prefix = "";
          if (maxAbs >= 1e9) prefix = "Billions";
          else if (maxAbs >= 1e6) prefix = "Millions";
          else if (maxAbs >= 1e4) prefix = "Thousands";
          const rawUnit = meta?.unit || "";
          const unitScale =
            rawUnit && prefix
              ? `${rawUnit} (${prefix})`
              : rawUnit || prefix || "";
          const name = meta?.sub_category || "";
          return unitScale ? `${name} [${unitScale}]` : name || undefined;
        })()
      : "Value";

  // Dynamically size left margin based on largest tick label
  const allScaledVals = seriesList.flatMap((s) =>
    s.data.filter((v) => v !== null && Number.isFinite(v)),
  );
  const maxScaled = allScaledVals.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const dynamicLeft = Math.max(
    64,
    new Intl.NumberFormat().format(maxScaled).length * 8 + 20,
  );

  const shownTickIndices = (() => {
    if (n <= 7) return new Set(Array.from({ length: n }, (_, i) => i));
    const inner = 5;
    const indices = new Set([0, n - 1]);
    for (let i = 1; i <= inner; i++)
      indices.add(Math.round((i * (n - 1)) / (inner + 1)));
    return indices;
  })();
  const tickInterval = (_v, index) => shownTickIndices.has(index);

  const xTickFormatter = (v) =>
    formatDateByFrequency(v, primaryMeta?.frequency_name);
  const xAxisLabel = primaryMeta?.frequency_name || undefined;

  const forecastSx = {};
  const sharedProps = {
    height: 360,
    series: seriesList,
    margin: { left: dynamicLeft, right: 48, top: 12, bottom: 72 },
    yAxis: [
      {
        width: dynamicLeft,
        valueFormatter: (v) => formatNumber(v),
      },
    ],
    sx: {
      ...forecastSx,
      "& text": { fontFamily: '"Lato", system-ui, sans-serif' },
      "& tspan": { fontFamily: '"Lato", system-ui, sans-serif' },
      "& .MuiMarkElement-root": { r: markRadius },
    },
    hideLegend: true,
  };

  const subtitleText =
    datasets.length === 0
      ? "Pick a dataset from the left panel."
      : datasets.map((d) => d.meta?.sub_category).join(" · ");

  return (
    <section className="panel chart-panel" ref={panelRef}>
      <div className="panel-head-row">
        <p className="panel-subtitle">{subtitleText}</p>
        <div className="panel-head-actions">
          <ChartControls
            movingWindow={movingWindow}
            onMovingWindowChange={onMovingWindowChange}
            onDownload={downloadChart}
            hasData={hasData}
            dataSpanYears={dataSpanYears}
          />
          {onClose && (
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close chart"
              className="chart-close-btn"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      </div>
      <div className="chart-wrap">
        {yAxisLabel && (
          <div className="chart-y-label" aria-hidden="true">
            {yAxisLabel}
          </div>
        )}
        {!hasData ? (
          <div className="empty-state">
            No chart points available for this dataset.
          </div>
        ) : (
          <LineChart
            {...sharedProps}
            xAxis={[
              {
                data: allDates,
                scaleType: "point",
                tickInterval,
                label: xAxisLabel,
                valueFormatter: xTickFormatter,
              },
            ]}
          />
        )}
      </div>
      {hasData && fullMinYear < fullMaxYear && (
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
      {hasData && (
        <div className="chart-legend">
          {seriesList.map((s, i) => (
            <span key={s.id} className="chart-legend-item">
              <svg width="36" height="10">
                <line
                  x1="0"
                  y1="5"
                  x2="36"
                  y2="5"
                  stroke={s.color}
                  strokeWidth="2"
                />
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export default ChartPanel;
