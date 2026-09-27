import { apiChargesService } from "./apiChargesService";
import type { ChargesService } from "./chargesService";

// Single point of truth for which implementation the app uses.
// `mockChargesService` implements the same interface for offline work.
export const chargesService: ChargesService = apiChargesService;

export type { ChargesService } from "./chargesService";
