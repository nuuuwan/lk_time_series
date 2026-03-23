import React from "react";
import {
  buildDatasetGithubUrl,
  buildDatasetRawUrl,
} from "../../nonview/core/datasetApi";
import { formatDate, formatNumber } from "../../nonview/core/timeSeriesUtils";
import {
  getSourceLabel,
  getSourceImage,
} from "../../nonview/cons/DATA_SOURCE_IDX";
import MetaField from "../atoms/MetaField";

function DatasetDetails({ meta }) {
  if (!meta) {
    return (
      <section className="panel dataset-details-panel">
        <div className="empty-state">Select a dataset to view details.</div>
      </section>
    );
  }
  const stat = meta.summary_statistics || {};
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
            {formatDate(stat.min_t)} – {formatDate(stat.max_t)}
          </strong>
        </div>
        <div className="details-stat">
          <span className="details-stat-label">Value Range</span>
          <strong className="details-stat-value">
            {formatNumber(stat.min_value)} – {formatNumber(stat.max_value)}
          </strong>
        </div>
      </div>
      <div className="details-grid">
        <MetaField label="Frequency" value={meta.frequency_name} />
        <MetaField label="Unit" value={meta.unit || "N/A"} />
        <MetaField label="Scale" value={meta.scale || "N/A"} />
        <MetaField
          label="Last Updated"
          value={formatDate(meta.last_updated_time_str)}
        />
      </div>
      <div className="link-row">
        <a
          className="link-btn"
          href={buildDatasetRawUrl(meta)}
          target="_blank"
          rel="noreferrer"
        >
          Raw JSON
        </a>
        <a
          className="link-btn link-btn-secondary"
          href={buildDatasetGithubUrl(meta)}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}

export default DatasetDetails;
