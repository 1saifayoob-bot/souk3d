import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Souk3D <order@souk3d.com>";
const REPLY_TO = "1saif.ayoob@gmail.com";

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + RESEND_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: to, reply_to: REPLY_TO, subject: subject, html: html }),
    });
  } catch (e) {
    console.error("Confirmation email failed:", e.message);
  }
}

function confirmationHtml(orderNo, addr, items, total) {
  const rows = (items || [])
    .map(function (it) {
      return (
        '<tr><td style="padding:6px 0;">' +
        (it.name || "Item") + " x " + (it.qty || 1) +
        '</td><td style="padding:6px 0;text-align:right;">$' +
        Number((it.price || 0) * (it.qty || 1)).toFixed(2) +
        "</td></tr>"
      );
    })
    .join("");
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1F18;">' +
    '<h1 style="font-size:24px;color:#D4881F;margin:0 0 4px;">Souk3D</h1>' +
    '<p style="font-size:18px;margin:20px 0 8px;">Thank you for your order, ' +
    (addr.name || "friend") + "!</p>" +
    '<p style="font-size:15px;color:#555;">Order ' + orderNo +
    " is confirmed. Here is what you ordered:</p>" +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0;">' +
    rows +
    '<tr><td style="padding:10px 0;border-top:1px solid #eee;font-weight:700;">Total</td><td style="padding:10px 0;border-top:1px solid #eee;text-align:right;font-weight:700;">$' +
    Number(total || 0).toFixed(2) +
    "</td></tr></table>" +
    '<p style="font-size:13px;color:#888;margin-top:28px;">We will email you again when it ships.</p>' +
    "</div>"
  );
}

// Service-role client - used ONLY on the server to write orders/customers and
// adjust stock. This key bypasses RLS and must never reach the browser.
const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Stripe needs the raw request body to verify the signature, so turn off
// Vercel's automatic JSON body parsing for this function.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function orderNumberFor(session) {
  // Deterministic from the Stripe session id so duplicate webhook deliveries
  // never create duplicate orders.
  return "SK-" + String(session.id).slice(-12).toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let event;
  try {
    const raw = await readRawBody(req);
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Webhook Error: " + err.message });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await fulfillOrder(event.data.object);
    } catch (err) {
      console.error("Order fulfillment error:", err);
      return res.status(500).json({ error: "Fulfillment failed" });
    }
  }

  return res.status(200).json({ received: true });
}

async function fulfillOrder(session) {
  const orderNumber = orderNumberFor(session);

  // Idempotency: if we already saved this order, do nothing.
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (existing) return;

  // Rebuild the purchased items from Stripe (source of truth, not the browser).
  const li = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });
  const items = (li.data || []).map((row) => {
    const qty = row.quantity || 1;
    const product = row.price && row.price.product;
    const pid =
      product && product.metadata ? product.metadata.product_id : null;
    return {
      product_id: pid || null,
      name: row.description || (product && product.name) || "Item",
      qty,
      price: qty ? (row.amount_total || 0) / 100 / qty : 0,
    };
  });

  const m = session.metadata || {};
  const cd = session.customer_details || {};
  const shipping_address = {
    name: m.name || cd.name || "",
    email: m.email || cd.email || session.customer_email || "",
    phone: m.phone || cd.phone || "",
    line1: m.line1 || "",
    line2: m.line2 || "",
    city: m.city || "",
    state: m.state || "",
    zip: m.zip || "",
    country: m.country || "US",
    gift_message: m.gift || "",
  };

  const total = (session.amount_total || 0) / 100;
  const subtotal = (session.amount_subtotal || 0) / 100;
  const shipping =
    session.total_details && session.total_details.amount_shipping
      ? session.total_details.amount_shipping / 100
      : 0;

  // Save / update the customer so they appear in the Customers tab.
  let customerId = null;
  if (shipping_address.email) {
    const { data: cust, error: custErr } = await admin
      .from("customers")
      .upsert(
        {
          name: shipping_address.name || shipping_address.email,
          email: shipping_address.email,
          phone: shipping_address.phone || null,
          address: shipping_address,
        },
        { onConflict: "email" }
      )
      .select("id")
      .maybeSingle();
    if (!custErr && cust) customerId = cust.id;
  }

  // Save the paid order.
  const { error: orderErr } = await admin.from("orders").insert({
    order_number: orderNumber,
    customer_id: customerId,
    status: "new",
    items,
    subtotal,
    shipping,
    tax: 0,
    total,
    shipping_address,
    payment_status: "paid",
  });
  if (orderErr) throw orderErr;

  if (shipping_address.email) {
    await sendEmail(
      shipping_address.email,
      "Your Souk3D order is confirmed",
      confirmationHtml(orderNumber, shipping_address, items, total)
    );
  }

  // Decrement stock for each purchased product.
  for (const it of items) {
    if (!it.product_id) continue;
    const { data: prod } = await admin
      .from("products")
      .select("stock")
      .eq("id", it.product_id)
      .maybeSingle();
    if (prod && typeof prod.stock === "number") {
      const next = Math.max(0, prod.stock - it.qty);
      await admin
        .from("products")
        .update({ stock: next })
        .eq("id", it.product_id);
    }
  }
}
