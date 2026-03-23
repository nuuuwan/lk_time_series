import React from "react";

function StatChip({ label, value }) {
  return (
    <div className="stat-chip">
      <span className="stat-chip-label">{label}</span>
      <span className="stat-chip-value">{value}</span>
    </div>
  );
}

export default StatChip;
