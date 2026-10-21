import { useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "formal", label: "Formal" },
  { value: "funny", label: "Funny" },
  { value: "heartfelt", label: "Heartfelt" },
];

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hinglish", label: "Hinglish" },
];

/** Invitation drafts in the user's tone, English or Hinglish. */
export default function InviteComposer({ open, onOpenChange, event }) {
  const { toast } = useToast();
  const [tone, setTone] = useState("heartfelt");
  const [language, setLanguage] = useState("english");
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const write = async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const response = await base44.functions.invoke("generateInviteMessage", {
        tone,
        language,
        event: {
          name: event.name,
          occasion_name: event.occasion_name,
          event_type: event.event_type,
          event_date: event.event_date,
          guest_count: event.guest_count,
          city: event.city,
          venue_preference: event.venue_preference,
          theme: event.theme,
          culture: event.culture,
          must_haves: event.must_haves,
        },
      });
      setState({ loading: false, data: response.data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e?.message || "The assistant is unreachable." });
    }
  };

  const copy = async (text, label) => {
    await navigator.clipboard?.writeText(text || "");
    toast({ title: `${label} copied` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invitation drafts</DialogTitle>
          <DialogDescription>{formatDate(event?.event_date, "D MMMM YYYY")} · {event?.city || "your city"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tone</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  aria-pressed={tone === t.value}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition",
                    tone === t.value ? "gradient-brand text-white" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Language</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLanguage(l.value)}
                  aria-pressed={language === l.value}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition",
                    language === l.value ? "gradient-brand text-white" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={write} disabled={state.loading} className="w-full rounded-full">
            {state.loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Writing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> Write my invitation
              </>
            )}
          </Button>

          {state.error ? (
            <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          {state.data ? (
            <div className="space-y-4">
              <div className="rounded-3xl bg-secondary/70 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Full invitation</h3>
                  <Button variant="ghost" size="sm" onClick={() => copy(state.data.long_form, "Invitation")}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Copy
                  </Button>
                </div>
                {state.data.subject ? (
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Subject: {state.data.subject}</p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
                  {state.data.long_form}
                </p>
              </div>

              <div className="rounded-3xl bg-secondary/70 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">WhatsApp version</h3>
                  <Button variant="ghost" size="sm" onClick={() => copy(state.data.whatsapp, "WhatsApp message")}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Copy
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
                  {state.data.whatsapp}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}