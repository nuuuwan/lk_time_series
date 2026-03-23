import React from "react";

function MultiCheckList({ items, selected, onChange, renderItem }) {
  // selected: null = all pass, [...ids] = only these pass
  const total = items.length;
  const checkedCount = selected === null ? total : selected.length;
  const allSelected = selected === null || checkedCount === total;
  const noneSelected = checkedCount === 0;

  function toggle(item) {
    if (selected === null) {
      onChange(items.filter((x) => x !== item));
    } else if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item));
    } else {
      const next = [...selected, item];
      onChange(next.length === total ? null : next);
    }
  }

  const isChecked = (item) => selected === null || selected.includes(item);

  return (
    <div className="multi-check-list">
      <div className="multi-check-header">
        <span className="multi-check-count">
          {checkedCount} of {total}
        </span>
        <div className="multi-check-actions">
          <button
            type="button"
            className="mca-btn"
            disabled={allSelected}
            onClick={() => onChange(null)}
          >
            All
          </button>
          <button
            type="button"
            className="mca-btn"
            disabled={noneSelected}
            onClick={() => onChange([])}
          >
            None
          </button>
        </div>
      </div>
      <div className="multi-check-items">
        {items.map((item) => (
          <label
            key={typeof item === "object" ? item.id : item}
            className={`multi-check-item${isChecked(typeof item === "object" ? item.id : item) ? " checked" : ""}`}
          >
            <input
              type="checkbox"
              checked={isChecked(typeof item === "object" ? item.id : item)}
              onChange={() => toggle(typeof item === "object" ? item.id : item)}
            />
            {renderItem ? renderItem(item) : <span>{item}</span>}
          </label>
        ))}
      </div>
    </div>
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
      <div className="panel-head-row">
        <div>
          <h2>Discovery</h2>
          <p className="panel-subtitle">
            Filter and search across the full catalog.
          </p>
        </div>
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

