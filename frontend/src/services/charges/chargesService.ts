import type { PaginatedResult } from "../../types/commande";
import type { ChargeQueryParams, ChargeRecord, ChargesStats, CreateChargeInput } from "../../types/charges";

// Contract the My Charges page depends on. Swap `mockChargesService` for a
// real HTTP-backed implementation in `index.ts` without touching components.
export interface ChargesService {
  getCharges(params: ChargeQueryParams): Promise<PaginatedResult<ChargeRecord>>;
  getStats(): Promise<ChargesStats>;
  createCharge(input: CreateChargeInput): Promise<ChargeRecord>;
  updateCharge(id: string, input: CreateChargeInput): Promise<ChargeRecord>;
  deleteCharge(id: string): Promise<void>;
}
