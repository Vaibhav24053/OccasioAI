import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CULTURES,
  DATE_FLEXIBILITY,
  EVENT_TYPES,
  BUDGET_FLEXIBILITY,
  THEMES,
  VENUE_PREFERENCES,
} from "@/lib/budget";
import { CURRENCIES } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The intake interview. One question at a time, quick-pick chips or free text,
 * with the finished answers left above as a conversation transcript.
 */
const STEPS = [
  {
    key: "type",
    prompt: "Lovely. What are we celebrating?",
    fields: [{ name: "event_type", type: "chips", options: EVENT_TYPES, autoAdvance: true }],
  },
  {
    key: "occasion",
    prompt: "Tell me about it — and roughly how many people?",
    fields: [
      { name: "occasion_name", type: "text", placeholder: "My mom's 60th birthday" },
      { name: "guest_count", type: "number", placeholder: "Guest count", quick: [25, 50, 100, 250] },
    ],
  },
  {
    key: "date",
    prompt: "When is it, and how fixed is the date?",
    fields: [
      { name: "event_date", type: "date", label: "Event date" },
      { name: "date_flexibility", type: "chips", options: DATE_FLEXIBILITY },
    ],
  },
  {
    key: "place",
    prompt: "Which city, and where do you picture it happening?",
    fields: [
      { name: "city", type: "text", placeholder: "Jaipur" },
      { name: "venue_preference", type: "chips", options: VENUE_PREFERENCES },
    ],
  },
  {
    key: "budget",
    prompt: "Now the important bit — what's the total budget?",
    fields: [
      { name: "budget_total", type: "number", placeholder: "150000", label: "Total budget" },
      { name: "currency", type: "select", options: CURRENCIES },
      { name: "budget_flexibility", type: "chips", options: BUDGET_FLEXIBILITY },
    ],
    footnote: "Not sure yet? Pick strict — you can change it later.",
  },
  {
    key: "vibe",
    prompt: "How should the day feel, and which traditions matter?",
    fields: [
      { name: "theme", type: "chips", options: THEMES },
      { name: "culture", type: "chips", options: CULTURES },
    ],
  },
  {
    key: "dealbreakers",
    prompt: "Last one. What must happen, and what should I never suggest?",
    fields: [
      { name: "must_haves", type: "textarea", placeholder: "Live dhol, mom's favourite marigolds…" },
      { name: "no_gos", type: "textarea", placeholder: "No loud DJ after 10pm, no buffet…" },
    ],
  },
];

const DEFAULTS = { currency: "INR" };

function answeredLabel(step, answers) {
  const values = step.fields
    .map((field) => {
      const raw = answers[field.name];
      if (raw === undefined || raw === null || raw === "") return null;
      if (field.options) {
        const match = field.options.find((o) => o.value === raw);
        return match ? match.label || match.value : raw;
      }
      return String(raw);
    })
    .filter(Boolean);
  return values.join(" · ");
}

export default function IntakeChat({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(DEFAULTS);
  const bottomRef = useRef(null);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [index]);

  const set = (name, value) => {
    setAnswers((prev) => ({ ...prev, [name]: value }));
    const field = step.fields.find((f) => f.name === name);
    // A single quick-pick question advances on its own, like a real conversation.
    if (field?.autoAdvance && step.fields.length === 1) {
      setTimeout(() => setIndex((i) => Math.min(i + 1, STEPS.length - 1)), 220);
    }
  };

  const requiredFilled = step.fields.every((field) => {
    if (["must_haves", "no_gos", "guest_count", "budget_total", "occasion_name", "city", "event_date"].includes(field.name)) {
      return answers[field.name] !== undefined && answers[field.name] !== "";
    }
    return true;
  });

  const next = () => {
    if (isLast) onComplete(answers);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full gradient-brand transition-all duration-500"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {index + 1}/{STEPS.length}
        </span>
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {STEPS.slice(0, index).map((done) => (
          <div key={done.key} className="space-y-3">
            <div className="max-w-[85%] rounded-3xl rounded-tl-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">
              {done.prompt}
            </div>
            <div className="ml-auto max-w-[85%] rounded-3xl rounded-tr-lg px-4 py-3 text-sm text-white gradient-brand">
              {answeredLabel(done, answers) || "—"}
            </div>
          </div>
        ))}

        <div key={step.key} className="animate-rise space-y-4 pt-2">
          <div className="max-w-[85%] rounded-3xl rounded-tl-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            {step.prompt}
          </div>

          <div className="space-y-3 rounded-3xl bg-card p-4 shadow-soft ring-hairline">
            {step.fields.map((field) => (
              <div key={field.name}>
                {field.label && field.type !== "chips" ? (
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground" htmlFor={`f-${field.name}`}>
                    {field.label}
                  </label>
                ) : null}

                {field.type === "chips" ? (
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => {
                      const active = answers[field.name] === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => set(field.name, option.value)}
                          aria-pressed={active}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition",
                            active
                              ? "gradient-brand text-white shadow-soft"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                          )}
                        >
                          {option.emoji ? <span aria-hidden="true">{option.emoji}</span> : null}
                          {option.label}
                          {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : field.type === "select" ? (
                  <select
                    id={`f-${field.name}`}
                    value={answers[field.name] || ""}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={`f-${field.name}`}
                    value={answers[field.name] || ""}
                    placeholder={field.placeholder}
                    rows={2}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                ) : (
                  <>
                    <Input
                      id={`f-${field.name}`}
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      inputMode={field.type === "number" ? "numeric" : undefined}
                      value={answers[field.name] || ""}
                      placeholder={field.placeholder}
                      onChange={(e) => set(field.name, e.target.value)}
                    />
                    {field.quick ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {field.quick.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => set(field.name, String(q))}
                            className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/70"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ))}

            {step.footnote ? <p className="text-xs text-muted-foreground">{step.footnote}</p> : null}

            <div className="flex items-center justify-between pt-1">
              {index > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button onClick={next} disabled={!requiredFilled} className="rounded-full">
                {isLast ? "Build my blueprint" : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export { STEPS as INTAKE_STEPS };