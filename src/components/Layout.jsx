import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { useEvent } from "@/lib/EventContext";
import SidebarNav from "@/components/SidebarNav";
import BottomNav from "@/components/BottomNav";
import CompanionDock from "@/components/CompanionDock";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/** Mobile top bar: menu drawer + current event name. */
function MobileTopBar({ onOpenNav }) {
  const { activeEvent } = useEvent();
  return (
    <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Button variant="ghost" size="icon" onClick={onOpenNav} aria-label="Open navigation">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base leading-tight text-foreground">
          {activeEvent?.name || "OccasioAI"}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {activeEvent ? "Plan in progress" : "Start planning"}
        </p>
      </div>
    </header>
  );
}

/** The chrome around every logged-in screen. */
function LayoutShell() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen gradient-veil">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-border/70 bg-card/80 backdrop-blur-xl lg:block">
        <SidebarNav />
      </aside>

      <MobileTopBar onOpenNav={() => setNavOpen(true)} />

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="lg:pl-[272px]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-20 lg:pt-10">
          <div key={window.location.pathname} className="animate-rise">
            <Outlet />
          </div>
        </div>
      </main>

      <BottomNav />
      <CompanionDock />
    </div>
  );
}

export default function Layout() {
  // The plan store is provided above the router so onboarding shares it.
  return <LayoutShell />;
}