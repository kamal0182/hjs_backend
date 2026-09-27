import type { ClientOption, Commande, CommandeLine } from "../../types/commande";

const CATEGORIES = ["Ramla", "Kayas", "Toufna"];

export const CLIENT_SEEDS: ClientOption[] = [
  { id: "c1", name: "John Doe", company: "ABC Logistics", city: "Casablanca" },
  { id: "c2", name: "Jane Doe", company: "XYZ Trading", city: "Rabat" },
  { id: "c3", name: "Karim El Amrani", company: "Atlas Import Export", city: "Marrakech" },
  { id: "c4", name: "Sara Bennis", company: "Nord Distribution", city: "Tanger" },
  { id: "c5", name: "Youssef Idrissi", company: "Fes Textile Group", city: "Fès" },
  { id: "c6", name: "Amina Chraibi", company: "Souss Agro", city: "Agadir" },
  { id: "c7", name: "Mehdi Tazi", company: "Meknes Industries", city: "Meknès" },
  { id: "c8", name: "Nadia Alaoui", company: "Oujda Cargo", city: "Oujda" },
  { id: "c9", name: "Omar Fassi", company: "ABC Logistics", city: "Casablanca" },
  { id: "c10", name: "Leila Benjelloun", company: "Rabat Freight", city: "Rabat" },
  { id: "c11", name: "Hicham Ouazzani", company: "Atlas Import Export", city: "Marrakech" },
  { id: "c12", name: "Salma Berrada", company: "Nord Distribution", city: "Tanger" },
];

const COMMENTS = [
  "Livraison urgente demandée avant vendredi.",
  "Client fidèle, toujours ponctuel pour le paiement.",
  "Merci de vérifier l'emballage avant expédition, dernière fois le colis était endommagé à la réception.",
  "Préfère être contacté par email plutôt que par téléphone.",
  "Nouvelle adresse de livraison à confirmer.",
  "",
  "Commande récurrente mensuelle.",
  "Demande une facture détaillée avec TVA.",
  "Retard de livraison la fois précédente, à surveiller.",
  "RAS",
];

const STREET_NAMES = [
  "Rue des Fleurs",
  "Avenue Hassan II",
  "Boulevard Mohammed V",
  "Rue de la Liberté",
  "Avenue des FAR",
  "Rue Ibn Sina",
  "Boulevard Zerktouni",
];

function buildAddress(seed: number, city: string): string {
  const street = STREET_NAMES[seed % STREET_NAMES.length];
  const number = 1 + (seed % 200);
  return `${number} ${street}, ${city}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildLines(seed: number): CommandeLine[] {
  const lineCount = 1 + (seed % 3); // 1 to 3 category lines per commande
  const lines: CommandeLine[] = [];
  for (let i = 0; i < lineCount; i++) {
    const category = CATEGORIES[(seed + i) % CATEGORIES.length];
    if (lines.some((line) => line.category === category)) continue;
    lines.push({ category, quantity: 1 + ((seed + i * 3) % 12) });
  }
  return lines;
}

function buildMockCommandes(): Commande[] {
  const commandes: Commande[] = [];
  let counter = 1;

  const offsets = [0, 0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 14, 15, 18, 20, 22, 25, 28, 30];

  CLIENT_SEEDS.forEach((client, clientIndex) => {
    const ordersForClient = 2 + (clientIndex % 4); // 2 to 5 commandes per client
    for (let i = 0; i < ordersForClient; i++) {
      const offset = offsets[(clientIndex * 3 + i) % offsets.length];
      commandes.push({
        id: `cmd-${counter}`,
        clientId: client.id,
        clientName: client.name,
        company: client.company,
        commandeRef: `CMD-${String(counter).padStart(3, "0")}`,
        lines: buildLines(clientIndex + i),
        date: daysAgo(offset),
        comment: COMMENTS[(clientIndex + i) % COMMENTS.length],
        city: client.city,
        address: buildAddress(clientIndex + i, client.city),
      });
      counter++;
    }
  });

  return commandes.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const MOCK_COMMANDES: Commande[] = buildMockCommandes();
