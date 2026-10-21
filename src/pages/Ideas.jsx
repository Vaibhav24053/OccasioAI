import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Loader2, Sparkles, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import PageHeader from "@/components/PageHeader";
import IdeaBoardCard from "@/components/ideas/IdeaBoardCard";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { celebrateSmall, showUndo } from "@/lib/feedback";
import { isTightBudget } from "@/lib/budget";

const TIER_LEGEND = [
  { tier: "₹", label: "Budget-friendly" },
  { tier: "₹₹", label: "Mid-range" },
  { tier: "₹₹₹", label: "Premium" },
];

/** Personalised idea engine — three concept boards per tap, budget and culture aware. */
export default function Ideas() {
  const { activeEvent } = useEvent();
  const { toast } = useToast();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const currency = activeEvent?.currency || "INR";

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const page = await base44.entities.Idea.filter(
      { event_id: activeEvent.id },
      { sort: "-created_date", limit: 40 },
    );
    setSaved(page.items ?? []);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const surprise = async () => {
    setGenerating(true);
    setError(null);
    setBoards(null);
    try {
      const response = await base44.functions.invoke("generateIdeas", {
        event: {
          name: activeEvent.name,
          occasion_name: activeEvent.occasion_name,
          event_type: activeEvent.event_type,
          event_date: activeEvent.event_date,
          guest_count: activeEvent.guest_count,
          city: activeEvent.city,
          venue_preference: activeEvent.venue_preference,
          theme: activeEvent.theme,
          culture: activeEvent.culture,
          must_haves: activeEvent.must_haves,
          no_gos: activeEvent.no_gos,
          budget_total: activeEvent.budget_total,
          budget_flexibility: activeEvent.budget_flexibility,
          currency,
          tight_budget: isTightBudget(activeEvent),
        },
        avoid_titles: saved.map((s) => s.title),
      });
      setBoards(response.data?.boards || []);
    } catch (e) {
      setError(e?.message || "The assistant is unreachable.");
    } finally {
      setGenerating(false);
    }
  };

  const saveBoard = async (board) => {
    await base44.entities.Idea.create({ ...board, event_id: activeEvent.id, saved: true });
    setBoards((prev) => prev.filter((b) => b.title !== board.title));
    await load();
    celebrateSmall();
    toast({ title: "Saved to your plan", description: board.title });
  };

  const remove = async (idea) => {
    await base44.entities.Idea.delete(idea.id);
    await load();
    const { id, ...rest } = idea;
    showUndo(toast, {
      title: "Idea removed",
      description: idea.title,
      undo: async () => {
        await base44.entities.Idea.create(rest);
        await load();
      },
    });
  };

  if (!activeEvent) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="No event selected"
        description="Create an event and I'll design concepts around your budget and traditions."
        action={<Button asChild><a href="/onboarding">Plan an event</a></Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Idea engine"
        title="Concepts, not Pinterest noise"
        subtitle={`Boards built for ${activeEvent.guest_count || "your"} guests in ${activeEvent.city || "your city"}, priced to the budget you actually have.`}
        actions={
          <Button onClick={surprise} disabled={generating} className="rounded-full gradient-brand text-white">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Designing…
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" /> Surprise me
              </>
            )}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-card p-4 text-sm shadow-soft ring-hairline">
        <span className="font-semibold text-foreground">Cost tiers:</span>
        {TIER_LEGEND.map((t) => (
          <span key={t.tier} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="font-semibold text-primary">{t.tier}</span> {t.label}
          </span>
        ))}
        {isTightBudget(activeEvent) ? (
          <span className="ml-auto rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-foreground">
            Tight budget — I'll weight ideas towards ₹
          </span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {generating ? (
        <div className="grid gap-4 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : null}

      {boards?.length ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Three ways this could go
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {boards.map((board) => (
              <IdeaBoardCard key={board.title} idea={board} currency={currency} saved={false} onSave={saveBoard} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl text-foreground">Saved in your plan</h2>
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <EmptyState
            icon={Wand2}
            title="Nothing saved yet"
            description="Tap “Surprise me” and I'll put three tailored concepts in front of you — decor palette, music mood, food stations and all."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {saved.map((idea) => (
              <IdeaBoardCard key={idea.id} idea={idea} currency={currency} saved onDelete={remove} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}