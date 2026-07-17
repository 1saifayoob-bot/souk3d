
import React, { useState, useEffect } from "react";
import { supabase, fetchProducts, signUpCustomer, signInCustomer, signOutCustomer, sendPasswordReset, getCurrentUser, onAuthChange, fetchMyOrders } from "./lib/supabase";

// ─── BRAND CONSTANTS ───────────────────────────────────────────────────────────
const C = {
  saffron: "#D4881F", saffronLight: "#E8B864", saffronDark: "#A86510",
  terracotta: "#B85C3C", damascene: "#1E5C8C", olive: "#5C6B3F",
  charcoal: "#2A1F18", inkBrown: "#3D2817", cream: "#FAF3E7",
  cream2: "#F0E5D0", wheat: "#E8D5A8", textMuted: "#7A6856",
};
const F = { display: "'Cormorant Garamond', serif", body: "'Outfit', sans-serif", arabic: "'Amiri', serif" };

// ─── STOREFRONT MOCK DATA ──────────────────────────────────────────────────────
const DEFAULT_STORE_PRODUCTS = [
  { id: 1, name: "Damascus Name Plaque", name_ar: "لوحة الاسم الدمبقية", category: "Home Decor", country: "Syria", flag: "🇸🇾", price: 44.99, compareAt: 59.99, badge: "Best Seller", stars: 4.9, reviews: 47, emoji: "🏺", desc: "Beautifully 3D-printed wall plaque featuring your family name in Diwani calligraphy. Each piece is hand-finished in Detroit and ships worldwide.", customizable: true },
  { id: 2, name: "Eid Mubarak Lantern", name_ar: "فانوس عيد مبارك", category: "Seasonal", country: "Pan-Arab", flag: "🌍", price: 34.99, compareAt: null, badge: "New", stars: 4.8, reviews: 38, emoji: "🪔", desc: "Intricate geometric lantern celebrating Eid al-Fitr and Eid al-Adha. Perfect as a centerpiece or gift.", customizable: false },
  { id: 3, name: "Palestinian Olive Tree", name_ar: "شجرة الزيتون الفلسطينية", category: "Art", country: "Palestine", flag: "🇵🇸", price: 54.99, compareAt: null, badge: null, stars: 5.0, reviews: 29, emoji: "🫒", desc: "A symbol of steadfastness and heritage. This sculptural olive tree captures the spirit of Palestinian connection to the land.", customizable: false },
  { id: 4, name: "Kufic Calligraphy Frame", name_ar: "إطار الخط الكوفي", category: "Art", country: "Pan-Arab", flag: "🌍", price: 64.99, compareAt: 79.99, badge: "Sale", stars: 4.7, reviews: 18, emoji: "✦", desc: "Custom Quranic verse or family name rendered in the ancient Kufic script, mounted in a sleek matte frame.", customizable: true },
];

// Reads from localStorage (set by admin panel), falls back to defaults
const STORE_PRODUCTS = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("souk3d_products"));
    if (saved && saved.length > 0) {
      return saved
        .filter(p => p.status === "active")
        .map(p => ({
          id: p.id,
          buyUrl: p.buyUrl || "",
        imageUrl: p.imageUrl || (p.images && p.images[0] && p.images[0].url) || "",
          images: p.images || [],
          imageBg: p.imageBg || (p.images && p.images[0] && p.images[0].bg) || "cream",
          name: p.name || "",
          name_ar: p.name_ar || "",
          category: p.category || "Other",
          country: p.country || "Pan-Arab",
          flag: p.flag || "🌍",
          price: parseFloat(p.price) || 0,
          compareAt: p.compareAt ? parseFloat(p.compareAt) : null,
          badge: p.badge || null,
          stars: parseFloat(p.stars) || 0,
          reviews: parseInt(p.reviews) || 0,
          emoji: p.emoji || "🏺",
          desc: p.desc || "",
          desc_ar: p.desc_ar || "",
          customizable: !!p.customizable,
        }));
    }
  } catch (e) {}
  return DEFAULT_STORE_PRODUCTS;
})();

const HERITAGE_ITEMS = [
  { country: "Syria", flag: "🇸🇾", arabic: "سوريا", count: 12, color: C.saffron },
  { country: "Lebanon", flag: "🇱🇧", arabic: "لبنان", count: 8, color: C.terracotta },
  { country: "Palestine", flag: "🇵🇸", arabic: "فلسطين", count: 10, color: C.damascene },
  { country: "Egypt", flag: "🇪🇬", arabic: "مصر", count: 7, color: C.olive },
  { country: "Iraq", flag: "🇮🇶", arabic: "العراق", count: 6, color: C.saffronDark },
  { country: "Pan-Arab", flag: "🌍", arabic: "عربي", count: 15, color: C.inkBrown },
];

const REVIEWS = [
  { name: "Layla H.", flag: "🇺🇸", location: "Detroit, MI", text: "Nala's work is absolutely stunning. The Damascus name plaque hangs above our fireplace and gets compliments every single day. Ordered a second one as a gift!", stars: 5, product: "Damascus Name Plaque", arabic: "ممتاز جداً" },
  { name: "Omar K.", flag: "🇨🇦", location: "Toronto, ON", text: "Finally someone who understands the diaspora experience. Every piece tells a story. Fast shipping to Canada too.", stars: 5, product: "Eid Mubarak Lantern", arabic: "" },
  { name: "Yara M.", flag: "🇬🇧", location: "London, UK", text: "The Palestinian olive tree sculpture is breathtaking. My mother cried when she saw it. It means so much to our family.", stars: 5, product: "Palestinian Olive Tree", arabic: "شكراً جزيلاً" },
];

// ─── SHARED STOREFRONT COMPONENTS ─────────────────────────────────────────────
function Stars({ count, size = 13 }) {
  return <span style={{ color: C.saffron, fontSize: size, letterSpacing: 1 }}>{"★".repeat(Math.floor(count))}{"☆".repeat(5 - Math.floor(count))}</span>;
}

