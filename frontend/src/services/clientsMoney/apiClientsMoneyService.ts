import { api } from "../../lib/apiClient";
import type { PaginatedResult } from "../../types/commande";
import type {
  ClientMoneyQueryParams,
  ClientMoneyRecord,
  ClientMoneySummary,
  ClientsMoneyStats,
  CreateClientMoneyRecordInput,
  CreatePaymentInput,
  PaymentRecord,
} from "../../types/clientsMoney";
import type { ClientsMoneyService } from "./clientsMoneyService";

export const apiClientsMoneyService: ClientsMoneyService = {
  getClientsSummary(params: ClientMoneyQueryParams) {
    return api.get<PaginatedResult<ClientMoneySummary>>("/clients-money/records/", { ...params });
  },

  getStats() {
    return api.get<ClientsMoneyStats>("/clients-money/records/stats/");
  },

  createRecord(input: CreateClientMoneyRecordInput) {
    return api.post<ClientMoneyRecord>("/clients-money/records/", input);
  },

  updateRecord(id: string, input: CreateClientMoneyRecordInput) {
    return api.put<ClientMoneyRecord>(`/clients-money/records/${id}/`, input);
  },

  deleteRecord(id: string) {
    return api.delete(`/clients-money/records/${id}/`);
  },

  createPayment(input: CreatePaymentInput) {
    return api.post<PaymentRecord>("/clients-money/payments/", input);
  },

  updatePayment(id: string, input: CreatePaymentInput) {
    return api.put<PaymentRecord>(`/clients-money/payments/${id}/`, input);
  },

  deletePayment(id: string) {
    return api.delete(`/clients-money/payments/${id}/`);
  },

  getRecord(recordId: string) {
    return api.get<ClientMoneyRecord>(`/clients-money/records/${recordId}/`);
  },

  getPayments(recordId: string) {
    return api.get<PaymentRecord[]>("/clients-money/payments/", { recordId });
  },
};
