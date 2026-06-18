import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env manually
const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length && !key.startsWith('#')) {
    process.env[key.trim()] = rest.join('=').trim();
  }
}

const client = new Anthropic();

async function generateSpecs(name, category = '', imageUrl = '') {
  console.log(`\n🔍 Product: "${name}"${category ? ` (${category})` : ''}\n`);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a product data specialist for Fixam Africa, a Nigerian kitchen and cookware e-commerce store.

Product Name: ${name.trim()}${category ? `\nCategory: ${category}` : ''}${imageUrl ? `\nImage: ${imageUrl}` : ''}

Generate accurate product variations and specifications for this item.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation — with exactly this shape:
{
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
- variations: only include if the product genuinely comes in meaningful options (size, colour, capacity, material, set size, wattage, etc.). Return [] if it is a single-variant product.
- specifications: include relevant technical details — material, dimensions, capacity, weight, wattage, compatibility, certifications, etc. Be specific and accurate to the product type.
- Nigerian context: note gas-hob compatibility where relevant, use metric units, voltage 220-240V for appliances.
- Do NOT invent specs that are unknowable without the real product sheet. Use "N/A" sparingly for genuinely unknown values — it is better to omit.`,
      },
    ],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}';
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    data = JSON.parse(stripped);
  }

  console.log('─── VARIATIONS ─────────────────────────');
  if (data.variations?.length > 0) {
    for (const v of data.variations) {
      console.log(`  ${v.name}: ${v.options.join(', ')}`);
    }
  } else {
    console.log('  (none — single-variant product)');
  }

  console.log('\n─── SPECIFICATIONS ──────────────────────');
  if (data.specifications && Object.keys(data.specifications).length > 0) {
    for (const [key, val] of Object.entries(data.specifications)) {
      console.log(`  ${key.padEnd(24)} ${val}`);
    }
  } else {
    console.log('  (none returned)');
  }

  console.log('\n─── RAW JSON ────────────────────────────');
  console.log(JSON.stringify(data, null, 2));
  console.log('─────────────────────────────────────────\n');

  return data;
}

// Test products
await generateSpecs('Tefal Hard Titanium 28cm Non-Stick Frying Pan', 'Cookware');
await generateSpecs('Scanfrost 5L Stand Mixer 1000W', 'Appliances');
await generateSpecs('Silicone Baking Mat', 'Bakeware');
