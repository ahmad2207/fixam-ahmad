import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/lib/auth';

const PROMPT = (name: string, category?: string) =>
  `You are a product data specialist for Fixam Africa, a Nigerian kitchen and cookware e-commerce store.

Product Name: ${name.trim()}${category ? `\nCategory: ${category}` : ''}

Generate accurate product variations and specifications for this item.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation — with exactly this shape:
{
  "description": "A short 1-2 sentence product description for the store listing.",
  "variations": [
    { "name": "Size", "options": ["20cm", "24cm", "28cm"] }
  ],
  "specifications": {
    "Material": "Hard-anodised aluminium",
    "Diameter": "28cm",
    "Compatible Hobs": "Gas, Electric, Ceramic",
    "Oven Safe": "Up to 180°C",
    "Dishwasher Safe": "No"
  }
}

Guidelines:
- description: 1-2 sentences, customer-facing, highlight key benefit and use case. No marketing fluff.
- variations: only include if the product genuinely comes in meaningful options (size, colour, capacity, material, set size, wattage, etc.). Return [] if it is a single-variant product.
- specifications: include relevant technical details — material, dimensions, capacity, weight, wattage, compatibility, certifications, etc. Be specific and accurate to the product type.
- Nigerian context: note gas-hob compatibility where relevant, use metric units, voltage 220-240V for appliances.
- Do NOT invent specs that are unknowable without the real product sheet. Use "N/A" sparingly for genuinely unknown values — it is better to omit.`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'admin' && role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, category } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: 'gemini-flash-latest',
      // gemini-flash-latest spends part of this budget on invisible internal
      // "thinking" tokens before it writes the actual JSON answer (observed
      // ~835 thinking tokens for this prompt) — this SDK version has no
      // thinkingConfig to cap that separately, so the budget needs enough
      // headroom for both, or the JSON answer gets cut off mid-string.
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
    });

    const result = await model.generateContent(PROMPT(name, category));

    const finishReason = result.response.candidates?.[0]?.finishReason;
    const raw = result.response.text()?.trim() ?? '{}';

    let data: { description?: unknown; variations?: unknown; specifications?: unknown };
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      console.error('[ai/product-specs] unparsable response:', { finishReason, raw });
      const reason = finishReason === 'MAX_TOKENS'
        ? 'The AI response was cut off — try again.'
        : 'The AI returned an unexpected response — try again.';
      return NextResponse.json({ error: reason }, { status: 502 });
    }

    return NextResponse.json({
      description: typeof data.description === 'string' ? data.description : '',
      variations: Array.isArray(data.variations) ? data.variations : [],
      specifications: data.specifications && typeof data.specifications === 'object' ? data.specifications : {},
    });
  } catch (err) {
    console.error('[ai/product-specs] error:', err);
    return NextResponse.json({ error: 'Failed to generate specs' }, { status: 500 });
  }
}
