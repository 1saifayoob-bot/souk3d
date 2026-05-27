import React, { useState } from "react";

// ─── BRAND CONSTANTS ───────────────────────────────────────────────────────────
const C = {
  saffron: "#D4881F", saffronLight: "#E8B864", saffronDark: "#A86510",
  terracotta: "#B85C3C", damascene: "#1E5C8C", olive: "#5C6B3F",
  charcoal: "#2A1F18", inkBrown: "#3D2817", cream: "#FAF3E7",
  cream2: "#F0E5D0", wheat: "#E8D5A8", textMuted: "#7A6856",
};
const F = { display: "'Cormorant Garamond', serif", body: "'Outfit', sans-serif", arabic: "'Amiri', serif" };

// ─── STOREFRONT MOCK DATA ──────────────────────────────────────────────────────
const STORE_PRODUCTS = [
  { id: 1, name: "Damascus Name Plaque", name_ar: "لوحة الاسم الدمشقية", category: "Home Decor", country: "Syria", flag: "🇸🇾", price: 44.99, compareAt: 59.99, badge: "Best Seller", stars: 4.9, reviews: 47, emoji: "🏺", desc: "Beautifully 3D-printed wall plaque featuring your family name in Diwani calligraphy. Each piece is hand-finished in Detroit and ships worldwide.", customizable: true },
  { id: 2, name: "Eid Mubarak Lantern", name_ar: "فانوس عيد مبارك", category: "Seasonal", country: "Pan-Arab", flag: "🌍", price: 34.99, compareAt: null, badge: "New", stars: 4.8, reviews: 38, emoji: "🪔", desc: "Intricate geometric lantern celebrating Eid al-Fitr and Eid al-Adha. Perfect as a centerpiece or gift.", customizable: false },
  { id: 3, name: "Palestinian Olive Tree", name_ar: "شجرة الزيتون الفلسطينية", category: "Art", country: "Palestine", flag: "🇵🇸", price: 54.99, compareAt: null, badge: null, stars: 5.0, reviews: 29, emoji: "🫒", desc: "A symbol of steadfastness and heritage. This sculptural olive tree captures the spirit of Palestinian connection to the land.", customizable: false },
  { id: 4, name: "Kufic Calligraphy Frame", name_ar: "إطار الخط الكوفي", category: "Art", country: "Pan-Arab", flag: "🌍", price: 64.99, compareAt: 79.99, badge: "Sale", stars: 4.7, reviews: 18, emoji: "✦", desc: "Custom Quranic verse or family name rendered in the ancient Kufic script, mounted in a sleek matte frame.", customizable: true },
];

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
        {product.emoji}
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
              <div style={{ width: 64, height: 64, background: `linear-gradient(135deg, ${C.cream2} 0%, ${C.wheat}44 100%)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.emoji}</div>
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
            <button onClick={() => { if (promoCode.toUpperCase() === "WELCOME10") setPromoApplied(true); }} style={{ padding: "9px 14px", background: C.charcoal, color: "#FFF", border: "none", borderRadius: 8, fontSize: 12, fontFamily: F.body, cursor: "pointer" }}>Apply</button>
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

// ─── PRODUCT DETAIL PAGE ──2500─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function ProductDetail({ product, onBack, onAddToCart }) {
  const [tab, setTab] = useState("description");
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
            {product.emoji}
            {product.badge && <div style={{ position: "absolute", top: 16, left: 16, background: C.saffron, color: "#FFF", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 12, fontFamily: F.body }}>{product.badge}</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, aspectRatio: "1", background: `linear-gradient(135deg, ${C.cream2} 0%, ${C.wheat}44 100%)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: i === 1 ? `2px solid ${C.saffron}` : `0.5px solid ${C.wheat}`, cursor: "pointer" }}>{product.emoji}</div>
            ))}
          </div>
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
function CheckoutPage({ cart, onBack }) {
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [address, setAddress] = useState({ name: "", line1: "", line2: "", city: "", state: "", zip: "", country: "US" });
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [giftMessage, setGiftMessage] = useState("");
  const [step, setStep] = useState("details");

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
            <button onClick={() => setStep("success")} style={{ width: "100%", padding: "14px", background: C.saffron, color: "#FFF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: F.body, cursor: "pointer" }}>Place Order · ${total.toFixed(2)}</button>
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

  const OCCASIONS = [
    { id: "wedding", label: "Wedding", emoji: "💍", arabic: "زفاف" },
    { id: "graduation", label: "Graduation", emoji: "🎓", arabic: "تخرج" },
    { id: "baby", label: "New Baby", emoji: "👶", arabic: "مولود جديد" },
    { id: "eid", label: "Eid", emoji: "🌙", arabic: "عيد" },
    { id: "birthday", label: "Birthday", emoji: "🎂", arabic: "عيد ميلاد" },
    { id: "anniversary", label: "Anniversary", emoji: "💞", arabic: "ذكرى سنوية" },
    { id: "housewarming", label: "Housewarming", emoji: "🏡", arabic: "منزل جديد" },
    { id: "other\, label: "Other", emoji: "✦", arabic: "أخرى" },
  ];
  const COLORS_LIST = [{ name: "Gold", hex: "#D4881F" }, { name: "White", hex: "#F5F5F5" }, { name: "Black", hex: "#1A1A1A" }, { name: "Blue", hex: "#1E5C8C" }, { name: "Rose Gold", hex: "#C9856F" }];
  const STYLES = ["Diwani", "Modern", "Kufi", "Classic"];

  if (submitted) {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✦</div>
        <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>Request Received!</div>
        <div style={{ fontFamily: F.arabic, fontSize: 24, color: C.saffron, marginBottom: 16 }}>تم استلام طلبك!</div>
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

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: "13px", background: "#FFF", color: C.charcoal, border: `0.5px solid ${C.wheat}`, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, cursor: "pointer" }}>← Back</button>
            <button onClick={() => formData.name && formData.email && setSubmitted(true)} style={{ flex: 2, padding: "13px", background: formData.name && formData.email ? C.saffron : C.wheat, color: formData.name && formData.email ? "#FFF" : C.textMuted, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: F.body, cursor: formData.name && formData.email ? "pointer" : "not-allowed" }}>Submit Request ✦</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOMEPAGE ─────────────────────────────────────────────────────────────────
function Homepage({ onViewProduct, onAddToCart, onCustomOrder }) {
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
            <div style={{ fontFamily: F.arabic, fontSize: 20, color: C.saffron, marginBottom: 12 }}>من نالا بكل حب</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 600, color: "#FFF", lineHeight: 1.2, marginBottom: 16 }}>A piece of home in every print.</div>
            <p style={{ fontSize: 14, color: "#C9B99A", fontFamily: F.body, lineHeight: 1.8, marginBottom: 20 }}>Growing up in the Arab diaspora, I always searched for gifts that felt like home — pieces that held our language, our patterns, our stories. When I couldn't find them, I decided to make them. Every Souk3D piece is printed, finished, and packed by my own hands in Detroit.</p>
            <div style={{ fontFamily: F.display, fontSize: 22, color: C.saffron, fontStyle: "italic" }}>— Nala ✦</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 160, height: 160, borderRadius: "50%", background: `linear-gradient(135deg, ${C.saffron}44 0%, ${C.terracotta}44 100%)`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72 }}>🏺</div>
            <div style={{ fontFamily: F.arabic, fontSize: 24, color: C.wheat }}>سوق ثري دي</div>
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
          <div style={{ fontFamily: F.arabic, fontSize: 18, color: C.saffron, marginBottom: 12 }}>انضم إلى عائلتنا</div>
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
              <div style={{ fontFamily: F.arabic, fontSize: 16, color: C.saffron, marginBottom: 12 }}>سوق ثري دي</div>
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
export default function App() {
  const [page, setPage] = useState("home");
  const [viewingProduct, setViewingProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

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
          <span style={{ fontSize: 18, cursor: "pointer", color: C.charcoal }}>👤</span>
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
          onViewProduct={(p) => { setViewingProduct(p); setPage("product"); }}
          onAddToCart={addToCart}
          onCustomOrder={() => setPage("custom-order")}
        />
      )}
      {page === "product" && viewingProduct && (
        <ProductDetail
          product={viewingProduct}
          onBack={() => { setViewingProduct(null); setPage("home"); }}
          onAddToCart={addToCart}
        />
      )}
      {page === "checkout" && (
        <CheckoutPage cart={cart} onBack={() => setPage("home")} />
      )}
      {page === "custom-order" && (
        <CustomOrd
