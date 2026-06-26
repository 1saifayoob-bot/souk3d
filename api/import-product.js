import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function requireAdmin(req) {
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
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return null;
  }
  return data.user;
}

function extractJson(text) {
  let t = "{" + (text || "");
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  return JSON.parse(t);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireAdmin(req);
  if (!user) return res.status(403).json({ error: "Not authorized" });

  try {
    const { url } = req.body || {};
    if (
      !url ||
      !(
        String(url).startsWith("http://") || String(url).startsWith("https://")
      )
    ) {
      return res.status(400).json({ error: "Provide a valid product URL." });
    }

    let html = "";
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      html = await r.text();
    } catch (e) {
      return res
        .status(400)
        .json({ error: "Could not reach that link. Please fill it in manually." });
    }

    if (!html || html.length < 200) {
      return res.status(422).json({
        error:
          "That page returned no readable content. Please fill it in manually.",
      });
    }

    const snippet = String(html).slice(0, 18000);
    const promptText =
      "You are extracting product details from the raw HTML of an online store product page (it may be Amazon, Etsy, eBay, a Shopify store, etc.). Read the HTML carefully, especially meta tags such as og:title, og:description, og:image, product:price:amount, and the page title. Respond with ONLY a JSON object, no markdown, no commentary, with EXACTLY these fields: title (a clean human product title), description (a friendly, specific 80 to 130 word product description based on what the product genuinely is), price (a number such as 29.99, or 0 if unknown), category (a short best-guess category), image (the main product image URL if one is clearly present, otherwise an empty string). If the page is a bot-check, captcha, login wall, or has no product, set title to an empty string. HTML: " +
      snippet;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      messages: [
        { role: "user", content: promptText },
        { role: "assistant", content: "{" },
      ],
    });

    const raw = message.content[0] && message.content[0].text ? message.content[0].text : "";
    let data;
    try {
      data = extractJson(raw);
    } catch (e) {
      return res.status(422).json({
        error:
          "Could not read product details from that page. Please fill it in manually.",
      });
    }

    if (!data || !data.title) {
      return res.status(422).json({
        error:
          "That site blocked the import or had no product. Please fill it in manually.",
      });
    }

    return res.status(200).json({
      title: data.title || "",
      description: data.description || "",
      price: data.price || "",
      category: data.category || "",
      image: data.image || "",
    });
  } catch (err) {
    console.error("import-product error:", err);
    return res
      .status(500)
      .json({ error: "Import failed", details: err.message });
  }
}
