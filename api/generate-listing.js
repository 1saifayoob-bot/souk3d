import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sonnet writes noticeably better Arabic. Haiku is the fallback so listing
// never breaks if the primary model is unavailable.
const PRIMARY_MODEL = "claude-sonnet-5";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

const DEFAULT_CATEGORIES = ["Home Decor", "Art", "Seasonal", "Kitchen", "Accessories", "Other"];
const BADGES = ["Best Seller", "New", "Sale", "Limited"];

// Only staff who can edit products may spend AI credits.
async function requireStaff(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data || !data.user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  const role = profile && profile.role;
  if (role !== "admin" && role !== "super_admin" && role !== "lister") return null;
  return data.user;
}

// Pull a JSON object out of the reply even if it is wrapped in fences or prose.
function extractJson(text) {
  let t = (text || "").trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) t = t.slice(first, last + 1);
  return JSON.parse(t);
}

// A data: URL or an http(s) URL becomes an Anthropic image source block.
function buildImageSource(image) {
  if (typeof image !== "string" || !image) return null;
  if (image.startsWith("data:")) {
    const m = image.match(/^data:([^;]+);base64,(.*)$/s);
    if (!m) return null;
    return { type: "base64", media_type: m[1], data: m[2] };
  }
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return { type: "url", url: image };
  }
  return null;
}

const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

// Never trust the model's shape: coerce every field into what the form expects.
function clean(data, categories, countries, imageCount) {
  const out = {
    title_en: str(data.title_en, 120),
    title_ar: str(data.title_ar, 120),
    desc_en: str(data.desc_en, 2000),
    desc_ar: str(data.desc_ar, 2000),
    category: categories.includes(data.category) ? data.category : "",
    country: countries.includes(data.country) ? data.country : "",
    keywords: (Array.isArray(data.keywords) ? data.keywords : [])
      .map((k) => str(k, 40)).filter(Boolean).slice(0, 12),
    customizable: data.customizable === true,
    emoji: str(data.emoji, 8),
    badge: BADGES.includes(data.badge) ? data.badge : "",
    price_suggestion: Number(data.price_suggestion) > 0 ? Math.round(Number(data.price_suggestion) * 100) / 100 : 0,
    alt_texts: (Array.isArray(data.alt_texts) ? data.alt_texts : [])
      .map((a) => str(a, 140)).slice(0, imageCount),
    variations: [],
  };
  if (Array.isArray(data.variations)) {
    out.variations = data.variations.slice(0, 3).map((g) => ({
      name: str(g && g.name, 30),
      options: (Array.isArray(g && g.options) ? g.options : []).slice(0, 8).map((o) => ({
        label: str(o && o.label, 40),
        delta: Number.isFinite(Number(o && o.delta)) ? Number(o.delta) : 0,
      })).filter((o) => o.label),
    })).filter((g) => g.name && g.options.length >= 2);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireStaff(req);
  if (!user) return res.status(403).json({ error: "Not authorized" });

  const body = req.body || {};
  const { name, category, country, hints, cost, style } = body;
  // Accept the new `images` array, or the old single `image` field.
  const rawImages = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
  const imageSources = rawImages.map(buildImageSource).filter(Boolean).slice(0, 5);
  if (!name && imageSources.length === 0) {
    return res.status(400).json({ error: "Provide a product name or at least one photo" });
  }

  const categories = Array.isArray(body.categories) && body.categories.length
    ? body.categories.map((c) => str(c, 40)).filter(Boolean)
    : DEFAULT_CATEGORIES;
  const countries = Array.isArray(body.countries)
    ? body.countries.map((c) => str(c, 40)).filter(Boolean)
    : [];
  const examples = (Array.isArray(body.examples) ? body.examples : []).slice(0, 3)
    .map((e) => "- " + str(e && e.name, 100) + ": " + str(e && e.desc, 300))
    .join("\n");

  const promptText = `You are the listing writer for Souk3D (souk3d.com), a US store selling handmade and 3D-printed gifts and decor, many celebrating Arab heritage. Write a complete, SEO-ready product listing based strictly on the ACTUAL product.

${imageSources.length ? `${imageSources.length} photo(s) of the product are attached, in order. Study all of them: what the item is, materials, colours, size cues, finish and style. Base everything on what you actually see.\n` : ""}
Rules:
- Do not invent a country, culture, religion or heritage that is not clearly visible in the photos or stated below.
- Do not invent facts you cannot see or were not told (exact dimensions, weight, materials beyond what is evident).
- Arabic must be natural, fluent Modern Standard Arabic written for diaspora gift buyers, not a literal translation.

Known details (may be empty):
Product name: ${str(name, 200) || "(infer from the photos)"}
Current category: ${str(category, 40) || "(choose)"}
Country/heritage: ${str(country, 40) || "(none stated - only set one if clearly shown)"}
Production cost (USD): ${Number(cost) > 0 ? Number(cost) : "unknown"}
Seller hints: ${str(hints, 3000) || "none"}
${style ? `\nListing style to follow (overrides tone defaults):\n${str(style, 3000)}\n` : ""}${examples ? `\nFor voice consistency, here are existing Souk3D listings:\n${examples}\n` : ""}
Respond with ONLY a JSON object, no markdown and no commentary, with exactly these fields:
{
  "title_en": "SEO English title, max 80 chars, main search terms first",
  "title_ar": "Arabic title, max 60 chars",
  "desc_en": "English description, 100-150 words: what it is, how it is made, who it is for, why it is special, a call to action",
  "desc_ar": "Arabic description, 80-120 words, culturally adapted, ending with an Arabic call to action",
  "category": "exactly one of: ${categories.join(" | ")}",
  "country": "${countries.length ? "exactly one of: " + countries.join(" | ") + " - or empty string if not clearly indicated" : "empty string"}",
  "keywords": ["8 to 12 search phrases a shopper would type, English"],
  "customizable": true or false (true only if the item is clearly meant to carry a name or custom text),
  "emoji": "one emoji that represents the product",
  "badge": "one of: New, Best Seller, Sale, Limited - or empty string (default to New for a new item)",
  "price_suggestion": number in USD for a handmade 3D-printed gift in the US market${Number(cost) > 0 ? ", at least 2.5x the production cost" : ""},
  "alt_texts": ["one short descriptive alt text per attached photo, in the same order"],
  "variations": [only if the photos or hints clearly show options such as several sizes or colours: {"name": "Size", "options": [{"label": "Small", "delta": 0}, {"label": "Large", "delta": 5}]}. Otherwise an empty array]
}`;

  const content = imageSources.map((source) => ({ type: "image", source }));
  content.push({ type: "text", text: promptText });

  const run = (model) =>
    client.messages.create({
      model,
      max_tokens: 2500,
      messages: [{ role: "user", content }],
    });

  try {
    let message;
    try {
      message = await run(PRIMARY_MODEL);
    } catch (e) {
      console.warn("Primary model failed, falling back:", e && e.message);
      message = await run(FALLBACK_MODEL);
    }
    const text = (message.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const data = extractJson(text);
    return res.status(200).json(clean(data, categories, countries, imageSources.length));
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Generation failed", details: error.message });
  }
}
