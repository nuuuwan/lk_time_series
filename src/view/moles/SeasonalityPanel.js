import React from "react";
import {
  ScatterChart,
  ChartsReferenceLine,
  useXScale,
  useYScale,
} from "@mui/x-charts";
import { Chip } from "@mui/material";
import { getSeasonalityData } from "../../nonview/core/timeSeriesUtils";

const CONFIDENCE_COLOR = {
  high: "success",
  medium: "warning",
  low: "warning",
  none: "error",
};

const CONFIDENCE_LABEL = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  none: "No confidence",
};

function ErrorBars({ pctDeviations, stdDevs }) {
  const xScale = useXScale();
  const yScale = useYScale();
  return (
    <g>
      {pctDeviations.map((mean, i) => {
        const std = stdDevs[i];
        const cx = xScale(i);
        const y1 = yScale(mean + std);
        const y2 = yScale(mean - std);
        if (cx == null || y1 == null || y2 == null) return null;
        const tw = 5;
        return (
          <g
            key={i}
            stroke="#0f766e"
            strokeWidth={1.5}
            opacity={0.75}
            fill="none"
          >
            <line x1={cx} y1={y1} x2={cx} y2={y2} />
            <line x1={cx - tw} y1={y1} x2={cx + tw} y2={y1} />
            <line x1={cx - tw} y1={y2} x2={cx + tw} y2={y2} />
          </g>
        );
      })}
    </g>
  );
}

function SeasonalityPanel({ mainSeries }) {
  const data = getSeasonalityData(mainSeries);

  if (!data) return null;

  const {
    periodLabel,
    labels,
    count,
    allPoints,
    pctDeviations,
    stdDevs,
    peakLabel,
    peakPct,
    troughLabel,
    troughPct,
    hasPattern,
    confidence,
  } = data;

  const meanPoints = pctDeviations.map((y, i) => ({
    id: `mean-${i}`,
    x: i,
    y,
  }));

  const series = [
    {
      id: "seasonality",
      data: allPoints,
      valueFormatter: ({ x, y }) =>
        `${labels[x] ?? x}: ${y.toFixed(1)}% vs mean`,
      color: "rgba(15, 118, 110, 0.12)",
      markerSize: 5,
    },
    {
      id: "means",
      data: meanPoints,
      valueFormatter: ({ x, y }) =>
        `${labels[x] ?? x} mean: ${y.toFixed(1)}% (±${stdDevs[x]?.toFixed(1)}%)`,
      color: "#0f766e",
      markerSize: 8,
    },
  ];

  return (
    <section className="panel seasonality-panel">
      <div className="panel-subtitle-row">
        <p className="panel-subtitle">{periodLabel} Seasonality</p>
        <Chip
          label={CONFIDENCE_LABEL[confidence]}
          color={CONFIDENCE_COLOR[confidence]}
          size="small"
        />
      </div>
      {(confidence === "low" || confidence === "none") && (
        <p className="seasonality-confidence-note">
          {confidence === "none"
            ? "No reliable seasonal pattern — high variability across years."
            : "Weak seasonal pattern — significant year-to-year variability."}
        </p>
      )}
      <ScatterChart
        height={220}
        series={series}
        xAxis={[
          {
            min: -0.5,
            max: count - 0.5,
            tickInterval: labels.map((_, i) => i),
            valueFormatter: (v) => labels[Math.round(v)] ?? "",
          },
        ]}
        yAxis={[{ label: "% vs mean" }]}
        margin={{ left: 52, right: 16, top: 12, bottom: 36 }}
        hideLegend
        sx={{
          "& text": { fontFamily: '"Lato", system-ui, sans-serif' },
          "& tspan": { fontFamily: '"Lato", system-ui, sans-serif' },
        }}
      >
        <ChartsReferenceLine
          y={0}
          lineStyle={{ stroke: "#94a3b8", strokeWidth: 1 }}
        />
        <ErrorBars pctDeviations={pctDeviations} stdDevs={stdDevs} />
      </ScatterChart>
      <ul className="insight-list">
        {hasPattern ? (
          <>
            <li>
              Peak: <strong>{peakLabel}</strong> — +{peakPct.toFixed(1)}% above
              mean
            </li>
            <li>
              Trough: <strong>{troughLabel}</strong> — {troughPct.toFixed(1)}%
              below mean
            </li>
          </>
        ) : (
          <li>No significant seasonal pattern detected.</li>
        )}
      </ul>
    </section>
  );
}

export default SeasonalityPanel;
