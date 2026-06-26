import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_KEY = process.env.RESEND_API_KEY;
// Test sender. Swap to "Souk3D <orders@souk3d.com>" once the domain is verified.
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
      body: JSON.stringify({ from: FROM_EMAIL, to: to, reply_to: REPLY_TO, subject: subject, html: html }),
    });
  } catch (e) {
    console.error("Email send failed:", e.message);
  }
}

function shippedHtml(order, addr, tracking, trackingUrl) {
  const name = addr.name || "there";
  const orderNo = order.order_number || "";
  const trackBlock = tracking
    ? '<p style="margin:16px 0;font-size:15px;color:#2A1F18;">Tracking number: <strong>' +
      tracking +
      "</strong></p>" +
      (trackingUrl
        ? '<p style="margin:16px 0;"><a href="' +
          trackingUrl +
          '" style="background:#D4881F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Track your package</a></p>'
        : "")
    : "";
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1F18;">' +
    '<h1 style="font-size:24px;color:#D4881F;margin:0 0 4px;">Souk3D</h1>' +
    '<p style="font-size:18px;margin:20px 0 8px;">Good news, ' +
    name +
    " — your order is on its way!</p>" +
    '<p style="font-size:15px;color:#555;">Order ' +
    orderNo +
    " has shipped." +
    "</p>" +
    trackBlock +
    '<p style="font-size:13px;color:#888;margin-top:28px;">Thank you for supporting handmade. — Souk3D</p>' +
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
    const { order_id, tracking } = req.body || {};
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();
    if (!order) return res.status(404).json({ error: "Order not found" });

    const updates = { status: "shipped" };
    if (tracking) updates.tracking_number = tracking;
    await admin.from("orders").update(updates).eq("id", order_id);

    const a = order.shipping_address || {};
    const email = a.email || "";
    if (email) {
      const html = shippedHtml(
        order,
        a,
        tracking || order.tracking_number || "",
        order.tracking_url || ""
      );
      await sendEmail(email, "Your Souk3D order has shipped", html);
    }

    return res.status(200).json({ ok: true, emailed: !!email });
  } catch (err) {
    console.error("mark-shipped error:", err);
    return res
      .status(500)
      .json({ error: "Mark shipped failed", details: err.message });
  }
}
