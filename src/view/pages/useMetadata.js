import { useEffect, useMemo, useState } from "react";
import { fetchSummaryMetadata } from "../../nonview/core/datasetApi";
import DATA_SOURCE_IDX from "../../nonview/cons/DATA_SOURCE_IDX";

export default function useMetadata(searchQuery, filters) {
  const [metadata, setMetadata] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setMetadataLoading(true);
        const list = await fetchSummaryMetadata();
        setMetadata(list);
      } catch (error) {
        setMetadataError(error.message);
      } finally {
        setMetadataLoading(false);
      }
    };
    load();
  }, []);

  const filteredMetadata = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return metadata.filter((item) => {
      if (filters.sources !== null && !filters.sources.includes(item.source_id))
        return false;
      if (
        filters.categories !== null &&
        !filters.categories.includes(item.category)
      )
        return false;
      if (
        filters.frequencies !== null &&
        !filters.frequencies.includes(item.frequency_name)
      )
        return false;
      if (!q) return true;
      const haystack = [
        item.source_id,
        item.category,
        item.sub_category,
        item.frequency_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [metadata, searchQuery, filters]);

  const options = useMemo(() => {
    // Derive sources from datasets matching the current search/category/frequency
    // filters (excluding the source filter itself) so only sources with at least
    // one matching dataset are listed.
    const q = searchQuery.trim().toLowerCase();
    const metaForSources = metadata.filter((item) => {
      if (
        filters.categories !== null &&
        !filters.categories.includes(item.category)
      )
        return false;
      if (
        filters.frequencies !== null &&
        !filters.frequencies.includes(item.frequency_name)
      )
        return false;
      if (!q) return true;
      const haystack = [
        item.source_id,
        item.category,
        item.sub_category,
        item.frequency_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const categories = [
      ...new Set(metadata.map((item) => item.category).filter(Boolean)),
    ].sort();
    const sources = [
      ...new Set(metaForSources.map((item) => item.source_id).filter(Boolean)),
    ]
      .sort()
      .map((sourceId) => ({
        id: sourceId,
        label: DATA_SOURCE_IDX[sourceId]?.label || sourceId,
        image: DATA_SOURCE_IDX[sourceId]?.image || null,
      }));
    const frequencies = [
      ...new Set(metadata.map((item) => item.frequency_name).filter(Boolean)),
    ].sort();
    return { categories, sources, frequencies };
  }, [metadata, searchQuery, filters]);

  return {
    metadata,
    metadataLoading,
    metadataError,
    options,
    filteredMetadata,
  };
}
