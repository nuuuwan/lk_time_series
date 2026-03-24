import React from "react";
import { buildDatasetRawUrl } from "../../nonview/core/datasetApi";
import {
  formatDate,
  formatNumber,
  formatDateByFrequency,
} from "../../nonview/core/timeSeriesUtils";
import {
  getSourceLabel,
  getSourceImage,
} from "../../nonview/cons/DATA_SOURCE_IDX";
import MetaField from "../atoms/MetaField";
import { DATETIME_STR } from "../../nonview/cons/VERSION";

function downloadDelimited(mainSeries, meta, sep, ext) {
  const header = `date${sep}value`;
  const rows = mainSeries
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

function DatasetDetails({ meta, mainSeries = [] }) {
  if (!meta) {
    return (
      <section className="panel dataset-details-panel">
        <div className="empty-state">Select a dataset to view details.</div>
      </section>
    );
  }
  const finiteValues = mainSeries
    .map((p) => p.value)
    .filter((v) => v !== null && Number.isFinite(v));
  const xData = mainSeries.map((p, i) =>
    Number.isFinite(p.timeMs)
      ? new Date(p.timeMs).toISOString().slice(0, 10)
      : p.t || String(i),
  );
  const stat = {
    n: finiteValues.length || meta.summary_statistics?.n,
    min_t: xData[0] || meta.summary_statistics?.min_t,
    max_t: xData[xData.length - 1] || meta.summary_statistics?.max_t,
    min_value: finiteValues.length
      ? Math.min(...finiteValues)
      : meta.summary_statistics?.min_value,
    max_value: finiteValues.length
      ? Math.max(...finiteValues)
      : meta.summary_statistics?.max_value,
  };
  return (
    <section className="panel dataset-details-panel">
      <div className="details-source-row">
        {getSourceImage(meta.source_id) && (
          <img
            src={getSourceImage(meta.source_id)}
            alt={getSourceLabel(meta.source_id)}
            className="details-source-logo"
          />
        )}
        <span className="details-source-name">
          {getSourceLabel(meta.source_id)}
        </span>
      </div>
      <h2 className="details-title">{meta.sub_category}</h2>
      <p className="details-category">{meta.category}</p>
      <div className="details-stat-row">
        <div className="details-stat">
          <span className="details-stat-label">Data Points</span>
          <strong className="details-stat-value">{formatNumber(stat.n)}</strong>
        </div>
        <div className="details-stat">
          <span className="details-stat-label">Date Range</span>
          <strong className="details-stat-value">
            {formatDateByFrequency(stat.min_t, meta.frequency_name)} to{" "}
            {formatDateByFrequency(stat.max_t, meta.frequency_name)}
          </strong>
        </div>
        <div className="details-stat">
          <span className="details-stat-label">Value Range</span>
          <strong className="details-stat-value">
            {formatNumber(stat.min_value)} to {formatNumber(stat.max_value)}
          </strong>
        </div>
      </div>
      <div className="details-grid">
        <MetaField label="Frequency" value={meta.frequency_name} />
        <MetaField label="Unit" value={meta.unit || "N/A"} />
        <MetaField label="Scale" value={meta.scale || "N/A"} />
      </div>
      <div className="link-row">
        <a
          className="link-btn"
          href={buildDatasetRawUrl(meta)}
          target="_blank"
          rel="noreferrer"
        >
          JSON
        </a>
        <button
          type="button"
          className="link-btn link-btn-secondary"
          onClick={() => downloadDelimited(mainSeries, meta, ",", "csv")}
        >
          CSV
        </button>
        <button
          type="button"
          className="link-btn link-btn-secondary"
          onClick={() => downloadDelimited(mainSeries, meta, "\t", "tsv")}
        >
          TSV
        </button>
      </div>
      <p className="details-last-updated">Last Updated {DATETIME_STR}</p>
    </section>
  );
}

export default DatasetDetails;
