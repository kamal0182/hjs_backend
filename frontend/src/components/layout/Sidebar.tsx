import {
  Banknote,
  Contact,
  CreditCard,
  Fuel,
  LayoutDashboard,
  LogOut,
  MapPin,
  Tags,
  Truck,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  { items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }] },
  {
    title: "Features",
    items: [
      { label: "Clients", to: "/clients", icon: Users },
      { label: "Gazoil", to: "/gazoil", icon: Fuel },
      { label: "Clients Money", to: "/clients-money", icon: Wallet },
      { label: "My Charges", to: "/my-charges", icon: Banknote },
    ],
  },
  {
    title: "Gestion",
    items: [
      { label: "Utilisateurs", to: "/gestion/utilisateurs", icon: UserCog, adminOnly: true },
      { label: "Clients", to: "/gestion/clients", icon: Contact },
      { label: "Camions", to: "/gestion/camions", icon: Truck },
      { label: "Catégories", to: "/gestion/categories", icon: Tags },
      { label: "Villes", to: "/gestion/villes", icon: MapPin },
      { label: "Types de paiement", to: "/gestion/types-paiement", icon: CreditCard },
    ],
  },
];

interface SidebarProps {
  /** Only used below lg, where the sidebar is an off-canvas drawer. */
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0",
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Truck size={18} />
          </div>
          <span className="text-lg font-semibold text-slate-900">HJS Transport</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>
  
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => !item.adminOnly || user?.isAdmin);
            if (items.length === 0) return null;
            return (
              <div key={section.title ?? "main"} className="space-y-1">
                {section.title && (
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                )}
                {items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      ].join(" ")
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
  
        {user && (
          <div className="border-t border-slate-200 px-3 py-4">
            <div className="mb-2 px-3">
              <p className="truncate text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">{user.isAdmin ? "Administrateur" : "Utilisateur"}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut size={18} />
              Se déconnecter
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
