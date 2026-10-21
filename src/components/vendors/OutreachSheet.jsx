import { useEffect, useState } from "react";
import { Copy, Loader2, MessageCircle, Mail, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

/** AI-written first message to a vendor — WhatsApp short version plus a full email. */
export default function OutreachSheet({ open, onOpenChange, vendor, event, currency = "INR", onSaved }) {
  const { toast } = useToast();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [channel, setChannel] = useState("whatsapp");

  useEffect(() => {
    if (!open || !vendor) return;
    let cancelled = false;
    setState({ loading: true, data: null, error: null });
    (async () => {
      try {
        const response = await base44.functions.invoke("generateVendorOutreach", {
          vendor: {
            category: vendor.category,
            category_label: vendor.category_label,
            name: vendor.name,
            quoted_price: vendor.quoted_price,
            budget_allocated: vendor.budget_allocated,
          },
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
            no_gos: event.no_gos,
            budget_total: event.budget_total,
            currency,
          },
        });
        if (!cancelled) setState({ loading: false, data: response.data, error: null });
      } catch (e) {
        if (!cancelled) setState({ loading: false, data: null, error: e?.message || "The assistant is unreachable." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, vendor, event, currency]);

  const text = channel === "whatsapp" ? state.data?.whatsapp : state.data?.email;

  const copy = async () => {
    await navigator.clipboard?.writeText(text || "");
    toast({ title: "Copied", description: "Paste it into WhatsApp or your email app." });
  };

  const saveDraft = async () => {
    await base44.entities.Vendor.update(vendor.id, { outreach_draft: state.data?.whatsapp || "" });
    await onSaved?.();
    toast({ title: "Draft saved to this vendor" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display">
            Message for your {vendor?.category_label || vendor?.category}
          </SheetTitle>
          <SheetDescription>
            Written from your brief — {event?.guest_count} guests in {event?.city || "your city"}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex gap-2">
          <Button
            variant={channel === "whatsapp" ? "default" : "secondary"}
            size="sm"
            className="rounded-full"
            onClick={() => setChannel("whatsapp")}
          >
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" /> WhatsApp
          </Button>
          <Button
            variant={channel === "email" ? "default" : "secondary"}
            size="sm"
            className="rounded-full"
            onClick={() => setChannel("email")}
          >
            <Mail className="mr-2 h-4 w-4" aria-hidden="true" /> Email
          </Button>
        </div>

        {state.loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> writing your message…
          </div>
        ) : null}

        {state.error ? (
          <p role="alert" className="mt-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        {state.data ? (
          <div className="mt-5 space-y-5">
            <p className="whitespace-pre-wrap rounded-3xl bg-secondary/70 p-4 text-sm leading-relaxed text-secondary-foreground">
              {text}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button onClick={copy} className="rounded-full">
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Copy message
              </Button>
              <Button variant="outline" onClick={saveDraft} className="rounded-full">
                Save to this vendor
              </Button>
            </div>

            {(state.data.questions || []).length ? (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Ask them this before you commit
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {state.data.questions.map((q) => (
                    <li key={q} className="text-sm text-muted-foreground">
                      • {q}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}