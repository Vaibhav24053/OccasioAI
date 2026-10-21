import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, Store, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import PageHeader from "@/components/PageHeader";
import StatGrid from "@/components/dashboard/StatGrid";
import VendorCard from "@/components/vendors/VendorCard";
import VendorDialog from "@/components/vendors/VendorDialog";
import QuoteRequestDialog from "@/components/vendors/QuoteRequestDialog";
import OutreachSheet from "@/components/vendors/OutreachSheet";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { celebrateSmall, showUndo } from "@/lib/feedback";
import { VENDOR_STATUS, vendorStatusIndex } from "@/lib/budget";
import { formatMoney } from "@/lib/format";

/** Vendor command centre: what to book, who to chase, what to pay. */
export default function Vendors() {
  const { activeEvent } = useEvent();
  const { toast } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, vendor: null });
  const [draftFor, setDraftFor] = useState(null);
  const [quoteFor, setQuoteFor] = useState(null);
  const currency = activeEvent?.currency || "INR";

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const page = await base44.entities.Vendor.filter(
      { event_id: activeEvent.id },
      { sort: "sort_order", limit: 80 },
    );
    setVendors(page.items ?? []);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const quoted = vendors.reduce((sum, v) => sum + (Number(v.quoted_price) || 0), 0);
    const allocated = vendors.reduce((sum, v) => sum + (Number(v.budget_allocated) || 0), 0);
    const booked = vendors.filter((v) => vendorStatusIndex(v.status) >= 2).length;
    return { quoted, allocated, booked, total: vendors.length };
  }, [vendors]);

  const setStatus = async (vendor, status) => {
    const advanced = vendorStatusIndex(status) > vendorStatusIndex(vendor.status);
    await base44.entities.Vendor.update(vendor.id, { status });
    await load();
    if (advanced && vendorStatusIndex(status) >= 2) celebrateSmall(0.5, 0.4);
  };

  const remove = async (vendor) => {
    await base44.entities.Vendor.delete(vendor.id);
    await load();
    const { id, ...rest } = vendor;
    showUndo(toast, {
      title: "Vendor removed",
      description: vendor.category_label || vendor.category,
      undo: async () => {
        await base44.entities.Vendor.create(rest);
        await load();
      },
    });
  };

  if (!activeEvent) {
    return (
      <EmptyState
        icon={Store}
        title="No event selected"
        description="Create an event and I'll list every vendor category you need to book."
        action={<Button asChild><a href="/onboarding">Plan an event</a></Button>}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const tiles = [
    { label: "Categories", value: totals.total, hint: "vendors you'll likely need", icon: Store },
    { label: "Booked or paid", value: `${totals.booked}/${totals.total}`, hint: `${totals.total - totals.booked} still open`, icon: CheckCircle2 },
    { label: "Quoted so far", value: formatMoney(totals.quoted, currency), hint: "across all quotes", icon: Wallet },
    {
      label: "Budget for vendors",
      value: formatMoney(totals.allocated, currency),
      hint: totals.quoted > totals.allocated ? "quotes are above budget" : "within budget",
      warn: totals.quoted > totals.allocated,
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Vendor command centre"
        title="Who to book, and what to say"
        subtitle="Every category your event needs, with a status pipeline and an AI-written first message."
        actions={
          <Button onClick={() => setDialog({ open: true, vendor: null })} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add vendor
          </Button>
        }
      />

      {vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendor categories yet"
          description="Your blueprint normally creates this list. You can also add categories yourself."
          action={<Button onClick={() => setDialog({ open: true, vendor: null })}>Add the first one</Button>}
        />
      ) : (
        <>
          <StatGrid tiles={tiles} />

          <div className="flex flex-wrap gap-3 rounded-3xl bg-card p-4 shadow-soft ring-hairline">
            {VENDOR_STATUS.map((step) => {
              const count = vendors.filter((v) => v.status === step.value).length;
              return (
                <div key={step.value} className="flex-1 min-w-[110px]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{step.label}</p>
                  <p className="font-display text-xl text-foreground">{count}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                currency={currency}
                onStatusChange={setStatus}
                onEdit={(v) => setDialog({ open: true, vendor: v })}
                onDraft={(v) => setDraftFor(v)}
                onDelete={remove}
                onEmail={(v) => setQuoteFor(v)}
              />
            ))}
          </div>
        </>
      )}

      {dialog.open ? (
        <VendorDialog
          key={dialog.vendor?.id || "new"}
          open={dialog.open}
          onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
          eventId={activeEvent.id}
          vendor={dialog.vendor}
          onSaved={load}
        />
      ) : null}

      <OutreachSheet
        open={Boolean(draftFor)}
        onOpenChange={(open) => {
          if (!open) setDraftFor(null);
        }}
        vendor={draftFor}
        event={activeEvent}
        currency={currency}
        onSaved={load}
      />

      {quoteFor ? (
        <QuoteRequestDialog
          open={Boolean(quoteFor)}
          onOpenChange={(open) => {
            if (!open) setQuoteFor(null);
          }}
          vendor={quoteFor}
          event={activeEvent}
          onSent={load}
        />
      ) : null}
    </div>
  );
}