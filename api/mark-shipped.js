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
  const name = addr && addr.name ? String(addr.name).split(" ")[0] : "friend";
  const orderNo = order.order_number || "";
  const rows = (order.items || [])
    .map((it) => `<tr><td style="padding:8px 0;border-bottom:1px solid #F0E8D8;">${it.name || "Item"} <span style="color:#999;">x ${it.qty || 1}</span></td><td style="padding:8px 0;border-bottom:1px solid #F0E8D8;text-align:right;">$${Number((it.price || 0) * (it.qty || 1)).toFixed(2)}</td></tr>`)
    .join("");
  const track = tracking ? `<p style="font-size:15px;color:#2A1F18;margin:8px 0;">Tracking number: <strong>${tracking}</strong></p>${trackingUrl ? `<p style="margin:16px 0;"><a href="${trackingUrl}" style="background:#D4881F;color:#fff;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;">Track your package</a></p>` : ""}` : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#FAF3E7;border-radius:16px;overflow:hidden;"><div style="background:#2A1F18;padding:28px 24px;text-align:center;"><div style="font-size:30px;font-weight:700;color:#D4881F;letter-spacing:1px;">Souk3D</div><div style="font-size:13px;color:#E8D5A8;margin-top:4px;">Handmade 3D-printed gifts</div></div><div style="padding:28px 28px 8px;"><div style="font-size:25px;font-weight:700;color:#2A1F18;">It is on its way! 📦</div><p style="font-size:16px;color:#5a4a3a;line-height:1.7;">Great news, ${name} — your handmade order has shipped and is heading to you now. We packed it with care and a little happy dance.</p>${track}<p style="font-size:14px;color:#5a4a3a;margin-top:18px;">Here is what is in your package:</p><table style="width:100%;border-collapse:collapse;font-size:15px;color:#2A1F18;margin:8px 0 18px;">${rows}</table><div style="background:#F3E8D2;border-radius:12px;padding:16px 18px;font-size:14px;color:#5a4a3a;line-height:1.7;">Thank you for supporting our small business. 💛 Souk3D is a tiny, family-run studio, and every single order genuinely makes our day. We are so grateful you chose handmade.</div><p style="font-size:16px;color:#2A1F18;margin-top:22px;">With love,<br><strong style="color:#D4881F;">Nala and the Souk3D family</strong></p></div><div style="padding:18px;text-align:center;font-size:12px;color:#a89a86;">شكراً لك · Order ${orderNo}</div></div>`;
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
