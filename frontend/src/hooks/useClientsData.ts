import { useEffect, useMemo, useState } from "react";
import { clientsService } from "../services/clients";
import type { ClientsStats, Commande } from "../types/commande";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

export function useClientsData() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState<ClientsStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const retry = () => setReloadKey((key) => key + 1);

  // Used after creating a commande: jump back to page 1 and refetch
  // the list, the stats cards, and the city filter options.
  const refreshAll = () => {
    setPage(1);
    setReloadKey((key) => key + 1);
  };

  // Debounce the free-text search so we don't refetch on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, city, date]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await clientsService.getCommandes({
          search: debouncedSearch || undefined,
          city: city || undefined,
          date: date || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setCommandes(result.data);
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
  }, [debouncedSearch, city, date, page, reloadKey]);

  useEffect(() => {
    clientsService.getCities().then(setCities).catch(() => setCities([]));
    clientsService.getStats().then(setStats).catch(() => setStats(null));
  }, [reloadKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return {
    commandes,
    total,
    totalPages,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    search,
    setSearch,
    city,
    setCity,
    date,
    setDate,
    cities,
    stats,
    isLoading,
    error,
    retry,
    refreshAll,
  };
}
