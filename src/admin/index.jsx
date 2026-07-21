import React, { useState, useMemo, useRef, useEffect } from "react";
import { supabase, fetchProducts, saveProduct, deleteProductById, migrateLocalProducts, fetchOrders, setProductStatus, reoptimizeProductImages, fetchProductIds, fetchProductById, productNeedsOptimizing, fetchCustomOrders, setCustomOrderStage, fetchCustomers, fetchDiscounts, saveDiscount, setDiscountStatus, deleteDiscountById } from "../lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

// ─── BRAND CONSTANTS ───────────────────────────────────────────────────────────
const COLORS = {
  saffron: "#D4881F", saffronLight: "#E8B864", saffronDark: "#A86510",
  terracotta: "#B85C3C", damascene: "#1E5C8C", olive: "#5C6B3F",
  charcoal: "#2A1F18", inkBrown: "#3D2817", cream: "#FAF3E7",
  cream2: "#F0E5D0", wheat: "#E8D5A8", textMuted: "#7A6856",
};
const FONTS = {
  display: "'Cormorant Garamond', serif",
  body: "'Outfit', sans-serif",
  arabic: "'Amiri', serif",
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const DEFAULT_PRODUCTS = [];

const ORDERS_DATA = [];

const CUSTOMERS_DATA = [];

const CUSTOM_ORDERS_DATA = [];

const REVENUE_DATA = [];

const HERITAGE_DATA = [];

const DISCOUNTS_DATA = [];

const NAV_ITEMS = [
  { section: "SALES", items: [
    { id: "dashboard", label: "Dashboard", icon: "⬛" },
    { id: "orders", label: "Orders", icon: "📦", badge: 3 },
    { id: "products", label: "Products", icon: "🏺" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "custom-orders", label: "Custom Orders", icon: "✦", badge: 5 },
  ]},
  { section: "MARKETING", items: [
    { id: "discounts", label: "Discounts", icon: "🎟" },
    { id: "email", label: "Email & Marketing", icon: "📧" },
  ]},
  { section: "INSIGHTS", items: [
    { id: "analytics", label: "Analytics", icon: "📊" },
  ]},
  { section: "ACCOUNT", items: [
    { id: "settings-general", label: "Settings", icon: "⚙️" },
  ]},
];

const HERITAGE_COLORS = {
  Syria: "#D4881F", Lebanon: "#B85C3C", Palestine: "#1E5C8C",
  "Pan-Arab": "#5C6B3F", Egypt: "#E8B864",
};

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 16, fontSize: 11, fontWeight: active ? 600 : 500,
      border: `0.5px solid ${active ? COLORS.saffron : COLORS.wheat}`,
      background: active ? COLORS.saffron : "#FFFFFF",
      color: active ? "#FFFFFF" : COLORS.inkBrown, cursor: "pointer",
      fontFamily: FONTS.body, whiteSpace: "nowrap",
    }}>{label}</div>
  );
}

function StatCard({ label, value, sub, icon, dark }) {
  return (
    <div style={{
      background: dark ? COLORS.charcoal : "#FFFFFF",
      border: `0.5px solid ${dark ? "transparent" : COLORS.wheat}`,
      borderRadius: 10, padding: "16px 18px", flex: 1, minWidth: 140,
    }}>
      {icon && <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 11, fontFamily: FONTS.body, color: dark ? COLORS.wheat : COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontFamily: FONTS.display, fontWeight: 600, color: dark ? "#FFFFFF" : COLORS.charcoal }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: dark ? COLORS.saffronLight : COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  const map = {
    new: { bg: "#EEF4FF", color: "#3B5BB5", label: "New" },
    in_production: { bg: "#FFF7E6", color: "#A86510", label: "In Production" },
    shipped: { bg: "#E6F4FF", color: "#1E5C8C", label: "Shipped" },
    delivered: { bg: "#EDFBF0", color: "#2D7A45", label: "Delivered" },
    awaiting_approval: { bg: "#FFF0ED", color: "#B85C3C", label: "Awaiting Approval" },
    active: { bg: "#EDFBF0", color: "#2D7A45", label: "Active" },
    paused: { bg: "#F5F5F5", color: "#666", label: "Paused" },
    expired: { bg: "#FFF0ED", color: "#B85C3C", label: "Expired" },
    scheduled: { bg: "#EEF4FF", color: "#3B5BB5", label: "Scheduled" },
  };
  const s = map[status] || { bg: "#F5F5F5", color: "#666", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, fontFamily: FONTS.body }}>{s.label}</span>
  );
}

function SectionCard({ children, style }) {
  return (
    <div style={{ background: "#FFFFFF", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 10, padding: "16px 18px", marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: COLORS.saffron, color: "#FFF", border: "none",
      padding: "9px 20px", fontSize: 11, fontWeight: 600,
      letterSpacing: 1, textTransform: "uppercase", borderRadius: 6,
      cursor: "pointer", fontFamily: FONTS.body, ...style,
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color: COLORS.inkBrown,
      border: `0.5px solid ${COLORS.wheat}`, padding: "8px 16px",
      fontSize: 11, fontWeight: 500, borderRadius: 6,
      cursor: "pointer", fontFamily: FONTS.body, ...style,
    }}>{children}</button>
  );
}

function HeritageAvatar({ name, heritage, size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const bg = HERITAGE_COLORS[heritage] || COLORS.saffron;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg + "22", border: `1.5px solid ${bg}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 600, color: bg, fontFamily: FONTS.body,
      flexShrink: 0,
    }}>{initials}</div>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const handle = (e) => {
    e.preventDefault();
    if (pw === "admin" || pw === "") { onLogin(); }
    else setErr("Incorrect password");
  };
  return (
    <div style={{ minHeight: "100vh", background: COLORS.charcoal, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 380, background: COLORS.cream, borderRadius: 16, padding: 40, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 32, fontWeight: 600, color: COLORS.charcoal }}>Souk3D</div>
          <div style={{ fontFamily: FONTS.arabic, fontSize: 18, color: COLORS.saffron, marginTop: 4 }}>سوق ثري دي</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, fontFamily: FONTS.body }}>Admin Dashboard · Nala's Studio</div>
        </div>
        <form onSubmit={handle}>
          <input
            type="password" placeholder="Password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }}
            style={{ width: "100%", padding: "12px 14px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 14, fontFamily: FONTS.body, background: "#FFF", outline: "none", marginBottom: 12, boxSizing: "border-box" }}
          />
          {err && <div style={{ color: COLORS.terracotta, fontSize: 12, marginBottom: 8 }}>{err}</div>}
          <PrimaryBtn style={{ width: "100%", padding: "13px 20px" }}>Sign In</PrimaryBtn>
        </form>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onLogin} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontFamily: FONTS.body }}>One-click demo access →</button>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  return (
    <div style={{ width: 220, background: COLORS.charcoal, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
      <div style={{ padding: "24px 20px 16px" }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: "#FFF" }}>Souk3D</div>
        <div style={{ fontFamily: FONTS.arabic, fontSize: 13, color: COLORS.saffron }}>سوق ثري دي</div>
      </div>
      <div style={{ padding: "0 10px", flex: 1 }}>
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: COLORS.textMuted, fontFamily: FONTS.body, fontWeight: 600, padding: "0 10px", marginBottom: 4 }}>{section}</div>
            {items.map(item => (
              <div key={item.id} onClick={() => setPage(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                borderRadius: 8, cursor: "pointer", marginBottom: 2,
                background: page === item.id ? COLORS.saffron + "22" : "transparent",
                color: page === item.id ? COLORS.saffronLight : "#C9B99A",
              }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontFamily: FONTS.body, fontWeight: page === item.id ? 600 : 400, flex: 1 }}>{item.label}</span>
                {item.badge && <span style={{ background: COLORS.terracotta, color: "#FFF", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 20px", borderTop: `0.5px solid ${COLORS.inkBrown}` }}>
        <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>Nala's Studio</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted + "88", marginTop: 2 }}>Detroit, MI</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 600, color: COLORS.charcoal }}>Good morning, Nala ☀️</div>
        <div style={{ fontFamily: FONTS.arabic, fontSize: 16, color: COLORS.saffron }}>صباح الخير يا نالا</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 4 }}>Here's what's happening in your store today.</div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="TODAY'S REVENUE" value="$0" sub="" dark />
        <StatCard label="ORDERS" value="0" sub="" />
        <StatCard label="AVG ORDER VALUE" value="$0" sub="" />
        <StatCard label="NEW CUSTOMERS" value="0" sub="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
        <SectionCard>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 14 }}>Revenue — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.saffron} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.saffron} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: FONTS.body, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: FONTS.body, fill: COLORS.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v}`, "Revenue"]} contentStyle={{ fontFamily: FONTS.body, fontSize: 11, borderRadius: 8, border: `0.5px solid ${COLORS.wheat}` }} />
              <Area type="monotone" dataKey="revenue" stroke={COLORS.saffron} strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 14 }}>Top Sellers</div>
          {DEFAULT_PRODUCTS.slice(0, 4).map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: COLORS.saffron + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: COLORS.saffron }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal, fontFamily: FONTS.body }}>{p.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>{p.orders} orders · ${p.revenue.toFixed(0)}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
      <SectionCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body }}>Recent Orders</div>
          <GhostBtn onClick={() => onNavigate("orders")}>View All</GhostBtn>
        </div>
        {ORDERS_DATA.slice(0, 4).map(o => (
          <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
            <div style={{ fontSize: 12, fontFamily: FONTS.body, fontWeight: 600, color: COLORS.damascene, width: 60 }}>{o.orderNumber}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal }}>{o.customer}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>{o.items[0].name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal }}>${o.total.toFixed(2)}</div>
            <Badge status={o.status} />
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

// ─── COUNTRY → FLAG MAP ────────────────────────────────────────────────────────
const COUNTRY_FLAGS = {
  Syria: "🇸🇾", Lebanon: "🇱🇧", Palestine: "🇵🇸",
  "Pan-Arab": "🌍", Egypt: "🇪🇬", Iraq: "🇮🇶",
  Jordan: "🇯🇴", Morocco: "🇲🇦", Tunisia: "🇹🇳", Other: "🌐",
};

// ─── PRODUCT FORM MODAL ────────────────────────────────────────────────────────
// ─── AI LISTING GENERATOR ──────────────────────────────────────────────────────
const LISTING_TEMPLATES = {
  "Home Decor": { intros: ["Handcrafted with meticulous care,","A timeless piece of Arab craftsmanship,","Rooted in centuries of tradition,"], mids: ["this stunning piece brings the warmth of heritage into your home.","this heirloom-quality piece elevates any living space.","this handmade creation tells a story of culture and artistry."], ctas: ["Perfect as a gift or a cherished personal keepsake.","A conversation-starting statement piece for any home.","Ships worldwide — loved by the Arab diaspora globally."] },
  "Art": { intros: ["A masterpiece of Arab artistry,","Born from skilled hands and a rich cultural tradition,","Inspired by the beauty of the Arab world,"], mids: ["this original piece captures the soul of its heritage.","this artwork brings colour, culture, and meaning to any wall.","this creation is a window into a vibrant cultural legacy."], ctas: ["Own a piece of living history.","Elevate your space with authentic Arab art.","A truly unique collector's piece."] },
  "Seasonal": { intros: ["Celebrate in style with","Mark the occasion beautifully with","A special limited-edition piece —"], mids: ["this festive creation crafted to honour your most cherished celebrations.","this seasonal piece designed to make every moment unforgettable.","this limited creation made to bring joy to the whole family."], ctas: ["Order early — quantities are limited.","The most thoughtful seasonal gift you can give.","Ships fast for the occasion."] },
  "default": { intros: ["Crafted with passion and precision,","A beautiful expression of Arab craftsmanship,","Made with love and tradition,"], mids: ["this unique piece reflects the rich cultural heritage of the Arab world.","this handmade item brings authenticity and warmth to its owner.","this carefully crafted piece is a tribute to generations of artistry."], ctas: ["A meaningful gift for any occasion.","Ships worldwide — free gift wrapping available.","Personalisation available on request."] },
};
const AR_TEMPLATES = {
  "Home Decor": ["مصنوع بعناية يدوية فائقة، هذه القطعة الفريدة تجلب دفء التراث العربي إلى منزلك. هدية مثالية تُحفظ للأجيال.","روعة الحرفية العربية في قطعة ديكور أصيلة تضيف لمسة من الأناقة والتميز لأي مكان.","قطعة حرفية أصيلة تحكي قصة حضارة وفن عريق. مثالية كهدية أو كإضافة راقية لديكور منزلك."],
  "Art": ["تحفة فنية عربية أصيلة تعكس عمق الحضارة وجمال الإبداع التشكيلي. قطعة فريدة من نوعها تستحق الاقتناء.","إبداع فني يجمع بين الأصالة والمعاصرة — اقتنِ قطعة من روح التراث العربي الحي."],
  "Seasonal": ["احتفل بمناسباتك الخاصة بأبهى الصور مع هذه القطعة الموسمية المميزة. محدود الكمية — اطلب الآن!","هدية موسمية أصيلة تعكس روح المناسبة وتُسعد كل من يحظى بها."],
  "default": ["قطعة حرفية يدوية من أجود الخامات تجمع بين الجمال والجودة لتكون هدية لا تُنسى في كل مناسبة.","صُنعت بحب وإتقان لتعكس روح التراث العربي الأصيل. هدية مثالية تناسب جميع المناسبات.","حرفية عربية أصيلة في كل تفصيلة — قطعة فريدة تستحق الاقتناء والإهداء."],
};
const ARABIC_WORD_MAP = {
  Green:"الأخضر",Blue:"الأزرق",Red:"الأحمر",Golden:"الذهبي",Silver:"الفضي",Black:"الأسود",White:"الأبيض",Dark:"الداكن",
  Dome:"قبة",Plaque:"لوحة",Lantern:"فانوس",Frame:"إطار",Box:"صندوق",Stand:"حامل",Arch:"قوس",Tree:"شجرة",Map:"خريطة",
  Star:"نجمة",Moon:"هلال",Gift:"هدية",Wall:"لوحة جدارية",Sign:"لافتة",Mosque:"مسجد",Palace:"قصر",Name:"اسم",
  Damascus:"دمشقية",Palestinian:"فلسطينية",Lebanese:"لبنانية",Syrian:"سورية",Jordanian:"أردنية",Egyptian:"مصرية",
  Eid:"العيد",Ramadan:"رمضان",Wedding:"زفاف",Olive:"زيتون",Cedar:"أرز",Custom:"مخصصة",
};
const COUNTRY_AR = { "Syria":"سوري","Palestine":"فلسطيني","Lebanon":"لبناني","Jordan":"أردني","Egypt":"مصري","Iraq":"عراقي","Morocco":"مغربي","Saudi Arabia":"سعودي","UAE":"إماراتي" };
function generateListing(name, category, country, hints) {
  hints = hints || "";
  const tmpl=LISTING_TEMPLATES[category]||LISTING_TEMPLATES.default;
  const arTmpl=AR_TEMPLATES[category]||AR_TEMPLATES.default;
  const pick=function(a){return a[Math.floor(Math.random()*a.length)];};
  const hintSuffix=hints.trim()?" — "+hints.trim():"";
  const desc=pick(tmpl.intros)+" "+pick(tmpl.mids)+" "+pick(tmpl.ctas)+hintSuffix;
  const hintAr=hints.trim()?(" | "+hints.split(",").slice(0,2).map(function(h){return h.trim();}).join("، ")):""; 
  const desc_ar=pick(arTmpl)+hintAr;
  const words=name.split(/[\s,\-]+/);
  const arParts=words.map(function(w){return ARABIC_WORD_MAP[w]||ARABIC_WORD_MAP[w.charAt(0).toUpperCase()+w.slice(1)];}).filter(Boolean);
  var name_ar;
  if(arParts.length>=2){name_ar=arParts[0]+" "+arParts.slice(1).join(" ");}
  else if(arParts.length===1){name_ar=arParts[0]+(COUNTRY_AR[country]?" - "+COUNTRY_AR[country]:"");}
  else{name_ar=COUNTRY_AR[country]?"قطعة "+COUNTRY_AR[country]+" مميزة":"قطعة حرفية مميزة";}
  const prices={"Home Decor":44.99,"Art":89.99,"Seasonal":34.99,"Jewelry":59.99,"Accessories":29.99,"Other":39.99};
  const badge=category==="Seasonal"?"Limited":Math.random()>0.6?"Best Seller":"";
  return {desc,desc_ar,name_ar,price:String(prices[category]||44.99),badge};
}

