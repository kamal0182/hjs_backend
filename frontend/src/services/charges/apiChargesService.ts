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

  updateCharge(id: string, input: CreateChargeInput) {
    return api.put<ChargeRecord>(`/charges/${id}/`, input);
  },

  deleteCharge(id: string) {
    return api.delete(`/charges/${id}/`);
  },
};
