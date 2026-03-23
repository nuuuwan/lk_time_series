import React from "react";
import { getForecastMeta } from "../../nonview/core/forecastSeries";

function ForecastPanel({ mainSeries }) {
  const meta = getForecastMeta(mainSeries);
  if (!meta) return null;

  const { lag, steps, usesAR, nPoints, medianGapDays } = meta;

  const methodName = usesAR ? `AR(${lag}) with Ridge OLS` : "OLS Linear Trend";

  const freqLabel =
    medianGapDays <= 2
      ? "daily"
      : medianGapDays <= 10
        ? "weekly"
        : medianGapDays <= 40
          ? "monthly"
          : medianGapDays <= 100
            ? "quarterly"
            : "annual";

  const rows = [
    ["Model", methodName],
    ["Training points", nPoints],
    usesAR ? ["Lag features", lag] : null,
    ["Steps ahead", steps],
    ["Data frequency", `~${freqLabel} (${medianGapDays}d gap)`],
  ].filter(Boolean);

  const methodNote = usesAR
    ? `Uses the last ${lag} values as features to predict each future step, repeating iteratively for all ${steps} forecasted steps.`
    : `Insufficient data for AR — falls back to a linear least-squares trend extrapolated ${steps} steps ahead.`;

  const regularizationNote = usesAR
    ? "Ridge regularisation (λ = 1% of feature matrix trace) prevents overfitting on short series."
    : null;

  return (
    <section className="panel forecast-panel">
      <p className="panel-subtitle">Forecast Model</p>
      <table className="forecast-meta-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="forecast-meta-label">{label}</td>
              <td className="forecast-meta-value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="forecast-note">{methodNote}</p>
      {regularizationNote && (
        <p className="forecast-note">{regularizationNote}</p>
      )}
    </section>
  );
}

export default ForecastPanel;
