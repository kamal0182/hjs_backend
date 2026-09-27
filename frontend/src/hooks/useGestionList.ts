import { useEffect, useMemo, useState } from "react";
import type { PaginatedResult } from "../types/commande";
import type { GestionQueryParams } from "../types/gestion";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Paginated + searchable list shared by the Gestion pages.
 * `fetchPage` must be a stable reference (e.g. a service method), not an inline arrow.
 */
export function useGestionList<T>(
  fetchPage: (params: GestionQueryParams) => Promise<PaginatedResult<T>>,
  errorMessage: string,
) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchPage({ search: search || undefined, page, pageSize: PAGE_SIZE });
        if (cancelled) return;
        // Deleting the last row of the last page: step back one page.
        if (result.data.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setItems(result.data);
        setTotal(result.total);
      } catch {
        if (cancelled) return;
        setError(errorMessage);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, errorMessage, page, search, reloadKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return {
    items,
    total,
    totalPages,
    page,
    setPage,
    searchInput,
    setSearchInput,
    isLoading,
    error,
    retry,
  };
}
