import React from "react";

function AIPanel({ insightLines }) {
  return (
    <section className="panel ai-panel">
      <ul className="insight-list">
        {insightLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export default AIPanel;
