import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

// â”€â”€â”€ BRAND CONSTANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ MOCK DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PRODUCTS_DATA = [
  { id: 1, sku: "S3D-001", name: "Damascus Name Plaque", name_ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ø¯Ù…Ø´Ù‚ÙŠØ©", category: "Home Decor", country: "Syria", price: 44.99, cost: 12, stock: 23, status: "active", featured: true, orders: 47, revenue: 2114.53 },
  { id: 2, sku: "S3D-002", name: "Eid Mubarak Lantern", name_ar: "ÙØ§Ù†ÙˆØ³ Ø¹ÙŠØ¯ Ù…Ø¨Ø§Ø±Ùƒ", category: "Seasonal", country: "Pan-Arab", price: 34.99, cost: 9, stock: 41, status: "active", featured: true, orders: 38, revenue: 1329.62 },
  { id: 3, sku: "S3D-003", name: "Palestinian Olive Tree", name_ar: "Ø´Ø¬Ø±Ø© Ø§Ù„Ø²ÙŠØªÙˆÙ† Ø§Ù„ÙÙ„Ø³Ø·ÙŠÙ†ÙŠØ©", category: "Art", country: "Palestine", price: 54.99, cost: 15, stock: 12, status: "active", featured: false, orders: 29, revenue: 1594.71 },
  { id: 4, sku: "S3D-004", name: "Lebanese Cedar Stand", name_ar: "Ø­Ø§Ù…Ù„ Ø§Ù„Ø£Ø±Ø² Ø§Ù„Ù„Ø¨Ù†Ø§Ù†ÙŠ", category: "Home Decor", country: "Lebanon", price: 39.99, cost: 11, stock: 0, status: "out_of_stock", featured: false, orders: 22, revenue: 879.78 },
  { id: 5, sku: "S3D-005", name: "Kufic Calligraphy Frame", name_ar: "Ø¥Ø·Ø§Ø± Ø§Ù„Ø®Ø· Ø§Ù„ÙƒÙˆÙÙŠ", category: "Art", country: "Pan-Arab", price: 64.99, cost: 18, stock: 7, status: "active", featured: true, orders: 18, revenue: 1169.82 },
];

const ORDERS_DATA = [
  { id: 1, orderNumber: "#3041", customer: "Layla Hadi", email: "layla.h@example.com", location: "Detroit, MI ðŸ‡ºðŸ‡¸", items: [{ name: "Damascus Name Plaque", qty: 1, price: 44.99 }], total: 52.98, status: "new", date: "5 min ago", customText: "Ø¹Ø§Ø¦Ù„Ø© Ø­Ø¯Ø§Ø¯", isCustom: false },
  { id: 2, orderNumber: "#3040", customer: "Omar Khouri", email: "omar.k@example.com", location: "Toronto, ON ðŸ‡¨ðŸ‡¦", items: [{ name: "Eid Mubarak Lantern", qty: 2, price: 34.99 }], total: 77.97, status: "in_production", date: "1 hour ago", isCustom: false },
  { id: 3, orderNumber: "#3039", customer: "Sarah Jaber", email: "sarah.j@example.com", location: "Dearborn, MI ðŸ‡ºðŸ‡¸", items: [{ name: "Custom Wedding Arch", qty: 1, price: 120.00 }], total: 128.99, status: "awaiting_approval", date: "3 hours ago", isCustom: true },
  { id: 4, orderNumber: "#3038", customer: "Yara Mansour", email: "yara.m@example.com", location: "London, UK ðŸ‡¬ðŸ‡§", items: [{ name: "Palestinian Olive Tree", qty: 1, price: 54.99 }], total: 67.98, status: "shipped", date: "Yesterday", trackingNumber: "1Z999AA1012345678", isCustom: false },
  { id: 5, orderNumber: "#3037", customer: "Maya Saadeh", email: "maya.s@example.com", location: "Sydney, AU ðŸ‡¦ðŸ‡º", items: [{ name: "Kufic Calligraphy Frame", qty: 1, price: 64.99 }], total: 79.98, status: "delivered", date: "2 days ago", isCustom: false },
];

const CUSTOMERS_DATA = [
  { id: 1, name: "Layla Hadi", email: "layla.h@example.com", phone: "+1 313 555-0142", heritage: "Syria", location: { city: "Detroit", state: "MI", country: "USA", flag: "ðŸ‡ºðŸ‡¸" }, orders: 5, customOrders: 3, ltv: 184.95, lastOrder: "5 min ago", tags: ["VIP", "Repeat buyer", "Custom orders"] },
  { id: 2, name: "Omar Khouri", email: "omar.k@example.com", phone: "+1 416 555-0198", heritage: "Lebanon", location: { city: "Toronto", state: "ON", country: "Canada", flag: "ðŸ‡¨ðŸ‡¦" }, orders: 3, customOrders: 0, ltv: 94.94, lastOrder: "1 hour ago", tags: ["Repeat buyer"] },
  { id: 3, name: "Yara Mansour", email: "yara.m@example.com", phone: "+44 20 7946 0958", heritage: "Palestine", location: { city: "London", state: "", country: "UK", flag: "ðŸ‡¬ðŸ‡§" }, orders: 2, customOrders: 0, ltv: 65.98, lastOrder: "3 hours ago", tags: ["Gift buyer"] },
  { id: 4, name: "Sarah Jaber", email: "sarah.j@example.com", phone: "+1 313 555-0167", heritage: "Syria", location: { city: "Dearborn", state: "MI", country: "USA", flag: "ðŸ‡ºðŸ‡¸" }, orders: 7, customOrders: 5, ltv: 312.50, lastOrder: "Yesterday", tags: ["VIP", "Custom orders"] },
  { id: 5, name: "Maya Saadeh", email: "maya.s@example.com", phone: "+61 2 9999 0000", heritage: "Lebanon", location: { city: "Sydney", state: "NSW", country: "Australia", flag: "ðŸ‡¦ðŸ‡º" }, orders: 1, customOrders: 0, ltv: 44.97, lastOrder: "2 days ago", tags: [] },
  { id: 6, name: "Karim Daher", email: "karim.d@example.com", phone: "+49 30 12345678", heritage: "Pan-Arab", location: { city: "Berlin", state: "", country: "Germany", flag: "ðŸ‡©ðŸ‡ª" }, orders: 1, customOrders: 0, ltv: 59.96, lastOrder: "3 days ago", tags: [] },
  { id: 7, name: "Nour Salem", email: "nour.s@example.com", phone: "+1 718 555-0123", heritage: "Palestine", location: { city: "Brooklyn", state: "NY", country: "USA", flag: "ðŸ‡ºðŸ‡¸" }, orders: 2, customOrders: 0, ltv: 38.98, lastOrder: "4 days ago", tags: ["Repeat buyer"] },
  { id: 8, name: "Rana Haddad", email: "rana.h@example.com", phone: "+1 514 555-0177", heritage: "Syria", location: { city: "Montreal", state: "QC", country: "Canada", flag: "ðŸ‡¨ðŸ‡¦" }, orders: 1, customOrders: 1, ltv: 39.99, lastOrder: "5 days ago", tags: ["Custom orders"] },
];

