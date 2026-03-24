import React from "react";
import {
  formatDate,
  formatDateByFrequency,
} from "../../nonview/core/timeSeriesUtils";
import {
  getSourceLabel,
  getSourceImage,
} from "../../nonview/cons/DATA_SOURCE_IDX";

function DatasetList({ datasets, selectedKey, onSelectDataset }) {
  const sorted = [...datasets]
    .sort((a, b) => {
      // Normalise max_t: bare year → "YYYY-12-31" so it sorts correctly against ISO dates
      const normalize = (t) => {
        if (!t) return "";
        const s = String(t);
        if (/^\d{4}$/.test(s)) return s + "-12-31";
        return s;
      };
      return normalize(b.summary_statistics?.max_t).localeCompare(
        normalize(a.summary_statistics?.max_t),
      );
    })
    .slice(0, 200);

  return (
    <section className="panel dataset-list-panel">
      <div className="dataset-list" role="listbox" aria-label="Dataset results">
        {sorted.map((meta, idx) => (
          <button
            key={meta.key}
            type="button"
            className={`dataset-list-item ${meta.key === selectedKey ? "active" : ""}`}
            onClick={() => onSelectDataset(meta.key)}
          >
            <span className="dataset-list-num">{idx + 1}</span>
            <span className="dataset-list-body">
              <strong>{meta.sub_category}</strong>
              <span className="dataset-list-meta">
                {getSourceImage(meta.source_id) && (
                  <img
                    src={getSourceImage(meta.source_id)}
                    alt={getSourceLabel(meta.source_id)}
                    className="dataset-list-source-img"
                  />
                )}
                <span>{getSourceLabel(meta.source_id)}</span>
                <span className="dataset-list-sep">·</span>
                <span>{meta.frequency_name}</span>
                <span className="dataset-list-sep">·</span>
                <span>
                  {formatDateByFrequency(
                    meta.summary_statistics?.max_t,
                    meta.frequency_name,
                  )}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
      {datasets.length > 200 && (
        <p className="panel-note">
          Showing first 200 results. Narrow filters to see specific datasets.
        </p>
      )}
    </section>
  );
}

export default DatasetList;
