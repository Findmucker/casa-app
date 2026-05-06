import { NextResponse } from "next/server";

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

    // Call Gemini API
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "AI processing failed" }, { status: 502 });
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
