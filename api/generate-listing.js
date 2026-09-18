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

// The Souk3D listing voice. Human-readable version: LISTING_STYLE.md in the
// repo root. Keep the two in sync when the brand rules change.
const SOUK3D_STYLE = `You write product listings for Souk3D (souk3d.com): 3D-printed and handmade objects that turn familiar Arab memories, sayings, objects and everyday culture into things people can hold, display, gift and keep.

VOICE: modern, Arab, nostalgic, playful, design-conscious. Recognizable. Cultural. Warm. A little witty. Never cheesy. Never over-written. Not overly traditional, not fake-luxury, not Amazon keyword stuffing, not AI-poetic, not a museum label. An Arab customer should think "I know exactly what this is", and someone unfamiliar with the reference should still understand the product.

THE BIGGEST RULE - DON'T OVERWRITE. Hook + description together are 40-80 words. If a sentence could describe 5,000 other Etsy products, delete it.

TITLE: clear first, personality second. Accurate product and category words, max 60 chars. Good: "Arabic Coffee Cup Magnet Set", "Habibi Heart Magnet", "Damascus Jasmine Magnet", "Bismillah Arabic Wall Decor". Bad: "Beautiful Handmade Traditional Middle Eastern Cultural Coffee Lover Refrigerator Magnet Gift". Extra search terms go in keywords, never stuffed into the title or description.

HOOK: one human sentence that says what it is and why it is special, or which memory or reference it represents. Choose the lead by angle:
- cultural/nostalgic: lead with the memory ("If you grew up seeing these cups around the house, you already know.")
- funny: lead with the joke ("For the person who says yalla and then takes another 20 minutes to leave.")
- Arabic typography: lead with the meaning ("Habibi - one little word with a lot behind it.")
- city/country: lead with identity and place ("A little piece of Damascus, wherever home is today.")
- functional: lead with what it does ("Your everyday cable problem, cleaned up in one tiny piece.")

DESCRIPTION: 2-4 short sentences after the hook. Flow: cultural connection -> what the object is -> where or how you would use it -> optional gift line. Two sentences is often enough. Recognition rule: if almost every Arab customer will recognize the reference, do not explain it; if it is regional, historical or niche, add at most one sentence of context.

NEVER use these or anything like them: "Elevate your space", "Add a touch of", "Beautifully crafted", "Meticulously designed", "Perfect blend of", "Timeless elegance", "Whether you're looking for", "Transform your everyday space", "attention to detail", "perfect addition", "look no further", "must-have".

DETAILS are separate from the prose: short scannable facts (what's included, material, size, how it is made, colour variation, care). Only include facts that are visible in the photos or given in the seller facts. Never invent sizes, counts or weights. Never call PLA "ceramic" and never say "hand-painted" unless the seller says so. "Colors may vary slightly between pieces" is always acceptable.

HONESTY ABOUT HANDMADE: only use phrases like "3D printed and finished by hand", "made in small batches" or "designed and 3D printed in our studio" when the seller facts support them. Specificity builds more trust than craftsmanship language.

ARABIC: same personality as the English. Easy, modern Arabic with an occasional conversational touch - never stiff corporate or translated-sounding Arabic (avoid lines like "أضف لمسة فنية ساحرة على مساحتك"). LOCALIZE, DON'T TRANSLATE: the Arabic can use different words as long as it carries the same feeling. Example of the right tone: "قطعة صغيرة من ذكريات القهوة العربية. مستوحاة من فناجين القهوة الملوّنة اللي نعرفها ونحبها. حطّها على الثلاجة، في ركن القهوة، أو اهديها لشخص رح يعرف الحكاية من أول نظرة." A single fitting emoji is fine.

FINAL TESTS before answering: (1) Could Amazon, Temu, Etsy or another gift store put its logo above this exact description? If yes, rewrite it. (2) Can a shopper understand what they are buying in 10 seconds? If not, simplify.`;

const BANNED = [
  "elevate", "add a touch", "beautifully crafted", "beautifully handcrafted", "meticulous",
  "perfect blend", "timeless elegance", "whether you're looking", "whether you are looking",
  "transform your", "attention to detail", "perfect addition", "look no further", "must-have",
];

const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

// Mechanical checks for the rules a model most often slips on.
function styleIssues(data, hints) {
  const issues = [];
  if (!data || typeof data !== "object") return ["The response was not a JSON object."];
  const en = [data.title_en, data.hook, data.desc_en].join(" ").toLowerCase();
  const hit = BANNED.filter((b) => en.includes(b));
  if (hit.length) issues.push("Remove banned filler phrases: " + hit.join(", ") + ".");
  const total = words(data.hook) + words(data.desc_en);
  if (total > 90) issues.push("Hook + description is " + total + " words; cut it to 40-80.");
  if (total < 25) issues.push("Hook + description is only " + total + " words; aim for 40-80.");
  if (String(data.title_en || "").length > 70) issues.push("English title is too long; keep it under 60 characters.");
  if (!String(data.hook || "").trim()) issues.push("The hook is missing.");
  const h = String(hints || "").toLowerCase();
  const detailText = (Array.isArray(data.details) ? data.details.join(" ") : "") + " " + en;
  if (/ceramic/i.test(detailText) && !h.includes("ceramic")) issues.push("Do not call the product ceramic; the seller did not say it is.");
  if (/hand[- ]?painted/i.test(detailText) && !/hand[- ]?paint/.test(h)) issues.push("Do not say hand-painted; the seller did not say it is.");
  if (String(data.desc_ar || "").includes("أضف لمسة")) issues.push("The Arabic sounds translated; rewrite it in easy, modern, localized Arabic.");
  return issues;
}

