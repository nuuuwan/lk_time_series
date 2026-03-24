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
import CloseIcon from "@mui/icons-material/Close";

function DatasetList({
  datasets,
  selectedKeys = [],
  selectedUnit = null,
  selectedScale = null,
  onToggleDataset,
  onSelectForDetail,
}) {
  // When at least one dataset is selected, only show the + button for items
  // whose unit and scale match. The × button on selected items is always shown.
  const hasSelection = selectedKeys.length > 0;
  function canAdd(meta) {
    if (!hasSelection) return true;
    const unitMatch =
      selectedUnit === null || (meta.unit ?? "") === (selectedUnit ?? "");
    const scaleMatch =
      selectedScale === null || (meta.scale ?? "") === (selectedScale ?? "");
    return unitMatch && scaleMatch;
  }
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
        {sorted.map((meta, idx) => {
          const isSelected = selectedKeys.includes(meta.key);
          if (hasSelection && !isSelected && !canAdd(meta)) return null;
          return (
          <div
            key={meta.key}
            className={`dataset-list-item ${isSelected ? "active" : ""}`}
            onClick={() =>
              onSelectForDetail
                ? onSelectForDetail(meta.key)
                : onToggleDataset(meta.key)
            }
            role="option"
            aria-selected={isSelected}
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
              className={`dataset-list-add-btn${isSelected ? " dataset-list-remove-btn" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDataset(meta.key);
              }}
              aria-label={
                isSelected
                  ? `Remove ${meta.sub_category}`
                  : `Select ${meta.sub_category}`
              }
            >
              {isSelected ? (
                <CloseIcon fontSize="small" />
              ) : (
                <AddIcon fontSize="small" />
              )}
            </IconButton>
          </div>
          );
        })}
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
