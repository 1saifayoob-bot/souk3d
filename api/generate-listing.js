import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Robustly pull a JSON object out of Claude's reply, even if it wrapped it
// in ```json ... ``` fences or added stray commentary.
function extractJson(text) {
  let t = (text || "").trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  return JSON.parse(t);
}

// Turn whatever the client sent (a data: URL or an http(s) URL) into an
// Anthropic image source block.
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, category, country, hints, image } = req.body || {};
  if (!name && !image) {
    return res.status(400).json({ error: "Provide a product name or an image" });
  }

  const imageSource = buildImageSource(image);

  const promptText = `You are an expert e-commerce copywriter specialising in handmade Arab heritage products sold to the Arab diaspora worldwide. Generate a complete product listing.

${imageSource ? "An image of the product is attached. Study it carefully — identify what the item is, its materials, colours, craftsmanship and style — and base the listing on what you actually see in the image.\n" : ""}Product Name: ${name || "(infer an appropriate name from the image)"}
Category: ${category || "(infer the most fitting category from the product)"}
Heritage/Country: ${country || "Arab World"}
Additional hints: ${hints || "none"}

Respond with ONLY a JSON object — no markdown, no code fences, no commentary — with EXACTLY these fields:
{
  "title_en": "SEO-optimised English title (max 80 chars, include key search terms)",
  "title_ar": "Arabic title - natural fluent Arabic, grammatically correct (max 60 chars)",
  "desc_en": "English marketing description 100-150 words. Include: what it is, how made, who for, why special, call to action. SEO-optimised.",
  "desc_ar": "Arabic description 80-120 words. Natural flowing Arabic. Culturally adapted. End with Arabic call to action.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "price_suggestion": 44.99,
  "badge": "Best Seller"
}

Badge must be one of: Best Seller, New, Sale, Limited, or empty string.`;

  const content = [];
  if (imageSource) content.push({ type: "image", source: imageSource });
  content.push({ type: "text", text: promptText });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        { role: "user", content },
        // Prefill the assistant turn with "{" so the model continues a raw
        // JSON object and cannot prepend a ```json fence.
        { role: "assistant", content: "{" },
      ],
    });
    const raw = "{" + (message.content[0]?.text || "");
    const data = extractJson(raw);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Generation failed", details: error.message });
  }
}
