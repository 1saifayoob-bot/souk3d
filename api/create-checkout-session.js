import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Public read client - only needs to read active products' real prices.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, contact, address, shippingMethod, giftMessage, promoCode } =

req.body || {};

    // Member discount is decided HERE, from the caller's signed token - never
    // from anything the browser claims. A guest cannot fake this.
    let isMember = false;
    let memberEmail = "";
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (token) {
        const { data: u } = await supabase.auth.getUser(token);
        if (u && u.user && u.user.email) {
          isMember = true;
          memberEmail = u.user.email;
        }
      }
    } catch (e) {
      isMember = false;
    }
    const MEMBER_DISCOUNT = 0.05;

    // Promo codes are validated against the database HERE. Whatever percentage
    // the browser claims is ignored - only what the discounts table says counts.
    let promoPercent = 0;
    let promoApplied = "";
    const wanted = String(promoCode || "").trim().toUpperCase();
    if (wanted) {
      try {
        const { data: dc } = await supabase
          .from("discounts")
          .select("code, type, value, status")
          .ilike("code", wanted)
          .eq("status", "active")
          .maybeSingle();
        if (dc && dc.type === "percent") {
          promoPercent = Math.max(0, Math.min(50, Number(dc.value) || 0)) / 100;
          promoApplied = dc.code;
        }
      } catch (e) {
        promoPercent = 0;
      }
    }

    // Member 5% and a promo code stack, but never below 50% off in total.
    const memberPart = isMember ? MEMBER_DISCOUNT : 0;
    const totalOff = Math.min(0.5, memberPart + promoPercent);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    // SECURITY: never trust prices sent by the browser. Look every price up
    // from the database by product id, and ignore anything not active.
    const ids = items.map((i) => i.id).filter(Boolean);
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, stock, images, status")
      .in("id", ids);
    if (error) throw error;

    const byId = {};
    (products || []).forEach((p) => {
      byId[p.id] = p;
    });

    const line_items = [];
    let subtotalCents = 0;
    for (const item of items) {
      const p = byId[item.id];
      if (!p || p.status !== "active") continue;
      const qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
      const unit = Math.round(Number(p.price) * 100);
      if (!unit || unit < 0) continue;
      subtotalCents += unit * qty;
      const imgUrl =
        p.images && p.images[0] && p.images[0].url ? p.images[0].url : null;
      const safeImg =
        imgUrl && String(imgUrl).startsWith("http") ? [imgUrl] : [];
      line_items.push({
        quantity: qty,
        price_data: {
          currency: "usd",
      unit_amount: totalOff > 0 ? Math.round(unit * (1 - totalOff)) : unit,
          product_data: {
            name: p.name || "Souk3D item",
            images: safeImg,
            metadata: { product_id: p.id },
          },
        },
      });
    }

    if (line_items.length === 0) {
      return res
        .status(400)
        .json({ error: "No purchasable items in your cart." });
    }

    // Shipping mirrors the storefront: express $12.99, otherwise free over $75
    // or $5.99 standard.
    const subtotalDollars = subtotalCents / 100;
    const shippingCents =
      shippingMethod === "express" ? 1299 : subtotalDollars >= 75 ? 0 : 599;

    const origin =
      req.headers.origin ||
      (req.headers.host
        ? "https://" + req.headers.host
        : "https://www.souk3d.com");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: contact && contact.email ? contact.email : undefined,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCents, currency: "usd" },
            display_name:
              shippingMethod === "express"
                ? "Express (1-3 business days)"
                : "Standard shipping",
          },
        },
      ],
      success_url:
        origin + "/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/?checkout=cancel",
      metadata: {
        name: (address && address.name ? address.name : "").slice(0, 120),
        email: (contact && contact.email ? contact.email : "").slice(0, 120),
        phone: (contact && contact.phone ? contact.phone : "").slice(0, 40),
        line1: (address && address.line1 ? address.line1 : "").slice(0, 160),
        line2: (address && address.line2 ? address.line2 : "").slice(0, 160),
        city: (address && address.city ? address.city : "").slice(0, 80),
        state: (address && address.state ? address.state : "").slice(0, 40),
        zip: (address && address.zip ? address.zip : "").slice(0, 20),
        country: (address && address.country ? address.country : "US").slice(
          0,
          8
        ),
        gift: (giftMessage || "").slice(0, 300),
        shippingMethod: shippingMethod || "standard",
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res
      .status(500)
      .json({ error: "Could not start checkout", details: err.message });
  }
}
