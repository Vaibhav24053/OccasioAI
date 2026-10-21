import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max = 200) => String(value ?? "").slice(0, max);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Rebalance maths: when a category is overshooting, work out where the money
 * can come from — without touching the contingency below a safe floor.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const event = body?.event ?? {};
    const categories = Array.isArray(body?.categories) ? body.categories.slice(0, 30) : [];
    if (!categories.length) return Response.json({ error: "No budget categories to work with." }, { status: 400 });

    const total = num(event.budget_total);
    const currency = clean(event.currency, 8) || "INR";
    const totalSpent = categories.reduce((sum, c) => sum + num(c.spent), 0);

    const lines = categories.map((c) => {
      const allocated = num(c.allocated);
      const spent = num(c.spent);
      return `- ${clean(c.label || c.category, 60)} [key: ${clean(c.category, 40)}]: allocated ${allocated}, spent ${spent}, ${spent > allocated ? `${spent - allocated} OVER` : `${allocated - spent} left`}`;
    });

    const prompt = `You are OccasioAI, a budget planner. Move money between the categories of one event so the plan is affordable again.

EVENT
- Occasion: ${clean(event.occasion_name || event.name, 200) || "a celebration"}
- Guests: ${num(event.guest_count) || "unknown"}
- Total budget: ${currency} ${total}
- Spent so far across all categories: ${currency} ${totalSpent}
- Flexibility noted by the user: ${clean(event.budget_flexibility, 60) || "unspecified"}

CATEGORIES
${lines.join("\n")}

Work only from the numbers above. Rules:
- Only move money out of a category that genuinely has room (allocated minus spent must be greater than the amount you move).
- Never take the contingency/buffer category below 5% of the total budget; treat the buffer as protection, not spare cash.
- Do not move money into a category that is already comfortably within its allocation unless it is structurally underfunded for the guest count (for example catering or venue).
- Amounts must be round, realistic numbers in ${currency}. Prefer two or three meaningful moves over many small ones.
- "from_category" and "to_category" must be exactly the category keys listed above.
- If everything is healthy, return an empty suggestions array and say so in the headline.

Return JSON with:
- headline: one decisive sentence the user reads first
- suggestions: array of { from_category, to_category, amount, reason } — reason explains the trade-off in one line and what the user gives up
- warnings: 0 to 3 short, honest warnings about anything that cannot be fixed by moving money (too few guests for the venue's minimum, a category that is structurally impossible on this budget, quotes that need renegotiating)

Output JSON only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from_category: { type: "string" },
                to_category: { type: "string" },
                amount: { type: "number" },
                reason: { type: "string" },
              },
              required: ["from_category", "to_category", "amount", "reason"],
            },
          },
          warnings: { type: "array", items: { type: "string" } },
        },
        required: ["headline", "suggestions"],
      },
    });

    return Response.json({
      headline: clean(data?.headline, 400),
      suggestions: (data?.suggestions ?? []).slice(0, 4),
      warnings: (data?.warnings ?? []).slice(0, 3),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}