const CUSTOM_ORDERS_DATA = [
  { id: 1, customerId: 4, customerName: "Sarah Jaber", heritage: "Syria", flag: "ðŸ‡ºðŸ‡¸", arabicText: "Ø¹Ø§Ø¦Ù„Ø© Ø¬Ø§Ø¨Ø±", occasion: "Wedding", style: "Diwani", color: "Gold", deadline: "May 15", urgency: "urgent", stage: "mockup", messages: 4, snippet: "I need a custom wedding arch piece for my daughter..." },
  { id: 2, customerId: 1, customerName: "Layla Hadi", heritage: "Syria", flag: "ðŸ‡ºðŸ‡¸", arabicText: "Ø©Ø§Ø¦Ù„Ø© Ø­Ø¯Ø§Ø¯", occasion: "Graduation", style: "Modern", color: "White", deadline: "May 20", urgency: "soon", stage: "quote", messages: 2, snippet: "Congratulations plaque for my son graduating..." },
  { id: 3, customerId: 3, customerName: "Yara Mansour", heritage: "Palestine", flag: "ðŸ‡¬ðŸ‡§", arabicText: "Ù…Ø¨Ø±ÙˆÙƒ ÙŠØ§ Ø¯ÙƒØªÙˆØ±", occasion: "Graduation", style: "Classic", color: "Gold", deadline: "Jun 1", urgency: "ok", stage: "new", messages: 1, snippet: "Doctor graduation gift for my husband..." },
  { id: 4, customerId: 7, customerName: "Nour Salem", heritage: "Palestine", flag: "ðŸ‡ºðŸ‡¸", arabicText: "ÙŠØ§ ØµØ¨ÙŠ ÙŠØ§ Ø­Ù„Ùˆ", occasion: "Baby", style: "Diwani", color: "Blue", deadline: "Jun 15", urgency: "ok", stage: "approved", messages: 6, snippet: "New baby boy wall piece for nursery..." },
  { id: 5, customerId: 8, customerName: "Rana Haddad", heritage: "Syria", flag: "ðŸ‡¨ðŸ‡¦", arabicText: "Ø¹ÙŠØ¯ Ù…ÙŠÙ„Ø§Ø¯ Ø³Ø¹ÙŠØ¯", occasion: "Birthday", style: "Modern", color: "Mixed", deadline: "May 30", urgency: "ok", stage: "quote", messages: 3, snippet: "Birthday cake topper with arabic name..." },
];

const REVENUE_DATA = [
  { day: "Mon", revenue: 420 }, { day: "Tue", revenue: 380 }, { day: "Wed", revenue: 510 },
  { day: "Thu", revenue: 690 }, { day: "Fri", revenue: 820 }, { day: "Sat", revenue: 940 },
  { day: "Sun", revenue: 760 },
];

const HERITAGE_DATA = [
  { name: "Syria", value: 38, color: "#D4881F" },
  { name: "Lebanon", value: 24, color: "#B85C3C" },
  { name: "Palestine", value: 19, color: "#1E5C8C" },
  { name: "Pan-Arab", value: 12, color: "#5C6B3F" },
  { name: "Egypt", value: 7, color: "#E8B864" },
];

const DISCOUNTS_DATA = [
  { id: 1, code: "WELCOME10", name: "New Customer Welcome", type: "percent", value: 10, status: "active", usageCount: 47, usageLimit: 200, revenue: 2840, startsAt: "Jan 1", endsAt: "Dec 31", conditions: "First order only" },
  { id: 2, code: "EID2025", name: "Eid al-Adha Special", type: "percent", value: 20, status: "active", usageCount: 23, usageLimit: 100, revenue: 1920, startsAt: "Jun 5", endsAt: "Jun 12", conditions: "Min. $50 order" },
  { id: 3, code: "FREESHIP50", name: "Free Shipping Over $50", type: "free_shipping", value: 0, status: "active", usageCount: 89, usageLimit: null, revenue: 4210, startsAt: "Mar 1", endsAt: null, conditions: "$50+ subtotal" },
  { id: 4, code: "VIP25", name: "VIP Loyalty Reward", type: "percent", value: 25, status: "paused", usageCount: 12, usageLimit: 50, revenue: 890, startsAt: "Feb 14", endsAt: "Feb 28", conditions: "VIP customers only" },
  { id: 5, code: "RAMADAN15", name: "Ramadan Kareem", type: "percent", value: 15, status: "expired", usageCount: 61, usageLimit: 150, revenue: 3180, startsAt: "Mar 1", endsAt: "Mar 31", conditions: "All orders" },
];

const NAV_ITEMS = [
  { section: "SALES", items: [
    { id: "dashboard", label: "Dashboard", icon: "â¬›" },
    { id: "orders", label: "Orders", icon: "ðŸ“¦", badge: 3 },
    { id: "products", label: "Products", icon: "ðŸº" },
    { id: "customers", label: "Customers", icon: "ðŸ‘¥" },
    { id: "custom-orders", label: "Custom Orders", icon: "âœ¦", badge: 5 },
  ]},
  { section: "MARKETING", items: [
    { id: "discounts", label: "Discounts", icon: "ðŸŽŸ" },
    { id: "email", label: "Email & Marketing", icon: "ðŸ“§" },
  ]},
  { section: "INSIGHTS", items: [
    { id: "analytics", label: "Analytics", icon: "ðŸ“Š" },
  ]},
  { section: "ACCOUNT", items: [
    { id: "settings-general", label: "Settings", icon: "âš™ï¸" },
  ]},
];

const HERITAGE_COLORS = {
  Syria: "#D4881F", Lebanon: "#B85C3C", Palestine: "#1E5C8C",
  "Pan-Arab": "#5C6B3F", Egypt: "#E8B864",
};

