import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Mail, Plus, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEvent } from "@/lib/EventContext";
import PageHeader from "@/components/PageHeader";
import StatGrid from "@/components/dashboard/StatGrid";
import GuestRow from "@/components/guests/GuestRow";
import GuestDialog from "@/components/guests/GuestDialog";
import InviteComposer from "@/components/guests/InviteComposer";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { showUndo } from "@/lib/feedback";

/** Guest & invite manager: RSVP tracking plus headcount that feeds catering. */
export default function Guests() {
  const { activeEvent } = useEvent();
  const { toast } = useToast();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, guest: null });
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const page = await base44.entities.Guest.filter(
      { event_id: activeEvent.id },
      { sort: "name", limit: 400 },
    );
    setGuests(page.items ?? []);
    setLoading(false);
  }, [activeEvent?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const confirmed = guests.filter((g) => g.rsvp_status === "confirmed");
    const declined = guests.filter((g) => g.rsvp_status === "declined");
    const pending = guests.filter((g) => (g.rsvp_status || "pending") === "pending");
    const seats = confirmed.reduce((sum, g) => sum + 1 + (Number(g.plus_ones) || 0), 0);
    const invitedSeats = guests.reduce((sum, g) => sum + 1 + (Number(g.plus_ones) || 0), 0);
    return { confirmed: confirmed.length, declined: declined.length, pending: pending.length, seats, invitedSeats };
  }, [guests]);

  const changeRsvp = async (guest, rsvp_status) => {
    await base44.entities.Guest.update(guest.id, { rsvp_status });
    await load();
  };

  const remove = async (guest) => {
    await base44.entities.Guest.delete(guest.id);
    await load();
    const { id, ...rest } = guest;
    showUndo(toast, {
      title: "Guest removed",
      description: guest.name,
      undo: async () => {
        await base44.entities.Guest.create(rest);
        await load();
      },
    });
  };

  if (!activeEvent) {
    return (
      <EmptyState
        icon={Users}
        title="No event selected"
        description="Create an event to start building the guest list."
        action={<Button asChild><a href="/onboarding">Plan an event</a></Button>}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  const capacity = Number(activeEvent.venue_capacity) || Number(activeEvent.guest_count) || 0;
  const overCapacity = capacity > 0 && totals.invitedSeats > capacity;

  const tiles = [
    { label: "Invited", value: guests.length, hint: `${totals.invitedSeats} seats if all come`, icon: Users },
    { label: "Confirmed", value: totals.confirmed, hint: `${totals.seats} seats to cater for`, icon: Users },
    { label: "Awaiting reply", value: totals.pending, hint: "chase these next", icon: Mail },
    { label: "Can't make it", value: totals.declined, hint: "declined", icon: Users },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Guests & invites"
        title="Who's coming — and who needs a nudge"
        subtitle="Confirmed seats feed straight into your catering and seating numbers."
        actions={
          <>
            <Button variant="outline" className="rounded-full" onClick={() => setComposerOpen(true)}>
              <Mail className="mr-2 h-4 w-4" aria-hidden="true" /> Compose invitation
            </Button>
            <Button className="rounded-full" onClick={() => setDialog({ open: true, guest: null })}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add guests
            </Button>
          </>
        }
      />

      {overCapacity ? (
        <div role="alert" className="flex items-start gap-3 rounded-3xl bg-destructive/10 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg text-destructive">More guests than the venue fits</h2>
            <p className="mt-1 text-sm text-foreground">
              You've invited {totals.invitedSeats} seats against an estimated capacity of {capacity}. Either
              trim the list, look for a bigger venue, or split the celebration into two sittings — and check
              whether the caterer prices per plate.
            </p>
          </div>
        </div>
      ) : null}

      <StatGrid tiles={tiles} />

      {guests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guests yet"
          description="Add names one by one, or paste your whole list in one go."
          action={<Button onClick={() => setDialog({ open: true, guest: null })}>Add guests</Button>}
        />
      ) : (
        <section className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
          <h2 className="font-display text-lg text-foreground">Guest list</h2>
          <ul className="mt-2 divide-y divide-border/60">
            {guests.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                onRsvpChange={changeRsvp}
                onEdit={(g) => setDialog({ open: true, guest: g })}
                onDelete={remove}
              />
            ))}
          </ul>
        </section>
      )}

      {dialog.open ? (
        <GuestDialog
          key={dialog.guest?.id || "new"}
          open={dialog.open}
          onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
          eventId={activeEvent.id}
          guest={dialog.guest}
          onSaved={load}
        />
      ) : null}

      <InviteComposer open={composerOpen} onOpenChange={setComposerOpen} event={activeEvent} />
    </div>
  );
}