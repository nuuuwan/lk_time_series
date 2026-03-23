import React from "react";

function MultiCheckList({ items, selected, onChange, renderItem }) {
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
        {items.map((item) => {
          const id = typeof item === "object" ? item.id : item;
          return (
            <label
              key={id}
              className={`multi-check-item${isChecked(id) ? " checked" : ""}`}
            >
              <input
                type="checkbox"
                checked={isChecked(id)}
                onChange={() => toggle(id)}
              />
              {renderItem ? renderItem(item) : <span>{item}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default MultiCheckList;
