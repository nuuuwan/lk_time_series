import React from "react";

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

      <label className="field-label" htmlFor="source-filter">
        Source
      </label>
      <select
        id="source-filter"
        className="select-input"
        value={filters.source}
        onChange={(event) => onFilterChange("source", event.target.value)}
      >
        <option value="all">All sources</option>
        {options.sources.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

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
