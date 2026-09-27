import { useEffect, useMemo, useState } from "react";
import { gazoilService } from "../services/gazoil";
import type { CamionSummary, GazoilStats } from "../types/gazoil";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

export function useGazoilData() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [camions, setCamions] = useState<CamionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<GazoilStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => setReloadKey((key) => key + 1);
  const refreshAll = () => {
    setPage(1);
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await gazoilService.getCamionsSummary({
          search: debouncedSearch || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setCamions(result.data);
        setTotal(result.total);
      } catch {
        if (cancelled) return;
        setError("Impossible de charger les camions. Veuillez réessayer.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, reloadKey]);

  useEffect(() => {
    gazoilService.getStats().then(setStats).catch(() => setStats(null));
  }, [reloadKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return {
    camions,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    stats,
    isLoading,
    error,
    retry,
    refreshAll,
  };
}