const BG_STYLES = [
  { id: "cream", label: "Cream", solid: "#E8D5A8", colors: ["#E8D5A8","#D4B896"] },
  { id: "charcoal", label: "Charcoal", solid: "#2A1F18", colors: ["#2A1F18","#3D2817"] },
  { id: "saffron", label: "Saffron", solid: "#D4881F", colors: ["#FAEBD0","#E8B864"] },
  { id: "white", label: "White", solid: "#F8F8F8", colors: ["#FFFFFF","#F0F0F0"] },
];

function ProductFormModal({ product, onSave, onClose, existingProducts }) {
  // One sku per form session. This used to be minted inside handleSave, so a
  // slow save that the user clicked twice produced two different skus and
  // therefore two rows. Generating it once means a retry upserts the SAME row.
  const [sessionSku] = useState(function () {
    return product && product.sku ? product.sku : "S3D-" + String(Date.now()).slice(-4) + Math.floor(Math.random() * 9);
  });
  const [saving, setSaving] = useState(false);
  const empty = {
    name: "", name_ar: "", category: "Home Decor", country: "",
    price: "", compareAt: "", cost: "", stock: "", status: "active",
    featured: false, emoji: "🏺", desc: "", customizable: false, badge: "",
    images: [],
    desc_ar: "",
    hint: "", buyUrl: "", membersOnly: false, publicAt: "",
    variations: [],
  };
  const [form, setForm] = useState(product ? {
    ...product,
    price: String(product.price || ""),
    compareAt: product.compareAt ? String(product.compareAt) : "",
    cost: String(product.cost || ""),
    stock: String(product.stock || ""),
    badge: product.badge || "",
    images: product.images || (product.imageUrl ? [{url:product.imageUrl,bg:product.imageBg||"cream"}] : []),
  } : empty);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fileRef = useRef(null);
  const compressImg = (file) =>
    new Promise((res) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 800;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL("image/png"));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  const handleImageUpload = async (files) => {
    const remaining = 5 - form.images.length;
    const picked = Array.from(files).slice(0, remaining);
    if (picked.length === 0) return;
    for (const file of picked) {
      const url = await compressImg(file);
      setForm((f) => ({ ...f, images: [...f.images, { url, original: url, bg: "cream", bgRemoved: false }] }));
    }
  };

  const toggleRemoveBg = async (idx) => {
    const target = form.images[idx];
    if (!target) return;
    if (target.bgRemoved) {
      setForm((f) => { const a = [...f.images]; a[idx] = { ...a[idx], url: a[idx].original || a[idx].url, bgRemoved: false }; return { ...f, images: a }; });
      return;
    }
    setBgBusy(idx);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(target.original || target.url);
      const url = await compressImg(blob);
      setForm((f) => { const a = [...f.images]; a[idx] = { ...a[idx], url, bgRemoved: true }; return { ...f, images: a }; });
    } catch (err) {
      console.warn("Background removal failed", err);
      alert("Background removal failed - please try again.");
    } finally {
      setBgBusy(null);
    }
  };
  const removeImage = (idx) => setForm(f => ({ ...f, images: f.images.filter((_,i) => i!==idx) }));
  const moveImage = (idx, dir) => setForm(f => { const a=[...f.images]; [a[idx],a[idx+dir]]=[a[idx+dir],a[idx]]; return {...f,images:a}; });
  const updateImageBg = (idx, bg) => setForm(f => ({ ...f, images: f.images.map((img,i) => i===idx ? {...img,bg} : img) }));
  const getBgGrad = (bgId) => { const b=BG_STYLES.find(x=>x.id===bgId)||BG_STYLES[0]; return `linear-gradient(135deg,${b.colors[0]},${b.colors[1]})`; };
  const [genPreview, setGenPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [bgBusy, setBgBusy] = useState(null);
  const handleGenerate = async () => {
    if (!form.name.trim() && !(form.images && form.images[0] && form.images[0].url)) {
      alert("Add a product name or image first.");
      return;
    }
    setGenerating(true);
    try {
      const draftBits = [];
      if (form.name) draftBits.push("Current English title: " + form.name);
      if (form.desc) draftBits.push("Current English description: " + form.desc);
      if (form.name_ar) draftBits.push("Current Arabic title: " + form.name_ar);
      if (form.desc_ar) draftBits.push("Current Arabic description: " + form.desc_ar);
      const refineHints = draftBits.length
        ? ((form.hint || "") + " || Improve and refine this existing draft, keeping my wording and intent where I set it, fixing grammar and polishing, and return all fields consistent. " + draftBits.join(" | "))
        : (form.hint || "");
      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, category: form.category, country: form.country, hints: refineHints, image: (form.images && form.images[0] && form.images[0].url) || "" }),
      });
      if (!res.ok) throw new Error("API error " + res.status);
      const data = await res.json();
      setForm((f) => ({
        ...f,
        name: data.title_en || f.name,
        name_ar: data.title_ar || f.name_ar,
        desc: data.desc_en || f.desc,
        desc_ar: data.desc_ar || f.desc_ar,
        price: f.price || String(data.price_suggestion || ""),
        badge: f.badge || data.badge || "",
      }));
    } catch (e) {
      alert("Generation failed: " + e.message);
    }
    setGenerating(false);
  };
  const acceptGenerate = () => {
    setForm(f => ({
      ...f,
      name: genPreview.title_en || f.name,
      name_ar: genPreview.name_ar,
      desc: genPreview.desc,
      desc_ar: genPreview.desc_ar || "",
      price: genPreview.price,
      badge: genPreview.badge || f.badge,
    }));
    setGenPreview(null);
  };

  const hasDraftContent = () => Boolean(form.name && String(form.name).trim()) || (form.images && form.images.length > 0) || Boolean(form.description) || Boolean(form.price);
  const saveAsDraft = () => {
    const saved = {
      ...form,
      id: product?.id || Date.now(),
      sku: sessionSku,
      flag: COUNTRY_FLAGS[form.country] || "",
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      compareAt: form.compareAt ? parseFloat(form.compareAt) : null,
      badge: form.badge || null,
      status: "draft",
      name: form.name && String(form.name).trim() ? form.name : "Untitled draft",
      orders: product?.orders || 0,
      revenue: product?.revenue || 0,
      stars: product?.stars || 0,
      reviews: product?.reviews || 0,
    };
    onSave(saved, !!product);
  };
  const handleCancel = () => {
    if (!product && hasDraftContent()) { saveAsDraft(); } else { onClose(); }
  };
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const importFromLink = async () => {
    if (!importUrl) { alert("Paste a product link first."); return; }
    setImporting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : "";
      const res = await fetch("/api/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json();
      if (data && data.title) {
        setForm((f) => ({ ...f, name: data.title || f.name, desc: data.description || f.desc, price: data.price ? String(data.price) : f.price, category: data.category || f.category, images: data.image ? [{ url: data.image }].concat(f.images || []) : (f.images || []) }));
      } else {
        alert((data && data.error) || "Could not import from that link.");
      }
    } catch (e) { alert("Import failed: " + e.message); }
    setImporting(false);
  };
  const handleSave = async () => {
    if (saving) return;
    if (!form.name.trim() || !form.price) return alert("Name and price are required.");
    const isEdit = !!product;

    // Refuse to silently create a second product with the same name.
    const mine = String(form.name).trim().toLowerCase();
    const clash = (existingProducts || []).find(function (p) {
      return p && String(p.name || "").trim().toLowerCase() === mine && p.sku !== sessionSku;
    });
    if (clash) {
      const ok = window.confirm(
        "A product named \"" + String(form.name).trim() + "\" already exists (" + clash.sku + ").\n\n" +
        "Click Cancel to go back, or OK to save this as a separate product anyway."
      );
      if (!ok) return;
    }

    setSaving(true);
    const saved = {
      ...form,
      id: product?.id || Date.now(),
      sku: sessionSku,
      flag: COUNTRY_FLAGS[form.country] || "🌐",
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      compareAt: form.compareAt ? parseFloat(form.compareAt) : null,
      badge: form.badge || null,
      orders: product?.orders || 0,
      revenue: product?.revenue || 0,
      stars: product?.stars || 0,
      reviews: product?.reviews || 0,
      images: form.images || [],
      variations: (form.variations || []).map(function (g) { return { name: String(g.name || "").trim(), options: (g.options || []).map(function (o) { return { label: String(o.label || "").trim(), delta: parseFloat(o.delta) || 0 }; }).filter(function (o) { return o.label; }) }; }).filter(function (g) { return g.name && g.options.length > 0; }),
    };
    try {
      await onSave(saved, isEdit);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (isArabic) => ({
    width: "100%", padding: "8px 12px", border: `0.5px solid ${COLORS.wheat}`,
    borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box",
    fontFamily: isArabic ? FONTS.arabic : FONTS.body, direction: isArabic ? "rtl" : "ltr",
  });
  const labelStyle = {
    display: "block", fontSize: 10, fontWeight: 600, color: COLORS.textMuted,
    letterSpacing: 0.5, marginBottom: 4,
  };
  const field = (label, key, type = "text", placeholder = "", isArabic = false) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder} style={inputStyle(isArabic)} />
    </div>
  );
  const selectField = (label, key, options) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <select value={form[key]} onChange={e => set(key, e.target.value)}
        style={{ ...inputStyle(false), cursor: "pointer" }}>
        {options.map(o => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(40,31,24,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 12px", overflowY: "auto", zIndex: 1000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 720, background: COLORS.cream, borderRadius: 14, border: "1px solid " + COLORS.wheat, overflow: "hidden", fontFamily: FONTS.body, color: COLORS.charcoal }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid " + COLORS.wheat, background: "#fff" }}>
          <div>
            <div style={{ fontFamily: FONTS.display, fontSize: 23, fontWeight: 600, lineHeight: 1 }}>{product ? "Edit product" : "New product"}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>Create a professional storefront listing</div>
          </div>
          <button onClick={handleCancel} style={{ background: "none", border: "none", fontSize: 22, color: COLORS.textMuted, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Paste a product link (Amazon, Etsy, eBay...) to auto-fill" style={{ flex: 1, padding: "9px 12px", border: "0.5px solid " + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, boxSizing: "border-box" }} />
            <button onClick={importFromLink} disabled={importing} style={{ padding: "9px 16px", background: COLORS.charcoal, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{importing ? "Reading..." : "Import"}</button>
          </div>
          <input value={form.buyUrl || ""} onChange={(e) => setForm((f) => ({ ...f, buyUrl: e.target.value }))} placeholder="Optional: external buy link (adds a Buy on... button on the product page)" style={{ width: "100%", padding: "9px 12px", border: "0.5px solid " + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, padding: 16 }}>
          <div>
            {genPreview && (
              <div style={{ background: "#fff", border: "1.5px solid " + COLORS.saffron, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.saffronDark, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>✨ AI preview — edit, then accept or regenerate</div>
                <label style={labelStyle}>ENGLISH NAME</label>
                <input value={genPreview.title_en || ""} onChange={(e) => setGenPreview((p) => ({ ...p, title_en: e.target.value }))} style={{ ...inputStyle(false), marginBottom: 8 }} />
                <label style={{ ...labelStyle, textAlign: "right" }}>ARABIC NAME</label>
                <input dir="rtl" value={genPreview.name_ar || ""} onChange={(e) => setGenPreview((p) => ({ ...p, name_ar: e.target.value }))} style={{ ...inputStyle(true), marginBottom: 8 }} />
                <label style={labelStyle}>DESCRIPTION (EN)</label>
                <textarea value={genPreview.desc || ""} onChange={(e) => setGenPreview((p) => ({ ...p, desc: e.target.value }))} rows={3} style={{ ...inputStyle(false), resize: "vertical", marginBottom: 8 }} />
                <label style={{ ...labelStyle, textAlign: "right" }}>DESCRIPTION (AR)</label>
                <textarea dir="rtl" value={genPreview.desc_ar || ""} onChange={(e) => setGenPreview((p) => ({ ...p, desc_ar: e.target.value }))} rows={3} style={{ ...inputStyle(true), resize: "vertical", marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>PRICE</label><input value={genPreview.price || ""} onChange={(e) => setGenPreview((p) => ({ ...p, price: e.target.value }))} style={inputStyle(false)} /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>BADGE</label><input value={genPreview.badge || ""} onChange={(e) => setGenPreview((p) => ({ ...p, badge: e.target.value }))} style={inputStyle(false)} /></div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={acceptGenerate} style={{ flex: 1, padding: "8px 0", background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: FONTS.body, fontSize: 13, fontWeight: 600 }}>✓ Accept</button>
                  <button onClick={handleGenerate} disabled={generating} style={{ flex: 1, padding: "8px 0", background: "#fff", color: COLORS.saffron, border: "1px solid " + COLORS.saffron, borderRadius: 7, cursor: generating ? "not-allowed" : "pointer", fontFamily: FONTS.body, fontSize: 13, fontWeight: 600 }}>{generating ? "⏳ Regenerating…" : "🔄 Regenerate"}</button>
                  <button onClick={() => setGenPreview(null)} style={{ flex: "0 0 80px", padding: "8px 0", background: "#fff", color: COLORS.textMuted, border: "1px solid " + COLORS.wheat, borderRadius: 7, cursor: "pointer", fontFamily: FONTS.body, fontSize: 13 }}>Dismiss</button>
                </div>
              </div>
            )}
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600, marginBottom: 11 }}>Product details</div>
              <label style={labelStyle}>PRODUCT NAME (English)</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Damascus Name Plaque" style={{ ...inputStyle(false), flex: 1 }} />
                <button onClick={handleGenerate} disabled={generating} style={{ background: generating ? COLORS.textMuted : COLORS.saffron, color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontWeight: 600, fontSize: 12.5, fontFamily: FONTS.body, cursor: generating ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{generating ? "⏳…" : "✨ Generate"}</button>
              </div>
              <input type="text" value={form.hint} onChange={(e) => set("hint", e.target.value)} placeholder="Add hints for better SEO — e.g. 3D printed, Eid gift, metallic" style={{ ...inputStyle(false), fontSize: 11.5, marginBottom: 10 }} />
              <label style={{ ...labelStyle, textAlign: "right" }}>اسم المنتج (Arabic)</label>
              <input type="text" dir="rtl" value={form.name_ar} onChange={(e) => set("name_ar", e.target.value)} placeholder="مثال: لوحة الاسم" style={inputStyle(true)} />
            </div>
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600, marginBottom: 11 }}>Product images <span style={{ color: COLORS.textMuted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(up to 5)</span></div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleImageUpload(e.target.files)} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {form.images.map((img, idx) => (
                  <div key={idx} style={{ width: 92 }}>
                    <div style={{ position: "relative", width: 92, height: 92, borderRadius: 9, overflow: "hidden", background: getBgGrad(img.bg) }}>
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      <button onClick={() => removeImage(idx)} style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: COLORS.terracotta, color: "#fff", border: "none", fontSize: 11, cursor: "pointer", lineHeight: 1 }}>×</button>
                      {idx === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: COLORS.saffron, color: "#fff", fontSize: 8, fontWeight: 600, textAlign: "center", letterSpacing: 0.5, padding: "2px 0" }}>COVER</div>}
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, background: "#FBF4E4", border: "1px solid " + COLORS.wheat, borderRadius: 7, padding: "4px 6px", cursor: "pointer", fontSize: 10 }}>
                      <input type="checkbox" checked={!!img.bgRemoved} onChange={() => toggleRemoveBg(idx)} disabled={bgBusy === idx} style={{ margin: 0 }} />
                      <span style={{ color: COLORS.textMuted, flex: 1 }}>{bgBusy === idx ? "Removing…" : "Remove bg"}</span>
                    </label>
                    <select value={img.bg} onChange={(e) => updateImageBg(idx, e.target.value)} style={{ ...inputStyle(false), marginTop: 5, fontSize: 10.5, padding: "4px 6px", cursor: "pointer" }}>
                      {BG_STYLES.map((b) => <option key={b.id} value={b.id}>{b.label} bg</option>)}
                    </select>
                  </div>
                ))}
                {form.images.length < 5 && (
                  <div onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 92, height: 92, borderRadius: 9, border: "1.5px dashed " + COLORS.wheat, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: COLORS.saffronDark, cursor: "pointer" }}>
                    <span style={{ fontSize: 20 }}>+</span>
                    <span style={{ fontSize: 10.5, marginTop: 3 }}>Add photo</span>
                  </div>
                )}
              </div>
              <button onClick={handleGenerate} disabled={generating || !(form.images && form.images[0] && form.images[0].url)} style={{ width: "100%", marginTop: 12, background: "#FBEFD8", color: COLORS.saffronDark, border: "1px solid #E6C886", borderRadius: 8, padding: "9px 0", fontWeight: 600, fontSize: 12.5, fontFamily: FONTS.body, cursor: (form.images && form.images[0] && form.images[0].url) ? "pointer" : "not-allowed", opacity: (form.images && form.images[0] && form.images[0].url) ? 1 : 0.55 }}>{generating ? "⏳ Generating from photo…" : "📷 Generate listing from this photo"}</button>
              <button disabled style={{ width: "100%", marginTop: 8, background: "#F3ECDB", color: "#9A8B73", border: "1px dashed " + COLORS.wheat, borderRadius: 8, padding: "8px 0", fontWeight: 600, fontSize: 12, fontFamily: FONTS.body, cursor: "not-allowed" }}>✨ Generate product image (AI) — coming soon</button>
              <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginTop: 8, lineHeight: 1.45 }}>The AI reads your photo to write the whole listing. Background removal is off by default — toggle it per image for a clean cut-out.</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px" }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600, marginBottom: 11 }}>Description</div>
              <label style={labelStyle}>ENGLISH</label>
              <textarea value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder="Product description shown on the storefront…" rows={3} style={{ ...inputStyle(false), resize: "vertical", marginBottom: 10 }} />
              <label style={{ ...labelStyle, textAlign: "right" }}>العربية</label>
              <textarea dir="rtl" value={form.desc_ar} onChange={(e) => set("desc_ar", e.target.value)} placeholder="وصف المنتج" rows={3} style={{ ...inputStyle(true), resize: "vertical" }} />
            </div>
          </div>
          <div>
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600, marginBottom: 11 }}>Status</div>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} style={{ ...inputStyle(false), cursor: "pointer", marginBottom: 11 }}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9, fontSize: 12, cursor: "pointer" }}>Featured on homepage<input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} /></label>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, cursor: "pointer" }}>Accepts custom text<input type="checkbox" checked={!!form.customizable} onChange={(e) => set("customizable", e.target.checked)} /></label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: FONTS.body, color: COLORS.charcoal, cursor: "pointer" }}>Members only<input type="checkbox" checked={!!form.membersOnly} onChange={(e) => set("membersOnly", e.target.checked)} /></label>
          <div style={{ gridColumn: "1 / -1", marginTop: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 }}>EARLY ACCESS — PUBLIC FROM</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="datetime-local"
                value={form.publicAt ? String(form.publicAt).slice(0, 16) : ""}
                onChange={(e) => set("publicAt", e.target.value ? new Date(e.target.value).toISOString() : "")}
                style={{ padding: "8px 12px", border: "0.5px solid " + COLORS.wheat, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, outline: "none" }}
              />
              <GhostBtn type="button" onClick={() => set("publicAt", new Date(Date.now() + 48 * 3600 * 1000).toISOString())} style={{ fontSize: 11 }}>Members first for 48h</GhostBtn>
              {form.publicAt && (
                <GhostBtn type="button" onClick={() => set("publicAt", "")} style={{ fontSize: 11 }}>Clear</GhostBtn>
              )}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 4 }}>
              {form.publicAt
                ? "Members only until " + new Date(form.publicAt).toLocaleString() + ", then public."
                : "Leave empty to go public immediately."}
            </div>
          </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600 }}>Pricing</div>
                {form.price && form.cost ? <span style={{ fontSize: 10, background: "#EAF3DE", color: "#3B6D11", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>Margin {Math.max(0, Math.round((1 - parseFloat(form.cost) / parseFloat(form.price)) * 100))}%</span> : null}
              </div>
              <label style={labelStyle}>PRICE</label>
              <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" style={{ ...inputStyle(false), marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>COMPARE-AT</label><input type="number" value={form.compareAt} onChange={(e) => set("compareAt", e.target.value)} placeholder="0.00" style={inputStyle(false)} /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>COST</label><input type="number" value={form.cost} onChange={(e) => set("cost", e.target.value)} placeholder="0.00" style={inputStyle(false)} /></div>
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600, marginBottom: 11 }}>Inventory</div>
              <label style={labelStyle}>STOCK</label>
              <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" style={inputStyle(false)} />
            </div>
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600, marginBottom: 4 }}>Variations (optional)</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 11, lineHeight: 1.5 }}>e.g. Size or Color. Price adjustment is added to the base price: 2 means +$2.00, -1.5 means $1.50 less, 0 or blank means same price.</div>
              {(form.variations || []).map(function (g, gi) { return (
                <div key={gi} style={{ border: "1px solid " + COLORS.wheat, borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <input value={g.name || ""} onChange={function (e) { var v = (form.variations || []).slice(); v[gi] = { ...v[gi], name: e.target.value }; set("variations", v); }} placeholder="Variation name (e.g. Size)" style={{ ...inputStyle(false), flex: 1 }} />
                    <button onClick={function () { var v = (form.variations || []).slice(); v.splice(gi, 1); set("variations", v); }} title="Remove variation" style={{ background: "none", border: "none", color: "#B33", cursor: "pointer", fontSize: 15, padding: 4 }}>✕</button>
                  </div>
                  {(g.options || []).map(function (o, oi) { return (
                    <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                      <input value={o.label || ""} onChange={function (e) { var v = (form.variations || []).slice(); var opts = (v[gi].options || []).slice(); opts[oi] = { ...opts[oi], label: e.target.value }; v[gi] = { ...v[gi], options: opts }; set("variations", v); }} placeholder="Option (e.g. Small)" style={{ ...inputStyle(false), flex: 2 }} />
                      <input type="number" step="0.5" value={o.delta === 0 || o.delta ? o.delta : ""} onChange={function (e) { var v = (form.variations || []).slice(); var opts = (v[gi].options || []).slice(); opts[oi] = { ...opts[oi], delta: e.target.value }; v[gi] = { ...v[gi], options: opts }; set("variations", v); }} placeholder="+/- $" style={{ ...inputStyle(false), flex: 1 }} />
                      <button onClick={function () { var v = (form.variations || []).slice(); var opts = (v[gi].options || []).slice(); opts.splice(oi, 1); v[gi] = { ...v[gi], options: opts }; set("variations", v); }} title="Remove option" style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 13, padding: 4 }}>✕</button>
                    </div>
                  ); })}
                  <button onClick={function () { var v = (form.variations || []).slice(); v[gi] = { ...v[gi], options: (v[gi].options || []).concat([{ label: "", delta: "" }]) }; set("variations", v); }} style={{ background: "none", border: "1px dashed " + COLORS.wheat, borderRadius: 6, padding: "6px 10px", fontSize: 12, color: COLORS.charcoal, cursor: "pointer" }}>+ Add option</button>
                </div>
              ); })}
              <button onClick={function () { set("variations", (form.variations || []).concat([{ name: "", options: [{ label: "", delta: "" }] }])); }} style={{ background: "none", border: "1px dashed " + COLORS.saffronDark, borderRadius: 6, padding: "7px 12px", fontSize: 12, color: COLORS.saffronDark, fontWeight: 600, cursor: "pointer" }}>+ Add variation</button>
            </div>
            <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: "14px 15px" }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.saffronDark, fontWeight: 600, marginBottom: 11 }}>Organization</div>
              <label style={labelStyle}>CATEGORY</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} style={{ ...inputStyle(false), cursor: "pointer", marginBottom: 10 }}>
                {["Home Decor", "Art", "Seasonal", "Kitchen", "Accessories", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label style={labelStyle}>COUNTRY / HERITAGE</label>
              <select value={form.country} onChange={(e) => set("country", e.target.value)} style={{ ...inputStyle(false), cursor: "pointer", marginBottom: 10 }}>
                <option value="">None</option>
                {Object.keys(COUNTRY_FLAGS).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>BADGE</label><select value={form.badge} onChange={(e) => set("badge", e.target.value)} style={{ ...inputStyle(false), cursor: "pointer" }}><option value="">None</option><option>Best Seller</option><option>New</option><option>Sale</option><option>Limited</option></select></div>
                <div style={{ width: 64 }}><label style={labelStyle}>ICON</label><input type="text" value={form.emoji} onChange={(e) => set("emoji", e.target.value)} style={{ ...inputStyle(false), textAlign: "center", fontSize: 16, padding: "6px 4px" }} /></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid " + COLORS.wheat, background: "#fff" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", marginRight: "auto", fontFamily: FONTS.body }}>Discard</button>
          <button onClick={handleCancel} disabled={saving} style={{ background: "#fff", border: "1px solid " + COLORS.wheat, color: COLORS.textMuted, borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, fontFamily: FONTS.body, cursor: saving ? "not-allowed" : "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? COLORS.wheat : COLORS.saffron, border: "none", color: "#fff", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 600, fontFamily: FONTS.body, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1 }}>{saving ? "Saving..." : (product ? "Save changes" : "Add product")}</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
const MENU_ITEM = { display: "block", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "none", cursor: "pointer", fontFamily: FONTS.body, fontSize: 12, color: COLORS.charcoal, borderRadius: 6 };

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [optimizing, setOptimizing] = useState("");

  const loadProducts = async () => {
    try {
      const list = await fetchProducts();
      setProducts(list);
    } catch (e) {
      console.error("Load products failed", e);
      setProducts([]);
    }
    setLoading(false);
  };
  useEffect(() => { loadProducts(); }, []);

  const handleSave = async (product, isEdit) => {
    try {
      await saveProduct(product);
      await loadProducts();
    } catch (e) {
      alert("Save failed: " + e.message + "\n\nNothing was duplicated - fix the problem and press save again.");
      return;
    }
    setShowForm(false);
    setEditProduct(null);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try { await deleteProductById(id); setProducts((prev) => prev.filter((p) => p.id !== id)); }
    catch (e) { alert("Delete failed: " + e.message); }
    setSelected(null);
  };

  const handleArchive = async (p, archive) => {
    const next = archive ? "archived" : "active";
    try {
      await setProductStatus(p.id, next);
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    } catch (e) {
      alert((archive ? "Archive" : "Unarchive") + " failed: " + e.message);
    }
    setMenuFor(null);
    setSelected(null);
  };

  // Products are fetched one at a time here on purpose: rows that still carry
  // inline base64 images are ~900 KB each, so loading them all at once hits the
  // database statement timeout. Ids first, then one row per pass.
  const optimizeAll = async () => {
    if (!window.confirm("Re-compress every product image? This runs in your browser and may take a few minutes. You can keep working when it finishes.")) return;
    let ids = [];
    try {
      setOptimizing("Checking...");
      ids = await fetchProductIds();
    } catch (e) {
      setOptimizing("");
      alert("Could not list products: " + e.message);
      return;
    }
    let before = 0, after = 0, fixed = 0, failed = 0;
    for (let i = 0; i < ids.length; i++) {
      setOptimizing("Optimizing " + (i + 1) + "/" + ids.length);
      try {
        const p = await fetchProductById(ids[i]);
        if (!p || !productNeedsOptimizing(p)) continue;
        const r = await reoptimizeProductImages(p);
        if (r) { before += r.before; after += r.after; fixed++; }
      } catch (e) {
        failed++;
        console.error("Optimize failed for one product", e);
      }
    }
    setOptimizing("");
    try { await loadProducts(); } catch (e) { /* list refresh is best effort */ }
    const mb = (n) => (n / 1048576).toFixed(2) + " MB";
    alert("Optimized " + fixed + " product(s)" + (failed ? " (" + failed + " failed)" : "") + ".\nImages went from " + mb(before) + " to " + mb(after) + ".");
  };

    const openEdit = (p) => {
    setEditProduct(p);
    setShowForm(true);
    setSelected(null);
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginRight: "auto" }}>Products</div>
          <GhostBtn onClick={optimizeAll} disabled={!!optimizing} style={{ fontSize: 11 }}>{optimizing || "Optimize images"}</GhostBtn>
          <PrimaryBtn onClick={() => { setEditProduct(null); setShowForm(true); }}>+ New Product</PrimaryBtn>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, outline: "none" }} />
          {["all", "active", "out_of_stock", "draft", "archived"].map(s => (
            <FilterPill key={s} label={s === "all" ? "All" : s === "out_of_stock" ? "Out of Stock" : s.charAt(0).toUpperCase() + s.slice(1)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
      </div>
      <div style={{ height: 14 }} />
      <SectionCard>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
          <thead>
            <tr style={{ borderBottom: `0.5px solid ${COLORS.wheat}` }}>
              {["SKU", "Product", "Price", "Cost", "Stock", "Orders", "Status", ""].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, padding: "0 8px 10px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} onClick={() => setSelected(p)} style={{ borderBottom: `0.5px solid ${COLORS.wheat}`, cursor: "pointer" }}>
                <td style={{ padding: "12px 8px", fontSize: 11, color: COLORS.textMuted }}>{p.sku || "—"}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(()=>{const cover=p.images&&p.images[0]||(p.imageUrl?{url:p.imageUrl,bg:p.imageBg||"cream"}:null);const bg=(BG_STYLES.find(b=>b.id===(cover&&cover.bg))||BG_STYLES[0]).colors;return cover?(<div style={{width:38,height:38,borderRadius:8,background:`linear-gradient(135deg,${bg[0]},${bg[1]})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}><img src={cover.thumbUrl||cover.url} alt={p.name} loading="lazy" decoding="async" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} /></div>):(<span style={{fontSize:18}}>{p.emoji||"🏺"}</span>);})()}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{p.name}</div>
                      <div style={{ fontSize: 11, fontFamily: FONTS.arabic, color: COLORS.textMuted }}>{p.name_ar}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>${p.price}</td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: COLORS.textMuted }}>${p.cost || 0}</td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: p.stock === 0 ? COLORS.terracotta : COLORS.charcoal, fontWeight: p.stock < 5 ? 600 : 400 }}>{p.stock === 0 ? "Out" : p.stock}</td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: COLORS.charcoal }}>{p.orders || 0}</td>
                <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>
                  <Badge status={p.status} />
                  {p.membersOnly && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: COLORS.saffron + "22", color: COLORS.saffron }}>MEMBERS</span>}
                  {p.earlyAccess && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: COLORS.damascene + "22", color: COLORS.damascene }}>EARLY</span>}
                </td>
                <td style={{ padding: "12px 8px", position: "relative", whiteSpace: "nowrap" }}>
                  <GhostBtn onClick={(e) => { e.stopPropagation(); openEdit(p); }} style={{ padding: "4px 10px", fontSize: 10 }}>Edit</GhostBtn>
                  <button onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === p.id ? null : p.id); }} title="More actions" style={{ marginLeft: 4, padding: "3px 8px", border: "0.5px solid " + COLORS.wheat, borderRadius: 6, background: "transparent", cursor: "pointer", color: COLORS.textMuted, fontSize: 13, lineHeight: 1 }}>⋯</button>
                  {menuFor === p.id && (
                    <>
                      <div onClick={(e) => { e.stopPropagation(); setMenuFor(null); }} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 8, top: 36, zIndex: 61, background: "#FFF", border: "0.5px solid " + COLORS.wheat, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 4, minWidth: 150 }}>
                        <button onClick={() => { setMenuFor(null); openEdit(p); }} style={MENU_ITEM}>Edit</button>
                        {p.status === "archived" ? (
                          <button onClick={() => handleArchive(p, false)} style={MENU_ITEM}>Unarchive</button>
                        ) : (
                          <button onClick={() => handleArchive(p, true)} style={MENU_ITEM}>Archive</button>
                        )}
                        <button onClick={() => { setMenuFor(null); handleDelete(p.id); }} style={{ ...MENU_ITEM, color: COLORS.terracotta }}>Delete</button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "32px 8px", textAlign: "center", color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body }}>{loading ? "Loading products..." : "No products found. Click \"+ New Product\" to add one."}</td></tr>
            )}
          </tbody>
        </table>
      </SectionCard>

      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(580px, 92vw)", background: COLORS.cream, zIndex: 101, boxShadow: "-20px 0 60px rgba(0,0,0,0.3)", animation: "slideIn 0.3s ease", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                {(()=>{const cover=selected.images&&selected.images[0]||(selected.imageUrl?{url:selected.imageUrl,bg:selected.imageBg||"cream"}:null);const bg=(BG_STYLES.find(b=>b.id===(cover&&cover.bg))||BG_STYLES[0]).colors;return cover?(<div style={{width:84,height:84,borderRadius:12,background:`linear-gradient(135deg,${bg[0]},${bg[1]})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",marginBottom:10}}><img src={cover.thumbUrl||cover.url} alt={selected.name} loading="lazy" decoding="async" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} /></div>):(<div style={{fontSize:28,marginBottom:4}}>{selected.emoji||"🏺"}</div>);})()}
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal }}>{selected.name}</div>
                <div style={{ fontFamily: FONTS.arabic, fontSize: 16, color: COLORS.saffron }}>{selected.name_ar}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <StatCard label="PRICE" value={`$${selected.price}`} />
              <StatCard label="STOCK" value={selected.stock} />
              <StatCard label="ORDERS" value={selected.orders || 0} />
              <StatCard label="REVENUE" value={`$${(selected.revenue || 0).toFixed(0)}`} />
            </div>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12, letterSpacing: 0.5 }}>DETAILS</div>
              {[
                ["SKU", selected.sku || "—"],
                ["Category", selected.category],
                ["Heritage", `${selected.flag || ""} ${selected.country}`],
                ["Cost", `$${selected.cost || 0}`],
                ["Badge", selected.badge || "None"],
                ["Featured", selected.featured ? "Yes" : "No"],
                ["Customizable", selected.customizable ? "Yes" : "No"],
                ["Status", selected.status],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${COLORS.wheat}`, fontSize: 12, fontFamily: FONTS.body }}>
                  <span style={{ color: COLORS.textMuted }}>{k}</span>
                  <span style={{ color: COLORS.charcoal, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {selected.desc && (
                <div style={{ marginTop: 10, fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body, lineHeight: 1.6 }}>{selected.desc}</div>
              )}
            </SectionCard>
            <div style={{ display: "flex", gap: 8 }}>
              <PrimaryBtn onClick={() => openEdit(selected)} style={{ flex: 1 }}>Edit Product</PrimaryBtn>
              <GhostBtn onClick={() => handleArchive(selected, selected.status !== "archived")} style={{ flex: 1 }}>{selected.status === "archived" ? "Unarchive" : "Archive"}</GhostBtn>
              <GhostBtn onClick={() => handleDelete(selected.id)} style={{ flex: 1, color: COLORS.terracotta, borderColor: COLORS.terracotta }}>Delete</GhostBtn>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <ProductFormModal
          product={editProduct}
          existingProducts={products}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
        />
      )}
    </div>
  );
}

// ─── ORDERS PAGE ───────────────────────────────────────────────────────────────
const ORDER_STAGES = [
  { id: "new", label: "New", color: "#3B5BB5" },
  { id: "awaiting_approval", label: "Awaiting Approval", color: COLORS.terracotta },
  { id: "in_production", label: "In Production", color: COLORS.saffron },
  { id: "shipped", label: "Shipped", color: COLORS.damascene },
  { id: "delivered", label: "Delivered", color: COLORS.olive },
];

function AddOrderModal({ onClose, onCreated }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", city: "", state: "", zip: "" });
  const [lines, setLines] = useState([]);
  const [pick, setPick] = useState("");
  const [pay, setPay] = useState("paid");
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  useEffect(() => { fetchProducts({ activeOnly: false }).then((list) => setProducts(list || [])); }, []);
  const inp = { width: "100%", padding: "9px 11px", border: "0.5px solid " + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, boxSizing: "border-box", marginBottom: 8 };
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const addLine = () => { const p = products.find((x) => x.id === pick); if (!p) return; setLines((prev) => [...prev, { id: p.id, name: p.name, price: Number(p.price) || 0, qty: 1 }]); setPick(""); };
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const submit = async () => {
    if (!form.name || lines.length === 0) { alert("Add a customer name and at least one product."); return; }
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : "";
      const res = await fetch("/api/create-manual-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, address: { line1: form.line1, city: form.city, state: form.state, zip: form.zip }, items: lines.map((l) => ({ id: l.id, qty: l.qty })), pay: pay }),
      });
      const data = await res.json();
      if (data && data.ok) {
        alert(pay === "paid" ? "Order created and confirmation emailed to the customer." : "Payment link emailed to the customer.");
        onCreated();
      } else {
        alert((data && data.error) || "Could not create order.");
      }
    } catch (e) { alert("Failed: " + e.message); }
    setBusy(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "40px 16px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 14, padding: 24, width: 440, maxWidth: "100%" }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16 }}>New Order</div>
        {linkUrl ? (
          <div>
            <div style={{ fontSize: 13, color: COLORS.charcoal, marginBottom: 8 }}>Payment link created. Send this to your customer:</div>
            <input readOnly value={linkUrl} style={inp} onFocus={(e) => e.target.select()} />
            <button onClick={onCreated} style={{ width: "100%", padding: "11px", background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <div>
            <input placeholder="Customer name" value={form.name} onChange={(e) => setF("name", e.target.value)} style={inp} />
            <input placeholder="Email" value={form.email} onChange={(e) => setF("email", e.target.value)} style={inp} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setF("phone", e.target.value)} style={inp} />
            <input placeholder="Address line" value={form.line1} onChange={(e) => setF("line1", e.target.value)} style={inp} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="City" value={form.city} onChange={(e) => setF("city", e.target.value)} style={inp} />
              <input placeholder="State" value={form.state} onChange={(e) => setF("state", e.target.value)} style={{ ...inp, width: 80 }} />
              <input placeholder="ZIP" value={form.zip} onChange={(e) => setF("zip", e.target.value)} style={{ ...inp, width: 90 }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ ...inp, flex: 1, marginBottom: 0 }}>
                <option value="">Add a product...</option>
                {products.map((p) => (<option key={p.id} value={p.id}>{p.name} (${Number(p.price || 0).toFixed(2)})</option>))}
              </select>
              <button onClick={addLine} style={{ padding: "0 14px", background: COLORS.charcoal, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Add</button>
            </div>
            <div style={{ margin: "10px 0" }}>
              {lines.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>{l.name}</span>
                  <input type="number" min="1" value={l.qty} onChange={(e) => setLines((prev) => prev.map((x, j) => (j === i ? { ...x, qty: Math.max(1, parseInt(e.target.value, 10) || 1) } : x)))} style={{ width: 52, padding: "5px", border: "0.5px solid " + COLORS.wheat, borderRadius: 6 }} />
                  <span style={{ width: 64, textAlign: "right" }}>${(l.price * l.qty).toFixed(2)}</span>
                  <button onClick={() => setLines((prev) => prev.filter((x, j) => j !== i))} style={{ border: "none", background: "none", color: COLORS.textMuted, cursor: "pointer" }}>x</button>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "right", fontWeight: 700, marginBottom: 12 }}>Total: ${total.toFixed(2)}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[["paid", "Already paid"], ["link", "Payment link"]].map(([v, l]) => (
                <button key={v} onClick={() => setPay(v)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "0.5px solid " + COLORS.wheat, background: pay === v ? COLORS.saffron : "#FFF", color: pay === v ? "#fff" : COLORS.charcoal, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{l}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#FFF", color: COLORS.charcoal, border: "0.5px solid " + COLORS.wheat, borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              <button onClick={submit} disabled={busy} style={{ flex: 2, padding: "11px", background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>{busy ? "Working..." : pay === "paid" ? "Create Order" : "Create Payment Link"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersPage() {
  const [view, setView] = useState("kanban");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState(() => { try { return JSON.parse(localStorage.getItem("souk3d_orders")) || ORDERS_DATA; } catch { return ORDERS_DATA; } });

  const moveOrder = (orderId, newStatus) => {
    supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders(prev => { const next = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o); localStorage.setItem("souk3d_orders", JSON.stringify(next)); return next; });
  };

  useEffect(() => {
    fetchOrders().then((list) => setOrders(list));
  }, []);

  const [busy, setBusy] = useState(false);
  const [rates, setRates] = useState(null);
  const [confirmRate, setConfirmRate] = useState(null);
  const [trackInput, setTrackInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const buyLabel = async () => {
    if (!selectedOrder) return;
    setBusy(true);
    setRates(null);
    setConfirmRate(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : "";
      const res = await fetch("/api/create-label", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ order_id: selectedOrder.id }),
      });
      const data = await res.json();
      if (data && Array.isArray(data.rates) && data.rates.length) {
        setRates(data.rates);
      } else {
        alert((data && data.error) || "Could not load shipping rates.");
      }
    } catch (e) {
      alert("Rate request failed.");
    }
    setBusy(false);
  };
  const buyRate = async (rateId) => {
    if (!selectedOrder) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : "";
      const res = await fetch("/api/create-label", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ order_id: selectedOrder.id, rate_id: rateId }),
      });
      const data = await res.json();
      if (data && data.label_url) {
        window.open(data.label_url, "_blank");
        const upd = { ...selectedOrder, trackingNumber: data.tracking_number, labelUrl: data.label_url };
        setSelectedOrder(upd);
        setOrders((prev) => prev.map((o) => (o.id === upd.id ? upd : o)));
        setRates(null);
        setConfirmRate(null);
      } else {
        alert((data && data.error) || "Label purchase failed.");
      }
    } catch (e) {
      alert("Label purchase failed.");
    }
    setBusy(false);
  };
  const markShipped = async () => {
    if (!selectedOrder) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : "";
      const res = await fetch("/api/mark-shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ order_id: selectedOrder.id, tracking: trackInput || undefined }),
      });
      const data = await res.json();
      if (data && data.ok) {
        const upd = { ...selectedOrder, status: "shipped" };
        setSelectedOrder(upd);
        setOrders((prev) => prev.map((o) => (o.id === upd.id ? upd : o)));
        alert("Marked shipped" + (data.emailed ? " and emailed the customer." : "."));
      } else {
        alert((data && data.error) || "Could not mark shipped.");
      }
    } catch (e) {
      alert("Request failed.");
    }
    setBusy(false);
  };
  const printPackingSlip = () => {
    if (!selectedOrder) return;
    const o = selectedOrder;
    const a = o.address || {};
    const rows = (o.items || [])
      .map((it) => `<tr><td style="padding:6px 0;">${it.name || "Item"} x ${it.qty || 1}</td><td style="text-align:right;padding:6px 0;">$${Number((it.price || 0) * (it.qty || 1)).toFixed(2)}</td></tr>`)
      .join("");
    const html = `<html><head><title>Packing Slip ${o.orderNumber}</title></head><body style="font-family:Arial,sans-serif;max-width:640px;margin:24px auto;color:#2A1F18;"><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #D4881F;padding-bottom:12px;"><div><div style="font-size:28px;font-weight:700;color:#D4881F;">Souk3D</div><div style="font-size:12px;color:#888;">Handmade 3D-printed gifts</div></div><div style="text-align:right;font-size:13px;">Order ${o.orderNumber}<br>${o.date || ""}</div></div><h3 style="margin:20px 0 6px;">Ship To</h3><div style="font-size:14px;line-height:1.5;">${a.name || o.customer || ""}<br>${a.line1 || ""}${a.line2 ? "<br>" + a.line2 : ""}<br>${a.city || ""}, ${a.state || ""} ${a.zip || ""}</div><h3 style="margin:24px 0 6px;">Items</h3><table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}<tr><td style="border-top:1px solid #eee;padding-top:8px;font-weight:700;">Total</td><td style="border-top:1px solid #eee;padding-top:8px;text-align:right;font-weight:700;">$${Number(o.total || 0).toFixed(2)}</td></tr></table><p style="margin-top:28px;font-size:13px;color:#888;">Thank you for supporting handmade. Each piece is printed and packed by hand. - Souk3D</p></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  };
  const getByStatus = (status) => orders.filter(o => o.status === status);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, flex: 1 }}>Orders</div>
            <button onClick={() => setShowAdd(true)} style={{ padding: "8px 14px", background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: FONTS.body, cursor: "pointer", marginRight: 8 }}>+ Add Order</button>
            {showAdd && (<AddOrderModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); fetchOrders().then((list) => setOrders(list)); }} />)}
          <div style={{ display: "flex", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, overflow: "hidden" }}>
            {[["kanban", "Pipeline"], ["list", "List"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "7px 14px", fontSize: 11, fontFamily: FONTS.body, border: "none", cursor: "pointer", background: view === v ? COLORS.charcoal : "#FFF", color: view === v ? "#FFF" : COLORS.charcoal }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 14 }} />
      {view === "kanban" ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
          {ORDER_STAGES.map(stage => {
            const stageOrders = getByStatus(stage.id);
            return (
              <div key={stage.id} style={{ minWidth: 220, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body }}>{stage.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: "auto" }}>{stageOrders.length}</div>
                </div>
                {stageOrders.map(order => (
                  <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ background: "#FFF", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.damascene, fontFamily: FONTS.body }}>{order.orderNumber}</span>
                      {order.isCustom && <span style={{ fontSize: 9, background: COLORS.saffron + "22", color: COLORS.saffron, padding: "1px 6px", borderRadius: 6, fontWeight: 600 }}>Custom</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal, fontFamily: FONTS.body }}>{order.customer}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 2 }}>{order.items[0].name}</div>
                    {order.customText && <div style={{ fontFamily: FONTS.arabic, fontSize: 14, color: COLORS.saffron, marginTop: 6, direction: "rtl", textAlign: "right" }}>{order.customText}</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body }}>{order.date}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal }}>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <SectionCard>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${COLORS.wheat}` }}>
                {["Order", "Customer", "Items", "Total", "Status", "Date", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, padding: "0 8px 10px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} onClick={() => setSelectedOrder(o)} style={{ borderBottom: `0.5px solid ${COLORS.wheat}`, cursor: "pointer" }}>
                  <td style={{ padding: "12px 8px", fontSize: 12, fontWeight: 700, color: COLORS.damascene }}>{o.orderNumber}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal }}>{o.customer}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>{o.location}</div>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 11, color: COLORS.textMuted }}>{o.items[0].name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>${o.total.toFixed(2)}</td>
                  <td style={{ padding: "12px 8px" }}><Badge status={o.status} /></td>
                  <td style={{ padding: "12px 8px", fontSize: 11, color: COLORS.textMuted }}>{o.date}</td>
                  <td style={{ padding: "12px 8px" }}><GhostBtn style={{ padding: "4px 10px", fontSize: 10 }}>View</GhostBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
      {selectedOrder && (
        <>
          <div onClick={() => setSelectedOrder(null)} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(620px, 92vw)", background: COLORS.cream, zIndex: 101, boxShadow: "-20px 0 60px rgba(0,0,0,0.3)", animation: "slideIn 0.3s ease", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal }}>{selectedOrder.orderNumber}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>{selectedOrder.customer} · {selectedOrder.date}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {ORDER_STAGES.filter(s => !(!selectedOrder.isCustom && s.id === "awaiting_approval")).map(stage => (
                <button key={stage.id} onClick={() => { moveOrder(selectedOrder.id, stage.id); setSelectedOrder(prev => ({ ...prev, status: stage.id })); }} style={{ flex: 1, padding: "7px 4px", fontSize: 10, fontFamily: FONTS.body, border: `0.5px solid ${selectedOrder.status === stage.id ? stage.color : COLORS.wheat}`, borderRadius: 6, background: selectedOrder.status === stage.id ? stage.color + "22" : "#FFF", color: selectedOrder.status === stage.id ? stage.color : COLORS.textMuted, cursor: "pointer", fontWeight: selectedOrder.status === stage.id ? 700 : 400 }}>{stage.label}</button>
              ))}
            </div>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10 }}>ORDER ITEMS</div>
              {selectedOrder.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${COLORS.wheat}`, fontSize: 13, fontFamily: FONTS.body }}>
                  <span>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 600 }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 14, fontWeight: 700, fontFamily: FONTS.body, color: COLORS.charcoal }}>
                <span>Total</span><span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </SectionCard>
            {selectedOrder.customText && (
              <SectionCard>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>ARABIC CUSTOMIZATION</div>
                <div style={{ fontFamily: FONTS.arabic, fontSize: 28, color: COLORS.saffron, direction: "rtl", textAlign: "right" }}>{selectedOrder.customText}</div>
              </SectionCard>
            )}
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10 }}>CUSTOMER</div>
              {[["Name", selectedOrder.customer], ["Email", selectedOrder.email], ["Location", selectedOrder.location]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, fontFamily: FONTS.body }}>
                  <span style={{ color: COLORS.textMuted }}>{k}</span>
                  <span style={{ color: COLORS.charcoal }}>{v}</span>
                </div>
              ))}
            </SectionCard>
            {selectedOrder.trackingNumber && (
              <SectionCard>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 6 }}>TRACKING</div>
                <div style={{ fontSize: 12, fontFamily: FONTS.body, color: COLORS.damascene }}>{selectedOrder.trackingNumber}</div>
              </SectionCard>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <PrimaryBtn style={{ flex: 1 }} onClick={() => buyLabel()}>{busy ? "Working..." : "Buy & Print Label"}</PrimaryBtn>
              <GhostBtn style={{ flex: 1 }} onClick={() => markShipped()}>{busy ? "Working..." : "Mark Shipped"}</GhostBtn>
            </div><div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input value={trackInput} onChange={(e) => setTrackInput(e.target.value)} placeholder="Paste tracking number (optional)" style={{ flex: 2, padding: "10px 12px", border: "0.5px solid " + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, boxSizing: "border-box" }} />
              <GhostBtn style={{ flex: 1 }} onClick={() => printPackingSlip()}>Packing Slip</GhostBtn>
            </div>
            {confirmRate && (
              <div style={{ marginTop: 12, background: "#FFF", border: "1px solid " + COLORS.saffron, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>CONFIRM LABEL PURCHASE</div>
                <div style={{ fontSize: 14, fontFamily: FONTS.body, color: COLORS.charcoal }}>{confirmRate.carrier} {confirmRate.service}{confirmRate.days ? " - " + confirmRate.days + " day(s)" : ""}</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 600, color: COLORS.charcoal, margin: "4px 0 8px" }}>{"$" + confirmRate.amount}</div>
                <div style={{ fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted, marginBottom: 8 }}>{"Ship to: " + ((selectedOrder.address && selectedOrder.address.name) || selectedOrder.customer) + (selectedOrder.location ? " - " + selectedOrder.location : "")}</div>
                <div style={{ fontSize: 12, fontFamily: FONTS.body, color: COLORS.terracotta, background: COLORS.cream, border: "0.5px solid " + COLORS.wheat, borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>This buys real postage and charges your Shippo account. The customer is emailed their tracking automatically. Refunds take about 14 days.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <PrimaryBtn style={{ flex: 1 }} onClick={() => buyRate(confirmRate.id)}>{busy ? "Buying..." : "Confirm & Buy " + "$" + confirmRate.amount}</PrimaryBtn>
                  <GhostBtn style={{ flex: 1 }} onClick={() => setConfirmRate(null)}>Back</GhostBtn>
                </div>
              </div>
            )}
            {rates && !confirmRate && (
              <div style={{ marginTop: 12, background: "#FFF", border: "0.5px solid " + COLORS.wheat, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>CHOOSE A RATE</div>
                {rates.map((rt) => (
                  <button key={rt.id} onClick={() => setConfirmRate(rt)} disabled={busy} style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "10px 12px", marginBottom: 6, border: "0.5px solid " + COLORS.wheat, borderRadius: 8, background: COLORS.cream, cursor: "pointer", fontFamily: FONTS.body, fontSize: 13, color: COLORS.charcoal }}>
                    <span>{rt.carrier} {rt.service}{rt.days ? " - " + rt.days + "d" : ""}</span>
                    <strong>${rt.amount}</strong>
                  </button>
                ))}
                <button onClick={() => setRates(null)} style={{ marginTop: 4, background: "none", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              </div>
            )}
            
          </div>
        </>
      )}
    </div>
  );
}

