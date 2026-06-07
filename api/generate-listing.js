import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, category, country, hints } = req.body;
  if (!name) return res.status(400).json({ error: "Product name is required" });

  const prompt = `You are an expert e-commerce copywriter specialising in handmade Arab heritage products sold to the Arab diaspora worldwide. Generate a complete product listing for the following product.

Product Name: ${name}
Category: ${category || "Home Decor"}
Heritage/Country: ${country || "Arab World"}
Additional hints: ${hints || "none"}

Generate a JSON response with EXACTLY these fields:
{
  "title_en": "SEO-optimised English title (max 80 chars, include key search terms)",
  "title_ar": "Arabic title - natural fluent Arabic, grammatically correct (max 60 chars)",
  "desc_en": "English marketing description 100-150 words. Include: what it is, how made, who for, why special, call to action. SEO-optimised.",
  "desc_ar": "Arabic description 80-120 words. Natural flowing Arabic. Culturally adapted. End with Arabic call to action.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "price_suggestion": 44.99,
  "badge": "Best Seller"
}

Badge must be one of: Best Seller, New, Sale, Limited, or empty string.
Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const data = JSON.parse(message.content[0].text.trim());
    return res.status(200).json(data);
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Generation failed", details: error.message });
  }
}
