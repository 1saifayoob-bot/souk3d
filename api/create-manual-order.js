import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Souk3D <order@souk3d.com>";
const REPLY_TO = "1saif.ayoob@gmail.com";

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

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + RESEND_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: to,
        reply_to: REPLY_TO,
        subject: subject,
        html: html,
      }),
    });
  } catch (e) {
    console.error("Email failed:", e.message);
  }
}

function itemRows(items) {
  return (items || [])
    .map(function (it) {
      return (
        '<tr><td style="padding:6px 0;">' +
        (it.name || "Item") +
        " x " +
        (it.qty || 1) +
        '</td><td style="text-align:right;padding:6px 0;">$' +
        Number((it.price || 0) * (it.qty || 1)).toFixed(2) +
        "</td></tr>"
      );
    })
    .join("");
}

function confirmHtml(name, orderNo, items, total) {
  return (
    '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1F18;">' +
    '<h1 style="color:#D4881F;">Souk3D</h1>' +
    '<p style="font-size:18px;">Thank you for your order, ' +
    name +
    "!</p>" +
    '<p style="color:#555;">Order ' +
    orderNo +
    " is confirmed.</p>" +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0;">' +
    itemRows(items) +
    '<tr><td style="border-top:1px solid #eee;padding-top:8px;font-weight:700;">Total</td><td style="border-top:1px solid #eee;padding-top:8px;text-align:right;font-weight:700;">$' +
    Number(total || 0).toFixed(2) +
    "</td></tr></table>" +
    '<p style="font-size:13px;color:#888;margin-top:24px;">We will email you again when it ships. - Souk3D</p>' +
    "</div>"
  );
}

function linkHtml(name, url, total) {
  return (
    '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1F18;">' +
    '<h1 style="color:#D4881F;">Souk3D</h1>' +
    '<p style="font-size:18px;">Hi ' +
    name +
    ", your order is ready!</p>" +
    '<p style="color:#555;">Click below to complete your purchase of $' +
    Number(total || 0).toFixed(2) +
    ".</p>" +
    '<p style="margin:20px 0;"><a href="' +
    url +
    '" style="background:#D4881F;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">Pay now</a></p>' +
    '<p style="font-size:13px;color:#888;margin-top:24px;">Thank you. - Souk3D</p>' +
    "</div>"
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireAdmin(req);
  if (!user) return res.status(403).json({ error: "Not authorized" });

  try {
    const { name, email, phone, address, items, pay } = req.body || {};
    if (!name || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Add a customer name and at least one product." });
    }

    const ids = items.map((i) => i.id).filter(Boolean);
    const { data: products } = await admin
      .from("products")
      .select("id, name, price")
      .in("id", ids);
    const byId = {};
    (products || []).forEach((p) => {
      byId[p.id] = p;
    });

    const orderItems = [];
    const lineItems = [];
    let total = 0;
    for (const it of items) {
      const p = byId[it.id];
      if (!p) continue;
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      const price = Number(p.price) || 0;
      total += price * qty;
      orderItems.push({ product_id: p.id, name: p.name, qty: qty, price: price });
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(price * 100),
          product_data: { name: p.name, metadata: { product_id: p.id } },
        },
      });
    }
    if (orderItems.length === 0) {
      return res.status(400).json({ error: "No valid products selected." });
    }

    const addr = address || {};
    const shipping_address = {
      name: name,
      email: email || "",
      phone: phone || "",
      line1: addr.line1 || "",
      line2: "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: "US",
    };

    if (pay === "paid") {
      const orderNo = "SK-M" + Date.now().toString().slice(-8);
      const { error } = await admin.from("orders").insert({
        order_number: orderNo,
        status: "new",
        items: orderItems,
        subtotal: total,
        shipping: 0,
        tax: 0,
        total: total,
        shipping_address: shipping_address,
        payment_status: "paid",
      });
      if (error) {
        return res
          .status(500)
          .json({ error: "Could not save order", details: error.message });
      }
      if (email) {
        await sendEmail(
          email,
          "Your Souk3D order is confirmed",
          confirmHtml(name, orderNo, orderItems, total)
        );
      }
      return res.status(200).json({ ok: true, emailed: !!email });
    }

    const origin =
      req.headers.origin ||
      (req.headers.host
        ? "https://" + req.headers.host
        : "https://www.souk3d.com");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: email || undefined,
      success_url:
        origin + "/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/?checkout=cancel",
      metadata: {
        name: name,
        email: email || "",
        phone: phone || "",
        line1: shipping_address.line1,
        line2: "",
        city: shipping_address.city,
        state: shipping_address.state,
        zip: shipping_address.zip,
        country: "US",
        shippingMethod: "standard",
      },
    });

    if (email) {
      await sendEmail(
        email,
        "Complete your Souk3D order",
        linkHtml(name, session.url, total)
      );
    }
    return res
      .status(200)
      .json({ ok: true, emailed: !!email, url: session.url });
  } catch (err) {
    console.error("create-manual-order error:", err);
    return res
      .status(500)
      .json({ error: "Could not create order", details: err.message });
  }
}
