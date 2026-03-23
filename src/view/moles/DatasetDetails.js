import React from "react";
import {
  buildDatasetGithubUrl,
  buildDatasetRawUrl,
} from "../../nonview/core/datasetApi";
import { formatDate } from "../../nonview/core/timeSeriesUtils";
import {
  getSourceLabel,
  getSourceImage,
} from "../../nonview/cons/DATA_SOURCE_IDX";

function DatasetDetails({ meta }) {
  if (!meta) {
    return (
      <section className="panel dataset-details-panel">
        <h2>Dataset Details</h2>
        <div className="empty-state">Select a dataset to view details.</div>
      </section>
    );
  }

  return (
    <section className="panel dataset-details-panel">
      <div className="details-header">
        {getSourceImage(meta.source_id) && (
          <img
            src={getSourceImage(meta.source_id)}
            alt={getSourceLabel(meta.source_id)}
            className="details-source-logo"
          />
        )}
        <div>
          <h2>Dataset Details</h2>
          <p className="panel-subtitle">{getSourceLabel(meta.source_id)}</p>
        </div>
      </div>
      <div className="details-grid">
        <div>
          <span className="detail-label">Category</span>
          <strong>{meta.category}</strong>
        </div>
        <div>
          <span className="detail-label">Sub-category</span>
          <strong>{meta.sub_category}</strong>
        </div>
        <div>
          <span className="detail-label">Frequency</span>
          <strong>{meta.frequency_name}</strong>
        </div>
        <div>
          <span className="detail-label">Unit</span>
          <strong>{meta.unit || "N/A"}</strong>
        </div>
        <div>
          <span className="detail-label">Scale</span>
          <strong>{meta.scale || "N/A"}</strong>
        </div>
        <div>
          <span className="detail-label">Last Updated</span>
          <strong>{formatDate(meta.last_updated_time_str)}</strong>
        </div>
      </div>

      <div className="link-row">
        <a href={buildDatasetRawUrl(meta)} target="_blank" rel="noreferrer">
          Open raw JSON
        </a>
        <a href={buildDatasetGithubUrl(meta)} target="_blank" rel="noreferrer">
          Open GitHub file
        </a>
      </div>
    </section>
  );
}

export default DatasetDetails;
