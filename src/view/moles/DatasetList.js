import React from "react";

function DatasetList({ datasets, selectedKey, onSelectDataset }) {
  return (
    <section className="panel dataset-list-panel">
      <h2>Dataset List</h2>
      <p className="panel-subtitle">Select a dataset to visualize.</p>

      <div className="dataset-list" role="listbox" aria-label="Dataset results">
        {datasets.slice(0, 200).map((meta) => (
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
