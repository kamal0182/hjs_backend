import { apiClientsService } from "./apiClientsService";
import type { ClientsService } from "./clientsService";

// Single point of truth for which implementation the app uses.
// `mockClientsService` implements the same interface for offline work.
export const clientsService: ClientsService = apiClientsService;

export type { ClientsService } from "./clientsService";
