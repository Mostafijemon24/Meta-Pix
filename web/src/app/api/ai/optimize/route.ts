import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';

const SYSTEM = `You are Meta Pix, an SEO image optimization expert.
Analyze the image and return ONLY valid JSON (no markdown) with this exact shape:
{
  "fields": {
    "fileName": "kebab-case-seo-slug",
    "title": "SEO title under 70 chars",
    "alt": "Accessible alt text describing the image",
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
  "reason": "one short sentence why these choices fit"
}
Rules:
- Write metadata in the same language as any text in the image; otherwise English.
- Base every field on what is actually visible in the image — be specific and accurate.
- fileName must be lowercase kebab-case, no extension, derived from the image subject (not camera codes).
- Pick platform + orient that best match the image aspect ratio and likely social use.
- Prefer webp for web/social unless transparency clearly matters (then png).
- Prefer fill for photo crops; fit when the full subject must stay visible.
- Be specific and SEO-friendly; avoid generic filler like "beautiful image".`;

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

  let body: { image?: string; fileName?: string; width?: number; height?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { image, fileName = 'image.jpg', width, height } = body;
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Expected a data:image URL' }, { status: 400 });
  }
  if (image.length > 4_500_000) {
    return NextResponse.json({ error: 'Image payload too large' }, { status: 413 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://meta-pix-mauve.vercel.app';
  const userText = [
    `Original file name (for context only): ${fileName}`,
    width && height ? `Pixel size: ${width}×${height}` : null,
    'Generate complete, accurate SEO metadata and social export recommendations for Meta Pix from the image content.',
  ]
    .filter(Boolean)
    .join('\n');

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
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
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
      const msg =
        payload?.error?.message ||
        payload?.error ||
        `OpenRouter error (${res.status})`;
      return NextResponse.json({ error: String(msg) }, { status: res.status === 429 ? 429 : 502 });
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Empty model response' }, { status: 502 });
    }

    const parsed = extractJson(content) as Record<string, unknown>;
    return NextResponse.json({
      fields: parsed.fields ?? {},
      platform: parsed.platform ?? 'instagram',
      orient: parsed.orient ?? 's',
      format: parsed.format ?? 'webp',
      resize: parsed.resize ?? 'fill',
      quality: parsed.quality ?? 90,
      reason: parsed.reason ?? '',
      model: payload?.model || MODEL,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'OpenRouter request failed' },
      { status: 502 },
    );
  }
}
