# Souk3D — project rules for Claude Code

Live e-commerce store (souk3d.com) selling handmade / 3D-printed Arab-heritage gifts. Real customers and real payments — treat `main` as production.

## Stack
- Frontend: Vite + React SPA. Storefront in `src/App.jsx`, admin panel (route `/admin`) in `src/admin/index.jsx`, data helpers in `src/lib/supabase.js`.
- Hosting: Vercel, **Hobby tier — hard limit of 12 serverless functions. We are at 12.** Never add a new file under `api/`; extend an existing endpoint instead (e.g. an `action`/`mode` field in the body).
- Backend: Supabase (project `lxxvjlxsmrxqakyiftfu`). Schema reference: `supabase-schema.sql`.
- Payments: Stripe (live). Shipping labels: Shippo. Email: Resend (domain souk3d.com).
- AI: `api/generate-listing.js` (photo-first product listings, Sonnet with Haiku fallback), `api/import-product.js`.

## Definition of done
1. `npm run build` passes locally with no errors.
2. Commit and push, then confirm the Vercel deployment reaches **READY** (not ERROR) before calling a task done.
3. Batch related fixes into one verified commit where possible.

## Business rules
- Member discount is **5%** (not 10%), verified server-side from the signed member token. Promo codes stack with it and are validated against the `discounts` table.
- **All pricing is decided server-side.** Never trust prices, variation deltas or discounts sent from the browser.
- Customer custom text (often Arabic) must reach Stripe metadata, the order record and confirmation emails intact.
- Admin API endpoints must check the caller's Supabase JWT and `profiles.role` (`admin`, `super_admin`, `lister` where appropriate).

## Product listings
- All listing copy follows `LISTING_STYLE.md`. The AI generator's prompt (`SOUK3D_STYLE` in `api/generate-listing.js`) mirrors it; change both together.
- Products have a `details` jsonb array (short facts shown in the storefront Details tab). Descriptions are a one-line hook, a blank line, then 2-4 short sentences.

## AI studio (photos and video)
- `api/generate-listing.js` also handles `studio-*` actions: scene photos (Higgsfield, Grok Imagine 2.0) and image-to-video (Kling 3.0). Credentials: `HF_CREDENTIALS` (KEY_ID:SECRET) in Vercel. Results are copied to the `product-images` bucket under `ai-studio/`.
- Products have a `videos` jsonb array ([{ url }]) shown in the storefront gallery.

## Gotchas
- **Arabic text:** watch for mojibake. Keep files UTF-8 and test any change that touches Arabic strings end to end.
- **Schema changes:** run SQL in the Supabase dashboard SQL editor, then verify the table/column actually exists afterwards. Batches have silently rolled back before. Record every change in `supabase-schema.sql`.
- **Images** go to Supabase Storage as WebP (full + thumb). Never store base64 image data in product rows.
- **Secrets** live in Vercel env vars / `.env.local`. Never commit them; the repo is public.

## Working style
- The owner is terse and direct and expects autonomous execution. Only check in when done or when a real decision is needed.
- For larger or risky changes, work on a branch and use the Vercel preview URL before merging to `main`.
