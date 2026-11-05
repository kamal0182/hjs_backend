import type {
  ClientOption,
  ClientsQueryParams,
  ClientsStats,
  Commande,
  CreateCommandeInput,
  PaginatedResult,
} from "../../types/commande";

// Contract the Clients page depends on. Swap `mockClientsService` for a real
// HTTP-backed implementation (e.g. one calling the Django API) in
// `index.ts` without touching any component or hook.
export interface ClientsService {
  getCommandes(
    params: ClientsQueryParams,
  ): Promise<PaginatedResult<Commande>>;
  getStats(): Promise<ClientsStats>;
  getCities(): Promise<string[]>;
  getClients(): Promise<ClientOption[]>;
  createCommande(input: CreateCommandeInput): Promise<Commande>;
  updateCommande(id: string, input: CreateCommandeInput): Promise<Commande>;
  deleteCommande(id: string): Promise<void>;
}
