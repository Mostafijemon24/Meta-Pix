import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Prefer a fast free vision model; fall back to free router.
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

const SYSTEM = `You are Meta Pix, an SEO image optimization expert.
Look at the IMAGE PIXELS only. Return ONLY valid JSON (no markdown):
{
  "fields": {
    "fileName": "new-descriptive-kebab-slug",
    "title": "SEO title under 70 chars",
    "alt": "Accessible alt text describing what is visible",
    "description": "1-2 sentence SEO description",
    "keyword": "main focus keyword",
    "related": "comma, separated, related, keywords",
    "caption": "Short social caption",
    "tags": "comma, separated, tags"
  },
  "platform": "instagram" | "facebook" | "linkedin" | "x" | "pinterest" | "original",
  "orient": "h" | "s" | "v" | "long",
  "format": "webp" | "jpeg" | "png",
  "resize": "fill" | "fit",
  "quality": 85,
  "reason": "one short sentence"
}
CRITICAL rules:
- fields.fileName MUST be a NEW SEO kebab-case slug from visual content (what you see).
- NEVER copy or lightly edit the original upload filename (ignore IMG_, DSC_, WhatsApp, UUID, timestamps, random codes).
- fileName: lowercase English words, hyphens only, 3–8 words, no extension, no numbers-only slug.
- Write metadata in the language of text in the image when present; otherwise English.
- Prefer webp; png only if transparency matters; jpeg for photos if webp unfit.
- Prefer fill for photos; fit when the full subject must stay visible.
- Be specific; no filler like "beautiful image" or "high quality photo".`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('Model did not return JSON');
  }
}

export async function POST(req: NextRequest) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured on the server.' },
      { status: 503 },
    );
  }

  let body: {
    image?: string;
    fileName?: string;
    width?: number;
    height?: number;
    forceNewFileName?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { image, fileName = 'image.jpg', width, height } = body;
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Expected a data:image URL' }, { status: 400 });
  }
  if (image.length > 3_200_000) {
    return NextResponse.json({ error: 'Image payload too large' }, { status: 413 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://meta-pix-mauve.vercel.app';
  const userText = [
    `Ignore original filename for SEO naming. Upload label (do not reuse): ${fileName}`,
    width && height ? `Pixel size: ${width}×${height}` : null,
    'Invent a brand-new descriptive kebab-case fileName from what you see, plus full SEO fields.',
  ]
    .filter(Boolean)
    .join('\n');

  const models = [MODEL, 'openrouter/free', 'nvidia/nemotron-3.5-super-vl:free'].filter(
    (m, i, arr) => arr.indexOf(m) === i,
  );

  let lastError = 'OpenRouter request failed';

  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': site,
          'X-Title': 'Meta Pix',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 700,
          messages: [
            { role: 'system', content: SYSTEM },
            {
              role: 'user',
              content: [
                { type: 'text', text: userText },
                { type: 'image_url', image_url: { url: image } },
              ],
            },
          ],
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastError = String(payload?.error?.message || payload?.error || `OpenRouter error (${res.status})`);
        if (res.status === 429 || res.status >= 500) continue;
        return NextResponse.json({ error: lastError }, { status: res.status === 429 ? 429 : 502 });
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        lastError = 'Empty model response';
        continue;
      }

      const parsed = extractJson(content) as Record<string, unknown>;
      return NextResponse.json({
        fields: parsed.fields ?? {},
        platform: parsed.platform ?? 'instagram',
        orient: parsed.orient ?? 's',
        format: parsed.format ?? 'webp',
        resize: parsed.resize ?? 'fill',
        quality: parsed.quality ?? 88,
        reason: parsed.reason ?? '',
        model: payload?.model || model,
      });
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'OpenRouter request failed';
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}