// â”€â”€â”€ SHARED COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ LOGIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <div style={{ fontFamily: FONTS.arabic, fontSize: 18, color: COLORS.saffron, marginTop: 4 }}>Ø³ÙˆÙ‚ Ø«Ø±ÙŠ Ø¯ÙŠ</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, fontFamily: FONTS.body }}>Admin Dashboard Â· Nala's Studio</div>
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
          <button onClick={onLogin} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontFamily: FONTS.body }}>One-click demo access â†’</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Sidebar({ page, setPage }) {
  return (
    <div style={{ width: 220, background: COLORS.charcoal, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
      <div style={{ padding: "24px 20px 16px" }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: "#FFF" }}>Souk3D</div>
        <div style={{ fontFamily: FONTS.arabic, fontSize: 13, color: COLORS.saffron }}>Ø³ÙˆÙ‚ Ø«Ø±ÙŠ Ø¯ÙŠ</div>
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

// â”€â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€âflex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
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

// â”€â”€â”€ PRODUCTS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = PRODUCTS_DATA.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginRight: "auto" }}>Products</div>
          <PrimaryBtn>+ New Product</PrimaryBtn>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search productsâ€¦" style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, outline: "none" }} />
          {["all", "active", "out_of_stock", "draft"].map(s => (
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
                <td style={{ padding: "12px 8px", fontSize: 11, color: COLORS.textMuted }}>{p.sku}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{p.name}</div>
             flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
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

// â”€â”€â”€ PRODUCTS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = PRODUCTS_DATA.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginRight: "auto" }}>Products</div>
          <PrimaryBtn>+ New Product</PrimaryBtn>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search productsâ€¦" style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, outline: "none" }} />
          {["all", "active", "out_of_stock", "draft"].map(s => (
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
                <td style={{ padding: "12px 8px", fontSize: 11, color: COLORS.textMuted }}>{p.sku}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.charcoal }}>{p.name}</div>
                  <div style={{ fontSize: 11, fontFamily: FONTS.arabic, color: COLORS.textMuted }}>{p.name_ar}</div>
                </td>
                <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>${p.price}</td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: COLORS.textMuted }}>${p.cost}</td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: p.stock === 0 ? COLORS.terracotta : COLORS.charcoal, fontWeight: p.stock < 5 ? 600 : 400 }}>{p.stock === 0 ? "Out" : p.stock}</td>
                <td style={{ padding: "12px 8px", fontSize: 12, color: COLORS.charcoal }}>{p.orders}</td>
                <td style={{ padding: "12px 8px" }}><Badge status={p.status} /></td>
                <td style={{ padding: "12px 8px" }}><GhostBtn style={{ padding: "4px 10px", fontSize: 10 }}>Edit</GhostBtn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(580px, 92vw)", background: COLORS.cream, zIndex: 101, boxShadow: "-20px 0 60px rgba(0,0,0,0.3)", animation: "slideIn 0.3s ease", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal }}>{selected.name}</div>
                <div style={{ fontFamily: FONTS.arabic, fontSize: 16, color: COLORS.saffron }}>{selected.name_ar}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>âœ•</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <StatCard label="PRICE" value={`$${selected.price}`} />
              <StatCard label="STOCK" value={selected.stock} />
              <StatCard label="ORDERS" value={selected.orders} />
              <StatCard label="REVENUE" value={`$${selected.revenue?.toFixed(0) || 0}`} />
            </div>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12, letterSpacing: 0.5 }}>DETAILS</div>
              {[["SKU", selected.sku], ["Category", selected.category], ["Country", selected.country], ["Cost", `$${selected.cost}`], ["Status", selected.status]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${COLORS.wheat}`, fontSize: 12, fontFamily: FONTS.body }}>
                  <span style={{ color: COLORS.textMuted }}>{k}</span>
                  <span style={{ color: COLORS.charcoal, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </SectionCard>
            <div style={{ display: "flex", gap: 8 }}>
              <PrimaryBtn style={{ flex: 1 }}>Edit Product</PrimaryBtn>
              <GhostBtn style={{ flex: 1 }}>Duplicate</GhostBtn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€â”€ ORDERS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ORDER_STAGES = [
  { id: "new", label: "New", color: "#3B5BB5" },
  { id: "awaiting_approval", label: "Awaiting Approval", color: COLORS.terracotta },
  { id: "in_production", label: "In Production", color: COLORS.saffron },
  { id: "shipped", label: "Shipped", color: COLORS.damascene },
  { id: "delivered", label: "Delivered", color: COLORS.olive },
];

function OrdersPage() {
  const [view, setView] = useState("kanban");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState(ORDERS_DATA);

  const moveOrder = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const getByStatus = (status) => orders.filter(o => o.status === status);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, flex: 1 }}>Orders</div>
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
                <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>{selectedOrder.customer} Â· {selectedOrder.date}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>âœ•</button>
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
                  <span>{item.name} Ã— {item.qty}</span>
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
              <PrimaryBtn style={{ flex: 1 }}>Print Label</PrimaryBtn>
              <GhostBtn style={{ flex: 1 }}>Email Customer</GhostBtn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€â”€ CUSTOMERS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CustomersPage() {
  const [search, setSearch] = useState("");
  const [heritageFilter, setHeritageFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState("");

  const filtered = CUSTOMERS_DATA.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchHeritage = heritageFilter === "all" || c.heritage === heritageFilter;
    const matchTag = tagFilter === "all" || c.tags.includes(tagFilter);
    return matchSearch && matchHeritage && matchTag;
  });

  const totalLTV = CUSTOMERS_DATA.reduce((s, c) => s + c.ltv, 0);
  const avgLTV = totalLTV / CUSTOMERS_DATA.length;
  const vipCount = CUSTOMERS_DATA.filter(c => c.tags.includes("VIP")).length;
  const repeatCount = CUSTOMERS_DATA.filter(c => c.tags.includes("Repeat buyer")).length;
  const topHeritage = Object.entries(CUSTOMERS_DATA.reduce((acc, c) => { acc[c.heritage] = (acc[c.heritage] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0];

  const TAG_COLORS = { "VIP": COLORS.saffron, "Repeat buyer": COLORS.damascene, "Custom orders": COLORS.olive, "Gift buyer": COLORS.terracotta, "Refunded": "#888", "Inactive": "#aaa" };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, flex: 1 }}>Customers</div>
          <PrimaryBtn>Export CSV</PrimaryBtn>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customersâ€¦" style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, outline: "none" }} />
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
        <StatCard label="TOTAL CUSTOMERS" value={CUSTOMERS_DATA.length} />
        <StatCard label="REPEAT BUYERS" value={repeatCount} sub={`${Math.round(repeatCount/CUSTOMERS_DATA.length*100)}% of total`} />
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
                  <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.body }}>{selected.location.flag} {selected.location.city}, {selected.location.country} Â· {selected.heritage}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>âœ•</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <StatCard label="ORDERS" value={selected.orders} />
              <StatCard label="CUSTOM" value={selected.customOrders} />
              <StatCard label="LTV" value={`$${selected.ltv.toFixed(2)}`} dark />
              <StatCard label="LAST ORDER" value={selected.lastOrder} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[["âœ‰ Email", COLORS.damascene], ["ðŸ’¬ WhatsApp", COLORS.olive], ["ðŸŽŸ Discount", COLORS.saffron]].map(([label, color]) => (
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
                  <span key={t} style={{ fontSize: 10, background: (TAG_COLORS[t] || "#888") + "22", color: TAG_COLORS[t] || "#888", padding: "4px 10px", borderRadius: 10, fontWeight: 600, fontFamily: FONTS.body }}>{t} Ã—</span>
                ))}
              </div>
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10 }}>ORDER HISTORY</div>
              {ORDERS_DATA.filter(o => o.customer === selected.name).map(o => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.damascene, fontFamily: FONTS.body }}>{o.orderNumber}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>{o.items[0].name} Â· {o.date}</div>
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
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a private note about this customerâ€¦" style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              <PrimaryBtn style={{ marginTop: 8 }}>Save Note</PrimaryBtn>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€â”€ CUSTOM ORDERS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CUSTOM_STAGE_INFO = {
  new:      { label: "New",        color: "#3B5BB5", bg: "#EEF4FF" },
  quote:    { label: "Quote Sent", color: COLORS.saffron, bg: "#FFF7E6" },
  mockup:   { label: "Mockup",     color: COLORS.terracotta, bg: "#FFF0ED" },
  approved: { label: "Approved",   color: COLORS.olive, bg: "#EDFBF0" },
  production:{ label: "Production",color: COLORS.damascene, bg: "#E6F4FF" },
};
const URGENCY_INFO = {
  urgent: { label: "ðŸ”´ Urgent", color: COLORS.terracotta },
  soon:   { label: "ðŸŸ¡ Soon",   color: COLORS.saffron },
  ok:     { label: "ðŸŸ¢ OK",     color: COLORS.olive },
};
const MOCK_MESSAGES = {
  1: [
    { from: "customer", text: "Hi! I need a custom wedding arch piece for my daughter's wedding on May 15. Arabic name Ø¹Ø§Ø¦Ù„Ø© Ø¬Ø§Ø¨Ø± in Diwani calligraphy, gold color, about 12 inches wide.", time: "2 days ago" },
    { from: "owner",    text: "What a beautiful occasion! I can definitely do that. Let me put together a quote for you. The Diwani style in gold will be stunning ðŸŒŸ", time: "2 days ago" },
    { from: "customer", text: "Thank you so much! Also wondering if you can add a small olive branch motif on the sides?", time: "1 day ago" },
    { from: "owner",    text: "Absolutely â€” I've attached a mockup with the olive branches. Let me know what you think!", time: "5 hours ago" },
  ],
  2: [
    { from: "customer", text: "Congratulations plaque for my son graduating from U of M. Ø¹Ø§Ø¦Ù„Ø© Ø­Ø¯Ø§Ø¯ in modern style, white.", time: "3 days ago" },
    { from: "owner",    text: "Mabrook to your son! Here's a quote: base plaque $45 + custom Arabic text $20 = $65. Rush fee waived since we have 10 days.", time: "2 days ago" },
  ],
};

function CustomOrdersPage() {
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(CUSTOM_ORDERS_DATA[0]);
  const [replyText, setReplyText] = useState("");

  const filtered = CUSTOM_ORDERS_DATA.filter(o =>
    stageFilter === "all" || o.stage === stageFilter
  );

  const messages = MOCK_MESSAGES[selectedOrder?.id] || [];

  const STAGES_ORDERED = ["new", "quote", "mockup", "approved", "production"];

  return (
    <div style={{ animation: "fadeIn 0.3s ease", display: "flex", height: "calc(100vh - 48px)", margin: "-24px -32px", overflow: "hidden" }}>

      {/* Filter Rail */}
      <div style={{ width: 168, background: COLORS.cream2, borderRight: `0.5px solid ${COLORS.wheat}`, padding: "20px 12px", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: COLORS.textMuted, marginBottom: 10, fontFamily: FONTS.body }}>STATUS</div>
        {[["all", "All Requests"], ["urgent", "ðŸ”´ Urgent"], ["soon", "ðŸŸ¡ Needs Reply"]].map(([v, l]) => (
          <div key={v} onClick={() => setStageFilter(v)} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, cursor: "pointer", marginBottom: 3, background: stageFilter === v ? COLORS.saffron + "22" : "transparent", color: stageFilter === v ? COLORS.saffron : COLORS.inkBrown, fontWeight: stageFilter === v ? 600 : 400 }}>{l}</div>
        ))}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: COLORS.textMuted, margin: "16px 0 10px", fontFamily: FONTS.body }}>PIPELINE</div>
        {Object.entries(CUSTOM_STAGE_INFO).map(([k, s]) => (
          <div key={k} onClick={() => setStageFilter(k)} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, cursor: "pointer", marginBottom: 3, background: stageFilter === k ? s.color + "22" : "transparent", color: stageFilter === k ? s.color : COLORS.inkBrown, fontWeight: stageFilter === k ? 600 : 400 }}>{s.label}</div>
        ))}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: COLORS.textMuted, margin: "16px 0 10px", fontFamily: FONTS.body }}>OCCASION</div>
        {["Wedding", "Graduation", "Baby", "Birthday", "Eid"].map(o => (
          <div key={o} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, fontFamily: FONTS.body, cursor: "pointer", marginBottom: 2, color: COLORS.inkBrown }}>{o}</div>
        ))}
      </div>

      {/* Request List */}
      <div style={{ width: 260, borderRight: `0.5px solid ${COLORS.wheat}`, overflowY: "auto", flexShrink: 0, background: "#FDFAF4" }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal, fontFamily: FONTS.body }}>Custom Orders</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body }}>{filtered.length} requests</div>
        </div>
        {filtered.map(order => {
          const stage = CUSTOM_STAGE_INFO[order.stage];
          const urgency = URGENCY_INFO[order.urgency];
          const isSelected = selectedOrder?.id === order.id;
          return (
            <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ padding: "14px", borderBottom: `0.5px solid ${COLORS.wheat}`, cursor: "pointer", background: isSelected ? COLORS.saffron + "12" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body }}>{order.customerName}</span>
                <span style={{ fontSize: 10, color: urgency.color, fontFamily: FONTS.body }}>{urgency.label}</span>
              </div>
              <div style={{ fontFamily: FONTS.arabic, fontSize: 16, color: COLORS.saffron, direction: "rtl", textAlign: "right", marginBottom: 4 }}>{order.arabicText}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body, marginBottom: 6, lineHeight: 1.4 }}>{order.snippet?.slice(0, 60)}â€¦</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, background: stage.bg, color: stage.color, padding: "2px 7px", borderRadius: 8, fontWeight: 600 }}>{stage.label}</span>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>ðŸ“… {order.deadline}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversation View */}
      {selectedOrder ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Customer Header */}
          <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${COLORS.wheat}`, background: "#FFF", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <HeritageAvatar name={selectedOrder.customerName} heritage={selectedOrder.heritage} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, color: COLORS.charcoal }}>{selectedOrder.customerName}</div>
                {CUSTOMERS_DATA.find(c => c.id === selectedOrder.customerId)?.tags.includes("VIP") && (
                  <span style={{ fontSize: 9, background: COLORS.saffron, color: "#FFF", padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>VIP</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body }}>{selectedOrder.flag} {selectedOrder.heritage} Â· {CUSTOMERS_DATA.find(c => c.id === selectedOrder.customerId)?.email}</div>
            </div>
            {/* Pipeline progress */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {STAGES_ORDERED.map((s, i) => {
                const idx = STAGES_ORDERED.indexOf(selectedOrder.stage);
                const active = i <= idx;
                const info = CUSTOM_STAGE_INFO[s];
                return (
                  <React.Fragment key={s}>
                    <div style={{ fontSize: 10, fontFamily: FONTS.body, color: active ? info.color : COLORS.textMuted, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{info.label}</div>
                    {i < STAGES_ORDERED.length - 1 && <div style={{ width: 20, height: 1, background: active && i < idx ? info.color : COLORS.wheat }} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {/* Request Card */}
            <div style={{ background: COLORS.charcoal, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: COLORS.wheat, marginBottom: 10 }}>ORIGINAL REQUEST</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                {[["Occasion", selectedOrder.occasion], ["Style", selectedOrder.style], ["Color", selectedOrder.color], ["Deadline", selectedOrder.deadline]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: FONTS.body }}>{k}</div>
                    <div style={{ fontSize: 12, color: "#FFF", fontFamily: FONTS.body, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: FONTS.arabic, fontSize: 36, color: COLORS.saffron, direction: "rtl", textAlign: "right" }}>{selectedOrder.arabicText}</div>
            </div>

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.from === "owner" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "70%", background: msg.from === "owner" ? COLORS.saffron + "18" : "#FFF", border: `0.5px solid ${msg.from === "owner" ? COLORS.saffron + "44" : COLORS.wheat}`, borderRadius: 12, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: COLORS.charcoal, fontFamily: FONTS.body, lineHeight: 1.5 }}>{msg.text}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, fontFamily: FONTS.body }}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          <div style={{ padding: "12px 20px", borderTop: `0.5px solid ${COLORS.wheat}`, background: "#FFF", flexShrink: 0 }}>
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a replyâ€¦" style={{ width: "100%", minHeight: 72, padding: "10px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["ðŸ“Ž Attach", "ðŸ–¼ Mockup", "ðŸ“‹ Template", "ðŸŒ Translate"].map(t => (
                  <GhostBtn key={t} style={{ padding: "5px 10px", fontSize: 10 }}>{t}</GhostBtn>
                ))}
              </div>
              <PrimaryBtn style={{ padding: "8px 20px" }}>Send Reply</PrimaryBtn>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontFamily: FONTS.body }}>Select a request to view</div>
      )}
    </div>
  );
}

