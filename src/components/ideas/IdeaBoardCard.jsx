import { Bookmark, Music, Sparkles, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";

/** One concept board: palette, decor, music, food and the culture notes behind it. */
export default function IdeaBoardCard({ idea, currency = "INR", saved = true, onSave, onDelete }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft ring-hairline">
      <div className="h-2 w-full" style={{ background: idea.palette?.[0] || "#7C5CFF" }} aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <header>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl leading-tight text-foreground">{idea.title}</h3>
            <Badge variant="secondary" className="shrink-0 rounded-full">
              {idea.tier}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm italic text-muted-foreground">{idea.tagline}</p>
        </header>

        {idea.palette?.length ? (
          <div className="flex gap-2">
            {idea.palette.slice(0, 5).map((hex) => (
              <div key={hex} className="flex-1 text-center">
                <span
                  className="block h-10 w-full rounded-xl ring-hairline"
                  style={{ background: hex }}
                  aria-hidden="true"
                />
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {hex}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {idea.decor_ideas?.length ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Decor</h4>
            <ul className="mt-1.5 space-y-1 text-sm text-foreground">
              {idea.decor_ideas.map((d) => (
                <li key={d}>• {d}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {idea.music_mood ? (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Music className="h-3 w-3" aria-hidden="true" /> Music
              </h4>
              <p className="mt-1 text-sm text-foreground">{idea.music_mood}</p>
            </section>
          ) : null}
          {idea.food_stations?.length ? (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Utensils className="h-3 w-3" aria-hidden="true" /> Food
              </h4>
              <ul className="mt-1 space-y-0.5 text-sm text-foreground">
                {idea.food_stations.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {idea.activities?.length ? (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Flow of the day</h4>
            <ol className="mt-1.5 space-y-1 text-sm text-foreground">
              {idea.activities.map((a, i) => (
                <li key={a}>
                  <span className="mr-2 font-semibold text-primary">{i + 1}</span>
                  {a}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {idea.culture_notes ? (
          <p className="rounded-2xl bg-secondary/70 px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {idea.culture_notes}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {idea.estimated_cost ? (
            <span className="text-xs text-muted-foreground">
              roughly {formatMoney(idea.estimated_cost, currency)} to pull off
            </span>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 gap-2">
            {onSave ? (
              <Button size="sm" className="rounded-full" onClick={() => onSave(idea)}>
                <Bookmark className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Save
              </Button>
            ) : null}
            {saved && onDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => onDelete(idea)}
                aria-label={`Remove idea ${idea.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}