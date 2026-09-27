// A catégorie name, managed in Gestion > Catégories.
export type Category = string;

export interface CommandeLine {
  category: Category;
  quantity: number;
}

// One row = one commande (order). A client can appear in multiple rows
// if they have placed more than one commande. A single commande can cover
// several categories at once (e.g. Ramla: 5, Kayas: 3) via `lines`.
export interface Commande {
  id: string;
  clientId: string;
  clientName: string;
  company: string;
  commandeRef: string;
  lines: CommandeLine[];
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  comment: string;
  city: string;
  address: string;
}

export interface ClientOption {
  id: string;
  name: string;
  company: string;
  city: string;
}

export interface CreateCommandeInput {
  clientId: string;
  lines: CommandeLine[];
  date: string;
  city: string;
  address: string;
  comment: string;
}

export interface ClientsStats {
  totalClients: number;
  totalCommandes: number;
  commandesAujourdhui: number;
  villesCouvertes: number;
}

export interface ClientsQueryParams {
  search?: string;
  city?: string;
  date?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
