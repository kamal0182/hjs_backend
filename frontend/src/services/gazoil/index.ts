import { apiGazoilService } from "./apiGazoilService";
import type { GazoilService } from "./gazoilService";

// Single point of truth for which implementation the app uses.
// `mockGazoilService` implements the same interface for offline work.
export const gazoilService: GazoilService = apiGazoilService;

export type { GazoilService } from "./gazoilService";
