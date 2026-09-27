import type { ChargeRecord } from "../../types/charges";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const SEED_CHARGES: { comment: string; montant: number; offset: number }[] = [
  { comment: "Assurance flotte de camions", montant: 4500, offset: 30 },
  { comment: "Réparation moteur camion 45210-B-9", montant: 3200, offset: 25 },
  { comment: "Loyer du dépôt", montant: 6000, offset: 20 },
  { comment: "Fournitures de bureau", montant: 350, offset: 18 },
  { comment: "Salaire chauffeur intérimaire", montant: 2800, offset: 14 },
  { comment: "Péage autoroute", montant: 420, offset: 10 },
  { comment: "Entretien pneus", montant: 1500, offset: 6 },
  { comment: "Frais de télécommunication", montant: 280, offset: 2 },
];

function buildMockCharges(): ChargeRecord[] {
  return SEED_CHARGES.map((seed, index) => ({
    id: `charge-${index + 1}`,
    date: daysAgo(seed.offset),
    comment: seed.comment,
    montant: seed.montant,
  })).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const MOCK_CHARGES: ChargeRecord[] = buildMockCharges();
