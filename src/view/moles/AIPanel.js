import React from "react";

function AIPanel({ insightLines, seasonalityLines = [] }) {
  return (
    <section className="panel ai-panel">
      <ul className="insight-list">
        {insightLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {seasonalityLines.length > 0 && (
        <>
          <p className="insight-section-label">Seasonality</p>
          <ul className="insight-list">
            {seasonalityLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default AIPanel;
