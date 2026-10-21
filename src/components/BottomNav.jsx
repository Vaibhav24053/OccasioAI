import { NavLink } from "react-router-dom";
import { MOBILE_NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Thumb-reachable mobile navigation. */
export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 backdrop-blur-xl lg:hidden no-print"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} aria-hidden="true" />
                    <span className="truncate">{item.label.split(" ")[0]}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}