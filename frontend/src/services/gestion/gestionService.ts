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

// Contract the Gestion pages depend on (users, clients directory, trucks).
export interface GestionService {
  getUsers(params: GestionQueryParams): Promise<PaginatedResult<ManagedUser>>;
  createUser(input: UserInput): Promise<ManagedUser>;
  updateUser(id: string, input: UserInput): Promise<ManagedUser>;
  deactivateUser(id: string): Promise<void>;

  getClients(params: GestionQueryParams): Promise<PaginatedResult<ManagedClient>>;
  createClient(input: ClientInput): Promise<ManagedClient>;
  updateClient(id: string, input: ClientInput): Promise<ManagedClient>;
  deleteClient(id: string): Promise<void>;

  getCamions(params: GestionQueryParams): Promise<PaginatedResult<ManagedCamion>>;
  createCamion(input: CamionInput): Promise<ManagedCamion>;
  updateCamion(id: string, input: CamionInput): Promise<ManagedCamion>;
  deleteCamion(id: string): Promise<void>;

  // Full list (small), used by both the Gestion pages and the form dropdowns.
  getLookups(kind: LookupKind): Promise<LookupItem[]>;
  createLookup(kind: LookupKind, name: string): Promise<LookupItem>;
  updateLookup(kind: LookupKind, id: string, name: string): Promise<LookupItem>;
  deleteLookup(kind: LookupKind, id: string): Promise<void>;
}
