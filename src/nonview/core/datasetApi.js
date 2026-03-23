const SUMMARY_URL =
  "https://raw.githubusercontent.com/nuuuwan/lanka_data_timeseries/refs/heads/data/summary.json";

const DATASET_GITHUB_BASE =
  "https://github.com/nuuuwan/lanka_data_timeseries/blob/data/sources";

const DATASET_RAW_BASE =
  "https://raw.githubusercontent.com/nuuuwan/lanka_data_timeseries/data/sources";

export const getDatasetKey = (meta) =>
  `${meta.source_id}::${meta.sub_category}::${meta.frequency_name}`;

const encodeFileName = (meta) => {
  const source = encodeURIComponent(meta.source_id);
  const subCategory = encodeURIComponent(meta.sub_category);
  const frequency = encodeURIComponent(meta.frequency_name);
  return {
    source,
    fileName: `${source}.${subCategory}.${frequency}.json`,
  };
};

export const buildDatasetGithubUrl = (meta) => {
  const { source, fileName } = encodeFileName(meta);
  return `${DATASET_GITHUB_BASE}/${source}/${fileName}`;
};

export const buildDatasetRawUrl = (meta) => {
  const { source, fileName } = encodeFileName(meta);
  return `${DATASET_RAW_BASE}/${source}/${fileName}`;
};

export const fetchSummaryMetadata = async () => {
  const response = await fetch(SUMMARY_URL);
  if (!response.ok) {
    throw new Error(`Metadata request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Metadata payload is not an array.");
  }

  return payload.map((item) => ({
    ...item,
    key: getDatasetKey(item),
  }));
};

export const fetchDataset = async (meta) => {
  const response = await fetch(buildDatasetRawUrl(meta));
  if (!response.ok) {
    throw new Error(
      `Dataset request failed (${meta.source_id} / ${meta.sub_category}) with status ${response.status}.`,
    );
  }
  return response.json();
};
