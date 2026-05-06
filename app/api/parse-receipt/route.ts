import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30; // seconds

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PROMPT = `Extract all transactions from this image. Return ONLY valid JSON array, no markdown, no explanation:
[{ "description": "item name", "amount": 12.50, "date": "YYYY-MM-DD", "type": "expense" or "income", "category": "one of: casa, compras, restaurantes, transporte, lazer, saude, outros" }]

Rules:
- amount is always positive (type field indicates expense/income)
- If date is not visible, use today's date
- For receipts, each line item is a separate transaction
- For bank statements, each row is a transaction
- Negative amounts in bank statements = expense, positive = income
- Portuguese context: "supermercado" = compras, "farmácia" = saude, "uber/bolt" = transporte, "restaurante/café" = restaurantes
- If you can't read something clearly, use your best guess
- Return empty array [] if nothing readable`;

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
    }

    const { image, mimeType } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Check base64 size (~4MB limit for Vercel + Gemini)
    if (image.length > 5_000_000) {
      return NextResponse.json({ error: "File too large (max ~4MB)" }, { status: 413 });
    }

    // Call Gemini API with retry for rate limits
    const geminiBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });

    // Call Gemini API with retry for rate limits
    const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

    let res: Response | null = null;
    for (const model of models) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: geminiBody,
        }
      );

      // If success or non-retryable error, stop
      if (res.status !== 429 && res.status !== 404) break;
      console.log(`Model ${model} failed (${res.status}), trying next...`);
    }

    if (res && res.status === 429) {
      return NextResponse.json({ error: "Rate limited — please wait 1 minute and try again" }, { status: 429 });
    }

    if (!res || !res.ok) {
      const err = await res?.text();
      console.error("Gemini API error:", res?.status, err);
      return NextResponse.json({ error: `AI processing failed (${res?.status || "unknown"})` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const items = JSON.parse(jsonStr);

    // Validate and normalize
    const normalized = (Array.isArray(items) ? items : []).map((item: Record<string, unknown>) => ({
      description: String(item.description || "").slice(0, 100),
      amount: Math.abs(Number(item.amount) || 0),
      date: String(item.date || new Date().toISOString().split("T")[0]),
      type: item.type === "income" ? "income" : "expense",
      category: ["casa", "compras", "restaurantes", "transporte", "lazer", "saude", "outros"].includes(String(item.category))
        ? String(item.category)
        : "outros",
    }));

    return NextResponse.json({ items: normalized });
  } catch (e) {
    console.error("Parse receipt error:", e);
    return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
  }
}
