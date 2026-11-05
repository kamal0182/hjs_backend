import { api } from "../../lib/apiClient";
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
import type { GazoilService } from "./gazoilService";

export const apiGazoilService: GazoilService = {
  getCamionsSummary(params: GazoilQueryParams) {
    return api.get<PaginatedResult<CamionSummary>>("/gazoil/camions/", { ...params });
  },

  getStats() {
    return api.get<GazoilStats>("/gazoil/camions/stats/");
  },

  getHistoryForMatricule(matricule: string) {
    return api.get<GazoilRecord[]>("/gazoil/records/", { matricule });
  },

  getMatricules() {
    return api.get<string[]>("/gazoil/camions/matricules/");
  },

  createRecord(input: CreateGazoilRecordInput) {
    return api.post<GazoilRecord>("/gazoil/records/", input);
  },

  updateRecord(id: string, input: CreateGazoilRecordInput) {
    return api.put<GazoilRecord>(`/gazoil/records/${id}/`, input);
  },

  deleteRecord(id: string) {
    return api.delete(`/gazoil/records/${id}/`);
  },

  getCommentsForMatricule(matricule: string) {
    return api.get<GazoilComment[]>("/gazoil/comments/", { matricule });
  },

  addComment(input: CreateGazoilCommentInput) {
    return api.post<GazoilComment>("/gazoil/comments/", input);
  },

  updateComment(id: string, input: CreateGazoilCommentInput) {
    return api.put<GazoilComment>(`/gazoil/comments/${id}/`, input);
  },

  deleteComment(id: string) {
    return api.delete(`/gazoil/comments/${id}/`);
  },
};
