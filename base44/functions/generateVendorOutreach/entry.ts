import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max = 400) => String(value ?? "").slice(0, max);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Writes the first approach message to a vendor — WhatsApp version and a fuller email. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const vendor = body?.vendor ?? {};
    const event = body?.event ?? {};
    const currency = clean(event.currency, 8) || "INR";

    const prompt = `You are OccasioAI, writing on behalf of a client who needs to approach a vendor. Write the message the way a well-organised, warm person would — short, specific and easy to answer.

THE VENDOR
- Category: ${clean(vendor.category_label || vendor.category, 80)}
- Business: ${clean(vendor.name, 120) || "not chosen yet"}
- Their quote so far: ${vendor.quoted_price ? `${currency} ${num(vendor.quoted_price)}` : "none yet"}
- Client's budget for this category: ${vendor.budget_allocated ? `${currency} ${num(vendor.budget_allocated)}` : "not set"}

THE EVENT
- Occasion: ${clean(event.occasion_name, 200) || clean(event.name, 200) || "a celebration"} (${clean(event.event_type, 40) || "other"})
- Date: ${clean(event.event_date, 40) || "not set"}
- Guests: ${num(event.guest_count) || 50}
- City: ${clean(event.city, 80) || "not specified"}
- Venue: ${clean(event.venue_preference, 60) || "not decided"}
- Theme: ${clean(event.theme, 60) || "unspecified"} · Culture: ${clean(event.culture, 60) || "unspecified"}
- Must-haves: ${clean(event.must_haves, 300) || "none stated"}
- Budget overall: ${currency} ${num(event.budget_total)}

Return JSON with:
- whatsapp: a WhatsApp-ready message under 700 characters. Greet them, name the occasion, date, guest count and city in the first two lines, say what this vendor is being asked to do, ask for availability and a ballpark price for the guest count, and end with a simple next step. Plain text, no markdown, at most two emoji.
- email: a slightly fuller version — a short greeting line, a paragraph of the key details, a bulleted list of the three things needed from them, and a friendly sign-off. Plain text with line breaks, no markdown symbols, no signature name beyond "— sent via OccasioAI".
- questions: 4 or 5 sharp questions to ask before committing to this vendor category (deposit, cancellation, overtime, staffing, what's excluded).

Rules: never state a budget number as final — say the client is working to a budget; sound human, not like a template; never mention AI. Output JSON only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          whatsapp: { type: "string" },
          email: { type: "string" },
          questions: { type: "array", items: { type: "string" } },
        },
        required: ["whatsapp", "email"],
      },
    });

    return Response.json({
      whatsapp: clean(data?.whatsapp, 2000),
      email: clean(data?.email, 4000),
      questions: (data?.questions ?? []).slice(0, 5),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}