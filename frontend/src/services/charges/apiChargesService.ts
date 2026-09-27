import { api } from "../../lib/apiClient";
import type { ChargeQueryParams, ChargeRecord, ChargesStats, CreateChargeInput } from "../../types/charges";
import type { PaginatedResult } from "../../types/commande";
import type { ChargesService } from "./chargesService";

export const apiChargesService: ChargesService = {
  getCharges(params: ChargeQueryParams) {
    return api.get<PaginatedResult<ChargeRecord>>("/charges/", { ...params });
  },

  getStats() {
    return api.get<ChargesStats>("/charges/stats/");
  },

  createCharge(input: CreateChargeInput) {
    return api.post<ChargeRecord>("/charges/", input);
  },
};
