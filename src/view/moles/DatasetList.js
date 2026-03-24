import React from "react";
import {
  formatDateByFrequency,
  splitDatasetName,
} from "../../nonview/core/timeSeriesUtils";
import {
  getSourceLabel,
  getSourceImage,
} from "../../nonview/cons/DATA_SOURCE_IDX";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";

function DatasetList({
  datasets,
  selectedKeys = [],
  onToggleDataset,
  onSelectForDetail,
}) {
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
          <div
            key={meta.key}
            className={`dataset-list-item ${selectedKeys.includes(meta.key) ? "active" : ""}`}
            onClick={() =>
              onSelectForDetail
                ? onSelectForDetail(meta.key)
                : onToggleDataset(meta.key)
            }
            role="option"
            aria-selected={selectedKeys.includes(meta.key)}
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              (onSelectForDetail
                ? onSelectForDetail(meta.key)
                : onToggleDataset(meta.key))
            }
          >
            <span className="dataset-list-num">{idx + 1}</span>
            <span className="dataset-list-body">
              {(() => {
                const { metric, breadcrumb } = splitDatasetName(
                  meta.sub_category,
                );
                return (
                  <>
                    <strong className="dataset-list-metric">{metric}</strong>
                    {breadcrumb && (
                      <span className="dataset-list-breadcrumb">
                        {breadcrumb}
                      </span>
                    )}
                  </>
                );
              })()}
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
            <IconButton
              size="small"
              className="dataset-list-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDataset(meta.key);
              }}
              aria-label={`Select ${meta.sub_category}`}
            >
              {selectedKeys.includes(meta.key) ? (
                <CheckIcon fontSize="small" />
              ) : (
                <AddIcon fontSize="small" />
              )}
            </IconButton>
          </div>
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
