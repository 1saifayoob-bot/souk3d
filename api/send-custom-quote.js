import { createClient } from "@supabase/supabase-js";

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

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function quoteHtml(name, ref, amount, message, req) {
  const priceBlock =
    amount > 0
      ? '<div style="text-align:center;margin:20px 0;"><div style="font-size:11px;color:#8A7A6A;letter-spacing:0.5px;font-weight:700;">YOUR QUOTE</div>' +
        '<div style="font-size:38px;font-weight:700;color:#2A1F18;margin-top:4px;">$' +
        Number(amount).toFixed(2) +
        "</div></div>"
      : "";
  const body = String(message || "")
    .split("\n")
    .map(function (line) {
      return '<p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 10px;">' + esc(line) + "</p>";
    })
    .join("");
  const detail = [
    req.occasion ? "Occasion: " + req.occasion : "",
    req.arabicText ? "Text: " + req.arabicText : "",
    req.style ? "Style: " + req.style : "",
    req.color ? "Colour: " + req.color : "",
  ]
    .filter(Boolean)
    .map(function (l) {
      return '<div style="font-size:13px;color:#8A7A6A;padding:3px 0;">' + esc(l) + "</div>";
    })
    .join("");

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1F18;">' +
    '<div style="background:#2A1F18;border-radius:12px;padding:24px;text-align:center;margin-bottom:22px;">' +
    '<div style="color:#D4881F;font-size:26px;font-weight:700;">Souk3D</div>' +
    '<div style="color:#C9B99A;font-size:14px;margin-top:2px;">سوق ثري دي</div>' +
    "</div>" +
    '<p style="font-size:19px;margin:0 0 12px;">Your custom quote is ready, ' +
    esc(name || "friend") +
    "! ✦</p>" +
    body +
    priceBlock +
    (detail
      ? '<div style="background:#FBF7F0;border:0.5px solid #E8DCC8;border-radius:10px;padding:14px;margin:18px 0;">' +
        '<div style="font-size:11px;font-weight:700;color:#8A7A6A;letter-spacing:0.5px;margin-bottom:6px;">YOUR REQUEST — ' +
        esc(ref) +
        "</div>" +
        detail +
        "</div>"
      : "") +
    '<p style="font-size:14px;color:#555;line-height:1.7;">Just reply to this email to accept, ask a question, or change anything. Nothing is charged until you say yes.</p>' +
    '<p style="font-size:13px;color:#8A7A6A;margin-top:22px;">— Nala and the Souk3D family<br/><span style="font-size:15px;">شكراً لك</span></p>' +
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
    const { id, amount, message } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing request id" });
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Write a message to the customer." });
    }

    const { data: row, error: rErr } = await admin
      .from("custom_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (rErr || !row) return res.status(404).json({ error: "Request not found" });

    const request = row.request || {};
    const email = request.email || "";
    if (!email) {
      return res.status(400).json({ error: "This request has no email address." });
    }

    const ref = "CR-" + String(row.id).slice(0, 8).toUpperCase();
    const price = Number(amount) || 0;

    if (!RESEND_KEY) {
      return res.status(500).json({ error: "Email is not configured." });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + RESEND_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        reply_to: REPLY_TO,
        subject: "Your Souk3D custom quote ✦ " + ref,
        html: quoteHtml(request.name, ref, price, message, request),
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Quote email failed:", r.status, t.slice(0, 200));
      return res.status(500).json({ error: "Could not send the email." });
    }

    const messages = Array.isArray(row.messages) ? row.messages : [];
    messages.push({
      from: "shop",
      text: String(message),
      amount: price || null,
      at: new Date().toISOString(),
    });

    const { error: uErr } = await admin
      .from("custom_orders")
      .update({
        status: "quote",
        quote: { amount: price, sentAt: new Date().toISOString() },
        messages: messages,
      })
      .eq("id", id);
    if (uErr) {
      console.error("Quote save failed:", uErr);
      return res
        .status(500)
        .json({ error: "Email sent but saving failed", details: uErr.message });
    }

    return res.status(200).json({ ok: true, emailed: true, reference: ref });
  } catch (err) {
    console.error("send-custom-quote error:", err);
    return res
      .status(500)
      .json({ error: "Could not send quote", details: err.message });
  }
}
