import type { PaginatedResult } from "../../types/commande";
import type { ChargeQueryParams, ChargeRecord, ChargesStats, CreateChargeInput } from "../../types/charges";
import type { ChargesService } from "./chargesService";
import { MOCK_CHARGES } from "./mockData";

const SIMULATED_DELAY_MS = 400;

function wait<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

let nextId = MOCK_CHARGES.length + 1;

export const mockChargesService: ChargesService = {
  async getCharges(params: ChargeQueryParams): Promise<PaginatedResult<ChargeRecord>> {
    const sorted = [...MOCK_CHARGES].sort((a, b) => (a.date < b.date ? 1 : -1));

    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;

    return wait({
      data: sorted.slice(start, end),
      total: sorted.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  },

  async getStats(): Promise<ChargesStats> {
    return wait({
      totalMontant: MOCK_CHARGES.reduce((sum, c) => sum + c.montant, 0),
      totalRecords: MOCK_CHARGES.length,
    });
  },

  async createCharge(input: CreateChargeInput): Promise<ChargeRecord> {
    const charge: ChargeRecord = {
      id: `charge-${nextId++}`,
      date: input.date,
      comment: input.comment,
      montant: input.montant,
    };
    MOCK_CHARGES.unshift(charge);
    return wait(charge);
  },
};
