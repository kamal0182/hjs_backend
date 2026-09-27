// One record = one fill-up (plein) for a given truck (matricule).
export interface GazoilRecord {
  id: string;
  matricule: string;
  price: number;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
}

// One row in the main Gazoil table = one truck, summarizing its records.
export interface CamionSummary {
  matricule: string;
  latestPrice: number;
  latestDate: string;
  recordsCount: number;
  totalPrice: number;
  commentsCount: number;
}

// A dated note attached to a truck (matricule). A truck can have many.
export interface GazoilComment {
  id: string;
  matricule: string;
  comment: string;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
}

export interface CreateGazoilCommentInput {
  matricule: string;
  comment: string;
  date: string;
}

export interface GazoilStats {
  totalPriceAll: number;
  totalRecords: number;
  totalCamions: number;
}

export interface CreateGazoilRecordInput {
  matricule: string;
  price: number;
  date: string;
}

export interface GazoilQueryParams {
  search?: string;
  page: number;
  pageSize: number;
}
