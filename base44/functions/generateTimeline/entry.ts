import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max = 400) => String(value ?? "").slice(0, max);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Rewrites the open half of a timeline after the date moves, or when the plan
 * needs regenerating. Completed tasks are preserved and never re-created.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const event = body?.event ?? {};
    const completed = Array.isArray(body?.completed_tasks) ? body.completed_tasks.slice(0, 40).map((t) => clean(t, 160)) : [];

    const eventDate = clean(event.event_date, 40);
    const parsedDate = new Date(eventDate);
    const daysOut = Number.isNaN(parsedDate.getTime())
      ? null
      : Math.max(0, Math.round((parsedDate.getTime() - Date.now()) / 86400000));
    const emergency = daysOut !== null && daysOut < 7;

    const prompt = `You are OccasioAI, a meticulous event planning chief-of-staff. Rewrite the planning timeline for this event.

THE EVENT
- Occasion: ${clean(event.occasion_name, 200) || clean(event.name, 200) || "a celebration"} (${clean(event.event_type, 40) || "other"})
- Date: ${eventDate}${daysOut === null ? "" : ` (${daysOut} days from today)`}
- Guests: ${num(event.guest_count) || 50}
- City: ${clean(event.city, 80) || "not specified"}
- Theme: ${clean(event.theme, 60) || "unspecified"} · Culture: ${clean(event.culture, 60) || "unspecified"}
- Must-haves: ${clean(event.must_haves, 300) || "none stated"}
- No-gos: ${clean(event.no_gos, 300) || "none stated"}

ALREADY COMPLETED (do not repeat these, they stay as they are):
${completed.length ? completed.map((t) => `- ${t}`).join("\n") : "- none yet"}

Return JSON with a "tasks" array of 14 to 20 concrete, action-phrased tasks. For each: title, description, category, days_before (whole days before the event date, integer 0-180, ordered like a real countdown), priority (low/medium/high) and is_milestone for the handful of decisions that unlock everything else.

${emergency
        ? `This event is less than a week away: only include tasks that are still possible — lock venue and food first, then decor, then the small things. Every days_before must be between 0 and ${daysOut}.`
        : "Spread the tasks across the full runway so nothing is crowded into the last week."}

Output JSON only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
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
          },
        },
        required: ["tasks"],
      },
    });

    return Response.json({ tasks: (data?.tasks ?? []).slice(0, 22) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}