function ProductCard({ product, onView, onAddToCart }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s", boxShadow: hovered ? "0 8px 32px rgba(42,31,24,0.14)" : "none" }}>
      <div onClick={() => onView(product)} style={{ aspectRatio: "1", background: `linear-gradient(135deg, ${C.cream2} 0%, ${C.wheat}44 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, position: "relative" }}>
        {(product.thumbUrl || product.imageUrl || (product.images && product.images[0] && product.images[0].url)) ? <img src={product.thumbUrl || product.imageUrl || (product.images && product.images[0] && product.images[0].url) || ""} alt={product.name || ""} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }} /> : product.emoji}
        {product.badge && (
          <div style={{ position: "absolute", top: 12, left: 12, background: product.badge === "Sale" ? C.terracotta : product.badge === "New" ? C.damascene : C.saffron, color: "#FFF", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, fontFamily: F.body }}>{product.badge}</div>
        )}
        {product.customizable && (
          <div style={{ position: "absolute", top: 12, right: 12, background: C.olive, color: "#FFF", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 10, fontFamily: F.body }}>✦ Custom</div>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 9, color: C.textMuted, fontFamily: F.body, letterSpacing: 1, marginBottom: 4 }}>{product.flag} {product.country}</div>
        <div onClick={() => onView(product)} style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.charcoal, marginBottom: 2, lineHeight: 1.2 }}>{product.name}</div>
        <div style={{ fontFamily: F.arabic, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>{product.name_ar}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Stars count={product.stars} />
          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F.body }}>({product.reviews})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontFamily: F.body, fontSize: 17, fontWeight: 700, color: C.charcoal }}>${product.price}</span>
            {product.compareAt && <span style={{ fontSize: 12, color: C.textMuted, textDecoration: "line-through", marginLeft: 6 }}>${product.compareAt}</span>}
          </div>
          <button onClick={() => onAddToCart(product)} style={{ background: C.charcoal, color: "#FFF", border: "none", padding: "8px 14px", fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: "pointer", fontFamily: F.body, letterSpacing: 0.5 }}>Add to Cart</button>
        </div>
              {product.buyUrl && (
                <a href={product.buyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 10, textAlign: "center", padding: "14px", background: C.saffron, color: "#FFF", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, textDecoration: "none" }}>
                  Buy on {product.buyUrl.toLowerCase().includes("amazon") ? "Amazon" : product.buyUrl.toLowerCase().includes("etsy") ? "Etsy" : product.buyUrl.toLowerCase().includes("ebay") ? "eBay" : "their store"}
                </a>
              )}
      </div>
    </div>
  );
}

// ─── CART DRAWER ─────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onUpdateQty, onRemove, onCheckout }) {
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 75 ? 0 : 5.99;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const total = subtotal + shipping - discount;
  const freeShipProgress = Math.min(100, (subtotal / 75) * 100);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 95vw)", background: C.cream, zIndex: 201, boxShadow: "-20px 0 60px rgba(0,0,0,0.25)", animation: "slideIn 0.3s ease", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 22px", borderBottom: `0.5px solid ${C.wheat}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.charcoal }}>Your Cart ({cart.length})</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.textMuted }}>✕</button>
        </div>

        {/* Free shipping bar */}
        {subtotal < 75 && (
          <div style={{ padding: "10px 22px", background: C.saffron + "14", borderBottom: `0.5px solid ${C.wheat}` }}>
            <div style={{ fontSize: 11, color: C.charcoal, fontFamily: F.body, marginBottom: 6 }}>Add <strong>${(75 - subtotal).toFixed(2)}</strong> more for free shipping!</div>
            <div style={{ height: 4, background: C.wheat, borderRadius: 4 }}>
              <div style={{ height: 4, width: `${freeShipProgress}%`, background: C.saffron, borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          </div>
        )}
        {subtotal >= 75 && (
          <div style={{ padding: "10px 22px", background: C.olive + "18", borderBottom: `0.5px solid ${C.wheat}` }}>
            <div style={{ fontSize: 11, color: C.olive, fontFamily: F.body, fontWeight: 600 }}>🎉 You've unlocked free shipping!</div>
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px" }}>
          {cart.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.textMuted, fontFamily: F.body }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <div>Your cart is empty</div>
            </div>
           )}
          {cart.map(item => (
            <div key={item.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `0.5px solid ${C.wheat}` }}>
              <div style={{ width: 64, height: 64, background: `linear-gradient(135deg, ${C.cream2} 0%, ${C.wheat}44 100%)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.emojh}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.charcoal, fontFamily: F.body }}>{item.name}</div>
                {item.customText && <div style={{ fontFamily: F.arabic, fontSize: 14, color: C.saffron, direction: "rtl", textAlign: "right" }}>{item.customText}</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, border: `0.5px solid ${C.wheat}`, borderRadius: 6, overflow: "hidden" }}>
                    <button onClick={() => onUpdateQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>−</button>
                    <span style={{ fontSize: 13, fontFamily: F.body, fontWeight: 600 }}>{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>+</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>${(item.price * item.qty).toFixed(2)}</span>
                    <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 22px", borderTop: `0.5px solid ${C.wheat}`, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Promo code" style={{ flex: 1, padding: "9px 12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: F.body, outline: "none" }} />
            <button onClick={() => { if (promoCode.toUpperCase() === "WEDCOME10") setPromoApplied(true); }} style={{ padding: "9px 14px", background: C.charcoal, color: "#FFF", border: "none", borderRadius: 8, fontSize: 12, fontFamily: F.body, cursor: "pointer" }}>Apply</button>
          </div>
          {promoApplied && <div style={{ fontSize: 11, color: C.olive, marginBottom: 8, fontFamily: F.body }}>✓ WELCOME10 applied — 10% off!</div>}
          {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Shipping", subtotal >= 75 ? "Free" : "$5.99"], ...(promoApplied ? [["Discount (10%)", `-$${discount.toFixed(2)}`]] : [])].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: F.body, marginBottom: 4, color: k === "Discount (10%)" ? C.olive : C.charcoal }}><span>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: C.charcoal, fontFamily: F.body, borderTop: `0.5px solid ${C.wheat}`, paddingTop: 10, marginTop: 6, marginBottom: 14 }}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
          <button onClick={onCheckout} disabled={cart.length === 0} style={{ width: "100%", padding: "14px", background: cart.length === 0 ? C.wheat : C.charcoal, color: "#FFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: cart.length === 0 ? "not-allowed" : "pointer", letterSpacing: 0.5 }}>Checkout · ${total.toFixed(2)}</button>
        </div>
      </div>
    </>
  );
}

// ─── PRODUCT DETAIL PACE �,� 450─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function ProductDetail({ product, onBack, onAddToCart }) {
  const [tab, setTab] = useState("description");
  const [activeImg, setActiveImg] = useState(0);
  const galleryObjs = (product.images && product.images.length ? product.images.filter((im) => im && im.url) : (product.imageUrl ? [{ url: product.imageUrl }] : [])).filter((im, i, arr) => arr.findIndex((x) => x.url === im.url) === i);
  const galleryImgs = galleryObjs.map((im) => im.url);
  const mainSrc = galleryImgs[activeImg] || galleryImgs[0] || product.imageUrl || "";
  const [qty, setQty] = useState(1);
  const [customText, setCustomText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Diwani");
  const STYLES = ["Diwani", "Modern", "Kufi", "Classic"];

  const handleAdd = () => {
    onAddToCart({ ...product, qty, customText: customText || undefined });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
      {/* Breadcrumbs */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 24, fontSize: 12, fontFamily: F.body, color: C.textMuted }}>
        <span onClick={onBack} style={{ cursor: "pointer", color: C.saffron }}>Home</span>
        <span>/</span>
        <span onClick={onBack} style={{ cursor: "pointer" }}>{product.category}</span>
        <span>/</span>
        <span style={{ color: C.charcoal }}>{product.name}</span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 48 }}>
        {/* Gallery */}
        <div>
          <div style={{ aspectRatio: "1", background: `linear-gradient(135deg, ${C.cream2} 0%, ${C.wheat}55 100%)`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120, position: "relative", marginBottom: 12 }}>
            {(mainSrc) ? <img src={mainSrc || ""} alt={product.name || ""} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }} /> : product.emoji}
            {product.badge && <div style={{ position: "absolute", top: 16, left: 16, background: C.saffron, color: "#FFF", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 12, fontFamily: F.body }}>{product.badge}</div>}
          </div>
          {galleryImgs.length > 1 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {galleryImgs.map((thumbUrl, i) => (
              <div key={i} onClick={() => setActiveImg(i)} style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: i === activeImg ? "2px solid " + C.saffron : "0.5px solid " + C.wheat, background: C.cream2 }}>
                <img src={(galleryObjs[i] && galleryObjs[i].thumbUrl) || thumbUrl} alt={product.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Product info */}
        <div>
          <div style={{ fontSize: 10, background: C.saffron + "22", color: C.saffron, padding: "3px 10px", borderRadius: 10, display: "inline-block", fontWeight: 600, marginBottom: 10, fontFamily: F.body }}>{product.flag} {product.country}</div>
          <div style={{ fontFamily: F.display, fontSize: 34, fontWeight: 600, color: C.charcoal, lineHeight: 1.1, marginBottom: 6 }}>{product.name}</div>
          <div style={{ fontFamily: F.arabic, fontSize: 22, color: C.saffron, marginBottom: 12, direction: "rtl", textAlign: "right" }}>{product.name_ar}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Stars count={product.stars} size={16} />
            <span style={{ fontSize: 13, color: C.textMuted, fontFamily: F.body }}>{product.stars} ({product.reviews} reviews)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
            <span style={{ fontFamily: F.body, fontSize: 28, fontWeight: 700, color: C.charcoal }}>${product.price}</span>
            {product.compareAt && <span style={{ fontSize: 16, color: C.textMuted, textDecoration: "line-through" }}>${product.compareAt}</span>}
          </div>
          <p style={{ fontSize: 14, color: C.textMuted, fontFamily: F.body, lineHeight: 1.7, marginBottom: 20 }}>{product.desc}</p>
          {product.desc_ar && <p dir="rtl" style={{ fontSize: 14, color: C.textMuted, fontFamily: F.arabic, lineHeight: 1.9, marginBottom: 20, textAlign: "right" }}>{product.desc_ar}</p>}

          {/* Customization card */}
          {product.customizable && (
            <div style={{ background: C.charcoal, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronLight, letterSpacing: 0.8, marginBottom: 12, fontFamily: F.body }}>✦ ARABIC CUSTOMIZATION</div>
              <input value={customText} onChange={e => setCustomText(e.target.value)} placeholder="أكتب نصك بالعربي هنا…" style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.1)", border: `0.5px solid rgba(255,255,255,0.2)`, borderRadius: 8, fontSize: 18, fontFamily: F.arabic, color: "#FFF", outline: "none", direction: "rtl", textAlign: "right", marginBottom: 10, boxSizing: "border-box" }} />
              {customText && <div style={{ fontFamily: F.arabic, fontSize: 28, color: C.saffron, direction: "rtl", textAlign: "right", marginBottom: 10 }}>{customText}</div>}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STYLES.map(s => (
                  <button key={s} onClick={() => setSelectedStyle(s)} style={{ padding: "5px 12px", border: `0.5px solid ${selectedStyle === s ? C.saffron : "rgba(255,255,255,0.2)"}`, borderRadius: 16, background: selectedStyle === s ? C.saffron : "transparent", color: selectedStyle === s ? "#FFF" : "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: F.body, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + CTA */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", border: `0.5px solid ${C.wheat}`, borderRadius: 8, overflow: "hidden" }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 44, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>−</button>
              <span style={{ width: 40, textAlign: "center", fontSize: 15, fontWeight: 600, fontFamily: F.body }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 36, height: 44, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <button onClick={handleAdd} style={{ flex: 1, padding: "14px", background: C.charcoal, color: "#FFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: "pointer" }}>Add to Cart</button>
          </div>
          <button style={{ width: "100%", padding: "13px", background: C.saffron, color: "#FFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: "pointer", marginBottom: 16 }}>Buy Now</button>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {["🔒 Secure payment", "🚚 Free ship $75+", "✦ Handmade", "🔄 Easy returns"].map(b => (
              <span key={b} style={{ fontSize: 11, color: C.textMuted, fontFamily: F.body }}>{b}</span>
            ))}
          </div>

            <ShareRow product={product} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `0.5px solid ${C.wheat}`, marginBottom: 24, display: "flex", gap: 0 }}>
        {["description", "specifications", "shipping", "faq"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? C.saffron : "transparent"}`, fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? C.charcoal : C.textMuted, cursor: "pointer", fontFamily: F.body, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      <div style={{ fontSize: 14, color: C.textMuted, fontFamily: F.body, lineHeight: 1.8, marginBottom: 40, maxWidth: 700 }}>
        {tab === "description" && product.desc}
        {tab === "specifications" && "Material: PLA+ filament · Dimensions: approx. 8\" × 6\" · Weight: 180g · Finish: Matte white (custom colors available) · Mounting: Keyhole slots on back (hardware included)"}
        {tab === "shipping" && "Processing time: 3–5 business days · USA: Standard $5.99 (5–8 days), Express $12.99 (2–3 days) · Canada: $9.99 standard · International: From $14.99 · Free shipping on orders $75+"}
        {tab === "faq" && "Q: Can I request any Arabic text? A: Yes! Any name, verse, or phrase in any Arabic calligraphy style. Q: Do you ship internationally? A: Yes, we ship worldwide. Q: How long does a custom order take? A: 5–7 business days plus shipping."}
      </div>

      {/* Reviews */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, color: C.charcoal, marginBottom: 20 }}>Customer Reviews</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, fontFamily: F.body }}>{r.flag} {r.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F.body }}>{r.location}</div>
                </div>
                <div style={{ fontSize: 9, background: C.olive + "22", color: C.olive, padding: "2px 7px", borderRadius: 6, fontWeight: 600, height: "fit-content", fontFamily: F.body }}>✓ Verified</div>
              </div>
              <Stars count={r.stars} />
              <p style={{ fontSize: 13, color: C.charcoal, fontFamily: F.body, lineHeight: 1.6, marginTop: 8, marginBottom: r.arabic ? 6 : 0 }}>{r.text}</p>
              {r.arabic && <div style={{ fontFamily: F.arabic, fontSize: 15, color: C.saffron, direction: "rtl", textAlign: "right" }}>{r.arabic}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
function OrderConfirmed({ onContinue }) {
  return (
    <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>Order Confirmed</div>
      <div style={{ fontFamily: F.arabic, fontSize: 22, color: C.saffron, marginBottom: 16 }}>شكراً لطلبك</div>
      <p style={{ fontSize: 14, color: C.textMuted, fontFamily: F.body, lineHeight: 1.7, marginBottom: 24 }}>Thank you! Your payment went through and your order is confirmed. A receipt has been emailed to you, and we will be in touch as your order is prepared.</p>
      <button onClick={onContinue} style={{ padding: "13px 32px", background: C.saffron, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>Continue Shopping</button>
    </div>
  );
}

function CheckoutPage({ cart, onBack }) {
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [address, setAddress] = useState({ name: "", line1: "", line2: "", city: "", state: "", zip: "", country: "US" });
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [giftMessage, setGiftMessage] = useState("");
  const [step, setStep] = useState("details");
  const [paying, setPaying] = useState(false);
  async function placeOrder() {
    if (!contact.email || !address.name || !address.line1 || !address.city || !address.zip) {
      alert("Please fill in your email and full shipping address first.");
      return;
    }
    setPaying(true);
    try {
      // Attach the session token if signed in - the server decides the discount.
      const { data: sess } = await supabase.auth.getSession();
      const memberToken = sess && sess.session ? sess.session.access_token : "";
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: memberToken
          ? { "Content-Type": "application/json", Authorization: "Bearer " + memberToken }
          : { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ id: i.id, qty: i.qty })),
          contact,
          address,
          shippingMethod,
          giftMessage,
        }),
      });
      const data = await res.json();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        alert(data && data.error ? data.error : "Could not start checkout. Please try again.");
        setPaying(false);
      }
    } catch (e) {
      alert("Checkout failed. Please check your connection and try again.");
      setPaying(false);
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = shippingMethod === "express" ? 12.99 : subtotal >= 75 ? 0 : 5.99;
  const total = subtotal + shipping;

  if (step === "success") {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>Order Confirmed!</div>
        <div style={{ fontFamily: F.arabic, fontSize: 22, color: C.saffron, marginBottom: 16 }}>مبروك طلبك!</div>
        <p style={{ fontSize: 14, color: C.textMuted, fontFamily: F.body, lineHeight: 1.7, marginBottom: 24 }}>Your order has been received. Nala will begin crafting your pieces within 1–2 business days. You'll receive an email confirmation shortly.</p>
        <button onClick={onBack} style={{ padding: "13px 32px", background: C.charcoal, color: "#FFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.charcoal, marginBottom: 24 }}>Checkout</div>

      {/* Express buttons */}
      <div style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F.body, textAlign: "center", marginBottom: 12 }}>Express checkout</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[["Shop Pay", C.charcoal], ["Apple Pay", "#000"], ["Google Pay", "#4285F4"]].map(([name, bg]) => (
            <button key={name} style={{ flex: 1, padding: "12px", background: bg, color: "#FFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F.body }}>{name}</button>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 12, fontFamily: F.body }}>— or continue below —</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        {/* Form */}
        <div>
          {/* Contact */}
          <div style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, fontFamily: F.body, marginBottom: 14 }}>Contact</div>
            {[["Email", "email", "email", contact.email], ["Phone (optional)", "phone", "tel", contact.phone]].map(([label, key, type, val]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F.body, marginBottom: 4 }}>{label}</div>
                <input type={type} value={val} onChange={e => setContact(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: F.body, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>

          {/* Shipping address */}
          <div style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, fontFamily: F.body, marginBottom: 14 }}>Shipping Address</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Full Name", "name"], ["Address Line 1", "line1"], ["Apt/Suite (optional)", "line2"], ["City", "city"], ["State/Province", "state"], ["ZIP/Postal Code", "zip"]].map(([label, key]) => (
                <div key={key} style={{ gridColumn: key === "line1" || key === "name" ? "1/-1" : "auto" }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F.body, marginBottom: 4 }}>{label}</div>
                  <input value={address[key]} onChange={e => setAddress(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: F.body, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Shipping method */}
          <div style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, fontFamily: F.body, marginBottom: 14 }}>Shipping Method</div>
            {[["standard", "Standard (5–8 days)", subtotal >= 75 ? "Free" : "$5.99"], ["express", "Express (2–3 days)", "$12.99"]].map(([val, label, price]) => (
              <div key={val} onClick={() => setShippingMethod(val)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", border: `0.5px solid ${shippingMethod === val ? C.saffron : C.wheat}`, borderRadius: 8, cursor: "pointer", marginBottom: 8, background: shippingMethod === val ? C.saffron + "0A" : "#FFF" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${shippingMethod === val ? C.saffron : C.wheat}`, background: shippingMethod === val ? C.saffron : "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {shippingMethod === val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFF" }} />}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontFamily: F.body }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{price}</div>
              </div>
            ))}
          </div>

          {/* Gift message */}
          <div style={{ background: C.terracotta + "0E", border: `0.5px solid ${C.terracotta}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.terracotta, fontFamily: F.body, marginBottom: 8 }}>🎁 Add a gift message</div>
            <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder="Write a personal message for the recipient…" style={{ width: "100%", minHeight: 72, padding: "10px 12px", border: `0.5px solid ${C.terracotta}44`, borderRadius: 8, fontSize: 13, fontFamily: F.body, background: "transparent", outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>

          {/* Payment */}
          <div style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, fontFamily: F.body, marginBottom: 14 }}>Payment</div>
            <div style={{ padding: "12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, background: "#FAFAFA", marginBottom: 12 }}>
              <input placeholder="1234 5678 9012 3456" style={{ width: "100%", border: "none", background: "transparent", fontSize: 15, fontFamily: "monospace", letterSpacing: 2, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="MM/YY" style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, fontFamily: "monospace", outline: "none" }} />
                <input placeholder="CVC" style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, fontFamily: "monospace", outline: "none" }} />
              </div>
            </div>
            <button onClick={() => placeOrder()} style={{ width: "100%", padding: "14px", background: C.saffron, color: "#FFF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: F.body, cursor: "pointer" }}>Place Order · ${total.toFixed(2)}</button>
        </div>
        </div>

        {/* Order summary sidebar */}
        <div style={{ position: "sticky", top: 20, height: "fit-content" }}>
          <div style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "20px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, fontFamily: F.body, marginBottom: 14 }}>Order Summary</div>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${C.cream2} 0%, ${C.wheat}44 100%)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, position: "relative" }}>
                  {item.emoji}
                  <div style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, background: C.charcoal, color: "#FFF", borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.qty}</div>
                </div>
                <div style={{ flex: 1, fontSize: 12, fontFamily: F.body }}>{item.name}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>${(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
            <div style={{ borderTop: `0.5px solid ${C.wheat}`, paddingTop: 12, marginTop: 4 }}>
              {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Shipping", shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`], ["Total", `$${total.toFixed(2)}`]].map(([k, v], i) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: i === 2 ? 15 : 13, fontWeight: i === 2 ? 700 : 400, marginBottom: 6, fontFamily: F.body, color: C.charcoal, borderTop: i === 2 ? `0.5px solid ${C.wheat}` : "none", paddingTop: i === 2 ? 8 : 0 }}>
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOM ORDER FORM ────────────────────────────────────────────────────────
function CustomOrderForm({ onBack }) {
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [arabicText, setArabicText] = useState("");
  const [style, setStyle] = useState("Diwani");
  const [color, setColor] = useState("Gold");
  const [deadline, setDeadline] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", whatsapp: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [reference, setReference] = useState("");

  // This used to just flip setSubmitted(true), so every request a customer
  // sent was silently thrown away. It now actually saves and emails.
  const submitRequest = async () => {
    if (sending) return;
    if (!formData.name.trim() || !formData.email.trim()) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/create-custom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          notes: formData.notes,
          occasion: occasion,
          arabicText: arabicText,
          style: style,
          color: color,
          deadline: deadline,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setSendError((data && data.error) || "Something went wrong. Please try again, or email us at order@souk3d.com.");
        setSending(false);
        return;
      }
      setReference(data.reference || "");
      setSubmitted(true);
    } catch (e) {
      setSendError("We could not reach the server. Please check your connection and try again.");
    }
    setSending(false);
  };

  const OCCASIONS = [
    { id: "wedding", label: "Wedding", emoji: "💍", arabic: "زفاف" },
    { id: "graduation", label: "Graduation", emoji: "🎓", arabic: "تخرج" },
    { id: "baby", label: "New Baby", emoji: "👶", arabic: "مولود حديد" },
    { id: "eid", label: "Eid", emoji: "🌙", arabic: "عيد" },
    { id: "birthday", label: "Birthday", emoji: "🎂", arabic: "عيد ميلاد" },
    { id: "anniversary", label: "Anniversary", emoji: "💞", arabic: "ذكرى سنوية" },
    { id: "housewarming", label: "Housewarming", emoji: "🏡", arabic: "منزل جديد" },
    { id: "other", label: "Other", emoji: "✦", arabic: "أخرى" },
  ];
  const COLORS_LIST = [{ name: "Gold", hex: "#D4881F" }, { name: "White", hex: "#F5F5F5" }, { name: "Black", hex: "#1A1A1A" }, { name: "Blue", hex: "#1E5C8C" }, { name: "Rose Gold", hex: "#C9856F" }];
  const STYLES = ["Diwani", "Modern", "Kufi", "Classic"];

  if (submitted) {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✦</div>
        <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>Request Received!</div>
        <div style={{ fontFamily: F.arabic, fontSize: 24, color: C.saffron, marginBottom: 16 }}>تم استلام طلبك!</div>
        {reference && (
          <div style={{ display: "inline-block", background: C.cream2, border: "0.5px solid " + C.wheat, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontFamily: F.body, color: C.textMuted, marginBottom: 16 }}>Reference {reference}</div>
        )}
        <p style={{ fontSize: 14, color: C.textMuted, fontFamily: F.body, lineHeight: 1.7, marginBottom: 24 }}>Nala will review your request and send you a personalized quote within 24 hours. Check your email and WhatsApp!</p>
        <button onClick={onBack} style={{ padding: "13px 32px", background: C.saffron, color: "#FFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>Back to Shop</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>
      {/* Hero header */}
      <div style={{ background: C.charcoal, borderRadius: 16, padding: "32px", textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 600, color: "#FFF", marginBottom: 8 }}>Custom Order Request</div>
        <div style={{ fontFamily: F.arabic, fontSize: 22, color: C.saffron, marginBottom: 16 }}>طلب مخصص</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {["✦ Handmade for you", "💬 Reply in 24h", "🔒 No payment until approved"].map(t => (
            <span key={t} style={{ fontSize: 11, color: C.wheat, fontFamily: F.body, background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 12 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
        {[1, 2, 3].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: step >= s ? C.saffron : C.wheat, color: step >= s ? "#FFF" : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{s}</div>
              <div style={{ fontSize: 10, color: step >= s ? C.saffron : C.textMuted, fontFamily: F.body, fontWeight: step >= s ? 600 : 400, whiteSpace: "nowrap" }}>{["Occasion", "Details", "Your Info"][i]}</div>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > s ? C.saffron : C.wheat, margin: "0 4px", marginBottom: 20 }} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: C.charcoal, marginBottom: 20, textAlign: "center" }}>What's the occasion?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
            {OCCASIONS.map(o => (
              <div key={o.id} onClick={() => setOccasion(o.id)} style={{ background: occasion === o.id ? C.saffron + "18" : "#FFF", border: `1.5px solid ${occasion === o.id ? C.saffron : C.wheat}`, borderRadius: 12, padding: "16px 10px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{o.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal, fontFamily: F.body }}>{o.label}</div>
                <div style={{ fontFamily: F.arabic, fontSize: 12, color: C.textMuted }}>{o.arabic}</div>
              </div>
            ))}
          </div>
          <button onClick={() => occasion && setStep(2)} style={{ width: "100%", padding: "14px", background: occasion ? C.saffron : C.wheat, color: occasion ? "#FFF" : C.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: occasion ? "pointer" : "not-allowed" }}>Continue →</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: C.charcoal, marginBottom: 20, textAlign: "center" }}>Design Your Piece</div>

          {/* Arabic text input */}
          <div style={{ background: C.charcoal, borderRadius: 12, padding: "18px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.saffronLight, letterSpacing: 0.8, marginBottom: 10, fontFamily: F.body }}>YOUR ARABIC TEXT</div>
            <input value={arabicText} onChange={e => setArabicText(e.target.value)} placeholder="أكتب اسمك أو نصك هنا…" style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: `0.5px solid rgba(255,255,255,0.2)`, borderRadius: 8, padding: "12px", fontSize: 20, fontFamily: F.arabic, color: "#FFF", outline: "none", direction: "rtl", textAlign: "right", marginBottom: 8, boxSizing: "border-box" }} />
            {arabicText && (
              <div style={{ fontFamily: F.arabic, fontSize: 40, color: C.saffron, direction: "rtl", textAlign: "right", lineHeight: 1.4 }}>{arabicText}</div>
            )}
          </div>

          {/* Style picker */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8, fontFamily: F.body }}>CALLIGRAPHY STYLE</div>
            <div style={{ display: "flex", gap: 8 }}>
              {STYLES.map(s => (
                <button key={s} onClick={() => setStyle(s)} style={{ flex: 1, padding: "10px", border: `1.5px solid ${style === s ? C.saffron : C.wheat}`, borderRadius: 8, background: style === s ? C.saffron + "18" : "#FFF", color: style === s ? C.saffron : C.charcoal, fontSize: 12, fontWeight: style === s ? 700 : 400, fontFamily: F.body, cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Color swatches */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8, fontFamily: F.body }}>COLOR</div>
            <div style={{ display: "flex", gap: 10 }}>
              {COLORS_LIST.map(col => (
                <div key={col.name} onClick={() => setColor(col.name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: col.hex, border: `2.5px solid ${color === col.name ? C.charcoal : "transparent"}`, boxShadow: `0 0 0 1px ${C.wheat}` }} />
                  <div style={{ fontSize: 9, color: C.textMuted, fontFamily: F.body }}>{col.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.8, marginBottom: 8, fontFamily: F.body }}>ADDITIONAL NOTES (optional)</div>
            <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Size, special instructions, reference images…" style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: F.body, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px", background: "#FFF", color: C.charcoal, border: `0.5px solid ${C.wheat}`, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>← Back</button>
            <button onClick={() => arabicText && setStep(3)} style={{ flex: 2, padding: "13px", background: arabicText ? C.saffron : C.wheat, color: arabicText ? "#FFF" : C.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: arabicText ? "pointer" : "not-allowed" }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: C.charcoal, marginBottom: 20, textAlign: "center" }}>Almost there!</div>
          {[["Your Name", "name", "text", "Layla Hadi"], ["Email", "email", "email", "layla@example.com"], ["WhatsApp (optional)", "whatsapp", "tel", "+1 313 555-0100"]].map(([label, key, type, ph]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, fontFamily: F.body }}>{label.toUpperCase()}</div>
              <input type={type} value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={{ width: "100%", padding: "11px 12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: F.body, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 6, fontFamily: F.body }}>DEADLINE (optional)</div>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: "100%", padding: "11px 12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: F.body, outline: "none", boxSizing: "border-box" }} />
            {deadline && new Date(deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
              <div style={{ fontSize: 11, color: C.terracotta, marginTop: 6, fontFamily: F.body }}>⚠️ Rush orders within 7 days may incur a $15 rush fee.</div>
            )}
          </div>

          {/* What happens next */}
          <div style={{ background: C.cream2, border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 10, fontFamily: F.body }}>What happens next?</div>
            {["Nala reviews your request (within 24h)", "You receive a custom quote by email", "Approve the quote — no payment until you approve", "Nala crafts your piece (3–5 days)", "Ships directly to you worldwide 🚀"].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.saffron, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div style={{ fontSize: 12, color: C.charcoal, fontFamily: F.body, lineHeight: 1.5 }}>{s}</div>
              </div>
            ))}
          </div>

          {sendError && (
            <div style={{ background: "#FDF3EC", border: "0.5px solid " + C.terracotta, color: C.terracotta, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: F.body, marginBottom: 10 }}>{sendError}</div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: "13px", background: "#FFF", color: C.charcoal, border: `0.5px solid ${C.wheat}`, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>← Back</button>
            <button onClick={submitRequest} disabled={sending || !formData.name || !formData.email} style={{ flex: 2, padding: "13px", background: formData.name && formData.email && !sending ? C.saffron : C.wheat, color: formData.name && formData.email && !sending ? "#FFF" : C.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: formData.name && formData.email && !sending ? "pointer" : "not-allowed" }}>{sending ? "Sending..." : "Submit Request ✦"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOMEPAGE ─────────────────────────────────────────────────────────────────
function useProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    let active = true;
    fetchProducts({ activeOnly: true })
      .then((list) => { if (active) setProducts(list || []); })
      .catch((e) => { console.error("Storefront product load failed", e); });
    return () => { active = false; };
  }, []);
  return products;
}

function Homepage({ onViewProduct, onAddToCart, onCustomOrder }) {
  const STORE_PRODUCTS = useProducts();
  return (
    <div>
      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg, ${C.charcoal} 0%, ${C.inkBrown} 60%, #1a0f08 100%)`, padding: "80px 5% 90px", position: "relative", overflow: "hidden" }}>
        {/* Decorative Arabic patterns */}
        <div style={{ position: "absolute", right: "5%", top: "50%", transform: "translateY(-50%)", fontFamily: F.arabic, fontSize: 180, color: "rgba(255,255,255,0.03)", direction: "rtl", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>بسم الله</div>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.arabic, fontSize: 28, color: C.saffron, marginBottom: 12 }}>أهلاً وسهلاً</div>
            <div style={{ fontFamily: F.display, fontSize: 56, fontWeight: 600, color: "#FFF", lineHeight: 1.1, marginBottom: 16 }}>Gifts that carry your story home.</div>
            <p style={{ fontSize: 16, color: "#C9B99A", fontFamily: F.body, lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>Handmade 3D-printed gifts celebrating Arab heritage, crafted with love in Detroit by Nala. Every piece tells a diaspora story.</p>
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })} style={{ padding: "15px 32px", background: C.saffron, color: "#FFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: "pointer" }}>Shop Now</button>
              <button onClick={onCustomOrder} style={{ padding: "15px 32px", background: "transparent", color: "#FFF", border: `1.5px solid rgba(255,255,255,0.3)`, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>Custom Order ✦</button>
            </div>
          </div>
          {/* Floating product cards */}
          <div style={{ position: "relative", height: 360, display: "none" }}>
            {STORE_PRODUCTS.slice(0, 2).map((p, i) => (
              <div key={p.id} style={{ position: "absolute", top: i * 80, left: i * 40, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "16px 18px", width: 180, transform: `rotate(${i === 0 ? -4 : 3}deg)` }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{p.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#FFF", fontFamily: F.body }}>{p.name}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.saffron, marginTop: 4 }}>${p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ background: C.charcoal, padding: "14px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          {["✦ Handmade in Detroit", "🌍 Ships Worldwide", "💬 Arabic Customer Support", "🔄 Easy Returns"].map(t => (
            <span key={t} style={{ fontSize: 12, color: C.wheat, fontFamily: F.body }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 5%" }}>
        {/* Heritage nav */}
        <div id="heritage-section" style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.charcoal }}>Shop by Heritage</div>
            <div style={{ fontFamily: F.arabic, fontSize: 20, color: C.saffron }}>تسوق حسب التراث</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {HERITAGE_ITEMS.map(h => (
              <div key={h.country} style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: "20px 16px", textAlign: "center", cursor: "pointer", transition: "box-shadow 0.2s" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{h.flag}</div>
                <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.charcoal }}>{h.country}</div>
                <div style={{ fontFamily: F.arabic, fontSize: 14, color: h.color }}>{h.arabic}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{h.count} items</div>
              </div>
            ))}
          </div>
        </div>

        {/* Best sellers */}
        <div id="shop-section" style={{ marginBottom: 56 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.charcoal }}>Best Sellers</div>
              <div style={{ fontFamily: F.arabic, fontSize: 18, color: C.saffron }}>الأكثر مبيعاً</div>
            </div>
            <button style={{ fontSize: 13, color: C.saffron, background: "none", border: "none", cursor: "pointer", fontFamily: F.body, fontWeight: 600 }}>View all →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
            {STORE_PRODUCTS.map(p => (
              <ProductCard key={p.id} product={p} onView={onViewProduct} onAddToCart={onAddToCart} />
            ))}
          </div>
        </div>

        {/* Nala's story */}
        <div id="about-section" style={{ background: C.charcoal, borderRadius: 20, padding: "48px", marginBottom: 56, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.arabic, fontSize: 20, color: C.saffron, marginBottom: 12 }}>من مالا بكل حب</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 600, color: "#FFF", lineHeight: 1.2, marginBottom: 16 }}>A piece of home in every print.</div>
            <p style={{ fontSize: 14, color: "#C9B99A", fontFamily: F.body, lineHeight: 1.8, marginBottom: 20 }}>Growing up in the Arab diaspora, I always searched for gifts that felt like home — pieces that held our language, our patterns, our stories. When I couldn't find them, I decided to make them. Every Souk3D piece is printed, finished, and packed by my own hands in Detroit.</p>
            <div style={{ fontFamily: F.display, fontSize: 22, color: C.saffron, fontStyle: "italic" }}>— Nala ✦</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 160, height: 160, borderRadius: "50%", background: `linear-gradient(135deg, ${C.saffron}44 0%, ${C.terracotta}44 100%)`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72 }}>🏺</div>
            <div style={{ fontFamily: F.arabic, fontSize: 24, color: C.wheat }}>سوق تري دي</div>
          </div>
        </div>

        {/* Collections by occasion */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.charcoal }}>Shop by Occasion</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { title: "Eid Gifts", arabic: "هدايا العيد", emoji: "🌙", color: C.saffron },
              { title: "Weddings", arabic: "الأعراس", emoji: "💍", color: C.terracotta },
              { title: "Graduation", arabic: "التخرج", emoji: "🎓", color: C.damascene },
            ].map(occ => (
              <div key={occ.title} style={{ background: occ.color + "14", border: `0.5px solid ${occ.color}44`, borderRadius: 16, padding: "32px 20px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{occ.emoji}</div>
                <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.charcoal }}>{occ.title}</div>
                <div style={{ fontFamily: F.arabic, fontSize: 16, color: occ.color, marginTop: 4 }}>{occ.arabic}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, color: C.charcoal }}>What Our Community Says</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {REVIEWS.map((r, i) => (
              <div key={i} style={{ background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 16, padding: "22px" }}>
                <Stars count={r.stars} size={15} />
                <p style={{ fontSize: 14, color: C.charcoal, fontFamily: F.body, lineHeight: 1.7, margin: "12px 0" }}>{r.text}</p>
                {r.arabic && <div style={{ fontFamily: F.arabic, fontSize: 16, color: C.saffron, direction: "rtl", textAlign: "right", marginBottom: 10 }}>{r.arabic}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, fontFamily: F.body }}>{r.flag} {r.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F.body }}>{r.location}</div>
                  </div>
                  <div style={{ fontSize: 9, background: C.olive + "22", color: C.olive, padding: "3px 8px", borderRadius: 6, fontWeight: 700, fontFamily: F.body }}>✓ Verified</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div style={{ background: C.saffron + "14", border: `0.5px solid ${C.saffron}44`, borderRadius: 20, padding: "40px", textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>Join the Souk3D Family</div>
          <div style={{ fontFamily: F.arabic, fontSize: 18, color: C.saffron, marginBottom: 12 }}>انضم إلى عائل٪نا</div>
          <p style={{ fontSize: 14, color: C.textMuted, fontFamily: F.body, marginBottom: 20 }}>Get 10% off your first order with code <strong style={{ color: C.saffron }}>WELCOME10</strong> when you subscribe.</p>
          <div style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto" }}>
            <input placeholder="your@email.com" style={{ flex: 1, padding: "12px 14px", border: `0.5px solid ${C.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: F.body, outline: "none" }} />
            <button style={{ padding: "12px 24px", background: C.charcoal, color: "#FFF", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: F.body, cursor: "pointer" }}>Subscribe</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: C.charcoal, padding: "48px 5% 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: "#FFF", marginBottom: 4 }}>Souk3D</div>
              <div style={{ fontFamily: F.arabic, fontSize: 16, color: C.saffron, marginBottom: 12 }}>سوق تري دي</div>
              <p style={{ fontSize: 12, color: "#9A8878", fontFamily: F.body, lineHeight: 1.7 }}>Handmade 3D-printed gifts for the Arab diaspora, crafted with love in Detroit, MI.</p>
            </div>
            {[
              { title: "Shop", links: ["All Products", "Syria", "Lebanon", "Palestine", "Custom Orders"] },
              { title: "Help", links: ["FAQ", "Shipping Info", "Returns", "Track Order"] },
              { title: "Connect", links: ["Instagram", "TikTok", "Pinterest", "Etsy Shop"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#9A8878", marginBottom: 12, fontFamily: F.body }}>{col.title.toUpperCase()}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: "#C9B99A", fontFamily: F.body, marginBottom: 6, cursor: "pointer" }}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `0.5px solid ${C.inkBrown}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#6A5848", fontFamily: F.body }}>© 2025 Souk3D by Nala. All rights reserved.</div>
            <div style={{ fontSize: 12, color: "#6A5848", fontFamily: F.body }}>Made with ❤️ in Detroit, MI</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STOREFRONT ROOT ──────────────────────────────────────────────────────────
// ─── SHARE ───────────────────────────────────────────────
// Products live at /p/<sku> so there is something real to share.
export function productUrl(p) {
  return window.location.origin + "/p/" + encodeURIComponent(p.sku || "");
}

function ShareRow({ product }) {
  const [copied, setCopied] = useState(false);
  const url = productUrl(product);
  const text = product.name + " — $" + Number(product.price || 0).toFixed(2) + " · Souk3D";
  const enc = encodeURIComponent;

  const links = [
    { label: "WhatsApp", bg: "#25D366", href: "https://wa.me/?text=" + enc(text + " " + url) },
    { label: "Facebook", bg: "#1877F2", href: "https://www.facebook.com/sharer/sharer.php?u=" + enc(url) },
    { label: "X", bg: "#000000", href: "https://twitter.com/intent/tweet?text=" + enc(text) + "&url=" + enc(url) },
    { label: "Pinterest", bg: "#E60023", href: "https://pinterest.com/pin/create/button/?url=" + enc(url) + "&media=" + enc(product.imageUrl || "") + "&description=" + enc(text) },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      window.prompt("Copy this link:", url);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: product.name, text: text, url: url });
    } catch (e) { /* user dismissed the sheet */ }
  };

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `0.5px solid ${C.wheat}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 8, fontFamily: F.body }}>SHARE THIS · شاركها</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {typeof navigator !== "undefined" && navigator.share && (
          <button onClick={nativeShare} style={{ padding: "9px 16px", background: C.charcoal, color: "#FFF", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>Share</button>
        )}
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            style={{ padding: "9px 16px", background: l.bg, color: "#FFF", textDecoration: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: F.body }}>{l.label}</a>
        ))}
        <button onClick={copy} style={{ padding: "9px 16px", background: copied ? C.olive : "#FFF", color: copied ? "#FFF" : C.charcoal, border: `0.5px solid ${copied ? C.olive : C.wheat}`, borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

// ─── AUTH MODAL ──────────────────────────────────────────
function AuthModal({ onClose, onSignedIn }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (busy) return;
    setError("");
    setNotice("");
    if (!form.email.trim()) return setError("Please enter your email.");
    if (mode !== "forgot" && form.password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const r = await signUpCustomer(form.email.trim(), form.password, form.name.trim());
        if (r.needsConfirmation) {
          setNotice("Almost there! Check " + form.email.trim() + " and click the link to confirm your account.");
        } else {
          onSignedIn();
        }
      } else if (mode === "login") {
        await signInCustomer(form.email.trim(), form.password);
        onSignedIn();
      } else {
        await sendPasswordReset(form.email.trim());
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (e) {
      const m = String(e.message || e);
      if (/Invalid login/i.test(m)) setError("That email or password is not right.");
      else if (/already registered/i.test(m)) setError("That email already has an account. Try signing in.");
      else if (/Email not confirmed/i.test(m)) setError("Please confirm your email first - check your inbox.");
      else setError(m);
    }
    setBusy(false);
  };

  const input = {
    width: "100%", padding: "11px 12px", border: `0.5px solid ${C.wheat}`, borderRadius: 8,
    fontSize: 13, fontFamily: F.body, boxSizing: "border-box", outline: "none", marginBottom: 10,
  };
  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";
  const titleAr = mode === "signup" ? "أنشئ حسابك" : mode === "forgot" ? "إعادة تعيين كلمة السر" : "أهلاً بعودتك";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(400px, 92vw)", background: "#FFF", borderRadius: 16, zIndex: 201, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.28)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: C.charcoal }}>{title}</div>
            <div style={{ fontFamily: F.arabic, fontSize: 15, color: C.saffron, marginBottom: 16 }}>{titleAr}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.textMuted }}>✕</button>
        </div>

        {notice ? (
          <div style={{ background: "#F0F7F0", border: `0.5px solid ${C.olive}`, color: C.olive, borderRadius: 8, padding: "12px 14px", fontSize: 13, fontFamily: F.body, lineHeight: 1.6 }}>{notice}</div>
        ) : (
          <>
            {mode === "signup" && (
              <input value={form.name} onChange={set("name")} placeholder="Your name" style={input} />
            )}
            <input value={form.email} onChange={set("email")} type="email" placeholder="you@example.com" style={input} />
            {mode !== "forgot" && (
              <input value={form.password} onChange={set("password")} type="password" placeholder="Password" style={input}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            )}
            {error && (
              <div style={{ color: C.terracotta, fontSize: 12, fontFamily: F.body, marginBottom: 10 }}>{error}</div>
            )}
            <button onClick={submit} disabled={busy} style={{ width: "100%", padding: "13px", background: busy ? C.wheat : C.saffron, color: "#FFF", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: busy ? "not-allowed" : "pointer" }}>
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
          </>
        )}

        <div style={{ marginTop: 14, fontSize: 12, fontFamily: F.body, color: C.textMuted, textAlign: "center", lineHeight: 1.8 }}>
          {mode === "login" && (
            <>
              <span onClick={() => { setMode("signup"); setError(""); }} style={{ color: C.saffron, cursor: "pointer", fontWeight: 600 }}>Create an account</span>
              {" · "}
              <span onClick={() => { setMode("forgot"); setError(""); }} style={{ cursor: "pointer" }}>Forgot password?</span>
            </>
          )}
          {mode !== "login" && (
            <span onClick={() => { setMode("login"); setError(""); setNotice(""); }} style={{ color: C.saffron, cursor: "pointer", fontWeight: 600 }}>← Back to sign in</span>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted, fontFamily: F.body, textAlign: "center" }}>
          You can always check out as a guest - an account just keeps your orders in one place.
        </div>
      </div>
    </>
  );
}

// ─── MY ACCOUNT ──────────────────────────────────────────
function AccountPage({ user, onBack, onSignOut }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchMyOrders()
      .then((list) => { if (live) { setOrders(list); setError(""); } })
      .catch((e) => { if (live) setError(e.message || "Could not load your orders."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const name = (user.user_metadata && user.user_metadata.name) || user.email;
  const card = { background: "#FFF", border: `0.5px solid ${C.wheat}`, borderRadius: 12, padding: 20, marginBottom: 14 };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        <div style={{ marginRight: "auto" }}>
          <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 600, color: C.charcoal }}>My Account</div>
          <div style={{ fontFamily: F.arabic, fontSize: 17, color: C.saffron }}>حسابي</div>
        </div>
        <button onClick={onBack} style={{ background: "none", border: `0.5px solid ${C.wheat}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontFamily: F.body, cursor: "pointer", color: C.charcoal, marginRight: 8 }}>Keep shopping</button>
        <button onClick={onSignOut} style={{ background: "none", border: `0.5px solid ${C.wheat}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontFamily: F.body, cursor: "pointer", color: C.textMuted }}>Sign out</button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>SIGNED IN AS</div>
        <div style={{ fontSize: 15, fontFamily: F.body, color: C.charcoal, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 13, fontFamily: F.body, color: C.textMuted }}>{user.email}</div>
      </div>

      <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.charcoal, margin: "20px 0 10px" }}>Order history</div>

      {loading && <div style={{ ...card, color: C.textMuted, fontSize: 13, fontFamily: F.body }}>Loading your orders...</div>}
      {error && <div style={{ ...card, color: C.terracotta, fontSize: 13, fontFamily: F.body }}>{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 34 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🏺</div>
          <div style={{ fontSize: 14, fontFamily: F.body, color: C.charcoal, marginBottom: 4 }}>No orders yet</div>
          <div style={{ fontSize: 13, fontFamily: F.body, color: C.textMuted, lineHeight: 1.6 }}>
            Orders you place with this email will appear here, with tracking as soon as they ship.
          </div>
        </div>
      )}

      {orders.map((o) => (
        <div key={o.id} style={card}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.charcoal, marginRight: "auto" }}>{o.orderNumber}</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, fontFamily: F.body,
              background: o.status === "delivered" ? C.olive + "22" : o.status === "shipped" ? C.damascene + "22" : C.saffron + "22",
              color: o.status === "delivered" ? C.olive : o.status === "shipped" ? C.damascene : C.saffron }}>
              {String(o.status || "new").replace("_", " ").toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: F.body }}>{o.date}</span>
          </div>
          {(o.items || []).map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: F.body, color: C.textMuted, padding: "3px 0" }}>
              <span>{it.name} × {it.qty}</span>
              <span>{"$" + Number((it.price || 0) * (it.qty || 1)).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `0.5px solid ${C.wheat}`, marginTop: 8, paddingTop: 8, fontSize: 14, fontFamily: F.body, fontWeight: 700, color: C.charcoal }}>
            <span>Total</span>
            <span>{"$" + Number(o.total || 0).toFixed(2)}</span>
          </div>
          {o.trackingNumber && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F.body, marginBottom: 6 }}>Tracking: {o.trackingNumber}</div>
              {o.trackingUrl && (
                <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: C.saffron, color: "#FFF", textDecoration: "none", padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: F.body }}>Track your package</a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [viewingProduct, setViewingProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  // Keep the header in sync with the session (login, logout, token refresh).
  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
    const off = onAuthChange(setUser);
    return off;
  }, []);

  // Products have real URLs (/p/<sku>) so they can be shared and linked.
  const openProduct = (p) => {
    setViewingProduct(p);
    setPage("product");
    if (p && p.sku) window.history.pushState({ sku: p.sku }, "", "/p/" + encodeURIComponent(p.sku));
  };
  const goHome = () => {
    setViewingProduct(null);
    setPage("home");
    window.history.pushState({}, "", "/");
  };

  // Open the right product when someone lands on a shared link.
  useEffect(() => {
    const m = window.location.pathname.match(/^\/p\/(.+)$/);
    if (!m) return;
    const sku = decodeURIComponent(m[1]);
    let live = true;
    fetchProducts({ activeOnly: true })
      .then((list) => {
        const found = (list || []).find((p) => p.sku === sku);
        if (live && found) { setViewingProduct(found); setPage("product"); }
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  // Keep the browser back/forward buttons honest.
  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/p\//);
      if (!m) { setViewingProduct(null); setPage("home"); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const co = params.get("checkout");
    if (co === "success") {
      setCart([]);
      setPage("order-confirmed");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (co === "cancel") {
      setCartOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + (product.qty || 1) } : i);
      return [...prev, { ...product, qty: product.qty || 1 }];
    });
    setCartOpen(true);
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      {/* Announcement bar */}
      <div style={{ background: C.charcoal, color: C.saffronLight, textAlign: "center", padding: "9px", fontSize: 12, fontFamily: F.body }}>
        🎉 Use code <strong>WELCOME10</strong> for 10% off your first order · Free shipping on $75+ orders
      </div>

      {/* Navigation */}
      <nav style={{ background: C.cream, borderBottom: `0.5px solid ${C.wheat}`, padding: "14px 5%", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div onClick={() => { setPage("home"); setViewingProduct(null); }} style={{ cursor: "pointer" }}>
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.charcoal }}>Souk3D</div>
          <div style={{ fontFamily: F.arabic, fontSize: 12, color: C.saffron, lineHeight: 1 }}>سوق ثري دي</div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["Shop", "Heritage", "Custom Orders", "About"].map(link => (
            <span key={link} onClick={() => {
              if (link === "Custom Orders") { setPage("custom-order"); return; }
              setPage("home"); setViewingProduct(null);
              const ids = { Shop: "shop-section", Heritage: "heritage-section", About: "about-section" };
              setTimeout(() => { const el = document.getElementById(ids[link]); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 80);
            }} style={{ fontSize: 13, color: C.charcoal, fontFamily: F.body, cursor: "pointer", fontWeight: 500 }}>{link}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 18, cursor: "pointer", color: C.charcoal }}>🔍</span>
          <span
            onClick={() => { if (user) { setPage("account"); setViewingProduct(null); } else { setAuthOpen(true); } }}
            title={user ? "My account" : "Sign in"}
            style={{ fontSize: 18, cursor: "pointer", color: user ? C.saffron : C.charcoal }}
          >👤</span>
          <div onClick={() => setCartOpen(true)} style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ fontSize: 18, color: C.charcoal }}>🛒</span>
            {cartCount > 0 && (
              <div style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, background: C.saffron, color: "#FFF", borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</div>
            )}
          </div>
        </div>
      </nav>

      {/* Pages */}
      {page === "home" && !viewingProduct && (
        <Homepage
          onViewProduct={openProduct}
          onAddToCart={addToCart}
          onCustomOrder={() => setPage("custom-order")}
        />
      )}
      {page === "product" && viewingProduct && (
        <ProductDetail
          product={viewingProduct}
          onBack={goHome}
          onAddToCart={addToCart}
        />
      )}
      {page === "checkout" && (
        <CheckoutPage cart={cart} onBack={() => setPage("home")} />
      )}
      {page === "order-confirmed" && (
          <OrderConfirmed onContinue={() => setPage("home")} />
        )}
        {page === "account" && user && (
          <AccountPage
            user={user}
            onBack={() => setPage("home")}
            onSignOut={async () => { await signOutCustomer(); setUser(null); setPage("home"); }}
          />
        )}
        {page === "custom-order" && (
        <CustomOrderForm onBack={() => setPage("home")} />
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={id => setCart(prev => prev.filter(i => i.id !== id))}
          onCheckout={() => { setCartOpen(false); setPage("checkout"); }}
        />
      )}

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSignedIn={() => { setAuthOpen(false); setPage("account"); }}
        />
      )}
    </div>
  );
}
