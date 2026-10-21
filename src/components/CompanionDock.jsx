import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Sparkles, Wand2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import { buildPlanContext } from "@/lib/planContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STARTERS = [
  "Can I afford a live band?",
  "What should I do this week?",
  "Where am I overspending?",
  "Give me a low-cost decor idea",
];

/**
 * The planning companion: a docked assistant available on every screen that
 * answers using the user's real plan numbers.
 */
export default function CompanionDock() {
  const { activeEvent } = useEvent();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [context, setContext] = useState("");
  const scrollRef = useRef(null);

  // Gather the plan brief the first time the dock is opened for this event.
  useEffect(() => {
    if (!open || !activeEvent || context) return;
    (async () => {
      const [categories, expenses, tasks, vendors, guests, runSheet] = await Promise.all([
        base44.entities.BudgetCategory.filter({ event_id: activeEvent.id }, { limit: 50 }),
        base44.entities.Expense.filter({ event_id: activeEvent.id }, { limit: 300 }),
        base44.entities.Task.filter({ event_id: activeEvent.id }, { limit: 200 }),
        base44.entities.Vendor.filter({ event_id: activeEvent.id }, { limit: 60 }),
        base44.entities.Guest.filter({ event_id: activeEvent.id }, { limit: 300 }),
        base44.entities.RunSheet.filter({ event_id: activeEvent.id }, { limit: 100 }),
      ]);
      setContext(
        buildPlanContext({
          event: activeEvent,
          categories: categories.items ?? [],
          expenses: expenses.items ?? [],
          tasks: tasks.items ?? [],
          vendors: vendors.items ?? [],
          guests: guests.items ?? [],
          runSheet: runSheet.items ?? [],
        }),
      );
    })();
  }, [open, activeEvent, context]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ask = async (question) => {
    const text = (question ?? input).trim();
    if (!text || thinking) return;
    const history = messages.map((m) => `${m.role === "user" ? "User" : "OccasioAI"}: ${m.content}`).join("\n");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setThinking(true);
    try {
      const response = await base44.functions.invoke("plannerChat", {
        question: text,
        context: context || "No plan data available.",
        history,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data?.answer || "I couldn't reach your plan just now — try again in a moment." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I couldn't reach your plan just now — try again in a moment." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  if (!activeEvent) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        aria-label="Open the planning companion"
        className={cn(
          "no-print fixed bottom-20 right-4 z-40 h-14 gap-2 rounded-full px-5 gradient-brand text-white shadow-lift transition hover:scale-[1.03] lg:bottom-8 lg:right-8",
        )}
      >
        <Wand2 className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-semibold">Ask AI</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* the header carries its own close button, so the panel does not render a second one */}
        <SheetContent side="right" hideClose className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white" aria-hidden="true">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="font-display text-base">Planning companion</SheetTitle>
              <p className="truncate text-xs text-muted-foreground">{activeEvent.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close companion">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  I can see your whole plan — budget, timeline, vendors and guests. Ask me anything.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => ask(starter)}
                      className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "gradient-brand text-white"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {message.role === "user" ? (
                    message.content
                  ) : (
                    <div className="prose prose-sm max-w-none [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_strong]:font-semibold">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {thinking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> checking your numbers…
              </div>
            ) : null}
          </div>

          <form
            className="safe-bottom flex items-center gap-2 border-t border-border px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Can I afford a live band?"
              aria-label="Ask the planning companion"
            />
            <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Send question">
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}