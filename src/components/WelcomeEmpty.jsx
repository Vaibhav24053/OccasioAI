import { Link } from "react-router-dom";
import { CalendarClock, PiggyBank, Sparkles, Store, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROMISES = [
  { icon: Wand2, title: "Tell me the idea", body: "A chat, not a form. Seven quick questions and I have everything I need." },
  { icon: PiggyBank, title: "Get a real budget", body: "Your total split across venue, food, decor, photos and a 10% buffer." },
  { icon: CalendarClock, title: "Never miss a step", body: "A task timeline that counts backwards from your date and adjusts itself." },
  { icon: Store, title: "Tame the vendors", body: "Who to book, who to chase, what to pay — with outreach messages written for you." },
];

/** First-run experience: the promise of the product, then straight into intake. */
export default function WelcomeEmpty() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] gradient-brand px-6 py-12 text-white shadow-lift sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-gold/40 blur-3xl animate-float"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">OccasioAI</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] sm:text-6xl">
          From “I should plan something” to a plan you can actually run.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
          Weddings, birthdays, baby showers, corporate dos and community gatherings — tell me about
          yours and I'll build the budget, timeline, vendor list and ideas around it.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="rounded-full bg-white text-foreground hover:bg-white/90">
            <Link to="/onboarding">
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> Plan my event
            </Link>
          </Button>
          <span className="text-sm text-white/80">Takes about a minute.</span>
        </div>
      </section>

      <section aria-label="What OccasioAI does" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PROMISES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-3xl bg-card p-5 shadow-soft ring-hairline">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}