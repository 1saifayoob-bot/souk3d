import { createClient } from "@supabase/supabase-js";

// Anon client on purpose: RLS then applies, so a members-only product never
// leaks its details into a link preview for a crawler or a logged-out visitor.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// WhatsApp, Facebook and friends do not run JavaScript, so a client-rendered
// SPA gives them nothing to show. This serves the same index.html with real
// Open Graph tags injected for the product being shared.
export default async function handler(req, res) {
  const host = req.headers.host || "www.souk3d.com";
  const origin = "https://" + host;
  const sku = String((req.query && req.query.sku) || "").trim();

  let html = "";
  try {
    const shell = await fetch(origin + "/index.html");
    html = await shell.text();
  } catch (e) {
    res.setHeader("Location", "/");
    return res.status(302).end();
  }

  let p = null;
  if (sku) {
    try {
      const r = await supabase
        .from("products")
        .select("sku, name, name_ar, description, price, images")
        .eq("sku", sku)
        .maybeSingle();
      p = r.data || null;
    } catch (e) {
      p = null;
    }
  }

  if (p) {
    const first = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
    const img = (first && (first.url || first.thumbUrl)) || "";
    const title = p.name + " - Souk3D";
    const desc = String(
      p.description || "Handmade 3D-printed gifts celebrating Arab heritage, made by hand in Detroit."
    ).slice(0, 200);
    const url = origin + "/p/" + encodeURIComponent(p.sku);

    const tags = [
      '<meta property="og:type" content="product" />',
      '<meta property="og:site_name" content="Souk3D" />',
      '<meta property="og:title" content="' + esc(title) + '" />',
      '<meta property="og:description" content="' + esc(desc) + '" />',
      '<meta property="og:url" content="' + esc(url) + '" />',
      img ? '<meta property="og:image" content="' + esc(img) + '" />' : "",
      img ? '<meta property="og:image:width" content="1200" />' : "",
      '<meta property="product:price:amount" content="' + esc(p.price) + '" />',
      '<meta property="product:price:currency" content="USD" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:title" content="' + esc(title) + '" />',
      '<meta name="twitter:description" content="' + esc(desc) + '" />',
      img ? '<meta name="twitter:image" content="' + esc(img) + '" />' : "",
      '<link rel="canonical" href="' + esc(url) + '" />',
      "<title>" + esc(title) + "</title>",
    ]
      .filter(Boolean)
      .join("");

    // Drop the shell's own <title> so we do not end up with two.
    const ts = html.indexOf("<title>");
    const te = html.indexOf("</title>");
    if (ts !== -1 && te !== -1 && te > ts) {
      html = html.slice(0, ts) + html.slice(te + 8);
    }
    html = html.replace("</head>", tags + "</head>");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache at the edge so crawlers are fast, but let it refresh regularly.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
