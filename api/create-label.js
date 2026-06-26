import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SHIPPO_TOKEN = process.env.SHIPPO_API_TOKEN;

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Souk3D <order@souk3d.com>";
const REPLY_TO = "1saif.ayoob@gmail.com";

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: to, reply_to: REPLY_TO, subject: subject, html: html }),
    });
  } catch (e) { console.error("Email failed:", e.message); }
}

function shippedHtml(order, addr, tracking, trackingUrl) {
  const name = addr.name || "there";
  const orderNo = order.order_number || "";
  const track = tracking ? `<p style="margin:16px 0;">Tracking number: <strong>${tracking}</strong></p>${trackingUrl ? `<p><a href="${trackingUrl}" style="background:#D4881F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Track your package</a></p>` : ""}` : "";
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1F18;"><h1 style="color:#D4881F;">Souk3D</h1><p style="font-size:18px;">Good news, ${name} - your order is on its way!</p><p style="color:#555;">Order ${orderNo} has shipped.</p>${track}<p style="font-size:13px;color:#888;margin-top:24px;">Thank you for supporting handmade. - Souk3D</p></div>`;
}

// Store ship-from address (the return address printed on every label).
const SHIP_FROM = {
  name: "Saif Ayoob",
  street1: "201 W Ash Ave",
  city: "Burbank",
  state: "CA",
  zip: "91502",
  country: "US",
  phone: "6197518581",
  email: "1saif.ayoob@gmail.com",
};

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

async function shippo(path, body) {
  const r = await fetch("https://api.goshippo.com" + path, {
    method: "POST",
    headers: {
      Authorization: "ShippoToken " + SHIPPO_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireAdmin(req);
  if (!user) return res.status(403).json({ error: "Not authorized" });

  try {
    const { order_id, rate_id } = req.body || {};
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    const { data: order, error: oErr } = await admin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();
    if (oErr || !order) return res.status(404).json({ error: "Order not found" });

    // STEP 2: a rate was chosen -> buy that label.
    if (rate_id) {
      const tx = await shippo("/transactions", {
        rate: rate_id,
        label_file_type: "PDF_4x6",
        async: false,
      });
      if (!tx || tx.status !== "SUCCESS") {
        console.error(
          "Shippo buy failed:",
          JSON.stringify(tx && tx.messages ? tx.messages : tx)
        );
        return res.status(400).json({
          error: "Label purchase failed",
          details: tx && tx.messages ? tx.messages : tx,
        });
      }
      await admin
        .from("orders")
        .update({
          tracking_number: tx.tracking_number || null,
          tracking_url: tx.tracking_url_provider || null,
          label_url: tx.label_url || null,
          status: "shipped",
        })
        .eq("id", order_id);
      const buyer = order.shipping_address || {};
      if (buyer.email) {
        await sendEmail(buyer.email, "Your Souk3D order has shipped", shippedHtml(order, buyer, tx.tracking_number, tx.tracking_url_provider));
      }
      return res.status(200).json({
        label_url: tx.label_url,
        tracking_number: tx.tracking_number,
        tracking_url: tx.tracking_url_provider,
      });
    }

    // STEP 1: no rate chosen yet -> return the list of rates to pick from.
    const a = order.shipping_address || {};
    const addressTo = {
      name: a.name || "Customer",
      street1: a.line1 || "",
      street2: a.line2 || "",
      city: a.city || "",
      state: a.state || "",
      zip: a.zip || "",
      country: a.country || "US",
      phone: a.phone || "",
      email: a.email || "",
    };
    const parcel = {
      length: "6",
      width: "4",
      height: "2",
      distance_unit: "in",
      weight: "6",
      mass_unit: "oz",
    };

    const shipment = await shippo("/shipments", {
      address_from: SHIP_FROM,
      address_to: addressTo,
      parcels: [parcel],
      async: false,
    });

    if (
      !shipment ||
      !Array.isArray(shipment.rates) ||
      shipment.rates.length === 0
    ) {
      console.error(
        "Shippo rates failed:",
        JSON.stringify(shipment && shipment.messages ? shipment.messages : shipment)
      );
      return res.status(400).json({
        error: "No shipping rates returned. Check the addresses.",
        details: shipment && shipment.messages ? shipment.messages : null,
      });
    }

    const rates = shipment.rates
      .map(function (r) {
        return {
          id: r.object_id,
          carrier: r.provider || "",
          service: r.servicelevel && r.servicelevel.name ? r.servicelevel.name : "",
          amount: r.amount,
          currency: r.currency || "USD",
          days: r.estimated_days || null,
        };
      })
      .sort(function (x, y) {
        return parseFloat(x.amount) - parseFloat(y.amount);
      });

    return res.status(200).json({ rates: rates });
  } catch (err) {
    console.error("create-label error:", err);
    return res
      .status(500)
      .json({ error: "Label creation failed", details: err.message });
  }
}
