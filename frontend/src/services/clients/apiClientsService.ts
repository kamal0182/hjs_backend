import { api } from "../../lib/apiClient";
import type {
  ClientOption,
  ClientsQueryParams,
  ClientsStats,
  Commande,
  CreateCommandeInput,
  PaginatedResult,
} from "../../types/commande";
import type { ClientsService } from "./clientsService";

export const apiClientsService: ClientsService = {
  getCommandes(params: ClientsQueryParams) {
    return api.get<PaginatedResult<Commande>>("/commandes/", { ...params });
  },

  getStats() {
    return api.get<ClientsStats>("/commandes/stats/");
  },

  getCities() {
    return api.get<string[]>("/clients/cities/");
  },

  getClients() {
    return api.get<ClientOption[]>("/clients/");
  },

  createCommande(input: CreateCommandeInput) {
    return api.post<Commande>("/commandes/", input);
  },
};
