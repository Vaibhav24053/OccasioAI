import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const clean = (value, max = 400) => String(value ?? "").slice(0, max);
const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const TONES = ["formal", "funny", "heartfelt"];
const LANGUAGES = ["english", "hinglish"];

/** Invitation drafts in the user's tone, in English or Hinglish. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const event = body?.event ?? {};
    const tone = TONES.includes(body?.tone) ? body.tone : "heartfelt";
    const language = LANGUAGES.includes(body?.language) ? body.language : "english";

    const languageRule = language === "hinglish"
      ? "Write the invitation in natural Indian Hinglish (Hindi written in Roman script, mixed with English) the way a family actually texts — warm and easy to read aloud."
      : "Write in clear, warm English.";

    const prompt = `You are OccasioAI, writing an invitation on behalf of the host.

THE EVENT
- Occasion: ${clean(event.occasion_name, 200) || clean(event.name, 200) || "a celebration"} (${clean(event.event_type, 40) || "other"})
- Date: ${clean(event.event_date, 40) || "not set"}
- City: ${clean(event.city, 80) || "not specified"}
- Venue: ${clean(event.venue_preference, 60) || "not decided"}
- Theme: ${clean(event.theme, 60) || "unspecified"}
- Culture / tradition: ${clean(event.culture, 60) || "unspecified"}
- Guests expected: ${num(event.guest_count) || "a small gathering"}
- Must-haves to hint at: ${clean(event.must_haves, 300) || "none stated"}

Tone: ${tone}.
${languageRule}

Return JSON with:
- subject: the subject line or the first line of the card (max 12 words)
- long_form: the full invitation, 90 to 150 words, with the time and place left as clearly marked blanks like [time] and [venue name] so the host can fill them in, plus an RSVP request
- whatsapp: a short forwardable version under 320 characters with the key details and one warm line

Rules: never invent a real venue name, phone number or address — use bracketed placeholders. Never mention AI. Output JSON only.`;

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          long_form: { type: "string" },
          whatsapp: { type: "string" },
        },
        required: ["subject", "long_form", "whatsapp"],
      },
    });

    return Response.json({
      subject: clean(data?.subject, 200),
      long_form: clean(data?.long_form, 3000),
      whatsapp: clean(data?.whatsapp, 600),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}