// â”€â”€â”€ ANALYTICS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ANALYTICS_TREND = [
  { date: "May 1", revenue: 310, orders: 5 }, { date: "May 3", revenue: 480, orders: 8 },
  { date: "May 5", revenue: 390, orders: 6 }, { date: "May 7", revenue: 620, orders: 10 },
  { date: "May 9", revenue: 540, orders: 9 }, { date: "May 11", revenue: 780, orders: 13 },
  { date: "May 13", revenue: 920, orders: 15 },
];
const COUNTRY_DATA = [
  { country: "ðŸ‡ºðŸ‡¸ USA", orders: 47, pct: 58 }, { country: "ðŸ‡¨ðŸ‡¦ Canada", orders: 18, pct: 22 },
  { country: "ðŸ‡¬ðŸ‡§ UK", orders: 9, pct: 11 }, { country: "ðŸ‡¦ðŸ‡º Australia", orders: 4, pct: 5 },
  { country: "ðŸ‡©ðŸ‡ª Germany", orders: 3, pct: 4 },
];
const TRAFFIC_DATA = [
  { source: "Instagram", visits: 1240, pct: 44 }, { source: "Direct", visits: 680, pct: 24 },
  { source: "Etsy", visits: 420, pct: 15 }, { source: "TikTok", visits: 310, pct: 11 },
  { source: "Other", visits: 170, pct: 6 },
];

