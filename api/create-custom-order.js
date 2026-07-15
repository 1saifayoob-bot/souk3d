import { createClient } from "@supabase/supabase-js";

// Service-role client: the storefront is anonymous, so the insert happens here
// on the server rather than trusting the browser.
const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Souk3D <order@souk3d.com>";
const REPLY_TO = "1saif.ayoob@gmail.com";
const OWNER_EMAIL = "1saif.ayoob@gmail.com";

async function sendEmail(to, subject, html, replyTo) {
  if (!RESEND_KEY || !to) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + RESEND_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: to,
        reply_to: replyTo || REPLY_TO,
        subject: subject,
        html: html,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("Resend failed:", r.status, t.slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email failed:", e.message);
    return false;
  }
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, value) {
  if (!value) return "";
  return (
    '<tr><td style="padding:7px 0;color:#8A7A6A;font-size:13px;width:130px;">' +
    esc(label) +
    '</td><td style="padding:7px 0;color:#2A1F18;font-size:14px;font-weight:500;">' +
    esc(value) +
    "</td></tr>"
  );
}

// What the shop owner receives.
function ownerHtml(ref, r) {
  const wa = String(r.whatsapp || "").replace(/[^0-9]/g, "");
  const waBlock = wa
    ? '<p style="margin:18px 0;"><a href="https://wa.me/' +
      wa +
      '" style="background:#25D366;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;">Reply on WhatsApp</a></p>'
    : "";
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#2A1F18;">' +
    '<div style="background:#2A1F18;border-radius:12px;padding:20px;margin-bottom:20px;">' +
    '<div style="color:#D4881F;font-size:22px;font-weight:700;">New Custom Order Request</div>' +
    '<div style="color:#C9B99A;font-size:13px;margin-top:4px;">Reference ' +
    esc(ref) +
    "</div></div>" +
    '<table style="width:100%;border-collapse:collapse;">' +
    row("Name", r.name) +
    row("Email", r.email) +
    row("WhatsApp", r.whatsapp) +
    row("Occasion", r.occasion) +
    row("Arabic text", r.arabicText) +
    row("Style", r.style) +
    row("Colour", r.color) +
    row("Deadline", r.deadline) +
    row("Notes", r.notes) +
    "</table>" +
    waBlock +
    '<p style="margin:18px 0 0;"><a href="https://www.souk3d.com/admin" style="background:#D4881F;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;">Open in admin</a></p>' +
    '<p style="font-size:12px;color:#8A7A6A;margin-top:24px;">Reply straight to this email to reach ' +
    esc(r.name || "the customer") +
    ".</p>" +
    "</div>"
  );
}

// What the customer receives - a real confirmation, not a fake one.
function customerHtml(ref, r) {
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1F18;">' +
    '<div style="background:#2A1F18;border-radius:12px;padding:24px;text-align:center;margin-bottom:22px;">' +
    '<div style="color:#D4881F;font-size:26px;font-weight:700;">Souk3D</div>' +
    '<div style="color:#C9B99A;font-size:14px;margin-top:2px;">سوق ثري دي</div>' +
    "</div>" +
    '<p style="font-size:19px;margin:0 0 6px;">We have your request, ' +
    esc(r.name || "friend") +
    "! ✦</p>" +
    '<p style="font-size:15px;color:#555;line-height:1.7;">Thank you for trusting us with something personal. Nala will look over your idea and send you a personalised quote, usually within 1-2 business days.</p>' +
    '<div style="background:#FBF7F0;border:0.5px solid #E8DCC8;border-radius:10px;padding:16px;margin:18px 0;">' +
    '<div style="font-size:11px;font-weight:700;color:#8A7A6A;letter-spacing:0.5px;margin-bottom:8px;">YOUR REQUEST — ' +
    esc(ref) +
    "</div>" +
    '<table style="width:100%;border-collapse:collapse;">' +
    row("Occasion", r.occasion) +
    row("Arabic text", r.arabicText) +
    row("Style", r.style) +
    row("Colour", r.color) +
    row("Deadline", r.deadline) +
    row("Notes", r.notes) +
    "</table></div>" +
    '<p style="font-size:14px;color:#555;line-height:1.7;">Every Souk3D piece is designed, printed and finished by hand in Detroit. We will be in touch soon. 💛</p>' +
    '<p style="font-size:13px;color:#8A7A6A;margin-top:22px;">Just reply to this email if you want to add anything.</p>' +
    '<p style="font-size:13px;color:#8A7A6A;">— Nala and the Souk3D family<br/><span style="font-size:15px;">شكراً لك</span></p>' +
    "</div>"
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim();

    if (!name || !email || email.indexOf("@") === -1) {
      return res
        .status(400)
        .json({ error: "Please give us your name and a valid email." });
    }

    const request = {
      name: name,
      email: email,
      whatsapp: String(b.whatsapp || "").trim(),
      occasion: String(b.occasion || "").trim(),
      arabicText: String(b.arabicText || "").slice(0, 500),
      style: String(b.style || "").trim(),
      color: String(b.color || "").trim(),
      deadline: String(b.deadline || "").trim(),
      notes: String(b.notes || "").slice(0, 2000),
      submittedAt: new Date().toISOString(),
    };

    // Link the request to a customer record so it shows up in the Customers tab.
    let customerId = null;
    try {
      const { data: cust } = await admin
        .from("customers")
        .upsert(
          {
            name: name,
            email: email,
            phone: request.whatsapp || null,
          },
          { onConflict: "email" }
        )
        .select("id")
        .maybeSingle();
      if (cust) customerId = cust.id;
    } catch (e) {
      console.error("Customer upsert failed (continuing):", e.message);
    }

    const { data: saved, error } = await admin
      .from("custom_orders")
      .insert({
        customer_id: customerId,
        status: "new",
        request: request,
        messages: [],
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("custom_orders insert failed:", error);
      return res
        .status(500)
        .json({ error: "Could not save your request", details: error.message });
    }

    const ref = "CR-" + String(saved.id).slice(0, 8).toUpperCase();

    // The request is already saved by this point, so the customer's
    // confirmation is never a lie.
    const toOwner = await sendEmail(
      OWNER_EMAIL,
      "✦ New custom order request from " + name,
      ownerHtml(ref, request),
      email
    );
    const toCustomer = await sendEmail(
      email,
      "We have your Souk3D custom request ✦",
      customerHtml(ref, request)
    );

    return res.status(200).json({
      ok: true,
      id: saved.id,
      reference: ref,
      emailedOwner: toOwner,
      emailedCustomer: toCustomer,
    });
  } catch (err) {
    console.error("create-custom-order error:", err);
    return res
      .status(500)
      .json({ error: "Could not save your request", details: err.message });
  }
}
