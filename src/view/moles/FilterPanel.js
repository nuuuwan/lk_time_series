import React from "react";
import MultiCheckList from "../atoms/MultiCheckList";

function FilterSection({ label, selected, items, onChange, renderItem }) {
  const isActive = selected !== null;
  const activeCount = isActive ? selected.length : null;
  return (
    <details className="filter-details" open={isActive || undefined}>
      <summary className="filter-summary">
        {label}
        {isActive && activeCount > 0 && (
          <span className="filter-badge">{activeCount}</span>
        )}
      </summary>
      <MultiCheckList
        items={items}
        selected={selected}
        onChange={onChange}
        renderItem={renderItem}
      />
    </details>
  );
}

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
      <input
        id="search-input"
        className="text-input"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder="Search datasets…"
      />
      <FilterSection
        label="Source"
        selected={filters.sources}
        items={options.sources}
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
      <FilterSection
        label="Category"
        selected={filters.categories}
        items={options.categories}
        onChange={(val) => onFilterChange("categories", val)}
      />
      <FilterSection
        label="Frequency"
        selected={filters.frequencies}
        items={options.frequencies}
        onChange={(val) => onFilterChange("frequencies", val)}
      />
      <div className="result-meta">
        <span>
          {resultCount.toLocaleString()} / {datasetCount.toLocaleString()}
        </span>
        {isFiltered && (
          <button type="button" className="reset-btn" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
    </section>
  );
}

export default FilterPanel;
