import { useEffect, useMemo, useState } from "react";
import { chargesService } from "../services/charges";
import type { ChargeRecord, ChargesStats } from "../types/charges";

const PAGE_SIZE = 8;

export function useChargesData() {
  const [page, setPage] = useState(1);

  const [charges, setCharges] = useState<ChargeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ChargesStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => setReloadKey((key) => key + 1);
  const refreshAll = () => {
    setPage(1);
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await chargesService.getCharges({ page, pageSize: PAGE_SIZE });
        if (cancelled) return;
        // The API clamps a page past the end (e.g. after deleting the last row): follow it.
        if (result.page !== page) setPage(result.page);
        setCharges(result.data);
        setTotal(result.total);
      } catch {
        if (cancelled) return;
        setError("Impossible de charger les charges. Veuillez réessayer.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  useEffect(() => {
    chargesService.getStats().then(setStats).catch(() => setStats(null));
  }, [reloadKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return {
    charges,
    total,
    totalPages,
    page,
    setPage,
    stats,
    isLoading,
    error,
    retry,
    refreshAll,
  };
}
