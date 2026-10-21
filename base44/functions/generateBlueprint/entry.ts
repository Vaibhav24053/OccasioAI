import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max = 400) => String(value ?? "").slice(0, max);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const TASK_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      days_before: { type: "number" },
      priority: { type: "string", enum: ["low", "medium", "high"] },
      is_milestone: { type: "boolean" },
    },
    required: ["title", "days_before"],
  },
};

/**
 * Turns a short intake interview into a full event blueprint: name ideas,
 * a summary, a realistic capacity, a backward-planned task list and the vendor
 * categories this particular event needs.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const intake = body?.intake ?? {};

    const eventDate = clean(intake.event_date, 40);
    const parsedDate = new Date(eventDate);
    const daysOut = Number.isNaN(parsedDate.getTime())
      ? null
      : Math.max(0, Math.round((parsedDate.getTime() - Date.now()) / 86400000));

    const occasion = clean(intake.occasion_name, 200) || "a celebration";
    const eventType = clean(intake.event_type, 40) || "other";
    const guests = num(intake.guest_count) || 50;
    const budget = num(intake.budget_total);
    const currency = clean(intake.currency, 8) || "INR";
    const perGuest = Math.round(budget / Math.max(guests, 1));

    const prompt = `You are OccasioAI, a meticulous event planning chief-of-staff. Build a complete blueprint for this event.

THE EVENT
- Occasion: ${occasion}
- Type: ${eventType}
- Date: ${eventDate}${daysOut === null ? "" : ` (${daysOut} days from today)`}
- Guests: ${guests}
- City: ${clean(intake.city, 80) || "not specified"}
- Venue preference: ${clean(intake.venue_preference, 60) || "not decided"}
- Total budget: ${currency} ${budget} (about ${currency} ${perGuest} per guest) · flexibility: ${clean(intake.budget_flexibility, 60) || "unspecified"}
- Theme / vibe: ${clean(intake.theme, 60) || "unspecified"}
- Culture / tradition: ${clean(intake.culture, 60) || "unspecified"}
- Must-haves: ${clean(intake.must_haves, 400) || "none stated"}
- Absolute no-gos: ${clean(intake.no_gos, 400) || "none stated"}

Return JSON with:
1. name_suggestions: 4 warm, personal names for this event (max 5 words, no quotes or emoji) that echo the occasion, city and vibe.
2. summary: 2 sentences the planner reads at a glance — what this event is, the single biggest thing to get right first, and one honest budget caveat.
3. venue_capacity: a realistic venue capacity in people (number, a little above the guest count).
4. tasks: 16 to 22 concrete, action-phrased tasks ("Book the banquet hall"), never generic ones ("Plan event"). days_before = whole days before the event date (integer 0-180), ordered so the plan reads like a real countdown. Set is_milestone true for booking the venue, sending invitations and the final headcount confirmation. Mark 3 to 5 tasks "high" priority.
5. vendor_categories: 6 to 9 vendor categories this event genuinely needs — lowercase singular key in category, a human label, and one line on why it matters here.

Rules:
- Respect the culture and region: weave in the traditions, rituals and menu notes that fit it.
- Respect the no-gos absolutely; never suggest them.
- If the event is less than 7 days away, compress every task into the days that are actually left and drop anything needing long lead time.
- If the per-guest budget is low, word the tasks towards DIY and low-cost routes.
- Never invent real business names.
- Output JSON only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          name_suggestions: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
          venue_capacity: { type: "number" },
          tasks: TASK_SCHEMA,
          vendor_categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                label: { type: "string" },
                why: { type: "string" },
              },
              required: ["category", "label"],
            },
          },
        },
        required: ["name_suggestions", "summary", "tasks", "vendor_categories"],
      },
    });

    const blueprint = {
      name_suggestions: (data?.name_suggestions ?? []).slice(0, 4),
      summary: clean(data?.summary, 700),
      venue_capacity: num(data?.venue_capacity) || Math.round(guests * 1.1),
      tasks: (data?.tasks ?? []).slice(0, 24),
      vendor_categories: (data?.vendor_categories ?? []).slice(0, 10),
    };

    return Response.json(blueprint);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}