import React from "react";

function SourceLogo({ source, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`source-logo-btn${selected ? " active" : ""}`}
      onClick={() => onSelect(selected ? "all" : source.id)}
      title={source.label}
    >
      {source.image ? (
        <img src={source.image} alt={source.label} className="source-logo-img" />
      ) : (
        <span className="source-logo-fallback">{source.id}</span>
      )}
    </button>
  );
}

function FilterPanel({
  filters,
  onFilterChange,
  options,
  resultCount,
  datasetCount,
  searchQuery,
  onSearchQueryChange,
}) {
  return (
    <section className="panel filter-panel">
      <h2>Discovery</h2>
      <p className="panel-subtitle">
        Filter and search across the full catalog.
      </p>

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

      <label className="field-label">Source</label>
      <div className="source-logo-row">
        {options.sources.map((source) => (
          <SourceLogo
            key={source.id}
            source={source}
            selected={filters.source === source.id}
            onSelect={(id) => onFilterChange("source", id)}
          />
        ))}
      </div>
      {filters.source !== "all" && (
        <p className="source-selected-label">
          {options.sources.find((s) => s.id === filters.source)?.label}
          <button
            type="button"
            className="source-clear-btn"
            onClick={() => onFilterChange("source", "all")}
          >
            ✕ Clear
          </button>
        </p>
      )}

      <label className="field-label" htmlFor="category-filter">
        Category
      </label>
      <select
        id="category-filter"
        className="select-input"
        value={filters.category}
        onChange={(event) => onFilterChange("category", event.target.value)}
      >
        <option value="all">All categories</option>
        {options.categories.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="frequency-filter">
        Frequency
      </label>
      <select
        id="frequency-filter"
        className="select-input"
        value={filters.frequency}
        onChange={(event) => onFilterChange("frequency", event.target.value)}
      >
        <option value="all">All frequencies</option>
        {options.frequencies.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <div className="result-meta">
        <span>{resultCount.toLocaleString()} matched</span>
        <span>{datasetCount.toLocaleString()} total</span>
      </div>
    </section>
  );
}

export default FilterPanel;
