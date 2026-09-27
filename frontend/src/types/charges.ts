// One record = one company charge/expense.
export interface ChargeRecord {
  id: string;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  comment: string;
  montant: number;
}

export interface ChargesStats {
  totalMontant: number;
  totalRecords: number;
}

export interface CreateChargeInput {
  date: string;
  comment: string;
  montant: number;
}

export interface ChargeQueryParams {
  page: number;
  pageSize: number;
}
