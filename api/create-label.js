import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SHIPPO_TOKEN = process.env.SHIPPO_API_TOKEN;

// Store ship-from address (the return address printed on every label).
const SHIP_FROM = {
  name: "Saif Ayoob",
  street1: "201 W Ash Ave",
  city: "Burbank",
  state: "CA",
  zip: "91205",
  country: "US",
  phone: "6197518581",
  email: "1saif.ayoob@gmail.com",
};

// Only signed-in admins/super-admins may buy labels.
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await requireAdmin(req);
  if (!user) return res.status(403).json({ error: "Not authorized" });

  try {
    const { order_id } = req.body || {};
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    const { data: order, error: oErr } = await admin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();
    if (oErr || !order) return res.status(404).json({ error: "Order not found" });

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

    // Default parcel for now (we can wire per-product weights/sizes later).
    const parcel = {
      length: "6",
      width: "4",
      height: "2",
      distance_unit: "in",
      weight: "6",
      mass_unit: "oz",
    };

    // 1) Create the shipment to fetch live USPS/UPS rates.
    const shipmentRes = await fetch("https://api.goshippo.com/shipments", {
      method: "POST",
      headers: {
        Authorization: "ShippoToken " + SHIPPO_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_from: SHIP_FROM,
        address_to: addressTo,
        parcels: [parcel],
        async: false,
      }),
    });
    const shipment = await shipmentRes.json();
    if (
      !shipment ||
      !Array.isArray(shipment.rates) ||
      shipment.rates.length === 0
    ) {
      return res.status(400).json({
        error: "No shipping rates returned. Check the shipping address.",
        details: shipment && shipment.messages ? shipment.messages : null,
      });
    }

    // Pick the cheapest available rate.
    const rates = shipment.rates.slice().sort(function (x, y) {
      return parseFloat(x.amount) - parseFloat(y.amount);
    });
    const chosen = rates[0];

    // 2) Buy the label.
    const txRes = await fetch("https://api.goshippo.com/transactions", {
      method: "POST",
      headers: {
        Authorization: "ShippoToken " + SHIPPO_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rate: chosen.object_id,
        label_file_type: "PDF",
        async: false,
      }),
    });
    const tx = await txRes.json();
    if (!tx || tx.status !== "SUCCESS") {
      return res.status(400).json({
        error: "Label purchase failed",
        details: tx && tx.messages ? tx.messages : tx,
      });
    }

    const carrier = chosen.provider || "";
    const service =
      chosen.servicelevel && chosen.servicelevel.name
        ? chosen.servicelevel.name
        : "";

    // Save label + tracking back onto the order.
    await admin
      .from("orders")
      .update({
        tracking_number: tx.tracking_number || null,
        tracking_url: tx.tracking_url_provider || null,
        label_url: tx.label_url || null,
        shipping_carrier: (carrier + " " + service).trim(),
      })
      .eq("id", order_id);

    return res.status(200).json({
      tracking_number: tx.tracking_number,
      tracking_url: tx.tracking_url_provider,
      label_url: tx.label_url,
      carrier: carrier,
      service: service,
      amount: chosen.amount,
      currency: chosen.currency,
    });
  } catch (err) {
    console.error("create-label error:", err);
    return res
      .status(500)
      .json({ error: "Label creation failed", details: err.message });
  }
}
