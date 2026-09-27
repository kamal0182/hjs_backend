import { apiGestionService } from "./apiGestionService";
import type { GestionService } from "./gestionService";

// Single point of truth for which implementation the app uses.
export const gestionService: GestionService = apiGestionService;

export type { GestionService } from "./gestionService";
