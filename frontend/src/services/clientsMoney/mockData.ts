import type { ClientMoneyRecord, PaymentRecord } from "../../types/clientsMoney";

const PAYMENT_TYPES = ["Cash", "Traite", "Chèque"];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const SEED_CLIENTS: { name: string; montant: number; offset: number }[] = [
  { name: "John Doe", montant: 3200, offset: 35 },
  { name: "Jane Doe", montant: 1800, offset: 28 },
  { name: "Karim El Amrani", montant: 5400, offset: 40 },
  { name: "Sara Bennis", montant: 2100, offset: 22 },
  { name: "Youssef Idrissi", montant: 900, offset: 15 },
  { name: "Amina Chraibi", montant: 4700, offset: 33 },
  { name: "Mehdi Tazi", montant: 1500, offset: 10 },
  { name: "Nadia Alaoui", montant: 2600, offset: 5 },
];

function buildMockRecords(): ClientMoneyRecord[] {
  return SEED_CLIENTS.map((seed, index) => ({
    id: `rec-${index + 1}`,
    clientName: seed.name,
    montant: seed.montant,
    date: daysAgo(seed.offset),
  }));
}

export const MOCK_CLIENT_MONEY_RECORDS: ClientMoneyRecord[] = buildMockRecords();

function buildMockPayments(): PaymentRecord[] {
  const payments: PaymentRecord[] = [];
  let counter = 1;
  const offsets = [0, 2, 6, 9, 14, 18];

  MOCK_CLIENT_MONEY_RECORDS.forEach((record, index) => {
    const paymentCount = index % 3; // 0 to 2 payments; some records have none yet
    for (let i = 0; i < paymentCount; i++) {
      const offset = offsets[(index * 2 + i) % offsets.length];
      payments.push({
        id: `paypay-${counter}`,
        recordId: record.id,
        paymentType: PAYMENT_TYPES[(index + i) % PAYMENT_TYPES.length],
        price: 300 + ((index * 47 + i * 61) % 2000),
        date: daysAgo(offset),
      });
      counter++;
    }
  });

  return payments.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const MOCK_PAYMENTS: PaymentRecord[] = buildMockPayments();