function AnalyticsPage() {
  const [range, setRange] = useState("7d");

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, flex: 1 }}>Analytics</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["Today", "7d", "30d", "90d", "Year"].map(r => (
              <FilterPill key={r} label={r} active={range === r} onClick={() => setRange(r)} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 14 }} />

      {/* Big 4 KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 200, background: COLORS.charcoal, borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontSize: 10, color: COLORS.wheat, letterSpacing: 0.8, fontFamily: FONTS.body, marginBottom: 4 }}>TOTAL REVENUE</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 36, fontWeight: 700, color: "#FFF" }}>$4,520</div>
          <div style={{ fontSize: 11, color: COLORS.saffronLight }}>â†‘ 23% vs previous {range}</div>
          <div style={{ marginTop: 10, height: 50 }}>
            <ResponsiveContainer width="100%" height={50}>
              <AreaChart data={ANALYTICS_TREND}>
                <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.saffron} stopOpacity={0.5}/><stop offset="95%" stopColor={COLORS.saffron} stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="revenue" stroke={COLORS.saffronLight} strokeWidth={1.5} fill="url(#spark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <StatCard label="ORDERS" value="81" sub="â†‘ 12 vs prev period" />
        <StatCard label="AVG ORDER VALUE" value="$55.80" sub="â†‘ $4.20 this period" />
        <StatCard label="NEW CUSTOMERS" value="24" sub="â†‘ 6 vs prev period" />
      </div>

      {/* Revenue Trend */}
      <SectionCard style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 14 }}>Revenue Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={ANALYTICS_TREND}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.saffron} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={COLORS.saffron} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: FONTS.body, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fontFamily: FONTS.body, fill: COLORS.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={v => [`$${v}`, "Revenue"]} contentStyle={{ fontFamily: FONTS.body, fontSize: 11, borderRadius: 8, border: `0.5px solid ${COLORS.wheat}` }} />
            <Area type="monotone" dataKey="revenue" stroke={COLORS.saffron} strokeWidth={2.5} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* 3-column row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        {/* Heritage donut */}
        <SectionCard style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 12 }}>Sales by Heritage</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={HERITAGE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                {HERITAGE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontFamily: FONTS.body, fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          {HERITAGE_DATA.map(h => (
            <div key={h.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: FONTS.body, marginTop: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: h.color, display: "inline-block" }}/>{h.name}</span>
              <span style={{ fontWeight: 600, color: COLORS.charcoal }}>{h.value}%</span>
            </div>
          ))}
        </SectionCard>

        {/* Top countries */}
        <SectionCard style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 12 }}>Top Countries</div>
          {COUNTRY_DATA.map(c => (
            <div key={c.country} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: FONTS.body, marginBottom: 3 }}>
                <span>{c.country}</span><span style={{ fontWeight: 600, color: COLORS.charcoal }}>{c.orders} orders</span>
              </div>
              <div style={{ height: 4, background: COLORS.cream2, borderRadius: 4 }}>
                <div style={{ height: 4, width: `${c.pct}%`, background: COLORS.saffron, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Traffic sources */}
        <SectionCard style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 12 }}>Traffic Sources</div>
          {TRAFFIC_DATA.map(t => (
            <div key={t.source} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `0.5px solid ${COLORS.wheat}`, fontSize: 11, fontFamily: FONTS.body }}>
              <span>{t.source}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600, color: COLORS.charcoal }}>{t.visits.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted }}>{t.pct}%</div>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Best sellers + Smart alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <SectionCard style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 12 }}>Best Sellers</div>
          {PRODUCTS_DATA.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.saffron + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.saffron }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.charcoal, fontFamily: FONTS.body }}>{p.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>{p.orders} orders</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>${p.revenue.toFixed(0)}</div>
            </div>
          ))}
        </SectionCard>
        <SectionCard style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 12 }}>Smart Alerts</div>
          {[
            { type: "warn", msg: "Lebanese Cedar Stand has been out of stock for 7 days â€” restock soon" },
            { type: "good", msg: "Revenue up 23% this week â€” your best 7-day streak this month!" },
            { type: "info", msg: "5 custom order requests waiting â€” oldest is 3 days old" },
            { type: "warn", msg: "Kufic Calligraphy Frame low stock (7 units) â€” consider restocking" },
          ].map((a, i) => {
            const c = a.type === "warn" ? COLORS.terracotta : a.type === "good" ? COLORS.olive : COLORS.damascene;
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: c + "14", borderLeft: `3px solid ${c}`, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: COLORS.charcoal, fontFamily: FONTS.body }}>{a.msg}</div>
              </div>
            );
          })}
        </SectionCard>
      </div>
    </div>
  );
}

