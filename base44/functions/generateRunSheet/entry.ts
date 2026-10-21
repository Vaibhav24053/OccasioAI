import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max = 400) => String(value ?? "").slice(0, max);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Minute-by-minute event-day schedule plus the emergency checklist. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const event = body?.event ?? {};
    const vendors = Array.isArray(body?.vendors) ? body.vendors.slice(0, 30) : [];
    const confirmed = num(body?.confirmed_guests) || num(event.guest_count) || 50;

    const prompt = `You are OccasioAI, writing the run sheet for the day of an event. This is the document the family will actually follow, so it must be unambiguous.

THE EVENT
- Occasion: ${clean(event.occasion_name, 200) || clean(event.name, 200) || "a celebration"} (${clean(event.event_type, 40) || "other"})
- Date: ${clean(event.event_date, 40) || "not set"}
- Guests expected: ${confirmed}
- City: ${clean(event.city, 80) || "not specified"}
- Venue: ${clean(event.venue_preference, 60) || "not decided"}
- Theme: ${clean(event.theme, 60) || "unspecified"} · Culture: ${clean(event.culture, 60) || "unspecified"}
- Must-haves: ${clean(event.must_haves, 300) || "none stated"}

VENDORS ON THE DAY
${vendors.length
        ? vendors.map((v) => `- ${clean(v.category, 60)}: ${clean(v.name, 80) || "not decided"} (${clean(v.status, 20)})`).join("\n")
        : "- none recorded yet"}

Return JSON with two arrays:

1. "schedule": 12 to 18 lines covering the whole day in chronological order — setup and vendor arrivals before guests, guest arrival, welcome drinks, the ceremony or main moment, food service, speeches and toasts, cake or the sweet course, music and dancing, and a wrap-up. For each line: start_time in 24-hour "HH:MM", duration_minutes (number), activity (an instruction, not a label — e.g. "Caterer sets up the buffet line and lights the chafing dishes"), owner (a role like "Host", "MC", "Catering lead", "Uncle Ravi"), notes (one practical detail, or empty).
2. "contingency": 6 to 8 emergency checklist items the family should verify before the day. category must be one of: "rain plan", "first aid", "backup contact", "power", "transport", "money", "vendors". activity is short ("Rain plan confirmed with the venue"), notes is the practical detail ("Hall has an indoor backup; dhol players can move under the portico").

Rules: keep the schedule physically possible with ${confirmed} guests, respect the culture, and never invent real phone numbers or business names. Output JSON only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start_time: { type: "string" },
                duration_minutes: { type: "number" },
                activity: { type: "string" },
                owner: { type: "string" },
                notes: { type: "string" },
              },
              required: ["start_time", "activity"],
            },
          },
          contingency: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                activity: { type: "string" },
                notes: { type: "string" },
              },
              required: ["activity"],
            },
          },
        },
        required: ["schedule", "contingency"],
      },
    });

    return Response.json({
      schedule: (data?.schedule ?? []).slice(0, 20),
      contingency: (data?.contingency ?? []).slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}