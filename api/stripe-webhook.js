import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
