import type { GazoilComment, GazoilRecord } from "../../types/gazoil";

const MATRICULES = [
  "12345-A-6",
  "45210-B-9",
  "78932-A-2",
  "10456-C-4",
  "63201-B-7",
  "29874-A-1",
  "51023-D-3",
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildMockGazoilRecords(): GazoilRecord[] {
  const records: GazoilRecord[] = [];
  let counter = 1;

  const offsets = [0, 2, 5, 8, 11, 15, 18, 22, 26, 30, 35, 40];

  MATRICULES.forEach((matricule, matriculeIndex) => {
    const fillCount = 3 + (matriculeIndex % 4); // 3 to 6 fill-ups per truck
    for (let i = 0; i < fillCount; i++) {
      const offset = offsets[(matriculeIndex * 2 + i) % offsets.length];
      records.push({
        id: `gaz-${counter}`,
        matricule,
        price: 400 + ((matriculeIndex * 37 + i * 53) % 600),
        date: daysAgo(offset),
      });
      counter++;
    }
  });

  return records.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const MOCK_GAZOIL_RECORDS: GazoilRecord[] = buildMockGazoilRecords();

let commentCounter = 1;
function makeComment(matricule: string, comment: string, offset: number): GazoilComment {
  return {
    id: `gazcom-${commentCounter++}`,
    matricule,
    comment,
    date: daysAgo(offset),
  };
}

export const MOCK_GAZOIL_COMMENTS: GazoilComment[] = [
  makeComment(MATRICULES[0], "Consommation plus élevée que d'habitude, à surveiller.", 3),
  makeComment(MATRICULES[0], "Vidange effectuée en même temps que le plein.", 20),
  makeComment(MATRICULES[2], "Chauffeur signale une petite fuite au niveau du réservoir.", 6),
];
