import React from "react";

function MetaField({ label, value }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <strong className="detail-value">{value}</strong>
    </div>
  );
}

export default MetaField;
