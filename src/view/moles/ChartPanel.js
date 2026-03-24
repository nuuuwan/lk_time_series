import React, { useId, useRef, useState, useEffect } from "react";
import { LineChart } from "@mui/x-charts";
import { Slider, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DataObjectIcon from "@mui/icons-material/DataObject";
import GridOnIcon from "@mui/icons-material/GridOn";
import TableRowsIcon from "@mui/icons-material/TableRows";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { toPng } from "html-to-image";
import { buildDatasetRawUrl } from "../../nonview/core/datasetApi";
import {
  formatNumber,
  formatDateByFrequency,
  splitDatasetName,
} from "../../nonview/core/timeSeriesUtils";

const MOVING_WINDOW_OPTIONS = [
  { value: "365", label: "Year avg", minYears: 2 },
  { value: "3650", label: "Decade avg", minYears: 12 },
];

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

  function downloadDelimited(series, meta, sep, ext) {
    const header = `date${sep}value`;
    const rows = series
      .filter((p) => Number.isFinite(p.timeMs))
      .map((p) => {
        const date = new Date(p.timeMs).toISOString().slice(0, 10);
        return `${date}${sep}${p.value ?? ""}`;
      });
    const content = [header, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = (meta.sub_category || "data").replace(/[^a-z0-9]/gi, "_");
    a.download = `${name}.${ext}`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
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

  const availableMovingWindows = MOVING_WINDOW_OPTIONS.filter(
    (opt) => dataSpanYears >= opt.minYears,
  );

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
      area: datasets.length === 1,
      showMark: ({ isHighlighted }) => isHighlighted,
      curve: "linear",
      connectNulls: true,
      valueFormatter: (v) =>
        v !== null ? `${formatNumber(v)}${rawUnit ? " " + rawUnit : ""}` : "",
    };
  });

  const n = allDates.length;

  // One SVG gradient def per series for the area fill
  const gradientId = useId();
  const gradientDefs = (
    <defs>
      {seriesList.map((s, i) => (
        <linearGradient
          key={s.id}
          id={`${gradientId}-grad-${i}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </defs>
  );

  if (datasets.length === 0) {
    return (
      <section className="panel chart-panel chart-panel-empty" ref={panelRef}>
        <p className="chart-empty-prompt">Pick a dataset from the left panel.</p>
      </section>
    );
  }

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

  const sharedProps = {
    height: 360,
    series: seriesList,
    grid: {}, // gridlines handled via sx
    margin: { left: dynamicLeft, right: 48, top: 12, bottom: 72 },
    yAxis: [
      {
        width: dynamicLeft,
        valueFormatter: (v) => formatNumber(v),
      },
    ],
    sx: {
      /* Line: thicker, smooth joins */
      "& .MuiLineElement-root": {
        strokeWidth: 3,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      },
      /* Area fill: use the per-series gradient */
      ...Object.fromEntries(
        seriesList.map((s, i) => [
          `& .MuiAreaElement-series-ds-${i}`,
          { fill: `url(#${gradientId}-grad-${i})` },
        ]),
      ),
      /* Remove all gridlines */
      "& .MuiChartsGrid-horizontalLine": { display: "none" },
      "& .MuiChartsGrid-verticalLine": { display: "none" },
      /* Axis lines very faint, ticks off */
      "& .MuiChartsAxis-line": { stroke: "#e2e5e8", strokeWidth: 1 },
      "& .MuiChartsAxis-tick": { display: "none" },
      /* Hover marker: solid filled dot with white ring */
      "& .MuiMarkElement-root": {
        r: 4,
        strokeWidth: 2,
        stroke: "#ffffff",
      },
      "& text": {
        fontFamily: '"Lato", system-ui, sans-serif',
        fill: "#6b7280",
      },
      "& tspan": { fontFamily: '"Lato", system-ui, sans-serif' },
    },
    hideLegend: true,
  };

  const chartHeader = (() => {
    if (datasets.length === 0) {
      return { title: "Pick a dataset from the left panel.", breadcrumb: "" };
    }
    if (datasets.length === 1) {
      return splitDatasetName(datasets[0].meta?.sub_category);
    }
    // Multiple datasets: show all metric names, shared breadcrumb if identical
    const splits = datasets.map((d) => splitDatasetName(d.meta?.sub_category));
    const title = splits.map((s) => s.metric).join(" · ");
    const firstCrumb = splits[0].breadcrumb;
    const breadcrumb = splits.every((s) => s.breadcrumb === firstCrumb)
      ? firstCrumb
      : splits
          .map((s) => s.breadcrumb)
          .filter(Boolean)
          .join(" / ");
    return { title, breadcrumb };
  })();

  return (
    <section className="panel chart-panel" ref={panelRef}>
      <div className="panel-head-row">
        <div className="chart-title-block">
          <h2 className="chart-title">{chartHeader.title}</h2>
          {chartHeader.breadcrumb && (
            <p className="chart-breadcrumb">{chartHeader.breadcrumb}</p>
          )}
        </div>
      </div>
      <div className="chart-toolbar">
        {/* Moving average selector */}
        <select
          className="avg-select"
          value={movingWindow}
          onChange={(e) => onMovingWindowChange(e.target.value)}
          title="Smoothing"
        >
          <option value="none">No avg</option>
          {availableMovingWindows.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Data downloads */}
        {hasData && primaryMeta && (
          <>
            <div className="toolbar-sep" />
            <Tooltip title="Raw data (JSON)" placement="bottom" arrow>
              <IconButton
                size="small"
                className="toolbar-icon-btn"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = buildDatasetRawUrl(primaryMeta);
                  a.target = "_blank";
                  a.rel = "noreferrer";
                  a.click();
                }}
                aria-label="Download raw data as JSON"
              >
                <DataObjectIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as CSV" placement="bottom" arrow>
              <IconButton
                size="small"
                className="toolbar-icon-btn"
                onClick={() =>
                  downloadDelimited(primarySeries, primaryMeta, ",", "csv")
                }
                aria-label="Download as CSV"
              >
                <GridOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as TSV" placement="bottom" arrow>
              <IconButton
                size="small"
                className="toolbar-icon-btn"
                onClick={() =>
                  downloadDelimited(primarySeries, primaryMeta, "\t", "tsv")
                }
                aria-label="Download as TSV"
              >
                <TableRowsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* Chart PNG */}
        {hasData && (
          <>
            <div className="toolbar-sep" />
            <Tooltip title="Download chart as PNG" placement="bottom" arrow>
              <IconButton
                size="small"
                className="toolbar-icon-btn"
                onClick={downloadChart}
                aria-label="Download chart as PNG"
              >
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* Close */}
        {onClose && (
          <>
            <div className="toolbar-sep" />
            <Tooltip title="Close" placement="bottom" arrow>
              <IconButton
                size="small"
                className="toolbar-icon-btn"
                onClick={onClose}
                aria-label="Close chart"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
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
          >
            {gradientDefs}
          </LineChart>
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
          {seriesList.map((s) => (
            <span key={s.id} className="chart-legend-item">
              <span
                className="chart-legend-swatch"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export default ChartPanel;
