import React from "react";

function SourceLogo({ source, checked, onToggle }) {
  return (
    <button
      type="button"
      className={`source-logo-btn${checked ? " active" : ""}`}
      onClick={() => onToggle(source.id)}
      title={source.label}
    >
      {source.image ? (
        <img
          src={source.image}
          alt={source.label}
          className="source-logo-img"
        />
      ) : (
        <span className="source-logo-fallback">{source.id}</span>
      )}
    </button>
  );
}

function MultiCheckList({ items, selected, onChange }) {
  // selected: null = all pass, [] = none pass, [...ids] = only these pass
  function toggle(item) {
    if (selected === null) {
      onChange(items.filter((x) => x !== item));
    } else if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item));
    } else {
      onChange([...selected, item]);
    }
  }

  const isChecked = (item) => selected === null || selected.includes(item);

  return (
    <div className="multi-check-list">
      <div className="multi-check-actions">
        <button type="button" className="mca-btn" onClick={() => onChange(null)}>
          All
        </button>
        <button type="button" className="mca-btn" onClick={() => onChange([])}>
          None
        </button>
      </div>
      <div className="multi-check-items">
        {items.map((item) => (
          <label
            key={item}
            className={`multi-check-item${isChecked(item) ? " checked" : ""}`}
          >
            <input
              type="checkbox"
              checked={isChecked(item)}
              onChange={() => toggle(item)}
            />
            <span>{item}</span>
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

  function toggleSource(id) {
    const curr = filters.sources;
    if (curr === null) {
      // All currently included; deselect this one → all except this
      onFilterChange("sources", options.sources.map((s) => s.id).filter((s) => s !== id));
    } else if (curr.includes(id)) {
      onFilterChange("sources", curr.filter((s) => s !== id));
    } else {
      onFilterChange("sources", [...curr, id]);
    }
  }

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
        <div className="multi-check-actions">
          <button
            type="button"
            className="mca-btn"
            onClick={() => onFilterChange("sources", null)}
          >
            All
          </button>
          <button
            type="button"
            className="mca-btn"
            onClick={() => onFilterChange("sources", [])}
          >
            None
          </button>
        </div>
      </div>
      <div className="source-logo-row">
        {options.sources.map((source) => (
          <SourceLogo
            key={source.id}
            source={source}
            checked={
              filters.sources === null || filters.sources.includes(source.id)
            }
            onToggle={toggleSource}
          />
        ))}
      </div>

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

