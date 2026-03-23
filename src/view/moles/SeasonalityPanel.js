import React from "react";
import { BarChart, ChartsReferenceLine } from "@mui/x-charts";
import { getSeasonalityData } from "../../nonview/core/timeSeriesUtils";

function SeasonalityPanel({ mainSeries }) {
  const data = getSeasonalityData(mainSeries);

  if (!data) return null;

  const {
    periodLabel,
    labels,
    pctDeviations,
    peakLabel,
    peakPct,
    troughLabel,
    troughPct,
  } = data;

  const series = [
    {
      id: "seasonality",
      data: pctDeviations,
      label: "% vs mean",
      valueFormatter: (v) => (v !== null ? v.toFixed(1) + "%" : ""),
      color: "#0f766e",
    },
  ];

  return (
    <section className="panel seasonality-panel">
      <p className="panel-subtitle">{periodLabel} Seasonality</p>
      <BarChart
        height={220}
        series={series}
        xAxis={[{ data: labels, scaleType: "band" }]}
        yAxis={[{ label: "% vs mean" }]}
        margin={{ left: 52, right: 16, top: 12, bottom: 36 }}
        slotProps={{ legend: { hidden: true } }}
        sx={{
          "& .MuiBarElement-series-seasonality": {
            fill: (d) => (d?.value >= 0 ? "#0f766e" : "#e07b39"),
          },
        }}
      >
        <ChartsReferenceLine
          y={0}
          lineStyle={{ stroke: "#94a3b8", strokeWidth: 1 }}
        />
      </BarChart>
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
