# Sri Lanka Time Series (lk_time_series)

Frontend for exploring 3500+ public Sri Lankan time-series datasets.

## Introduction: What

Sri Lanka Time Series is a React frontend designed to make national and local time-series data easy to discover, understand, and use.

The app is built around three core user actions:

1. Visualize datasets quickly with clear charts and trends.
2. Search and filter across thousands of datasets.
3. AI-analyze datasets to generate insights, summaries, anomalies, and contextual explanations.

This project focuses on usability, speed, and trust so users can move from "I found data" to "I understand the story" in a few clicks.

## Core Design Principles

1. Data First, Interface Second
 Every screen should prioritize the signal in the data. Visual noise, decorative UI, and unnecessary interactions should be minimized.

2. Search Must Be Instant and Forgiving
 With 3500+ datasets, search is a primary feature, not a helper feature. Users should find datasets with partial terms, synonyms, and domain keywords.

3. Explainability Over Black-Box AI
 AI outputs should be understandable and verifiable. Summaries, trend detection, and anomaly findings should point back to the underlying data.

4. Progressive Depth
 Start simple (headline chart + key facts), then allow deeper analysis (comparison, decomposition, forecasting, metadata, and source links).

5. Trust Through Provenance
 Each dataset view should clearly show source, update date, frequency, coverage, and caveats. Confidence comes from transparent metadata.

## Layout

The app layout should support a fast exploration workflow:

1. Top Navigation
 Global search input, dataset count, quick filters, and navigation to major sections.

2. Left Panel (Discovery)
 Faceted filters (domain, geography, frequency, time range, source, quality flags).

3. Main Panel (Visualization)
 Primary chart area with series toggles, zoom, time-window selection, and chart type controls.

4. Right Panel (AI Analysis)
 AI-generated summary, trend notes, anomalies, seasonality hints, and natural-language Q&A for the selected dataset.

5. Dataset Details Section
 Metadata, source links, update history, schema notes, and download/API actions.

6. Compare Mode
 Side-by-side or overlaid charts for multiple series, with normalization options.

7. Mobile Layout
 Stacked views with a bottom tab pattern: Search, Chart, AI, and Details.

## Suggested Frontend Structure (Current Project)

Based on the existing project tree:

- `src/view/pages/`: Route-level pages (Home, Search, Dataset, Compare, AI Workspace).
- `src/view/moles/`: Composite UI blocks (filter panels, chart cards, AI insight cards).
- `src/view/atoms/`: Reusable small components (buttons, tags, inputs, chips, badges).
- `src/nonview/core/`: Data logic, API clients, query builders, caching, and normalization.
- `src/nonview/cons/` and `src/view/_cons/`: App constants (routes, labels, config, themes).

## Product Goal

Build the best public interface for Sri Lankan time-series intelligence: searchable, visual, explainable, and AI-assisted.
