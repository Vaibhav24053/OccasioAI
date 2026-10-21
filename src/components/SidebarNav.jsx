import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useEvent } from "@/lib/EventContext";
import EventSwitcher from "@/components/EventSwitcher";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

/** Primary navigation — the same list drives the mobile drawer. */
export default function SidebarNav({ onNavigate }) {
  const { activeEvent } = useEvent();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand text-white shadow-soft" aria-hidden="true">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg text-foreground">OccasioAI</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Event chief-of-staff
          </p>
        </div>
      </div>

      <EventSwitcher />

      <nav aria-label="Main" className="flex-1 overflow-y-auto hide-scrollbar">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const disabled = !activeEvent && item.path !== "/";
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  onClick={(e) => {
                    if (disabled) e.preventDefault();
                    else onNavigate?.();
                  }}
                  aria-disabled={disabled}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                      isActive && !disabled
                        ? "bg-secondary text-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      disabled && "pointer-events-none opacity-40",
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => {
            navigate("/onboarding");
            onNavigate?.();
          }}
          className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-primary transition hover:bg-secondary/60"
        >
          + Start another event
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  );
}