import type {
  ClientOption,
  ClientsQueryParams,
  ClientsStats,
  Commande,
  CreateCommandeInput,
  PaginatedResult,
} from "../../types/commande";
import type { ClientsService } from "./clientsService";
import { CLIENT_SEEDS, MOCK_COMMANDES } from "./mockData";

const SIMULATED_DELAY_MS = 400;

function wait<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesFilters(commande: Commande, params: ClientsQueryParams): boolean {
  if (params.search) {
    const search = normalize(params.search);
    const matchesSearch =
      normalize(commande.clientName).includes(search) ||
      normalize(commande.company).includes(search);
    if (!matchesSearch) return false;
  }

  if (params.city && commande.city !== params.city) {
    return false;
  }

  if (params.date && commande.date !== params.date) {
    return false;
  }

  return true;
}

let nextRef =
  MOCK_COMMANDES.reduce((max, c) => {
    const n = Number(c.commandeRef.replace("CMD-", ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0) + 1;

export const mockClientsService: ClientsService = {
  async getCommandes(params: ClientsQueryParams): Promise<PaginatedResult<Commande>> {
    const filtered = MOCK_COMMANDES.filter((commande) => matchesFilters(commande, params));

    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;

    return wait({
      data: filtered.slice(start, end),
      total: filtered.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  },

  async getStats(): Promise<ClientsStats> {
    const today = todayISO();
    const uniqueClients = new Set(MOCK_COMMANDES.map((c) => c.clientId));
    const uniqueCities = new Set(MOCK_COMMANDES.map((c) => c.city));
    const commandesAujourdhui = MOCK_COMMANDES.filter((c) => c.date === today).length;

    return wait({
      totalClients: uniqueClients.size,
      totalCommandes: MOCK_COMMANDES.length,
      commandesAujourdhui,
      villesCouvertes: uniqueCities.size,
    });
  },

  async getCities(): Promise<string[]> {
    const cities = Array.from(new Set(MOCK_COMMANDES.map((c) => c.city))).sort();
    return wait(cities);
  },

  async getClients(): Promise<ClientOption[]> {
    return wait(CLIENT_SEEDS);
  },

  async createCommande(input: CreateCommandeInput): Promise<Commande> {
    const client = CLIENT_SEEDS.find((c) => c.id === input.clientId);
    if (!client) {
      throw new Error("Client introuvable.");
    }

    const commande: Commande = {
      id: `cmd-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      company: client.company,
      commandeRef: `CMD-${String(nextRef++).padStart(3, "0")}`,
      lines: input.lines,
      date: input.date,
      city: input.city,
      address: input.address,
      comment: input.comment,
    };

    MOCK_COMMANDES.unshift(commande);
    return wait(commande);
  },

  async updateCommande(id: string, input: CreateCommandeInput): Promise<Commande> {
    const index = MOCK_COMMANDES.findIndex((c) => c.id === id);
    const client = CLIENT_SEEDS.find((c) => c.id === input.clientId);
    if (index === -1 || !client) throw new Error("Commande introuvable.");
    MOCK_COMMANDES[index] = {
      ...MOCK_COMMANDES[index],
      ...input,
      clientName: client.name,
      company: client.company,
    };
    return wait(MOCK_COMMANDES[index]);
  },

  async deleteCommande(id: string): Promise<void> {
    const index = MOCK_COMMANDES.findIndex((c) => c.id === id);
    if (index !== -1) MOCK_COMMANDES.splice(index, 1);
    return wait(undefined);
  },
};
