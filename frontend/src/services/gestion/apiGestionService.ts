import { api } from "../../lib/apiClient";
import type { PaginatedResult } from "../../types/commande";
import type {
  CamionInput,
  ClientInput,
  GestionQueryParams,
  LookupItem,
  LookupKind,
  ManagedCamion,
  ManagedClient,
  ManagedUser,
  UserInput,
} from "../../types/gestion";
import type { GestionService } from "./gestionService";

const LOOKUP_PATHS: Record<LookupKind, string> = {
  categories: "/categories/",
  villes: "/villes/",
  paymentTypes: "/clients-money/payment-types/",
};

export const apiGestionService: GestionService = {
  getUsers(params: GestionQueryParams) {
    return api.get<PaginatedResult<ManagedUser>>("/auth/users/", { ...params });
  },

  createUser(input: UserInput) {
    return api.post<ManagedUser>("/auth/users/", input);
  },

  updateUser(id: string, input: UserInput) {
    // PATCH so an empty password field leaves the current password unchanged.
    const { password, ...rest } = input;
    return api.patch<ManagedUser>(`/auth/users/${id}/`, password ? input : rest);
  },

  deactivateUser(id: string) {
    return api.delete(`/auth/users/${id}/`);
  },

  // The clients endpoint is not paginated server-side; page it here so the
  // Gestion pages all share the same PaginatedResult contract.
  async getClients(params: GestionQueryParams) {
    const all = await api.get<ManagedClient[]>("/clients/", { search: params.search });
    const start = (params.page - 1) * params.pageSize;
    return {
      data: all.slice(start, start + params.pageSize),
      total: all.length,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  createClient(input: ClientInput) {
    return api.post<ManagedClient>("/clients/", input);
  },

  updateClient(id: string, input: ClientInput) {
    // PATCH keeps any ville stored before it was removed from the form.
    return api.patch<ManagedClient>(`/clients/${id}/`, input);
  },

  deleteClient(id: string) {
    return api.delete(`/clients/${id}/`);
  },

  getCamions(params: GestionQueryParams) {
    return api.get<PaginatedResult<ManagedCamion>>("/gazoil/camions/directory/", { ...params });
  },

  createCamion(input: CamionInput) {
    return api.post<ManagedCamion>("/gazoil/camions/", input);
  },

  updateCamion(id: string, input: CamionInput) {
    return api.put<ManagedCamion>(`/gazoil/camions/${id}/`, input);
  },

  deleteCamion(id: string) {
    return api.delete(`/gazoil/camions/${id}/`);
  },

  getLookups(kind: LookupKind) {
    return api.get<LookupItem[]>(LOOKUP_PATHS[kind]);
  },

  createLookup(kind: LookupKind, name: string) {
    return api.post<LookupItem>(LOOKUP_PATHS[kind], { name });
  },

  updateLookup(kind: LookupKind, id: string, name: string) {
    return api.put<LookupItem>(`${LOOKUP_PATHS[kind]}${id}/`, { name });
  },

  deleteLookup(kind: LookupKind, id: string) {
    return api.delete(`${LOOKUP_PATHS[kind]}${id}/`);
  },
};
