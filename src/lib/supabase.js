import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = "product-images";

// ---------------------------------------------------------------------------
// Image optimisation
// Photos used to be stored as full-size PNGs (400 KB - 1.2 MB each), which made
// the shop and the admin products table very heavy. Every image is now resized
// and re-encoded to WebP, and a small thumbnail is stored alongside it for use
// in grids and tables. WebP keeps transparency, so cut-out photos still work.
// ---------------------------------------------------------------------------
const MAX_DIM = 1200;
const THUMB_DIM = 400;
const FULL_QUALITY = 0.85;
const THUMB_QUALITY = 0.8;

function loadImage(src, useCors) {
  return new Promise(function (resolve, reject) {
    const im = new Image();
    if (useCors) im.crossOrigin = "anonymous";
    im.onload = function () { resolve(im); };
    im.onerror = function () { reject(new Error("Could not load image")); };
    im.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(function (resolve) {
    canvas.toBlob(function (b) { resolve(b); }, type, quality);
  });
}

async function resizeToBlob(img, maxDim, quality) {
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDim / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  let blob = await canvasToBlob(canvas, "image/webp", quality);
  if (!blob) blob = await canvasToBlob(canvas, "image/jpeg", quality);
  return blob;
}

async function uploadBlob(blob) {
  const ext = blob.type.indexOf("webp") !== -1 ? "webp" : "jpg";
  const path = "products/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
  const up = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (up.error) throw up.error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Resize + upload one image source. Returns { url, thumbUrl, bytes }.
export async function optimizeAndUpload(src, useCors) {
  const img = await loadImage(src, useCors);
  const full = await resizeToBlob(img, MAX_DIM, FULL_QUALITY);
  const thumb = await resizeToBlob(img, THUMB_DIM, THUMB_QUALITY);
  const url = await uploadBlob(full);
  const thumbUrl = await uploadBlob(thumb);
  return { url: url, thumbUrl: thumbUrl, bytes: full.size + thumb.size };
}

// Upload any data: URL images to Storage (resized + WebP) and replace them
// with public URLs. Already-uploaded images are left alone.
async function uploadImagesToStorage(images) {
  const list = Array.isArray(images) ? images : [];
  const out = [];
  for (const img of list) {
    if (img && typeof img.url === "string" && img.url.startsWith("data:")) {
      try {
        const r = await optimizeAndUpload(img.url, false);
        out.push(Object.assign({}, img, { url: r.url, thumbUrl: r.thumbUrl }));
      } catch (e) {
        console.error("Image upload failed, keeping inline image", e);
        out.push(img);
      }
    } else if (img) {
      out.push(img);
    }
  }
  return out;
}

function baseImagesOf(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  if (p.imageUrl) return [{ url: p.imageUrl, bg: p.imageBg || "cream" }];
  return [];
}

// Map a database row to the app product shape
export function rowToProduct(r) {
  const images = Array.isArray(r.images) ? r.images : [];
  const first = images[0] || null;
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
    imageUrl: (first && first.url) || "",
    thumbUrl: (first && (first.thumbUrl || first.url)) || "",
    imageBg: r.image_bg || (first && first.bg) || "cream",
    desc: r.description || "",
    buyUrl: (r.external_links && r.external_links.buy) || "",
    desc_ar: r.description_ar || "",
    keywords: Array.isArray(r.tags) ? r.tags : [],
    badge: r.badge || "",
    emoji: r.emoji || "🏺",
    customizable: !!r.customizable,
  };
}

// Map an app product to a database row (sku is the upsert key; id is never sent)
export function productToRow(p) {
  const images = baseImagesOf(p);
  const num = (v) => (v === "" || v == null ? null : Number(v));
  return {
    sku: p.sku || ("S3D-" + String(Date.now()).slice(-5) + Math.floor(Math.random() * 90 + 10)),
    name: p.name || "",
    name_ar: p.name_ar || "",
    external_links: p.buyUrl ? { buy: p.buyUrl } : null,
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
  const images = await uploadImagesToStorage(baseImagesOf(p));
  const row = productToRow({ ...p, images });
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

// Archive / unarchive / any other status change on a single product.
export async function setProductStatus(id, status) {
  const { error } = await supabase.from("products").update({ status: status }).eq("id", id);
  if (error) throw error;
}

// One-time cleanup for products uploaded before the WebP pipeline existed.
// Re-downloads each stored image, resizes it, re-uploads it, and rewrites the
// row. Returns { before, after } byte counts, or null if nothing needed doing.
export async function reoptimizeProductImages(product) {
  const images = baseImagesOf(product);
  if (!images.length) return null;
  const out = [];
  let changed = false;
  let before = 0;
  let after = 0;
  for (const img of images) {
    const u = img && img.url;
    const isRemote = typeof u === "string" && u.indexOf("http") === 0;
    if (isRemote && !img.thumbUrl) {
      try {
        try {
          const head = await fetch(u, { cache: "no-store" });
          const buf = await head.blob();
          before += buf.size;
        } catch (e) { /* size is only for reporting */ }
        const r = await optimizeAndUpload(u, true);
        after += r.bytes;
        out.push(Object.assign({}, img, { url: r.url, thumbUrl: r.thumbUrl }));
        changed = true;
      } catch (e) {
        console.error("Re-optimize failed for one image", e);
        out.push(img);
      }
    } else {
      out.push(img);
    }
  }
  if (!changed) return null;
  const { error } = await supabase.from("products").update({ images: out }).eq("id", product.id);
  if (error) throw error;
  return { before: before, after: after };
}

export async function migrateLocalProducts(localProducts) {
  if (!localProducts || !localProducts.length) return 0;
  const rows = [];
  for (const p of localProducts) {
    const images = await uploadImagesToStorage(baseImagesOf(p));
    rows.push(productToRow({ ...p, images }));
  }
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "sku" });
  if (error) throw error;
  return rows.length;
}

export function rowToOrder(r) {
  const a = r.shipping_address || {};
  const loc = [a.city, a.state].filter(Boolean).join(", ");
  return {
    id: r.id,
    orderNumber: r.order_number,
    status: r.status || "new",
    customer: a.name || a.email || "Guest",
    email: a.email || "",
    location: loc,
    items: r.items || [],
    total: Number(r.total || 0),
    paymentStatus: r.payment_status || "pending",
    date: r.created_at
      ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "",
    trackingNumber: r.tracking_number || "",
    labelUrl: r.label_url || "",
    trackingUrl: r.tracking_url || "",
    shippingCarrier: r.shipping_carrier || "",
    address: r.shipping_address || {},
    isCustom: false,
  };
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchOrders error:", error);
    return [];
  }
  return (data || []).map(rowToOrder);
}
