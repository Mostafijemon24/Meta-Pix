# Meta Pix (Website)

SEO-friendly Next.js website + Studio for [Meta Pix](https://github.com/Mostafijemon24/Meta-Pix).

- Marketing site with sitemap, robots, Open Graph and JSON-LD
- `/studio` — full image optimizer (metadata, resize, export)
- `/api/ai/optimize` — OpenRouter **free** vision models auto-fill SEO fields, platform size and format

## Local

```bash
cd web
cp .env.example .env.local
# paste OPENROUTER_API_KEY from https://openrouter.ai/keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and Studio at `/studio`.

## Vercel (project name: meta-pix)

1. Import the GitHub repo on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `web`.
3. Project name: `meta-pix` → `https://meta-pix.vercel.app`.
4. Environment variables:
   - `OPENROUTER_API_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://meta-pix.vercel.app`
   - optional `OPENROUTER_MODEL=openrouter/free`
5. Deploy.

Free OpenRouter models are rate-limited (~20 req/min, ~50/day until you buy $10 credits once).
