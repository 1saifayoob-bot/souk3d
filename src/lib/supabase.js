import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Map a database row to the app product shape
export function rowToProduct(r) {
  const images = Array.isArray(r.images) ? r.images : [];
  return {
    id: r.id,
    sku: r.sku,
    name: r.name || "",
    name_ar: r.name_ar || "",
    category: r.category || "",
    country: r.country || "",
    price: r.price != null ? Number(r.price) : "",
    compareAt: r.compare_at_price != null ? Number(r.compare_at_price) : "",
    cost: r.cost != null ? Number(r.cost) : "",
    stock: r.stock != null ? Number(r.stock) : 0,
    status: r.status || "active",
    featured: !!r.featured,
    images,
    imageUrl: (images[0] && images[0].url) || "",
    imageBg: r.image_bg || (images[0] && images[0].bg) || "cream",
    desc: r.description || "",
    desc_ar: r.description_ar || "",
    keywords: Array.isArray(r.tags) ? r.tags : [],
    badge: r.badge || "",
    emoji: r.emoji || "🏺",
    customizable: !!r.customizable,
  };
}

// Map an app product to a database row (sku is the upsert key; id is never sent)
export function productToRow(p) {
  const images = Array.isArray(p.images) && p.images.length
    ? p.images
    : (p.imageUrl ? [{ url: p.imageUrl, bg: p.imageBg || "cream" }] : []);
  const num = (v) => (v === "" || v == null ? null : Number(v));
  return {
    sku: p.sku || ("S3D-" + String(Date.now()).slice(-5) + Math.floor(Math.random() * 90 + 10)),
    name: p.name || "",
    name_ar: p.name_ar || "",
    category: p.category || "",
    country: p.country || "",
    price: num(p.price),
    compare_at_price: num(p.compareAt),
    cost: num(p.cost),
    stock: p.stock === "" || p.stock == null ? 0 : parseInt(p.stock) || 0,
    status: p.status || "active",
    featured: !!p.featured,
    images,
    description: p.desc || "",
    description_ar: p.desc_ar || "",
    tags: Array.isArray(p.keywords) ? p.keywords : [],
    badge: p.badge || null,
    emoji: p.emoji || "🏺",
    customizable: !!p.customizable,
    image_bg: p.imageBg || (images[0] && images[0].bg) || "cream",
  };
}

export async function fetchProducts({ activeOnly = false } = {}) {
  let q = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (activeOnly) q = q.eq("status", "active");
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(rowToProduct);
}

export async function saveProduct(p) {
  const row = productToRow(p);
  const { data, error } = await supabase
    .from("products")
    .upsert(row, { onConflict: "sku" })
    .select()
    .single();
  if (error) throw error;
  return rowToProduct(data);
}

export async function deleteProductById(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function migrateLocalProducts(localProducts) {
  if (!localProducts || !localProducts.length) return 0;
  const rows = localProducts.map(productToRow);
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "sku" });
  if (error) throw error;
  return rows.length;
}
