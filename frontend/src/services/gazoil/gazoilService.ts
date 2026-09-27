import type { PaginatedResult } from "../../types/commande";
import type {
  CamionSummary,
  CreateGazoilCommentInput,
  CreateGazoilRecordInput,
  GazoilComment,
  GazoilQueryParams,
  GazoilRecord,
  GazoilStats,
} from "../../types/gazoil";

// Contract the Gazoil page depends on. Swap `mockGazoilService` for a real
// HTTP-backed implementation in `index.ts` without touching components.
export interface GazoilService {
  getCamionsSummary(params: GazoilQueryParams): Promise<PaginatedResult<CamionSummary>>;
  getStats(): Promise<GazoilStats>;
  getHistoryForMatricule(matricule: string): Promise<GazoilRecord[]>;
  getMatricules(): Promise<string[]>;
  createRecord(input: CreateGazoilRecordInput): Promise<GazoilRecord>;
  getCommentsForMatricule(matricule: string): Promise<GazoilComment[]>;
  addComment(input: CreateGazoilCommentInput): Promise<GazoilComment>;
}
