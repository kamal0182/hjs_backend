// A type de paiement name, managed in Gestion > Types de paiement.
export type PaymentType = string;

// Created independently via the page-level "Nouveau client" action.
// This is its own directory, separate from the Clients section.
export interface ClientMoneyRecord {
  id: string;
  clientName: string;
  montant: number;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
}

// One payment logged against a ClientMoneyRecord over time, via the
// row-level "Ajouter" action.
export interface PaymentRecord {
  id: string;
  recordId: string;
  paymentType: PaymentType;
  price: number;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
}

// One row in the main Clients Money table = one record, summarizing
// its initial montant plus every payment logged against it.
export interface ClientMoneySummary {
  recordId: string;
  clientName: string;
  latestMontant: number;
  latestDate: string;
  paymentsCount: number;
  totalMontant: number;
}

export interface ClientsMoneyStats {
  totalCollected: number;
  totalClients: number;
  totalPayments: number;
}

export interface CreateClientMoneyRecordInput {
  clientName: string;
  montant: number;
  date: string;
}

export interface CreatePaymentInput {
  recordId: string;
  paymentType: PaymentType;
  price: number;
  date: string;
}

export interface ClientMoneyQueryParams {
  search?: string;
  page: number;
  pageSize: number;
}
