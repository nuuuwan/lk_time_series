import React from "react";
import { ScatterChart, ChartsReferenceLine } from "@mui/x-charts";
import { getSeasonalityData } from "../../nonview/core/timeSeriesUtils";

function SeasonalityPanel({ mainSeries }) {
  const data = getSeasonalityData(mainSeries);

  if (!data) return null;

  const {
    periodLabel,
    labels,
    count,
    allPoints,
    peakLabel,
    peakPct,
    troughLabel,
    troughPct,
  } = data;

  const series = [
    {
      id: "seasonality",
      data: allPoints,
      valueFormatter: ({ x, y }) =>
        `${labels[x] ?? x}: ${y.toFixed(1)}% vs mean`,
      color: "rgba(15, 118, 110, 0.1)",
      markerSize: 6,
    },
  ];

  return (
    <section className="panel seasonality-panel">
      <p className="panel-subtitle">{periodLabel} Seasonality</p>
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
        slotProps={{ legend: { hidden: true } }}
      >
        <ChartsReferenceLine
          y={0}
          lineStyle={{ stroke: "#94a3b8", strokeWidth: 1 }}
        />
      </ScatterChart>
      <ul className="insight-list">
        <li>
          Peak: <strong>{peakLabel}</strong> — +{peakPct.toFixed(1)}% above mean
        </li>
        <li>
          Trough: <strong>{troughLabel}</strong> — {troughPct.toFixed(1)}% below
          mean
        </li>
      </ul>
    </section>
  );
}

export default SeasonalityPanel;
