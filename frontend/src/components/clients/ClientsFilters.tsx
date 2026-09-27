import { Search } from "lucide-react";

interface ClientsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  cities: string[];
  date: string;
  onDateChange: (value: string) => void;
}

export function ClientsFilters({
  search,
  onSearchChange,
  city,
  onCityChange,
  cities,
  date,
  onDateChange,
}: ClientsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="relative w-full sm:max-w-xs">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom ou entreprise…"
          className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />

        {(city || date || search) && (
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onCityChange("");
              onDateChange("");
            }}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
