import type { AuthUser, UserRole } from "./auth";
import type { ClientOption } from "./commande";

// Types for the "Gestion" pages: plain CRUD over users, clients and trucks.

export type ManagedUser = AuthUser;

export interface UserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  password?: string; // required on create, optional on update
}

export type ManagedClient = ClientOption;

// The ville is no longer entered on a client (it is chosen per commande).
export interface ClientInput {
  name: string;
  company: string;
}

export interface ManagedCamion {
  id: string;
  matricule: string;
  recordsCount: number;
  commentsCount: number;
}

export interface CamionInput {
  matricule: string;
}

// Managed lists: catégories, villes, types de paiement.
export type LookupKind = "categories" | "villes" | "paymentTypes";

export interface LookupItem {
  id: string;
  name: string;
}

export interface GestionQueryParams {
  search?: string;
  page: number;
  pageSize: number;
}
