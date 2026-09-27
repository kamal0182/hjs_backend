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
  createPayment(input: CreatePaymentInput): Promise<PaymentRecord>;
  getRecord(recordId: string): Promise<ClientMoneyRecord>;
  getPayments(recordId: string): Promise<PaymentRecord[]>;
}