// ─── CUSTOMERS PAGE ────────────────────────────────────────────────────────────
function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadCustomers = async () => {
    try {
      const list = await fetchCustomers();
      setCustomers(list);
      setLoadError("");
    } catch (e) {
      console.error("Load customers failed", e);
      setLoadError(e.message || "Could not load customers.");
    }
    setLoading(false);
  };
  useEffect(() => { loadCustomers(); }, []);

  const exportCsv = () => {
    const head = ["Name", "Email", "Phone", "Heritage", "Location", "Orders", "LTV", "Last Order", "Tags"];
    const esc = (v) => {
      const s = String(v == null ? "" : v);
      return s.indexOf(",") !== -1 || s.indexOf(String.fromCharCode(34)) !== -1
        ? String.fromCharCode(34) + s.split(String.fromCharCode(34)).join(String.fromCharCode(34, 34)) + String.fromCharCode(34)
        : s;
    };
    const rows = filtered.map((c) => [c.name, c.email, c.phone, c.heritage, c.location, c.orders, Number(c.ltv || 0).toFixed(2), c.lastOrder, (c.tags || []).join(" / ")].map(esc).join(","));
    const csv = [head.join(",")].concat(rows).join(String.fromCharCode(10));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "souk3d-customers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const [search, setSearch] = useState("");
  const [heritageFilter, setHeritageFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState("");

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchHeritage = heritageFilter === "all" || c.heritage === heritageFilter;
    const matchTag = tagFilter === "all" || c.tags.includes(tagFilter);
    return matchSearch && matchHeritage && matchTag;
  });

  const totalLTV = customers.reduce((s, c) => s + c.ltv, 0);
  const avgLTV = customers.length ? totalLTV / customers.length : 0;
  const vipCount = customers.filter(c => c.tags.includes("VIP")).length;
  const repeatCount = customers.filter(c => c.tags.includes("Repeat buyer")).length;
  const topHeritage = Object.entries(customers.reduce((acc, c) => { acc[c.heritage] = (acc[c.heritage] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0];

  const TAG_COLORS = { "VIP": COLORS.saffron, "Repeat buyer": COLORS.damascene, "Custom orders": COLORS.olive, "Gift buyer": COLORS.terracotta, "Refunded": "#888", "Inactive": "#aaa" };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, flex: 1 }}>Customers</div>
          <PrimaryBtn onClick={exportCsv}>Export CSV</PrimaryBtn>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, outline: "none" }} />
          {["all", "Syria", "Lebanon", "Palestine", "Pan-Arab", "Egypt"].map(h => (
            <FilterPill key={h} label={h === "all" ? "All Heritage" : h} active={heritageFilter === h} onClick={() => setHeritageFilter(h)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {["all", "VIP", "Repeat buyer", "Custom orders", "Gift buyer"].map(t => (
            <FilterPill key={t} label={t === "all" ? "All Tags" : t} active={tagFilter === t} onClick={() => setTagFilter(t)} />
          ))}
        </div>
      </div>
      <div style={{ height: 14 }} />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="TOTAL CUSTOMERS" value={customers.length} />
        <StatCard label="REPEAT BUYERS" value={repeatCount} sub={`${(customers.length ? Math.round((repeatCount / customers.length) * 100) : 0)}% of total`} />
        <StatCard label="VIP" value={vipCount} sub="3+ orders" dark />
        <StatCard label="AVG LIFETIME VALUE" value={`$${avgLTV.toFixed(0)}`} />
        <StatCard label="TOP HERITAGE" value={topHeritage} />
      </div>
      <SectionCard>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
          <thead>
            <tr style={{ borderBottom: `0.5px solid ${COLORS.wheat}` }}>
              {["Customer", "Heritage", "Location", "Orders", "Last Order", "LTV", "Tags", ""].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, padding: "0 8px 10px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} onClick={() => setSelected(c)} style={{ borderBottom: `0.5px solid ${COLORS.wheat}`, cursor: "pointer" }}>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <HeritageAvatar name={c.name} heritage={c.heritage} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{ fontSize: 10, background: (HERITAGE_COLORS[c.heritage] || COLORS.saffron) + "22", color: HERITAGE_COLORS[c.heritage] || COLORS.saffron, padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>{c.heritage}</span>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: COLORS.textMuted }}>{c.location.flag} {c.location.city}, {c.location.country}</td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: COLORS.charcoal, fontWeight: 600 }}>{c.orders}</td>
                <td style={{ padding: "12px 8px", fontSize: 11, color: COLORS.textMuted }}>{c.lastOrder}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>${c.ltv.toFixed(2)}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {c.tags.map(t => (
                      <span key={t} style={{ fontSize: 9, background: (TAG_COLORS[t] || "#888") + "22", color: TAG_COLORS[t] || "#888", padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "12px 8px" }}><GhostBtn style={{ padding: "4px 10px", fontSize: 10 }}>View</GhostBtn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(680px, 92vw)", background: COLORS.cream, zIndex: 101, boxShadow: "-20px 0 60px rgba(0,0,0,0.3)", animation: "slideIn 0.3s ease", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <HeritageAvatar name={selected.name} heritage={selected.heritage} size={56} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 600, color: COLORS.charcoal }}>{selected.name}</div>
                    {selected.tags.includes("VIP") && <span style={{ fontSize: 9, background: COLORS.saffron, color: "#FFF", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>VIP</span>}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>{selected.location.flag} {selected.location.city}, {selected.location.country} · {selected.heritage}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <StatCard label="ORDERS" value={selected.orders} />
              <StatCard label="CUSTOM" value={selected.customOrders} />
              <StatCard label="LTV" value={`$${selected.ltv.toFixed(2)}`} dark />
              <StatCard label="LAST ORDER" value={selected.lastOrder} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[["✉ Email", COLORS.damascene], ["💬 WhatsApp", COLORS.olive], ["🎟 Discount", COLORS.saffron]].map(([label, color]) => (
                <button key={label} style={{ flex: 1, padding: "9px 12px", background: color + "18", border: `0.5px solid ${color}44`, borderRadius: 8, fontSize: 11, fontWeight: 600, color, cursor: "pointer", fontFamily: FONTS.body }}>{label}</button>
              ))}
            </div>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10 }}>CONTACT</div>
              {[["Email", selected.email], ["Phone", selected.phone], ["Location", `${selected.location.city}, ${selected.location.state} ${selected.location.country}`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${COLORS.wheat}`, fontSize: 12, fontFamily: FONTS.body }}>
                  <span style={{ color: COLORS.textMuted }}>{k}</span><span style={{ color: COLORS.charcoal }}>{v}</span>
                </div>
              ))}
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10 }}>TAGS</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selected.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, background: (TAG_COLORS[t] || "#888") + "22", color: TAG_COLORS[t] || "#888", padding: "4px 10px", borderRadius: 10, fontWeight: 600, fontFamily: FONTS.body }}>{t} ×</span>
                ))}
              </div>
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10 }}>ORDER HISTORY</div>
              {ORDERS_DATA.filter(o => o.customer === selected.name).map(o => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.damascene, fontFamily: FONTS.body }}>{o.orderNumber}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>{o.items[0].name} · {o.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge status={o.status} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.charcoal }}>${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {!ORDERS_DATA.find(o => o.customer === selected.name) && <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>No orders on record.</div>}
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10 }}>PRIVATE NOTE</div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a private note about this customer…" style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              <PrimaryBtn style={{ marginTop: 8 }}>Save Note</PrimaryBtn>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CUSTOM ORDERS PAGE ────────────────────────────────────────────────────────
const CUSTOM_STAGE_INFO = {
  new:      { label: "New",        color: "#3B5BB5", bg: "#EEF4FF" },
  quote:    { label: "Quote Sent", color: COLORS.saffron, bg: "#FFF7E6" },
  mockup:   { label: "Mockup",     color: COLORS.terracotta, bg: "#FFF0ED" },
  approved: { label: "Approved",   color: COLORS.olive, bg: "#EDFBF0" },
  production:{ label: "Production",color: COLORS.damascene, bg: "#E6F4FF" },
};
const URGENCY_INFO = {
  urgent: { label: "🔴 Urgent", color: COLORS.terracotta },
  soon:   { label: "🟡 Soon",   color: COLORS.saffron },
  ok:     { label: "🟢 OK",     color: COLORS.olive },
};
const MOCK_MESSAGES = {
  1: [
    { from: "customer", text: "Hi! I need a custom wedding arch piece for my daughter's wedding on May 15. Arabic name عائلة جابر in Diwani calligraphy, gold color, about 12 inches wide.", time: "2 days ago" },
    { from: "owner",    text: "What a beautiful occasion! I can definitely do that. Let me put together a quote for you. The Diwani style in gold will be stunning 🌟", time: "2 days ago" },
    { from: "customer", text: "Thank you so much! Also wondering if you can add a small olive branch motif on the sides?", time: "1 day ago" },
    { from: "owner",    text: "Absolutely — I've attached a mockup with the olive branches. Let me know what you think!", time: "5 hours ago" },
  ],
  2: [
    { from: "customer", text: "Congratulations plaque for my son graduating from U of M. عائلة حداد in modern style, white.", time: "3 days ago" },
    { from: "owner",    text: "Mabrook to your son! Here's a quote: base plaque $45 + custom Arabic text $20 = $65. Rush fee waived since we have 10 days.", time: "2 days ago" },
  ],
};

function CustomOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [occasionFilter, setOccasionFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [sendingQuote, setSendingQuote] = useState(false);

  const load = async () => {
    try {
      const list = await fetchCustomOrders();
      setOrders(list);
      setLoadError("");
    } catch (e) {
      console.error("Load custom orders failed", e);
      setLoadError(e.message || "Could not load requests.");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const STAGES_ORDERED = [
    { id: "new", label: "New" },
    { id: "quote", label: "Quote Sent" },
    { id: "mockup", label: "Mockup" },
    { id: "approved", label: "Approved" },
    { id: "production", label: "Production" },
  ];

  const daysUntil = (v) => {
    if (!v) return null;
    const t = new Date(v).getTime();
    if (isNaN(t)) return null;
    return Math.ceil((t - Date.now()) / 86400000);
  };
  const ageDays = (o) => {
    const t = new Date(o.createdAt).getTime();
    if (isNaN(t)) return 0;
    return Math.floor((Date.now() - t) / 86400000);
  };
  const needsReply = (o) =>
    !o.messages.length || o.messages[o.messages.length - 1].from === "customer";
  const isUrgent = (o) => {
    const d = daysUntil(o.deadline);
    if (d !== null && d <= 14) return true;
    return o.stage === "new" && ageDays(o) >= 2;
  };

  const filtered = orders.filter((o) => {
    if (statusFilter === "urgent" && !isUrgent(o)) return false;
    if (statusFilter === "soon" && !needsReply(o)) return false;
    if (stageFilter !== "all" && o.stage !== stageFilter) return false;
    if (occasionFilter !== "all" && String(o.occasion).toLowerCase() !== occasionFilter) return false;
    return true;
  });

  const selectedOrder = filtered.find((o) => o.id === selectedId) || filtered[0] || null;
  const messages = selectedOrder ? selectedOrder.messages : [];

  const moveStage = async (stage) => {
    if (!selectedOrder) return;
    const id = selectedOrder.id;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, stage: stage } : o)));
    try {
      await setCustomOrderStage(id, stage);
    } catch (e) {
      alert("Could not update the stage: " + e.message);
      load();
    }
  };

  const sendQuote = async () => {
    if (!selectedOrder || sendingQuote) return;
    if (!replyText.trim()) return alert("Write a message to the customer first.");
    const amt = quoteAmount ? Number(quoteAmount) : 0;
    const who = selectedOrder.customerName || "the customer";
    const priceLine = amt > 0 ? " with a price of $" + amt.toFixed(2) : " (no price)";
    if (!window.confirm("Email this quote to " + who + priceLine + "?")) return;
    setSendingQuote(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : "";
      const res = await fetch("/api/send-custom-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ id: selectedOrder.id, amount: amt, message: replyText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        alert((data && data.error) || "Could not send the quote.");
      } else {
        setReplyText("");
        setQuoteAmount("");
        await load();
        alert("Quote emailed to " + who + ".");
      }
    } catch (e) {
      alert("Could not send the quote: " + e.message);
    }
    setSendingQuote(false);
  };

  const waLink = (n) => "https://wa.me/" + String(n || "").replace(/[^0-9]/g, "");
  const fmtDate = (v) => {
    if (!v) return "";
    const t = new Date(v);
    return isNaN(t.getTime()) ? String(v) : t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const railTitle = { fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: COLORS.textMuted, margin: "14px 0 6px" };
  const railItem = (active) => ({
    padding: "6px 9px", borderRadius: 7, fontSize: 12, fontFamily: FONTS.body, cursor: "pointer",
    background: active ? COLORS.saffron : "transparent",
    color: active ? "#fff" : COLORS.charcoal, marginBottom: 2,
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease", display: "flex", height: "calc(100vh - 48px)", margin: "-24px -32px" }}>
      {/* Filter rail */}
      <div style={{ width: 168, background: COLORS.cream2, borderRight: "0.5px solid " + COLORS.wheat, padding: "16px 12px", overflowY: "auto", flexShrink: 0 }}>
        <div style={railTitle}>STATUS</div>
        {[["all", "All Requests"], ["urgent", "Urgent"], ["soon", "Needs Reply"]].map(([v, l]) => (
          <div key={v} onClick={() => setStatusFilter(v)} style={railItem(statusFilter === v)}>{l}</div>
        ))}
        <div style={railTitle}>PIPELINE</div>
        <div onClick={() => setStageFilter("all")} style={railItem(stageFilter === "all")}>All Stages</div>
        {STAGES_ORDERED.map((s) => (
          <div key={s.id} onClick={() => setStageFilter(s.id)} style={railItem(stageFilter === s.id)}>{s.label}</div>
        ))}
        <div style={railTitle}>OCCASION</div>
        <div onClick={() => setOccasionFilter("all")} style={railItem(occasionFilter === "all")}>Any</div>
        {["wedding", "graduation", "baby", "birthday", "eid"].map((o) => (
          <div key={o} onClick={() => setOccasionFilter(o)} style={railItem(occasionFilter === o)}>{o.charAt(0).toUpperCase() + o.slice(1)}</div>
        ))}
      </div>

      {/* Request list */}
      <div style={{ width: 300, borderRight: "0.5px solid " + COLORS.wheat, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 10px", borderBottom: "0.5px solid " + COLORS.wheat }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 600, color: COLORS.charcoal }}>Custom Orders</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body }}>
            {loading ? "Loading..." : filtered.length + (filtered.length === 1 ? " request" : " requests")}
          </div>
        </div>
        {loadError && (
          <div style={{ margin: 12, padding: 10, background: "#FDF3EC", border: "0.5px solid " + COLORS.terracotta, borderRadius: 8, fontSize: 12, color: COLORS.terracotta, fontFamily: FONTS.body }}>{loadError}</div>
        )}
        {!loading && !filtered.length && !loadError && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body, lineHeight: 1.6 }}>
            No requests yet. They arrive here when a customer submits the Custom Order form on the site.
          </div>
        )}
        {filtered.map((o) => (
          <div key={o.id} onClick={() => setSelectedId(o.id)} style={{
            padding: "12px 16px", borderBottom: "0.5px solid " + COLORS.wheat, cursor: "pointer",
            background: selectedOrder && selectedOrder.id === o.id ? COLORS.cream2 : "transparent",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginRight: "auto" }}>{o.customerName}</div>
              {isUrgent(o) && <span style={{ fontSize: 9, background: COLORS.terracotta + "22", color: COLORS.terracotta, padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>URGENT</span>}
              {needsReply(o) && <span style={{ fontSize: 9, background: COLORS.saffron + "22", color: COLORS.saffron, padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>REPLY</span>}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 2 }}>
              {[o.occasion, o.style].filter(Boolean).join(" · ") || "Custom request"}
            </div>
            {o.arabicText && <div style={{ fontFamily: FONTS.arabic, fontSize: 13, color: COLORS.saffron, marginTop: 2 }}>{o.arabicText}</div>}
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 4 }}>{o.reference} · {fmtDate(o.createdAt)}</div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {!selectedOrder ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body, textAlign: "center", marginTop: 60 }}>
            {loading ? "Loading requests..." : "Select a request to view"}
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ marginRight: "auto" }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 600, color: COLORS.charcoal }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>{selectedOrder.reference} · {fmtDate(selectedOrder.createdAt)}</div>
              </div>
              {selectedOrder.whatsapp && (
                <a href={waLink(selectedOrder.whatsapp)} target="_blank" rel="noopener noreferrer" style={{ background: "#25D366", color: "#fff", textDecoration: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: FONTS.body, marginRight: 8 }}>WhatsApp</a>
              )}
              {selectedOrder.email && (
                <a href={"mailto:" + selectedOrder.email} style={{ background: "#fff", border: "0.5px solid " + COLORS.wheat, color: COLORS.charcoal, textDecoration: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: FONTS.body }}>Email</a>
              )}
            </div>

            {/* Pipeline */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {STAGES_ORDERED.map((s) => (
                <button key={s.id} onClick={() => moveStage(s.id)} style={{
                  padding: "7px 13px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: FONTS.body, cursor: "pointer",
                  border: "0.5px solid " + (selectedOrder.stage === s.id ? COLORS.saffron : COLORS.wheat),
                  background: selectedOrder.stage === s.id ? COLORS.saffron : "#fff",
                  color: selectedOrder.stage === s.id ? "#fff" : COLORS.textMuted,
                }}>{s.label}</button>
              ))}
            </div>

            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>THE REQUEST</div>
              {[
                ["Occasion", selectedOrder.occasion],
                ["Arabic text", selectedOrder.arabicText],
                ["Style", selectedOrder.style],
                ["Colour", selectedOrder.color],
                ["Deadline", selectedOrder.deadline],
                ["Email", selectedOrder.email],
                ["WhatsApp", selectedOrder.whatsapp],
              ].filter(([k, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid " + COLORS.wheat, fontSize: 12, fontFamily: FONTS.body, gap: 16 }}>
                  <span style={{ color: COLORS.textMuted, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: COLORS.charcoal, fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{v}</span>
                </div>
              ))}
              {selectedOrder.notes && (
                <div style={{ marginTop: 10, fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selectedOrder.notes}</div>
              )}
            </SectionCard>

            {selectedOrder.quote && selectedOrder.quote.amount > 0 && (
              <SectionCard>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5 }}>QUOTED</div>
                <div style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, color: COLORS.charcoal }}>{"$" + Number(selectedOrder.quote.amount).toFixed(2)}</div>
              </SectionCard>
            )}

            {messages.length > 0 && (
              <SectionCard>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>CONVERSATION</div>
                {messages.map((m, i) => (
                  <div key={i} style={{ marginBottom: 8, textAlign: m.from === "shop" ? "right" : "left" }}>
                    <div style={{ display: "inline-block", maxWidth: "80%", padding: "8px 12px", borderRadius: 10, fontSize: 12, fontFamily: FONTS.body, lineHeight: 1.6, whiteSpace: "pre-wrap",
                      background: m.from === "shop" ? COLORS.saffron : COLORS.cream2,
                      color: m.from === "shop" ? "#fff" : COLORS.charcoal }}>{m.text}</div>
                    <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{fmtDate(m.at)}</div>
                  </div>
                ))}
              </SectionCard>
            )}

            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>SEND A QUOTE</div>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4}
                placeholder={"Hi " + selectedOrder.customerName + ", I can make this for you..."}
                style={{ width: "100%", padding: "10px 12px", border: "0.5px solid " + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, boxSizing: "border-box", resize: "vertical", outline: "none" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <input value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} type="number" step="0.01" placeholder="Price (optional)"
                  style={{ flex: 1, padding: "10px 12px", border: "0.5px solid " + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, boxSizing: "border-box", outline: "none" }} />
                <PrimaryBtn onClick={sendQuote} disabled={sendingQuote} style={{ flex: 1 }}>{sendingQuote ? "Sending..." : "Send Quote"}</PrimaryBtn>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 8 }}>
                Emails the customer from order@souk3d.com and moves this request to Quote Sent.
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  useEffect(function () {
    var live = true;
    Promise.all([fetchOrders(), fetchProducts()])
      .then(function (res) { if (live) { setOrders(res[0] || []); setProducts(res[1] || []); } })
      .catch(function (e) { console.error('Analytics load failed', e); })
      .finally(function () { if (live) setLoading(false); });
    return function () { live = false; };
  }, []);

  var days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'all' ? 3650 : 30;
  var cutoff = Date.now() - days * 86400000;
  var paid = orders.filter(function (o) { return o.paymentStatus === 'paid'; });
  var inRange = paid.filter(function (o) { var t = new Date(o.date).getTime(); return isNaN(t) ? true : t >= cutoff; });

  var revenue = inRange.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);
  var orderCount = inRange.length;
  var aov = orderCount ? revenue / orderCount : 0;
  var units = inRange.reduce(function (s, o) { return s + (o.items || []).reduce(function (a, it) { return a + (Number(it.qty) || 1); }, 0); }, 0);

  // Top products by revenue, from the order line items.
  var byProduct = {};
  inRange.forEach(function (o) {
    (o.items || []).forEach(function (it) {
      var name = it.name || 'Item';
      var rev = (Number(it.price) || 0) * (Number(it.qty) || 1);
      if (!byProduct[name]) byProduct[name] = { name: name, revenue: 0, qty: 0 };
      byProduct[name].revenue += rev;
      byProduct[name].qty += (Number(it.qty) || 1);
    });
  });
  var topProducts = Object.keys(byProduct).map(function (k) { return byProduct[k]; }).sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 5);

  // Daily revenue series for the chart.
  var buckets = Math.min(days, 30);
  var series = [];
  for (var i = buckets - 1; i >= 0; i--) {
    var dayStart = new Date(); dayStart.setHours(0, 0, 0, 0); dayStart.setDate(dayStart.getDate() - i);
    var dayEnd = dayStart.getTime() + 86400000;
    var dayRev = paid.reduce(function (s, o) { var t = new Date(o.date).getTime(); return (t >= dayStart.getTime() && t < dayEnd) ? s + (Number(o.total) || 0) : s; }, 0);
    series.push({ label: (dayStart.getMonth() + 1) + '/' + dayStart.getDate(), revenue: Math.round(dayRev * 100) / 100 });
  }

  var money = function (n) { return '$' + Number(n || 0).toFixed(2); };
  var kpi = { flex: 1, minWidth: 150, background: '#fff', border: '0.5px solid ' + COLORS.wheat, borderRadius: 10, padding: 16 };
  var kpiLabel = { fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: COLORS.textMuted, fontFamily: FONTS.body };
  var kpiValue = { fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, color: COLORS.charcoal, marginTop: 4 };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ position: 'sticky', top: -24, zIndex: 10, background: COLORS.cream, margin: '-24px -32px 0', padding: '24px 32px 14px', borderBottom: '0.5px solid ' + COLORS.wheat }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginRight: 'auto' }}>Analytics</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['7d', '30d', '90d', 'all'].map(function (r) { return (<FilterPill key={r} label={r === 'all' ? 'All' : r} active={range === r} onClick={function () { setRange(r); }} />); })}
          </div>
        </div>
      </div>
      <div style={{ height: 14 }} />

      {loading ? (
        <SectionCard><div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body, padding: 20, textAlign: 'center' }}>Loading analytics...</div></SectionCard>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={kpi}><div style={kpiLabel}>REVENUE</div><div style={kpiValue}>{money(revenue)}</div></div>
            <div style={kpi}><div style={kpiLabel}>ORDERS</div><div style={kpiValue}>{orderCount}</div></div>
            <div style={kpi}><div style={kpiLabel}>AVG ORDER</div><div style={kpiValue}>{money(aov)}</div></div>
            <div style={kpi}><div style={kpiLabel}>UNITS SOLD</div><div style={kpiValue}>{units}</div></div>
          </div>

          <SectionCard>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>REVENUE — LAST {buckets} DAYS</div>
            {revenue > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={series}>
                  <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.saffron} stopOpacity={0.35} /><stop offset="100%" stopColor={COLORS.saffron} stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.textMuted }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} width={40} />
                  <Tooltip formatter={function (v) { return money(v); }} />
                  <Area type="monotone" dataKey="revenue" stroke={COLORS.saffron} strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body, padding: 30, textAlign: 'center' }}>No paid orders in this range yet. Your revenue chart appears here after your first sale.</div>
            )}
          </SectionCard>

          <SectionCard>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>TOP PRODUCTS</div>
            {topProducts.length === 0 ? (
              <div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body, padding: 10 }}>No sales yet.</div>
            ) : topProducts.map(function (p, i) { return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid ' + COLORS.wheat, fontSize: 13, fontFamily: FONTS.body }}>
                <span style={{ color: COLORS.charcoal, marginRight: 'auto' }}>{p.name}</span>
                <span style={{ color: COLORS.textMuted, marginRight: 16 }}>{p.qty + ' sold'}</span>
                <span style={{ color: COLORS.charcoal, fontWeight: 600 }}>{money(p.revenue)}</span>
              </div>
            ); })}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function DiscountsPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = function () {
    fetchDiscounts().then(function (list) { setCodes(list || []); }).catch(function (e) { console.error('Load discounts failed', e); }).finally(function () { setLoading(false); });
  };
  useEffect(function () { load(); }, []);

  const blank = { code: '', name: '', type: 'percent', value: '', status: 'active', usageLimit: '' };
  const openNew = function () { setForm(Object.assign({}, blank)); setShowForm(true); };
  const openEdit = function (c) { setForm({ id: c.id, code: c.code, name: c.name, type: c.type, value: c.value, status: c.status, usageLimit: c.usageLimit == null ? '' : c.usageLimit }); setShowForm(true); };
  const set = function (k) { return function (e) { setForm(function (p) { var n = Object.assign({}, p); n[k] = e.target.value; return n; }); }; };

  const save = async function () {
    if (saving) return;
    if (!form.code || !String(form.code).trim()) return alert('Enter a code.');
    if (form.value === '' || Number(form.value) <= 0) return alert('Enter a discount value greater than zero.');
    setSaving(true);
    try { await saveDiscount(form); await load(); setShowForm(false); setForm(null); }
    catch (e) { alert('Save failed: ' + e.message); }
    setSaving(false);
  };

  const toggle = async function (c) {
    var next = c.status === 'active' ? 'paused' : 'active';
    try { await setDiscountStatus(c.id, next); setCodes(function (prev) { return prev.map(function (x) { return x.id === c.id ? Object.assign({}, x, { status: next }) : x; }); }); }
    catch (e) { alert('Could not update: ' + e.message); }
  };

  const remove = async function (c) {
    if (!window.confirm('Delete code ' + c.code + '? This cannot be undone.')) return;
    try { await deleteDiscountById(c.id); setCodes(function (prev) { return prev.filter(function (x) { return x.id !== c.id; }); }); }
    catch (e) { alert('Delete failed: ' + e.message); }
  };

  const activeCount = codes.filter(function (c) { return c.status === 'active'; }).length;
  const input = { width: '100%', padding: '9px 12px', border: '0.5px solid ' + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, boxSizing: 'border-box', outline: 'none', marginBottom: 10 };
  const label = { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4, fontFamily: FONTS.body };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ position: 'sticky', top: -24, zIndex: 10, background: COLORS.cream, margin: '-24px -32px 0', padding: '24px 32px 14px', borderBottom: '0.5px solid ' + COLORS.wheat }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginRight: 'auto' }}>Discounts</div>
          <PrimaryBtn onClick={openNew}>+ New Code</PrimaryBtn>
        </div>
      </div>
      <div style={{ height: 14 }} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140, background: '#fff', border: '0.5px solid ' + COLORS.wheat, borderRadius: 10, padding: 16 }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: COLORS.textMuted }}>ACTIVE CODES</div><div style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, color: COLORS.charcoal, marginTop: 4 }}>{activeCount}</div></div>
        <div style={{ flex: 1, minWidth: 140, background: '#fff', border: '0.5px solid ' + COLORS.wheat, borderRadius: 10, padding: 16 }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: COLORS.textMuted }}>TOTAL CODES</div><div style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, color: COLORS.charcoal, marginTop: 4 }}>{codes.length}</div></div>
      </div>

      <SectionCard>
        {loading ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body, padding: 20, textAlign: 'center' }}>Loading codes...</div>
        ) : codes.length === 0 ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.body, padding: 24, textAlign: 'center' }}>No discount codes yet. Click "+ New Code" to create one.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.body }}>
            <thead><tr style={{ borderBottom: '0.5px solid ' + COLORS.wheat }}>{['Code', 'Description', 'Discount', 'Limit', 'Status', ''].map(function (h) { return (<th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, padding: '0 8px 10px' }}>{h}</th>); })}</tr></thead>
            <tbody>
              {codes.map(function (c) { return (
                <tr key={c.id} style={{ borderBottom: '0.5px solid ' + COLORS.wheat }}>
                  <td style={{ padding: '12px 8px', fontSize: 13, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'monospace' }}>{c.code}</td>
                  <td style={{ padding: '12px 8px', fontSize: 12, color: COLORS.textMuted }}>{c.name || '—'}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: COLORS.charcoal, fontWeight: 600 }}>{c.type === 'percent' ? (c.value + '% off') : ('$' + Number(c.value).toFixed(2) + ' off')}</td>
                  <td style={{ padding: '12px 8px', fontSize: 12, color: COLORS.textMuted }}>{c.usageLimit == null ? 'Unlimited' : c.usageLimit}</td>
                  <td style={{ padding: '12px 8px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: (c.status === 'active' ? COLORS.olive : COLORS.textMuted) + '22', color: c.status === 'active' ? COLORS.olive : COLORS.textMuted }}>{String(c.status).toUpperCase()}</span></td>
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <GhostBtn onClick={function () { openEdit(c); }} style={{ padding: '4px 10px', fontSize: 10, marginRight: 4 }}>Edit</GhostBtn>
                    <GhostBtn onClick={function () { toggle(c); }} style={{ padding: '4px 10px', fontSize: 10, marginRight: 4 }}>{c.status === 'active' ? 'Pause' : 'Activate'}</GhostBtn>
                    <GhostBtn onClick={function () { remove(c); }} style={{ padding: '4px 10px', fontSize: 10, color: COLORS.terracotta, borderColor: COLORS.terracotta }}>Delete</GhostBtn>
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {showForm && form && (
        <>
          <div onClick={function () { setShowForm(false); setForm(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(42,31,24,0.5)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(420px, 92vw)', background: '#fff', borderRadius: 14, zIndex: 101, padding: 24 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16 }}>{form.id ? 'Edit code' : 'New discount code'}</div>
            <div style={label}>CODE</div>
            <input value={form.code} onChange={set('code')} placeholder="SUMMER20" style={Object.assign({}, input, { textTransform: 'uppercase', fontFamily: 'monospace' })} />
            <div style={label}>DESCRIPTION</div>
            <input value={form.name} onChange={set('name')} placeholder="Summer sale" style={input} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><div style={label}>TYPE</div><select value={form.type} onChange={set('type')} style={input}><option value="percent">Percent off</option><option value="fixed">Amount off</option></select></div>
              <div style={{ flex: 1 }}><div style={label}>{form.type === 'percent' ? 'PERCENT' : 'AMOUNT ($)'}</div><input value={form.value} onChange={set('value')} type="number" step="0.01" placeholder={form.type === 'percent' ? '10' : '5.00'} style={input} /></div>
            </div>
            <div style={label}>USAGE LIMIT (optional)</div>
            <input value={form.usageLimit} onChange={set('usageLimit')} type="number" placeholder="Leave empty for unlimited" style={input} />
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <PrimaryBtn onClick={save} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save code'}</PrimaryBtn>
              <GhostBtn onClick={function () { setShowForm(false); setForm(null); }} style={{ flex: 1 }}>Cancel</GhostBtn>
            </div>
            {form.type === 'percent' && Number(form.value) > 50 && (<div style={{ fontSize: 11, color: COLORS.terracotta, marginTop: 8, fontFamily: FONTS.body }}>Note: checkout caps total discounts at 50%.</div>)}
          </div>
        </>
      )}
    </div>
  );
}

function EmailMarketingPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(""); // "" | "test" | "all"

  async function callNewsletter(payload) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess && sess.session ? sess.session.access_token : "";
    const r = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  useEffect(function () {
    var live = true;
    callNewsletter({ action: "list" })
      .then(function (d) { if (live) setSubs(d.subscribers || []); })
      .catch(function (e) { if (live) setLoadErr(e.message || "Could not load subscribers."); })
      .finally(function () { if (live) setLoading(false); });
    return function () { live = false; };
  }, []);

  const active = subs.filter(function (s) { return s.status === "subscribed"; });

  async function handleSend(test) {
    if (!subject.trim() || !message.trim()) { alert("Please add a subject and a message first."); return; }
    if (!test && !window.confirm("Send this campaign to " + active.length + " subscriber" + (active.length === 1 ? "" : "s") + "? This cannot be undone.")) return;
    setSending(test ? "test" : "all");
    try {
      const d = await callNewsletter({ action: "send", subject: subject.trim(), message: message.trim(), test: !!test });
      if (test) alert("Test email sent to your own inbox.");
      else {
        alert("Campaign sent to " + d.sent + " subscriber" + (d.sent === 1 ? "" : "s") + (d.failed ? " (" + d.failed + " failed — check Vercel logs)." : "."));
        setSubject(""); setMessage("");
      }
    } catch (e) { alert(e.message || "Sending failed."); }
    setSending("");
  }

  var automated = [
    { name: 'Order confirmation', when: 'Sent the moment a customer pays', on: true },
    { name: 'Shipping + tracking', when: 'Sent when you buy a label or mark shipped', on: true },
    { name: 'Custom order received', when: 'Sent when someone submits a custom request', on: true },
    { name: 'Custom order quote', when: 'Sent when you send a quote from Custom Orders', on: true },
    { name: 'Account confirmation + reset', when: 'Sent on signup and password reset', on: true },
    { name: 'Newsletter welcome (WELCOME10)', when: 'Sent when someone joins from the homepage signup box', on: true },
  ];
  var kpi = { flex: 1, minWidth: 150, background: '#fff', border: '0.5px solid ' + COLORS.wheat, borderRadius: 10, padding: 16 };
  var kpiLabel = { fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: COLORS.textMuted };
  var kpiValue = { fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, color: COLORS.charcoal, marginTop: 4 };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ position: 'sticky', top: -24, zIndex: 10, background: COLORS.cream, margin: '-24px -32px 0', padding: '24px 32px 14px', borderBottom: '0.5px solid ' + COLORS.wheat }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal }}>Email & Marketing</div>
      </div>
      <div style={{ height: 14 }} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={kpi}><div style={kpiLabel}>SUBSCRIBERS</div><div style={kpiValue}>{loading ? '...' : active.length}</div></div>
        <div style={kpi}><div style={kpiLabel}>UNSUBSCRIBED</div><div style={kpiValue}>{loading ? '...' : subs.length - active.length}</div></div>
        <div style={kpi}><div style={kpiLabel}>AUTOMATED EMAILS</div><div style={kpiValue}>{automated.length}</div></div>
        <div style={kpi}><div style={kpiLabel}>WELCOME CODE</div><div style={kpiValue}>WELCOME10</div></div>
      </div>

      <SectionCard>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>AUTOMATED EMAILS — LIVE</div>
        {automated.map(function (a, i) { return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid ' + COLORS.wheat }}>
            <div style={{ marginRight: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body }}>{a.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>{a.when}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: COLORS.olive + '22', color: COLORS.olive }}>ACTIVE</span>
          </div>
        ); })}
        <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 12, lineHeight: 1.6 }}>These send automatically from order@souk3d.com. Nothing to configure.</div>
      </SectionCard>

      <SectionCard>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>SEND A CAMPAIGN</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body, marginBottom: 12, lineHeight: 1.6 }}>Sends from order@souk3d.com in the Souk3D email template with an unsubscribe link. Blank lines start new paragraphs. Always send yourself a test first.</div>
        <input placeholder="Subject line" value={subject} onChange={function (e) { setSubject(e.target.value); }} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid ' + COLORS.wheat, borderRadius: 8, fontFamily: FONTS.body, fontSize: 14, marginBottom: 10 }} />
        <textarea placeholder="Write your newsletter…" value={message} onChange={function (e) { setMessage(e.target.value); }} rows={8} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid ' + COLORS.wheat, borderRadius: 8, fontFamily: FONTS.body, fontSize: 14, marginBottom: 12, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={function () { handleSend(true); }} disabled={!!sending} style={{ padding: '10px 18px', background: '#fff', color: COLORS.charcoal, border: '1px solid ' + COLORS.wheat, borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: FONTS.body, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>{sending === 'test' ? 'Sending…' : 'Send test to me'}</button>
          <button onClick={function () { handleSend(false); }} disabled={!!sending || active.length === 0} style={{ padding: '10px 18px', background: COLORS.charcoal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: FONTS.body, cursor: 'pointer', opacity: sending || active.length === 0 ? 0.6 : 1 }}>{sending === 'all' ? 'Sending…' : 'Send to ' + active.length + ' subscriber' + (active.length === 1 ? '' : 's')}</button>
        </div>
      </SectionCard>

      <SectionCard>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>SUBSCRIBERS</div>
        {loading ? (
          <div style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: FONTS.body }}>Loading…</div>
        ) : loadErr ? (
          <div style={{ fontSize: 13, color: '#B33', fontFamily: FONTS.body }}>{loadErr}</div>
        ) : subs.length === 0 ? (
          <div style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: FONTS.body, lineHeight: 1.7 }}>No subscribers yet. The signup box on the homepage now saves emails here and sends the WELCOME10 code automatically.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: FONTS.body }}>
              <thead><tr style={{ background: COLORS.cream2, textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Joined</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Source</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
              </tr></thead>
              <tbody>
                {subs.map(function (s) { return (
                  <tr key={s.id} style={{ borderTop: '0.5px solid ' + COLORS.wheat }}>
                    <td style={{ padding: '8px 12px', color: COLORS.charcoal }}>{s.email}</td>
                    <td style={{ padding: '8px 12px', color: COLORS.textMuted }}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</td>
                    <td style={{ padding: '8px 12px', color: COLORS.textMuted }}>{s.source || ''}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: (s.status === 'subscribed' ? COLORS.olive : COLORS.textMuted) + '22', color: s.status === 'subscribed' ? COLORS.olive : COLORS.textMuted }}>{s.status === 'subscribed' ? 'ACTIVE' : 'UNSUBSCRIBED'}</span>
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const _ss = (() => { try { return JSON.parse(localStorage.getItem("souk3d_settings")) || {}; } catch { return {}; } })();
  const [storeName, setStoreName] = useState(_ss.storeName || "Souk3D");
  const [storeEmail, setStoreEmail] = useState(_ss.storeEmail || "hello@souk3d.com");
  const [currency, setCurrency] = useState(_ss.currency || "USD");
  const [timezone, setTimezone] = useState(_ss.timezone || "UTC+3 (Riyadh)");

  const handleSave = () => { localStorage.setItem("souk3d_settings", JSON.stringify({storeName,storeEmail,currency,timezone})); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 16px", borderBottom: "0.5px solid #E8D5A8", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal }}>Settings</div>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>Store configuration & preferences</div>
        </div>
        <button onClick={handleSave} style={{ padding: "9px 22px", borderRadius: 8, border: "none", cursor: "pointer", background: saved ? "#22c55e" : COLORS.saffron, color: "#fff", fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, transition: "background 0.2s" }}>
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div style={{ marginTop: 28, display: "grid", gap: 20, maxWidth: 640 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E8D5A8" }}>Store Details</div>
          {[["Store Name", storeName, setStoreName, "text"], ["Contact Email", storeEmail, setStoreEmail, "email"]].map(([label, val, setter, type]) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 500, color: COLORS.charcoal, marginBottom: 6 }}>{label}</div>
              <input type={type} value={val} onChange={e => setter(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E8D5A8", fontFamily: FONTS.body, fontSize: 14, color: COLORS.charcoal, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E8D5A8" }}>Regional</div>
          {[["Currency", currency, setCurrency, ["USD", "SAR", "AED", "EUR", "GBP"]], ["Timezone", timezone, setTimezone, ["UTC+3 (Riyadh)", "UTC+4 (Dubai)", "UTC+2 (Cairo)", "UTC+0 (London)", "UTC-5 (New York)", "UTC-8 (Los Angeles)"]]].map(([label, val, setter, opts]) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 500, color: COLORS.charcoal, marginBottom: 6 }}>{label}</div>
              <select value={val} onChange={e => setter(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E8D5A8", fontFamily: FONTS.body, fontSize: 14, color: COLORS.charcoal, outline: "none", background: "#fff", boxSizing: "border-box" }}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E8D5A8" }}>Notifications</div>
          {[["New order received", true], ["Low stock alert (less than 5 units)", true], ["Customer messages", true], ["Custom order updates", true], ["Weekly summary", false], ["Marketing reports", false]].map(([label, def]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.charcoal }}>{label}</span>
              <input type="checkbox" defaultChecked={def} style={{ width: 16, height: 16, cursor: "pointer", accentColor: COLORS.saffron }} />
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E8D5A8" }}>Shipping Rates</div>
          {[["Standard (5-7 days)", "$8.99"], ["Express (2-3 days)", "$18.99"], ["International (10-15 days)", "$24.99"]].map(([name, price]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.charcoal }}>{name}</span>
              <span style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>{price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- MAIN ADMIN APP ---
const ADMIN_PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "SS" },
  { id: "products", label: "Products", icon: "PP" },
  { id: "orders", label: "Orders", icon: "OO" },
  { id: "customers", label: "Customers", icon: "CC" },
  { id: "custom", label: "Custom Orders", icon: "XX" },
  { id: "analytics", label: "Analytics", icon: "AA" },
  { id: "discounts", label: "Discounts", icon: "DD" },
  { id: "email", label: "Email & Marketing", icon: "EE" },
  { id: "settings", label: "Settings", icon: "GG" },
];

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.charcoal, fontFamily: FONTS.body, padding: 20 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 14, padding: 28 }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 700, color: COLORS.saffron, textAlign: "center", marginBottom: 4 }}>Souk3D</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginBottom: 20 }}>Admin sign in</div>
        <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid " + COLORS.wheat, borderRadius: 8, margin: "4px 0 14px", fontFamily: FONTS.body, fontSize: 14 }} />
        <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid " + COLORS.wheat, borderRadius: 8, margin: "4px 0 14px", fontFamily: FONTS.body, fontSize: 14 }} />
        {error && <div style={{ color: COLORS.terracotta, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", padding: "11px 0", background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, fontFamily: FONTS.body, cursor: busy ? "not-allowed" : "pointer" }}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("lister");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1px solid " + COLORS.wheat, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, outline: "none", background: "#FFFDF8", color: COLORS.charcoal };
  const call = async (body) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session ? data.session.access_token : null;
    const res = await fetch("/api/admin-users", {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  };
  const load = async () => {
    setLoading(true);
    try { const j = await call(null); setUsers(j.users || []); setError(""); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const addUser = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await call({ action: "create", email: email.trim(), password, role: newRole }); setEmail(""); setPassword(""); setNewRole("lister"); await load(); }
    catch (e) { setError(e.message); }
    setBusy(false);
  };
  const changeRole = async (id, r) => { try { await call({ action: "setrole", id, role: r }); await load(); } catch (e) { alert(e.message); } };
  const removeUser = async (id) => { if (!window.confirm("Remove this user permanently?")) return; try { await call({ action: "delete", id }); await load(); } catch (e) { alert(e.message); } };
  return (
    <div style={{ padding: "32px 40px", flex: 1, fontFamily: FONTS.body, color: COLORS.charcoal, overflowY: "auto" }}>
      <div style={{ fontFamily: FONTS.display, fontSize: 30, fontWeight: 600, marginBottom: 4 }}>Users & Roles</div>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>Add team members and control what they can access.</div>
      <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, padding: 20, marginBottom: 24, maxWidth: 660 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.saffronDark, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Add a user</div>
        <form onSubmit={addUser} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 180px" }}><label style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>EMAIL</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inp, marginTop: 4 }} /></div>
          <div style={{ flex: "1 1 140px" }}><label style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>PASSWORD</label><input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 chars" style={{ ...inp, marginTop: 4 }} /></div>
          <div style={{ flex: "0 0 150px" }}><label style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>ROLE</label><select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ ...inp, marginTop: 4, cursor: "pointer" }}><option value="lister">Lister</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></div>
          <button type="submit" disabled={busy} style={{ background: COLORS.saffron, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, fontFamily: FONTS.body, cursor: busy ? "not-allowed" : "pointer" }}>{busy ? "Adding…" : "Add user"}</button>
        </form>
        {error && <div style={{ color: COLORS.terracotta, fontSize: 12, marginTop: 12 }}>{error}</div>}
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12 }}>Lister: products only · Admin: all except users · Super Admin: full access</div>
      </div>
      <div style={{ background: "#fff", border: "1px solid " + COLORS.wheat, borderRadius: 12, overflow: "hidden", maxWidth: 760 }}>
        {loading ? (
          <div style={{ padding: 24, color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: COLORS.cream2, textAlign: "left" }}><th style={{ padding: "10px 16px", fontWeight: 600 }}>Email</th><th style={{ padding: "10px 16px", fontWeight: 600 }}>Role</th><th style={{ padding: "10px 16px" }}></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: "1px solid " + COLORS.wheat }}>
                  <td style={{ padding: "10px 16px" }}>{u.email}</td>
                  <td style={{ padding: "10px 16px" }}><select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} style={{ ...inp, padding: "5px 8px", cursor: "pointer", width: "auto" }}><option value="lister">Lister</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}><button onClick={() => removeUser(u.id)} style={{ background: "none", border: "1px solid " + COLORS.wheat, color: COLORS.terracotta, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontFamily: FONTS.body }}>Remove</button></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={3} style={{ padding: 20, color: COLORS.textMuted }}>No users yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [page, setPage] = useState("dashboard");
  const [session, setSession] = useState(undefined);
  const [role, setRole] = useState(null);
  useEffect(() => {
    if (session && session.user) {
      supabase.from("profiles").select("role").eq("id", session.user.id).single()
        .then(({ data }) => {
          const r = (data && data.role) || "lister";
          setRole(r);
          if (r === "lister") setPage("products");
        });
    } else { setRole(null); }
  }, [session]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (session === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.cream, fontFamily: FONTS.body, color: COLORS.textMuted }}>Loading…</div>;
  }
  if (!session) return <AdminLogin />;

  const PAGE_MAP = {
    dashboard: <Dashboard onNavigate={setPage} />,
    products: <ProductsPage />,
    orders: <OrdersPage />,
    customers: <CustomersPage />,
    custom: <CustomOrdersPage />,
    analytics: <AnalyticsPage />,
    discounts: <DiscountsPage />,
    email: <EmailMarketingPage />,
    settings: <SettingsPage />,
    users: <UsersPage />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E8D5A8; border-radius: 2px; }
      `}</style>

      <aside style={{ width: 224, background: COLORS.charcoal, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 21, fontWeight: 700, color: COLORS.saffron }}>Souk3D</div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.05em" }}>ADMIN PANEL</div>
        </div>
        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
          {ADMIN_PAGES.concat(role === "super_admin" ? [{ id: "users", label: "Users & Roles", icon: "👥" }] : []).filter(n => (role === "super_admin" ? true : role === "admin" ? n.id !== "users" : role === "lister" ? n.id === "products" : false)).map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left", transition: "all 0.15s", background: page === n.id ? "rgba(212,165,69,0.15)" : "transparent", color: page === n.id ? COLORS.saffron : "rgba(255,255,255,0.55)", fontFamily: FONTS.body, fontSize: 13, fontWeight: page === n.id ? 600 : 400 }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Souk3D v1.0</div>
        </div>
      <button onClick={() => supabase.auth.signOut()} style={{ margin: "0 10px 14px", padding: "10px 0", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, cursor: "pointer", fontFamily: FONTS.body, fontSize: 13 }}>↩ Log out</button>
        </aside>

      <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
        {PAGE_MAP[page] ?? <Dashboard onNavigate={setPage} />}
      </main>
    </div>
  );
}
