import {
  LayoutDashboard,
  Wallet,
  CalendarClock,
  Store,
  Lightbulb,
  Users,
  ClipboardList,
} from "lucide-react";

/** Every destination in the app — used by the sidebar and the mobile bar. */
export const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/budget", label: "Budget", icon: Wallet },
  { path: "/timeline", label: "Timeline", icon: CalendarClock },
  { path: "/vendors", label: "Vendors", icon: Store },
  { path: "/ideas", label: "Idea Engine", icon: Lightbulb },
  { path: "/guests", label: "Guests", icon: Users },
  { path: "/run-sheet", label: "Day-of Run Sheet", icon: ClipboardList },
];

const MOBILE_PATHS = ["/", "/budget", "/timeline", "/vendors", "/guests"];

/** The five thumb-reachable destinations on mobile. */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => MOBILE_PATHS.includes(item.path));