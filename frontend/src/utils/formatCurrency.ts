const formatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Renders a price consistently across the app in Moroccan Dirhams.
export function formatCurrency(value: number): string {
  return `${formatter.format(value)} DH`;
}
