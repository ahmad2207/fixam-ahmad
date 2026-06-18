import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const client = new Groq({ apiKey });

    const message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: PROMPT(name, category) }],
    });

    const raw = message.choices[0]?.message?.content?.trim() ?? '{}';
    const data = JSON.parse(raw) as { description?: unknown; variations?: unknown; specifications?: unknown };

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