// â”€â”€â”€ DISCOUNTS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DiscountsPage() {
  const [tab, setTab] = useState("codes");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newCode, setNewCode] = useState({ code: "", name: "", type: "percent", value: "", minOrder: "", limit: "" });

  const filtered = DISCOUNTS_DATA.filter(d => statusFilter === "all" || d.status === statusFilter);
  const totalUsed = DISCOUNTS_DATA.reduce((s, d) => s + d.usageCount, 0);
  const totalRevenue = DISCOUNTS_DATA.reduce((s, d) => s + d.revenue, 0);
  const topCode = DISCOUNTS_DATA.reduce((a, b) => a.revenue > b.revenue ? a : b);

  const TEMPLATES = [
    { group: "Diaspora Calendar", items: [{ code: "RAMADAN20", label: "Ramadan Kareem 20%" }, { code: "EID15", label: "Eid Mubarak 15%" }, { code: "NAKBA74", label: "Nakba Day Solidarity" }] },
    { group: "Universal", items: [{ code: "WELCOME10", label: "New Customer 10%" }, { code: "WINBACK20", label: "Win-Back 20%" }, { code: "VIP25", label: "VIP Loyalty 25%" }] },
    { group: "Seasonal", items: [{ code: "WEDDING15", label: "Wedding Season 15%" }, { code: "GRAD10", label: "Graduation 10%" }] },
    { group: "Sales", items: [{ code: "BFCM30", label: "Black Friday 30%" }, { code: "HOLIDAY15", label: "Holiday 15%" }] },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, flex: 1 }}>Discounts</div>
          <GhostBtn onClick={() => setShowTemplates(true)}>ðŸ“‹ Templates</GhostBtn>
          <PrimaryBtn onClick={() => setShowCreate(true)}>+ Create Code</PrimaryBtn>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["codes", "ðŸŽŸ Promo Codes"], ["sales", "ðŸ”¥ Auto Sales"], ["bundles", "ðŸ“¦ Bundles"]].map(([v, l]) => (
            <FilterPill key={v} label={l} active={tab === v} onClick={() => setTab(v)} />
          ))}
          <div style={{ flex: 1 }} />
          {["all", "active", "scheduled", "paused", "expired"].map(s => (
            <FilterPill key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
      </div>
      <div style={{ height: 14 }} />

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="CODES USED" value={totalUsed} sub="all time" />
        <StatCard label="TOP CODE" value={topCode.code} sub={`$${topCode.revenue.toFixed(0)} revenue`} dark />
        <StatCard label="DISCOUNTED REVENUE" value={`$${totalRevenue.toLocaleString()}`} />
        <StatCard label="ACTIVE CAMPAIGNS" value={DISCOUNTS_DATA.filter(d => d.status === "active").length} />
      </div>

      {/* Live campaigns banner */}
      {DISCOUNTS_DATA.filter(d => d.status === "active").length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {DISCOUNTS_DATA.filter(d => d.status === "active").slice(0, 2).map(d => (
            <div key={d.id} style={{ flex: 1, background: COLORS.charcoal, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, color: COLORS.saffronLight, letterSpacing: 1, marginBottom: 4, fontFamily: FONTS.body }}>ACTIVE CAMPAIGN</div>
                <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 700, color: COLORS.saffron }}>{d.code}</div>
                <div style={{ fontSize: 11, color: COLORS.wheat, marginTop: 2, fontFamily: FONTS.body }}>{d.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#FFF", fontFamily: FONTS.body }}>{d.type === "percent" ? `${d.value}%` : d.type === "free_shipping" ? "Free Ship" : `$${d.value}`}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.body }}>{d.usageCount} uses Â· ${d.revenue} rev</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "codes" && (
        <SectionCard>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${COLORS.wheat}` }}>
                {["Code", "Discount", "Conditions", "Status", "Usage", "Revenue", "Period", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: 0.5, padding: "0 8px 10px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ borderBottom: `0.5px solid ${COLORS.wheat}` }}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: COLORS.damascene, background: COLORS.damascene + "14", padding: "3px 8px", borderRadius: 6, display: "inline-block" }}>{d.code}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{d.name}</div>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 14, fontWeight: 700, color: COLORS.charcoal }}>
                    {d.type === "percent" ? `${d.value}%` : d.type === "free_shipping" ? "Free Shipping" : `$${d.value} off`}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 11, color: COLORS.textMuted }}>{d.conditions}</td>
                  <td style={{ padding: "12px 8px" }}><Badge status={d.status} /></td>
                  <td style={{ padding: "12px 8px", minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: COLORS.charcoal, marginBottom: 4 }}>{d.usageCount}{d.usageLimit ? `/${d.usageLimit}` : ""}</div>
                    {d.usageLimit && (
                      <div style={{ height: 4, background: COLORS.cream2, borderRadius: 4 }}>
                        <div style={{ height: 4, width: `${Math.min(100, d.usageCount / d.usageLimit * 100)}%`, background: COLORS.saffron, borderRadius: 4 }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>${d.revenue.toLocaleString()}</td>
                  <td style={{ padding: "12px 8px", fontSize: 10, color: COLORS.textMuted }}>{d.startsAt}{d.endsAt ? ` â€“ ${d.endsAt}` : " Â· Ongoing"}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <GhostBtn style={{ padding: "4px 8px", fontSize: 10 }}>Edit</GhostBtn>
                      <GhostBtn style={{ padding: "4px 8px", fontSize: 10 }}>â‹¯</GhostBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
      {tab !== "codes" && (
        <SectionCard>
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13 }}>
            {tab === "sales" ? "ðŸ”¥ Set up automatic sales â€” coming soon" : "ðŸ“¦ Bundle deals â€” coming soon"}
          </div>
        </SectionCard>
      )}

      {/* Templates slide-in */}
      {showTemplates && (
        <>
          <div onClick={() => setShowTemplates(false)} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 92vw)", background: COLORS.cream, zIndex: 101, boxShadow: "-20px 0 60px rgba(0,0,0,0.3)", animation: "slideIn 0.3s ease", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal }}>Discount Templates</div>
              <button onClick={() => setShowTemplates(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>âœ•</button>
            </div>
            {TEMPLATES.map(group => (
              <div key={group.group} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 10, fontFamily: FONTS.body }}>{group.group.toUpperCase()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {group.items.map(item => (
                    <div key={item.code} onClick={() => { setNewCode(n => ({ ...n, code: item.code })); setShowTemplates(false); setShowCreate(true); }} style={{ background: "#FFF", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, padding: "12px 14px", cursor: "pointer" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: COLORS.damascene }}>{item.code}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontFamily: FONTS.body }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create code slide-in */}
      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(42,31,24,0.5)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 92vw)", background: COLORS.cream, zIndex: 101, boxShadow: "-20px 0 60px rgba(0,0,0,0.3)", animation: "slideIn 0.3s ease", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal }}>Create Discount Code</div>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted }}>âœ•</button>
            </div>
            {[["Discount Code", "code", "WELCOME10"], ["Campaign Name", "name", "New Customer Welcome"]].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, fontFamily: FONTS.body }}>{label.toUpperCase()}</div>
                <input value={newCode[key]} onChange={e => setNewCode(n => ({ ...n, [key]: e.target.value }))} placeholder={ph} style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: key === "code" ? "monospace" : FONTS.body, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, fontFamily: FONTS.body }}>DISCOUNT TYPE</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["percent", "% Off"], ["fixed", "$ Fixed"], ["free_shipping", "Free Shipping"]].map(([v, l]) => (
                  <button key={v} onClick={() => setNewCode(n => ({ ...n, type: v }))} style={{ flex: 1, padding: "9px 8px", border: `0.5px solid ${newCode.type === v ? COLORS.saffron : COLORS.wheat}`, borderRadius: 8, background: newCode.type === v ? COLORS.saffron + "18" : "#FFF", color: newCode.type === v ? COLORS.saffron : COLORS.charcoal, fontSize: 12, fontFamily: FONTS.body, cursor: "pointer", fontWeight: newCode.type === v ? 600 : 400 }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, fontFamily: FONTS.body }}>{newCode.type === "percent" ? "PERCENT OFF" : "AMOUNT OFF"}</div>
                <input value={newCode.value} onChange={e => setNewCode(n => ({ ...n, value: e.target.value }))} placeholder={newCode.type === "percent" ? "10" : "5.00"} style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, fontFamily: FONTS.body }}>MIN ORDER ($)</div>
                <input value={newCode.minOrder} onChange={e => setNewCode(n => ({ ...n, minOrder: e.target.value }))} placeholder="0" style={{ width: "100%", padding: "10px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <PrimaryBtn style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Create Code</PrimaryBtn>
              <GhostBtn style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</GhostBtn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€â”€ EMAIL & MARKETING PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CAMPAIGNS_DATA = [
  { id: 1, name: "Eid al-Adha Collection Drop", status: "sent", date: "Jun 5", opens: 68, clicks: 31, revenue: 840 },
  { id: 2, name: "New Customer Welcome Series", status: "active", date: "Ongoing", opens: 74, clicks: 42, revenue: 1240 },
  { id: 3, name: "Ramadan Win-Back Flow", status: "sent", date: "Mar 15", opens: 41, clicks: 18, revenue: 390 },
  { id: 4, name: "Wedding Season Lookbook", status: "draft", date: "Scheduled Jun 20", opens: 0, clicks: 0, revenue: 0 },
];
const AUTOMATIONS = [
  { icon: "âœ…", name: "Order Confirmation", trigger: "Immediately after purchase", active: true, sent: 81, openRate: 94 },
  { icon: "ðŸšš", name: "Shipping Update", trigger: "When tracking added", active: true, sent: 67, openRate: 89 },
  { icon: "ðŸ‘‹", name: "Welcome Series", trigger: "On signup (3 emails, 7 days)", active: true, sent: 24, openRate: 71 },
  { icon: "ðŸ›’", name: "Abandoned Cart", trigger: "1 hour after cart abandoned", active: false, sent: 12, openRate: 38 },
  { icon: "âœ¦", name: "Custom Order Milestones", trigger: "Quote sent / Mockup ready / Approved", active: true, sent: 19, openRate: 86 },
  { icon: "ðŸ’Œ", name: "Win-Back", trigger: "90 days since last order", active: false, sent: 8, openRate: 29 },
];

function EmailMarketingPage() {
  const [tab, setTab] = useState("campaigns");
  const [automations, setAutomations] = useState(AUTOMATIONS);

  const toggleAuto = (idx) => setAutomations(prev => prev.map((a, i) => i === idx ? { ...a, active: !a.active } : a));

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ position: "sticky", top: -24, zIndex: 10, background: COLORS.cream, margin: "-24px -32px 0", padding: "24px 32px 14px", borderBottom: `0.5px solid ${COLORS.wheat}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, flex: 1 }}>Email & Marketing</div>
          <PrimaryBtn>+ New Campaign</PrimaryBtn>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["campaigns", "ðŸ“§ Campaigns"], ["automations", "âš¡ Automations"], ["subscribers", "ðŸ‘¥ Subscribers"], ["templates", "ðŸ“‹ Templates"]].map(([v, l]) => (
            <FilterPill key={v} label={l} active={tab === v} onClick={() => setTab(v)} />
          ))}
        </div>
      </div>
      <div style={{ height: 14 }} />

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="SUBSCRIBERS" value="284" sub="â†‘ 12 this month" />
        <StatCard label="AVG OPEN RATE" value="68%" sub="Industry avg 38%" dark />
        <StatCard label="AVG CLICK RATE" value="31%" sub="â†‘ 4% this month" />
        <StatCard label="REVENUE FROM EMAIL" value="$2,470" sub="this month" />
      </div>

      {tab === "campaigns" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div>
            {CAMPAIGNS_DATA.map(c => {
              const statusIcon = c.status === "sent" ? "âœ“" : c.status === "active" ? "â—" : "â—‹";
              const statusColor = c.status === "sent" ? COLORS.olive : c.status === "active" ? COLORS.saffron : COLORS.textMuted;
              return (
                <SectionCard key={c.id} style={{ marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ fontSize: 16, color: statusColor, marginTop: 1 }}>{statusIcon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 2 }}>{c.date}</div>
                    </div>
                    {c.status === "sent" && (
                      <div style={{ display: "flex", gap: 16, textAlign: "right" }}>
                        <div><div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>{c.opens}%</div><div style={{ fontSize: 9, color: COLORS.textMuted }}>Opens</div></div>
                        <div><div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>{c.clicks}%</div><div style={{ fontSize: 9, color: COLORS.textMuted }}>Clicks</div></div>
                        <div><div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>${c.revenue}</div><div style={{ fontSize: 9, color: COLORS.textMuted }}>Revenue</div></div>
                      </div>
                    )}
                    {c.status !== "sent" && <Badge status={c.status === "active" ? "active" : "scheduled"} />}
                  </div>
                </SectionCard>
              );
            })}
          </div>
          <div>
            <SectionCard style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body, marginBottom: 12 }}>Subscriber Health</div>
              <div style={{ fontFamily: FONTS.display, fontSize: 36, fontWeight: 700, color: COLORS.charcoal }}>284</div>
              <div style={{ fontSize: 11, color: COLORS.olive, marginBottom: 12 }}>â†‘ 12 subscribers this month</div>
              {[["VIP", 18, COLORS.saffron], ["Repeat buyers", 42, COLORS.damascene], ["Newsletter only", 184, COLORS.olive], ["Inactive 90d", 40, COLORS.terracotta]].map(([seg, n, c]) => (
                <div key={seg} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `0.5px solid ${COLORS.wheat}`, fontSize: 12, fontFamily: FONTS.body }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }}/>{seg}</span>
                  <span style={{ fontWeight: 600, color: COLORS.charcoal }}>{n}</span>
                </div>
              ))}
            </SectionCard>
            <div style={{ background: COLORS.saffron + "18", border: `0.5px solid ${COLORS.saffron}44`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.saffron, letterSpacing: 0.8, marginBottom: 10, fontFamily: FONTS.body }}>âœ¦ SMART SUGGESTIONS</div>
              {["40 inactive subscribers â€” send a win-back?", "3 customers have birthdays this month", "Eid al-Adha in 3 weeks â€” start a campaign now", "5 new VIPs this month â€” send a thank you"].map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: COLORS.charcoal, fontFamily: FONTS.body, padding: "6px 0", borderBottom: i < 3 ? `0.5px solid ${COLORS.saffron}22` : "none" }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "automations" && (
        <div>
          {automations.map((a, idx) => (
            <SectionCard key={idx} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 22 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.body, marginTop: 2 }}>{a.trigger}</div>
                </div>
                {a.sent > 0 && (
                  <div style={{ display: "flex", gap: 16, textAlign: "right", marginRight: 12 }}>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>{a.sent}</div><div style={{ fontSize: 9, color: COLORS.textMuted }}>Sent</div></div>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal }}>{a.openRate}%</div><div style={{ fontSize: 9, color: COLORS.textMuted }}>Opens</div></div>
                  </div>
                )}
                {/* Toggle */}
                <div onClick={() => toggleAuto(idx)} style={{ width: 42, height: 24, borderRadius: 12, background: a.active ? COLORS.saffron : COLORS.wheat, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: a.active ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#FFF", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === "subscribers" && (
        <SectionCard>
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13 }}>Subscriber management â€” coming soon. Import/export CSV, segment builder, and more.</div>
        </SectionCard>
      )}

      {tab === "templates" && (
        <SectionCard>
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13 }}>Email template library â€” coming soon. Arabic-friendly layouts, seasonal designs, and brand assets.</div>
        </SectionCard>
      )}
    </div>
  );
}

