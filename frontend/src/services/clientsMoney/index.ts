import { apiClientsMoneyService } from "./apiClientsMoneyService";
import type { ClientsMoneyService } from "./clientsMoneyService";

// Single point of truth for which implementation the app uses.
// `mockClientsMoneyService` implements the same interface for offline work.
export const clientsMoneyService: ClientsMoneyService = apiClientsMoneyService;

export type { ClientsMoneyService } from "./clientsMoneyService";