const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

// Never trust the model's shape: coerce every field into what the form expects.
function clean(data, categories, countries, imageCount) {
  const out = {
    title_en: str(data.title_en, 120),
    title_ar: str(data.title_ar, 120),
    hook: str(data.hook, 200),
    desc_en: str(data.desc_en, 2000),
    details: (Array.isArray(data.details) ? data.details : [])
      .map((d) => str(d, 80)).filter(Boolean).slice(0, 8),
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

  const promptText = `${SOUK3D_STYLE}

THE PRODUCT
${imageSources.length ? `${imageSources.length} photo(s) of the product are attached, in order. Study all of them: what the item is, colours, size cues, finish, and any Arabic text or cultural reference.\n` : ""}Product name: ${str(name, 200) || "(infer from the photos)"}
Current category: ${str(category, 40) || "(choose)"}
Country/heritage: ${str(country, 40) || "(none stated - only set one if clearly shown)"}
Production cost (USD): ${Number(cost) > 0 ? Number(cost) : "unknown"}
Seller facts and hints (the ONLY source for size, count, material and how it is made): ${str(hints, 3000) || "none"}
${style ? `\nExtra direction for this listing:\n${str(style, 3000)}\n` : ""}${examples ? `\nExisting Souk3D listings (match the brand, not their length or any filler they contain):\n${examples}\n` : ""}
Respond with ONLY a JSON object, no markdown and no commentary, with exactly these fields:
{
  "angle": "cultural | funny | typography | place | functional",
  "title_en": "clear searchable product name, max 60 chars",
  "title_ar": "natural Arabic product name, max 50 chars",
  "hook": "the one-line opening hook",
  "desc_en": "2-4 short sentences that follow the hook (do not repeat the hook). Hook + this together: 40-80 words",
  "details": ["short scannable facts only, e.g. Set of 2, 3D printed, Approx. 3 in each, Magnetic backing, Colors may vary slightly between pieces"],
  "desc_ar": "localized Arabic description, 25-60 words, same feeling, not a literal translation",
  "category": "exactly one of: ${categories.join(" | ")}",
  "country": "${countries.length ? "exactly one of: " + countries.join(" | ") + " - or empty string if not clearly indicated" : "empty string"}",
  "keywords": ["8 to 12 search phrases a shopper would type - this is where SEO terms go"],
  "customizable": true or false (true only if the item is clearly meant to carry a name or custom text),
  "emoji": "one emoji that represents the product",
  "badge": "one of: New, Best Seller, Sale, Limited - or empty string (default New for a new item)",
  "price_suggestion": number in USD for this item in the US gift market${Number(cost) > 0 ? ", at least 2.5x the production cost" : ""},
  "alt_texts": ["one short plain alt text per attached photo, same order"],
  "variations": [only if the photos or hints clearly show options such as several sizes or colours: {"name": "Size", "options": [{"label": "Small", "delta": 0}, {"label": "Large", "delta": 5}]}. Otherwise an empty array]
}`;

  const content = imageSources.map((source) => ({ type: "image", source }));
  content.push({ type: "text", text: promptText });

  const call = (model, messages) =>
    client.messages.create({ model, max_tokens: 2500, messages });
  const textOf = (message) =>
    (message.content || []).filter((x) => x.type === "text").map((x) => x.text).join("");

  try {
    let model = PRIMARY_MODEL;
    let messages = [{ role: "user", content }];
    let message;
    try {
      message = await call(model, messages);
    } catch (e) {
      console.warn("Primary model failed, falling back:", e && e.message);
      model = FALLBACK_MODEL;
      message = await call(model, messages);
    }
    let text = textOf(message);
    let data = extractJson(text);

    // The Souk3D writing test: if the draft breaks the style rules, send it
    // back once with the specific problems. Never loops more than once.
    const issues = styleIssues(data, hints);
    if (issues.length) {
      try {
        messages = messages.concat([
          { role: "assistant", content: text },
          { role: "user", content: "This draft breaks the Souk3D style rules:\n- " + issues.join("\n- ") + "\nRewrite it and return the full JSON object again, fixing every point." },
        ]);
        const retry = await call(model, messages);
        const retryData = extractJson(textOf(retry));
        if (styleIssues(retryData, hints).length <= issues.length) data = retryData;
      } catch (e) {
        console.warn("Style revision failed, keeping first draft:", e && e.message);
      }
    }
    return res.status(200).json(clean(data, categories, countries, imageSources.length));
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Generation failed", details: error.message });
  }
}
