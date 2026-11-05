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
import { MOCK_CLIENT_MONEY_RECORDS, MOCK_PAYMENTS } from "./mockData";

const SIMULATED_DELAY_MS = 400;

function wait<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function buildSummaries(): ClientMoneySummary[] {
  return MOCK_CLIENT_MONEY_RECORDS.map((record) => {
    const payments = MOCK_PAYMENTS.filter((p) => p.recordId === record.id);

    // The initial record itself counts as the first entry (montant + date);
    // any later payments can supersede it as the "latest" entry.
    const entries = [
      { price: record.montant, date: record.date },
      ...payments.map((p) => ({ price: p.price, date: p.date })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));

    return {
      recordId: record.id,
      clientName: record.clientName,
      montant: record.montant,
      date: record.date,
      latestMontant: entries[0].price,
      latestDate: entries[0].date,
      paymentsCount: payments.length,
      totalMontant: entries.reduce((sum, e) => sum + e.price, 0),
    };
  });
}

let nextRecordId = MOCK_CLIENT_MONEY_RECORDS.length + 1;
let nextPaymentId = MOCK_PAYMENTS.length + 1;

export const mockClientsMoneyService: ClientsMoneyService = {
  async getClientsSummary(
    params: ClientMoneyQueryParams,
  ): Promise<PaginatedResult<ClientMoneySummary>> {
    let summaries = buildSummaries().sort((a, b) => (a.latestDate < b.latestDate ? 1 : -1));

    if (params.search) {
      const search = normalize(params.search);
      summaries = summaries.filter((s) => normalize(s.clientName).includes(search));
    }

    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;

    return wait({
      data: summaries.slice(start, end),
      total: summaries.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  },

  async getStats(): Promise<ClientsMoneyStats> {
    const totalFromRecords = MOCK_CLIENT_MONEY_RECORDS.reduce((sum, r) => sum + r.montant, 0);
    const totalFromPayments = MOCK_PAYMENTS.reduce((sum, p) => sum + p.price, 0);

    return wait({
      totalCollected: totalFromRecords + totalFromPayments,
      totalClients: MOCK_CLIENT_MONEY_RECORDS.length,
      totalPayments: MOCK_PAYMENTS.length,
    });
  },

  async createRecord(input: CreateClientMoneyRecordInput): Promise<ClientMoneyRecord> {
    const record: ClientMoneyRecord = {
      id: `rec-${nextRecordId++}`,
      clientName: input.clientName,
      montant: input.montant,
      date: input.date,
    };
    MOCK_CLIENT_MONEY_RECORDS.unshift(record);
    return wait(record);
  },

  async createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
    const record = MOCK_CLIENT_MONEY_RECORDS.find((r) => r.id === input.recordId);
    if (!record) {
      throw new Error("Client introuvable.");
    }

    const payment: PaymentRecord = {
      id: `paypay-${nextPaymentId++}`,
      recordId: record.id,
      paymentType: input.paymentType,
      price: input.price,
      date: input.date,
    };
    MOCK_PAYMENTS.unshift(payment);
    return wait(payment);
  },

  async updateRecord(id: string, input: CreateClientMoneyRecordInput): Promise<ClientMoneyRecord> {
    const index = MOCK_CLIENT_MONEY_RECORDS.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Client introuvable.");
    MOCK_CLIENT_MONEY_RECORDS[index] = { ...MOCK_CLIENT_MONEY_RECORDS[index], ...input };
    return wait(MOCK_CLIENT_MONEY_RECORDS[index]);
  },

  async deleteRecord(id: string): Promise<void> {
    const index = MOCK_CLIENT_MONEY_RECORDS.findIndex((r) => r.id === id);
    if (index !== -1) MOCK_CLIENT_MONEY_RECORDS.splice(index, 1);
    for (let i = MOCK_PAYMENTS.length - 1; i >= 0; i--) {
      if (MOCK_PAYMENTS[i].recordId === id) MOCK_PAYMENTS.splice(i, 1);
    }
    return wait(undefined);
  },

  async updatePayment(id: string, input: CreatePaymentInput): Promise<PaymentRecord> {
    const index = MOCK_PAYMENTS.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Paiement introuvable.");
    MOCK_PAYMENTS[index] = { ...MOCK_PAYMENTS[index], ...input };
    return wait(MOCK_PAYMENTS[index]);
  },

  async deletePayment(id: string): Promise<void> {
    const index = MOCK_PAYMENTS.findIndex((p) => p.id === id);
    if (index !== -1) MOCK_PAYMENTS.splice(index, 1);
    return wait(undefined);
  },

  async getRecord(recordId: string): Promise<ClientMoneyRecord> {
    const record = MOCK_CLIENT_MONEY_RECORDS.find((r) => r.id === recordId);
    if (!record) throw new Error("Record not found");
    return wait(record);
  },

  async getPayments(recordId: string): Promise<PaymentRecord[]> {
    const payments = MOCK_PAYMENTS.filter((p) => p.recordId === recordId);
    return wait([...payments].sort((a, b) => (a.date < b.date ? 1 : -1)));
  },
};
