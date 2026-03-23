const DATA_SOURCE_IDX = {
  cbsl: {
    label: "Central Bank of Sri Lanka",
    image: `${process.env.PUBLIC_URL}/cbsl.png`,
  },
  world_bank: {
    label: "World Bank",
    image: `${process.env.PUBLIC_URL}/world_bank.png`,
  },
  imf: {
    label: "International Monetary Fund",
    image: `${process.env.PUBLIC_URL}/imf.png`,
  },
  adb: {
    label: "Asian Development Bank",
    image: `${process.env.PUBLIC_URL}/adb.png`,
  },
  dmtlk: {
    label: "Department of Motor Traffic, Sri Lanka",
    image: `${process.env.PUBLIC_URL}/dmtlk.png`,
  },
  sltda: {
    label: "Sri Lanka Tourism Development Authority",
    image: `${process.env.PUBLIC_URL}/sltda.png`,
  },
};

export const getSourceLabel = (sourceId) =>
  DATA_SOURCE_IDX[sourceId]?.label || sourceId;

export const getSourceImage = (sourceId) =>
  DATA_SOURCE_IDX[sourceId]?.image || null;

export default DATA_SOURCE_IDX;
