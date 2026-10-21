import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max = 400) => String(value ?? "").slice(0, max);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * The idea engine: three whole concept boards — palette, decor, music, food and
 * the flow of the day — priced to the budget and grounded in the user's culture.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const event = body?.event ?? {};
    const avoid = Array.isArray(body?.avoid_titles)
      ? body.avoid_titles.slice(0, 20).map((t) => clean(t, 120))
      : [];

    const guests = num(event.guest_count) || 50;
    const budget = num(event.budget_total);
    const currency = clean(event.currency, 8) || "INR";
    const tight = Boolean(event.tight_budget) || (budget > 0 && budget / Math.max(guests, 1) < 900);

    const prompt = `You are OccasioAI, a creative event designer who plans for real budgets, not Pinterest boards.

THE EVENT
- Occasion: ${clean(event.occasion_name, 200) || clean(event.name, 200) || "a celebration"} (${clean(event.event_type, 40) || "other"})
- Date: ${clean(event.event_date, 40) || "not set"}
- Guests: ${guests}
- City: ${clean(event.city, 80) || "not specified"}
- Venue preference: ${clean(event.venue_preference, 60) || "not decided"}
- Theme / vibe: ${clean(event.theme, 60) || "unspecified"}
- Culture / region: ${clean(event.culture, 60) || "unspecified"}
- Total budget: ${currency} ${budget}
- Must-haves: ${clean(event.must_haves, 300) || "none stated"}
- Absolute no-gos: ${clean(event.no_gos, 300) || "none stated"}
${avoid.length ? `- Already proposed (do not repeat or lightly reword): ${avoid.join("; ")}` : ""}

Design THREE genuinely different concept boards (not three colours of the same idea) and return JSON with a "boards" array. Each board must contain:
- title: 3-5 words, evocative, no quotes or emoji
- tagline: one line that sells the feel
- tier: "₹" (budget-friendly), "₹₹" (mid-range) or "₹₹₹" (premium) — spread the three boards across tiers, and make sure at least two are achievable when the budget is tight
- estimated_cost: realistic all-in number in ${currency} for ${guests} guests${tight ? " — these must fit a tight budget, so keep every board modest" : ""}
- palette: 4 hex colours that genuinely work together (exact hex like "#E8B75C")
- decor_ideas: 3 or 4 concrete, buildable decor ideas
- music_mood: one line describing the sound and when it shifts
- food_stations: 3 to 4 food or drink ideas that fit the culture and the guest count
- activities: 4 to 5 items in the actual running order of the celebration
- culture_notes: one or two lines naming the traditions, rituals or games that fit this culture${clean(event.culture, 60) ? "" : " (or say plainly that none was specified)"}

Rules:
- Respect the no-gos absolutely.
- Prefer things a family could actually arrange in ${clean(event.city, 80) || "their city"}.
- Never suggest anything illegal, unsafe or that would embarrass a guest.
- Output JSON only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          boards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                tagline: { type: "string" },
                tier: { type: "string", enum: ["₹", "₹₹", "₹₹₹"] },
                estimated_cost: { type: "number" },
                palette: { type: "array", items: { type: "string" } },
                decor_ideas: { type: "array", items: { type: "string" } },
                music_mood: { type: "string" },
                food_stations: { type: "array", items: { type: "string" } },
                activities: { type: "array", items: { type: "string" } },
                culture_notes: { type: "string" },
              },
              required: ["title", "tagline", "tier", "palette", "decor_ideas"],
            },
          },
        },
        required: ["boards"],
      },
    });

    return Response.json({ boards: (data?.boards ?? []).slice(0, 3) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}