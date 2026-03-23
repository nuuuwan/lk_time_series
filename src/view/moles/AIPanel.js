import React from "react";

function AIPanel({ seasonalityLines = [] }) {
  return (
    <section className="panel ai-panel">
      {seasonalityLines.length > 0 && (
        <ul className="insight-list">
          {seasonalityLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AIPanel;
