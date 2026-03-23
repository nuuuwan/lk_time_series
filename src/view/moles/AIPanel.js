import React from "react";

function AIPanel({ insightLines }) {
  return (
    <section className="panel ai-panel">
      <h2>AI Analysis</h2>
      <p className="panel-subtitle">
        AI generation is intentionally disabled in this build. Deterministic
        insight lines are shown instead.
      </p>

      <ul className="insight-list">
        {insightLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export default AIPanel;
