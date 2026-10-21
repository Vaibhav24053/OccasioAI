import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max) => String(value ?? "").slice(0, max);

/**
 * The planning companion. The frontend sends a compact brief of the user's real
 * plan, so every answer quotes their own numbers instead of generic advice.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const question = clean(body?.question, 800);
    if (!question) return Response.json({ error: "Ask me something first." }, { status: 400 });

    const context = clean(body?.context, 8000);
    const history = clean(body?.history, 4000);

    const prompt = `You are OccasioAI, the user's personal event chief-of-staff. You are warm, practical and decisive — you always answer with their actual plan numbers.

THE USER'S PLAN RIGHT NOW
${context}

${history ? `CONVERSATION SO FAR\n${history}\n` : ""}
THEIR QUESTION
${question}

How to answer:
- Ground every number in the plan above. If they ask "can I afford X", work out the real figure from their remaining budget and say yes, no, or "yes if you move Y" — never a vague "it depends".
- Be concise: 60 to 130 words, or a short bulleted list when comparing options. No preamble, no restating the question.
- Give one clear recommendation first, then the single reason, then one concrete next step they can do today.
- Use their currency and their category names.
- If something in the plan is a genuine risk (overspending, a date too close for a vendor lead time, too many guests for the budget), say so plainly and kindly.
- If the plan doesn't contain the answer, say what's missing and ask for that one detail.
- Never invent bookings, prices or vendor availability that aren't in the plan. Never mention AI.

Answer in plain text with light markdown (bold for the headline recommendation, dashes for bullets).`;

    const answer = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ answer: typeof answer === "string" ? answer : clean(answer?.answer, 4000) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}