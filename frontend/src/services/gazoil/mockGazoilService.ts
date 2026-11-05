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
import { MOCK_GAZOIL_COMMENTS, MOCK_GAZOIL_RECORDS } from "./mockData";

const SIMULATED_DELAY_MS = 400;

function wait<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function buildCamionsSummary(): CamionSummary[] {
  const byMatricule = new Map<string, GazoilRecord[]>();
  for (const record of MOCK_GAZOIL_RECORDS) {
    const existing = byMatricule.get(record.matricule) ?? [];
    existing.push(record);
    byMatricule.set(record.matricule, existing);
  }

  return Array.from(byMatricule.entries()).map(([matricule, records]) => {
    const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
    return {
      matricule,
      latestPrice: sorted[0].price,
      latestDate: sorted[0].date,
      recordsCount: records.length,
      totalPrice: records.reduce((sum, r) => sum + r.price, 0),
      commentsCount: MOCK_GAZOIL_COMMENTS.filter((c) => c.matricule === matricule).length,
    };
  });
}

let nextId = MOCK_GAZOIL_RECORDS.length + 1;
let nextCommentId = MOCK_GAZOIL_COMMENTS.length + 1;

export const mockGazoilService: GazoilService = {
  async getCamionsSummary(params: GazoilQueryParams): Promise<PaginatedResult<CamionSummary>> {
    let summaries = buildCamionsSummary().sort((a, b) => (a.latestDate < b.latestDate ? 1 : -1));

    if (params.search) {
      const search = normalize(params.search);
      summaries = summaries.filter((s) => normalize(s.matricule).includes(search));
    }

    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;

    return wait({
      data: summaries.slice(start, end),
      total: summaries.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  },

  async getStats(): Promise<GazoilStats> {
    const uniqueMatricules = new Set(MOCK_GAZOIL_RECORDS.map((r) => r.matricule));
    return wait({
      totalPriceAll: MOCK_GAZOIL_RECORDS.reduce((sum, r) => sum + r.price, 0),
      totalRecords: MOCK_GAZOIL_RECORDS.length,
      totalCamions: uniqueMatricules.size,
    });
  },

  async getHistoryForMatricule(matricule: string): Promise<GazoilRecord[]> {
    const records = MOCK_GAZOIL_RECORDS.filter((r) => r.matricule === matricule).sort((a, b) =>
      a.date < b.date ? 1 : -1,
    );
    return wait(records);
  },

  async getMatricules(): Promise<string[]> {
    const matricules = Array.from(new Set(MOCK_GAZOIL_RECORDS.map((r) => r.matricule))).sort();
    return wait(matricules);
  },

  async createRecord(input: CreateGazoilRecordInput): Promise<GazoilRecord> {
    const record: GazoilRecord = {
      id: `gaz-${nextId++}`,
      matricule: input.matricule.trim(),
      price: input.price,
      date: input.date,
    };
    MOCK_GAZOIL_RECORDS.unshift(record);
    return wait(record);
  },

  async getCommentsForMatricule(matricule: string): Promise<GazoilComment[]> {
    const comments = MOCK_GAZOIL_COMMENTS.filter((c) => c.matricule === matricule).sort((a, b) =>
      a.date < b.date ? 1 : -1,
    );
    return wait(comments);
  },

  async addComment(input: CreateGazoilCommentInput): Promise<GazoilComment> {
    const comment: GazoilComment = {
      id: `gazcom-${nextCommentId++}`,
      matricule: input.matricule,
      comment: input.comment,
      date: input.date,
    };
    MOCK_GAZOIL_COMMENTS.unshift(comment);
    return wait(comment);
  },

  async updateRecord(id: string, input: CreateGazoilRecordInput): Promise<GazoilRecord> {
    const index = MOCK_GAZOIL_RECORDS.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Plein introuvable.");
    MOCK_GAZOIL_RECORDS[index] = { ...MOCK_GAZOIL_RECORDS[index], ...input, matricule: input.matricule.trim() };
    return wait(MOCK_GAZOIL_RECORDS[index]);
  },

  async deleteRecord(id: string): Promise<void> {
    const index = MOCK_GAZOIL_RECORDS.findIndex((r) => r.id === id);
    if (index !== -1) MOCK_GAZOIL_RECORDS.splice(index, 1);
    return wait(undefined);
  },

  async updateComment(id: string, input: CreateGazoilCommentInput): Promise<GazoilComment> {
    const index = MOCK_GAZOIL_COMMENTS.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Commentaire introuvable.");
    MOCK_GAZOIL_COMMENTS[index] = { ...MOCK_GAZOIL_COMMENTS[index], ...input };
    return wait(MOCK_GAZOIL_COMMENTS[index]);
  },

  async deleteComment(id: string): Promise<void> {
    const index = MOCK_GAZOIL_COMMENTS.findIndex((c) => c.id === id);
    if (index !== -1) MOCK_GAZOIL_COMMENTS.splice(index, 1);
    return wait(undefined);
  },
};
