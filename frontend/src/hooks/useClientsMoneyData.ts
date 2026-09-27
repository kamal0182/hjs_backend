import { useEffect, useMemo, useState } from "react";
import { clientsMoneyService } from "../services/clientsMoney";
import type { ClientMoneySummary, ClientsMoneyStats } from "../types/clientsMoney";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

export function useClientsMoneyData() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [clients, setClients] = useState<ClientMoneySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ClientsMoneyStats | null>(null);

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
        const result = await clientsMoneyService.getClientsSummary({
          search: debouncedSearch || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setClients(result.data);
        setTotal(result.total);
      } catch {
        if (cancelled) return;
        setError("Impossible de charger les clients. Veuillez réessayer.");
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
    clientsMoneyService.getStats().then(setStats).catch(() => setStats(null));
  }, [reloadKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return {
    clients,
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
