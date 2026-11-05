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

// Contract the Clients Money page depends on. Swap `mockClientsMoneyService`
// for a real HTTP-backed implementation in `index.ts` without touching components.
export interface ClientsMoneyService {
  getClientsSummary(params: ClientMoneyQueryParams): Promise<PaginatedResult<ClientMoneySummary>>;
  getStats(): Promise<ClientsMoneyStats>;
  createRecord(input: CreateClientMoneyRecordInput): Promise<ClientMoneyRecord>;
  updateRecord(id: string, input: CreateClientMoneyRecordInput): Promise<ClientMoneyRecord>;
  deleteRecord(id: string): Promise<void>; // also deletes its payments
  createPayment(input: CreatePaymentInput): Promise<PaymentRecord>;
  updatePayment(id: string, input: CreatePaymentInput): Promise<PaymentRecord>;
  deletePayment(id: string): Promise<void>;
  getRecord(recordId: string): Promise<ClientMoneyRecord>;
  getPayments(recordId: string): Promise<PaymentRecord[]>;
}
