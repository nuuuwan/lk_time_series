import React from "react";
import { formatDate } from "../../nonview/core/timeSeriesUtils";

function DatasetList({ datasets, selectedKey, onSelectDataset }) {
  return (
    <section className="panel dataset-list-panel">
      <div className="dataset-list" role="listbox" aria-label="Dataset results">
        {[...datasets]
          .sort((a, b) =>
            String(b.summary_statistics?.max_t || "").localeCompare(
              String(a.summary_statistics?.max_t || ""),
            ),
          )
          .slice(0, 200)
          .map((meta) => (
            <button
              key={meta.key}
              type="button"
              className={`dataset-list-item ${meta.key === selectedKey ? "active" : ""}`}
              onClick={() => onSelectDataset(meta.key)}
            >
              <strong>{meta.sub_category}</strong>
              <span>{meta.category}</span>
              <span>
                {meta.source_id} • {meta.frequency_name}
              </span>
              <span className="dataset-list-dates">
                <span title="Latest value date">
                  {formatDate(meta.summary_statistics?.max_t)}
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
