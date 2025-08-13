export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  // CORS-afhandeling
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  // Alleen POST-toegang
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), { status: 405, headers: corsHeaders() });
  }

  try {
    const { message } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Missing 'message'" }), { status: 400, headers: corsHeaders() });
    }

    // Roep de OpenAI API aan
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Braster Empire Bot. Keep answers short, positive and practical." },
          { role: "user", content: String(message) }
        ]
      })
    });

    if (!r.ok) {
      const e = await r.text();
      return new Response(JSON.stringify({ error: "OpenAI error", detail: e }), { status: 500, headers: corsHeaders() });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content ?? "Ik heb even geen antwoord.";
    return new Response(JSON.stringify({ reply }), { status: 200, headers: corsHeaders() });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Server error", detail: e?.message }), { status: 500, headers: corsHeaders() });
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
