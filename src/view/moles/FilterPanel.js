import React from "react";
import MultiCheckList from "../atoms/MultiCheckList";

function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  options,
  resultCount,
  datasetCount,
  searchQuery,
  onSearchQueryChange,
}) {
  const isFiltered =
    searchQuery ||
    filters.sources !== null ||
    filters.categories !== null ||
    filters.frequencies !== null;

  return (
    <section className="panel filter-panel">
      <div className="panel-head-row">
        {isFiltered && (
          <button type="button" className="reset-btn" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
      <label className="field-label" htmlFor="search-input">
        Global Search
      </label>
      <input
        id="search-input"
        className="text-input"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder="Search source, category, sub-category, frequency"
      />
      <div className="filter-section-header">
        <label className="field-label">Source</label>
      </div>
      <MultiCheckList
        items={options.sources}
        selected={filters.sources}
        onChange={(val) => onFilterChange("sources", val)}
        renderItem={(source) => (
          <span className="source-check-item">
            {source.image && (
              <img
                src={source.image}
                alt={source.label}
                className="source-check-img"
              />
            )}
            <span>{source.label}</span>
          </span>
        )}
      />
      <div className="filter-section-header">
        <label className="field-label">Category</label>
      </div>
      <MultiCheckList
        items={options.categories}
        selected={filters.categories}
        onChange={(val) => onFilterChange("categories", val)}
      />
      <div className="filter-section-header">
        <label className="field-label">Frequency</label>
      </div>
      <MultiCheckList
        items={options.frequencies}
        selected={filters.frequencies}
        onChange={(val) => onFilterChange("frequencies", val)}
      />
      <div className="result-meta">
        <span>{resultCount.toLocaleString()} matched</span>
        <span>{datasetCount.toLocaleString()} total</span>
      </div>
    </section>
  );
}

export default FilterPanel;