// â”€â”€â”€ SETTINGS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SettingsPage({ section: initSection, onNavigate }) {
  const [section, setSection] = useState(initSection || "general");
  const [settings, setSettings] = useState({
    storeName: "Souk3D", tagline: "Handmade 3D-Printed Arab Gifts", description: "Authentic gifts for the Arab diaspora, handcrafted by Nala in Detroit, MI.",
    email: "nala@souk3d.com", phone: "+1 313 555-0100",
    instagram: "@souk3d", tiktok: "@souk3d", pinterest: "@souk3d", etsy: "Souk3D",
    currency: "USD", language: "en",
    guestCheckout: true, heritageFilters: true, customOrdersEnabled: true, maintenanceMode: false,
    stripeConnected: false, stripeMode: "test",
    processingDays: "3-5",
    freeShippingThreshold: 75,
  });
  const update = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const SETTINGS_NAV = [
    { group: "STORE", items: [{ id: "general", label: "General", icon: "ðŸª" }, { id: "payments", label: "Payments", icon: "ðŸ’³" }, { id: "shipping", label: "Shipping", icon: "ðŸ“¦" }] },
    { group: "ACCOUNT", items: [{ id: "notifications", label: "Notifications", icon: "ðŸ””" }, { id: "team", label: "Team", icon: "ðŸ‘¥" }] },
    { group: "LEGAL", items: [{ id: "policies", label: "Policies", icon: "ðŸ“‹" }] },
  ];

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 42, height: 24, borderRadius: 12, background: value ? COLORS.saffron : COLORS.wheat, cursor: "pointer", position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#FFF", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );

  const FieldRow = ({ label, children }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `0.5px solid ${COLORS.wheat}` }}>
      <div style={{ fontSize: 13, color: COLORS.charcoal, fontFamily: FONTS.body }}>{label}</div>
      {children}
    </div>
  );

  const TextInput = ({ value, onChange, placeholder }) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ padding: "7px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, outline: "none", minWidth: 220 }} />
  );

  const SHIPPING_ZONES = [
    { zone: "ðŸ‡ºðŸ‡¸ USA", standard: "$5.99", express: "$12.99", processing: "3â€“5 days" },
    { zone: "ðŸ‡¨ðŸ‡¦ Canada", standard: "$9.99", express: "$18.99", processing: "5â€“8 days" },
    { zone: "ðŸ‡ªðŸ‡º Europe", standard: "$14.99", express: "$24.99", processing: "7â€“12 days" },
    { zone: "ðŸ‡¦ðŸ‡º Australia", standard: "$16.99", express: "$29.99", processing: "10â€“14 days" },
    { zone: "ðŸŒ Worldwide", standard: "$19.99", express: "$34.99", processing: "14â€“21 days" },
  ];

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Settings sidebar */}
      <div style={{ width: 200, flexShrink: 0 }}>
        {SETTINGS_NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: COLORS.textMuted, marginBottom: 6, fontFamily: FONTS.body }}>{group}</div>
            {items.map(item => (
              <div key={item.id} onClick={() => { setSection(item.id); onNavigate && onNavigate(`settings-${item.id}`); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: section === item.id ? COLORS.saffron + "18" : "transparent", color: section === item.id ? COLORS.saffron : COLORS.inkBrown }}>
                <span>{item.icon}</span>
                <span style={{ fontSize: 13, fontFamily: FONTS.body, fontWeight: section === item.id ? 600 : 400 }}>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Settings content */}
      <div style={{ flex: 1 }}>
        {section === "general" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginBottom: 20 }}>General Settings</div>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>STORE IDENTITY</div>
              {[["Store Name", "storeName", "Souk3D"], ["Tagline", "tagline", "Handmade 3D giftsâ€¦"], ["Email", "email", "nala@souk3d.com"], ["Phone", "phone", "+1 313â€¦"]].map(([label, key, ph]) => (
                <FieldRow key={key} label={label}><TextInput value={settings[key]} onChange={v => update(key, v)} placeholder={ph} /></FieldRow>
              ))}
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>DESCRIPTION</div>
              <textarea value={settings.description} onChange={e => update("description", e.target.value)} style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>SOCIAL LINKS</div>
              {[["Instagram", "instagram", "@souk3d"], ["TikTok", "tiktok", "@souk3d"], ["Pinterest", "pinterest", "@souk3d"], ["Etsy", "etsy", "Souk3D"]].map(([label, key, ph]) => (
                <FieldRow key={key} label={label}><TextInput value={settings[key]} onChange={v => update(key, v)} placeholder={ph} /></FieldRow>
              ))}
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>CUSTOMER EXPERIENCE</div>
              {[["Guest Checkout", "guestCheckout"], ["Heritage Filters", "heritageFilters"], ["Custom Orders Enabled", "customOrdersEnabled"], ["Maintenance Mode", "maintenanceMode"]].map(([label, key]) => (
                <FieldRow key={key} label={label}><Toggle value={settings[key]} onChange={v => update(key, v)} /></FieldRow>
              ))}
            </SectionCard>
            <PrimaryBtn>Save Changes</PrimaryBtn>
          </div>
        )}

        {section === "payments" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginBottom: 20 }}>Payments</div>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>STRIPE</div>
              <div style={{ background: settings.stripeConnected ? COLORS.olive + "14" : COLORS.terracotta + "14", border: `0.5px solid ${settings.stripeConnected ? COLORS.olive : COLORS.terracotta}44`, borderRadius: 10, padding: "16px 18px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, fontFamily: FONTS.body }}>{settings.stripeConnected ? "âœ… Stripe Connected" : "âš ï¸ Stripe Not Connected"}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontFamily: FONTS.body }}>{settings.stripeConnected ? "Payments are active" : "Connect Stripe to accept payments"}</div>
                </div>
                <PrimaryBtn onClick={() => update("stripeConnected", !settings.stripeConnected)}>{settings.stripeConnected ? "Disconnect" : "Connect Stripe"}</PrimaryBtn>
              </div>
              <FieldRow label="Mode">
                <div style={{ display: "flex", gap: 8 }}>
                  {["test", "live"].map(m => (
                    <button key={m} onClick={() => update("stripeMode", m)} style={{ padding: "6px 14px", border: `0.5px solid ${settings.stripeMode === m ? COLORS.saffron : COLORS.wheat}`, borderRadius: 8, background: settings.stripeMode === m ? COLORS.saffron + "18" : "#FFF", color: settings.stripeMode === m ? COLORS.saffron : COLORS.charcoal, fontSize: 12, fontFamily: FONTS.body, cursor: "pointer", fontWeight: settings.stripeMode === m ? 600 : 400 }}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
                  ))}
                </div>
              </FieldRow>
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>ACCEPTED METHODS</div>
              {["Visa / Mastercard", "Apple Pay", "Google Pay", "Shop Pay"].map(m => (
                <FieldRow key={m} label={m}><Toggle value={true} onChange={() => {}} /></FieldRow>
              ))}
            </SectionCard>
          </div>
        )}

        {section === "shipping" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: COLORS.charcoal, marginBottom: 20 }}>Shipping</div>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>PROCESSING</div>
              <FieldRow label="Processing Time">
                <select value={settings.processingDays} onChange={e => update("processingDays", e.target.value)} style={{ padding: "7px 12px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, outline: "none" }}>
                  {["1-2", "2-3", "3-5", "5-7", "7-10"].map(v => <option key={v} value={v}>{v} business days</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Free Shipping Threshold">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: COLORS.textMuted }}>$</span>
                  <input type="number" value={settings.freeShippingThreshold} onChange={e => update("freeShippingThreshold", e.target.value)} style={{ width: 80, padding: "7px 10px", border: `0.5px solid ${COLORS.wheat}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.body, outline: "none" }} />
                </div>
              </FieldRow>
            </SectionCard>
            <SectionCard>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 14, fontFamily: FONTS.body }}>SHIPPING ZONES</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${COLORS.wheat}` }}>
                    {["Zone", "Standard", "Express", "Processing"].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: COLORS.textMuted, padding: "0 8px 8px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SHIPPING_ZONES.map(z => (
                    <tr key={z.zone} style={{ borderBottom: `0.5px solid ${COLORS.wheat}` }}>
                      <td style={{ padding: "10px 8px", fontSize: 13, fontFamily: FONTS.body }}>{z.zone}</td>
                      <td style={{ padding: "10px 8px", fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{z.standard}</td>
                      <td style={{ padding: "10px 8px", fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{z.express}</td>
                      <td style={{ padding: "10px 8px", fontSize: 11, color: COLORS.textMuted }}>{z.processing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
            <PrimaryBtn>Save Shipping Settings</PrimaryBtn>
          </div>
        )}

        {!["general", "payments", "shipping"].includes(section) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13 }}>
            {section.charAt(0).toUpperCase() + section.slice(1)} settings â€” coming soon
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ ADMIN APP (ROOT) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("dashboard");

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.cream }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto", minHeight: "100vh" }}>
        {page === "dashboard"        && <Dashboard onNavigate={setPage} />}
        {page === "products"         && <ProductsPage onNavigate={setPage} />}
        {page === "orders"           && <OrdersPage onNavigate={setPage} />}
        {page === "customers"        && <CustomersPage onNavigate={setPage} />}
        {page === "custom-orders"    && <CustomOrdersPage onNavigate={setPage} />}
        {page === "analytics"        && <AnalyticsPage onNavigate={setPage} />}
        {page === "discounts"        && <DiscountsPage onNavigate={setPage} />}
        {page === "email"            && <EmailMarketingPage onNavigate={setPage} />}
        {page === "settings-general"   && <SettingsPage section="general"   onNavigate={setPage} />}
        {page === "settings-payments"  && <SettingsPage section="payments"  onNavigate={setPage} />}
        {page === "settings-shipping"  && <SettingsPage section="shipping"  onNavigate={setPage} />}
      </div>
    </div>
  );
}
