// supabase/functions/generate-itinerary/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a travel planning expert. Given a user's trip description, generate a structured, day-by-day travel itinerary.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Use this exact structure:

{
  "trip_title": "string",
  "destination": "string",
  "days": [
    {
      "day_number": 1,
      "title": "string",
      "activities": [
        {
          "name": "string",
          "description": "string",
          "location": "string",
          "start_time": "HH:MM",
          "end_time": "HH:MM",
          "notes": "string",
          "latitude": 0.0,
          "longitude": 0.0,
          "estimated_cost": 0.00
        }
      ]
    }
  ]
}

Rules:
- Use real, specific place names for location fields.
- Include 4 to 6 activities per day with realistic, non-overlapping time ranges.
- Mix sightseeing, meals, and relaxation. Minimize travel distance between consecutive activities.
- Latitude and longitude must be real decimal coordinates for the named location.
- Estimated cost is in USD as a decimal number (e.g., 12.50). Use 0 if free.
- Maximum 7 days. Maximum 10 activities per day.`;

async function callOpenAI(userMessage: string, strict: boolean): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const systemPrompt = strict
    ? SYSTEM_PROMPT + "\n\nIMPORTANT: Return ONLY raw JSON. No markdown fences. No explanation text."
    : SYSTEM_PROMPT;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI API error");
  }

  return data.choices[0].message.content;
}

function validateItinerary(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const obj = parsed as Record<string, unknown>;
  if (!obj.trip_title || !obj.destination || !Array.isArray(obj.days)) return false;
  for (const day of obj.days as any[]) {
    if (!day.day_number || !Array.isArray(day.activities)) return false;
  }
  return true;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, currentItinerary, refinementInstruction } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userMessage: string;
    if (refinementInstruction && currentItinerary) {
      userMessage = `Here is an existing itinerary:\n${JSON.stringify(currentItinerary, null, 2)}\n\nUser wants these changes: "${refinementInstruction}"\n\nGenerate the updated itinerary with the requested modifications.`;
    } else {
      userMessage = `Generate a travel itinerary for this trip: "${prompt}"`;
    }

    let rawText = await callOpenAI(userMessage, false);
    let parsed: unknown;

    try {
      const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      rawText = await callOpenAI(userMessage, true);
      try {
        const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        return new Response(
          JSON.stringify({ error: "AI returned invalid JSON after retry. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!validateItinerary(parsed)) {
      return new Response(
        JSON.stringify({ error: "AI returned an invalid itinerary structure. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
