import { formatDate } from "@/lib/format";

/** "Quote request — Catering for Priya's wedding" */
export function quoteRequestSubject(vendor, event) {
  const what = vendor?.category_label || vendor?.category || "your services";
  return event?.name ? `Quote request — ${what} for ${event.name}` : `Quote request — ${what}`;
}

/** A ready-to-edit email asking this vendor to quote for the event. */
export function quoteRequestBody(vendor, event) {
  const who = vendor?.contact_name || vendor?.name || "there";
  const what = (vendor?.category_label || vendor?.category || "your services").toLowerCase();

  const details = [
    event?.event_date ? `on ${formatDate(event.event_date)}` : "",
    event?.guest_count ? `for about ${event.guest_count} guests` : "",
    event?.city ? `in ${event.city}` : "",
  ].filter(Boolean);

  const lines = [
    `Hi ${who},`,
    "",
    `I'm planning ${event?.name || "an upcoming event"}${details.length ? ` ${details.join(" ")}` : ""}.`,
    "",
    `Could you put together a quote for ${what}?`,
  ];

  if (event?.must_haves) lines.push("", `A few things that matter to us: ${event.must_haves}.`);

  lines.push(
    "",
    "It would help to know what's included, whether you're free that day, and your advance payment and cancellation terms.",
    "",
    "Thank you — looking forward to your quote.",
  );

  return lines.join("\n");
}