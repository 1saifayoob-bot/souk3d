import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Souk3D <order@souk3d.com>";
const REPLY_TO = "1saif.ayoob@gmail.com";
const SITE = "https://www.souk3d.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

function shell(inner, unsubUrl) {
  const unsub = unsubUrl
    ? '<p style="font-size:11px;color:#B0A493;margin:24px 0 0;text-align:center;">You are receiving this because you joined the Souk3D family. ' +
      '<a href="' + unsubUrl + '" style="color:#B0A493;">Unsubscribe</a></p>'
    : "";
  return (
    '<div style="background:#FAF6EF;padding:32px 16px;font-family:Georgia,serif;">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E8DFD0;border-radius:14px;padding:32px;">' +
    '<div style="text-align:center;margin-bottom:20px;">' +
    '<div style="font-size:24px;font-weight:700;color:#2A1F18;">Souk3D</div>' +
    '<div style="font-size:12px;color:#D4881F;letter-spacing:2px;">HANDMADE ARAB HERITAGE</div>' +
    "</div>" +
    inner +
    unsub +
    "</div></div>"
  );
}

function paragraphs(message) {
  return String(message || "")
    .split("\n")
    .map(function (line) {
      return line.trim()
        ? '<p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 12px;">' + esc(line) + "</p>"
        : "";
    })
    .join("");
}

function welcomeHtml(unsubUrl) {
  return shell(
    '<p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 12px;">Ahlan wa sahlan! You are now part of the Souk3D family.</p>' +
      '<div style="text-align:center;margin:22px 0;">' +
      '<div style="font-size:11px;color:#8A7A6A;letter-spacing:0.5px;font-weight:700;">YOUR WELCOME CODE — 10% OFF</div>' +
      '<div style="font-size:34px;font-weight:700;color:#D4881F;margin-top:4px;letter-spacing:2px;">WELCOME10</div>' +
      "</div>" +
      '<p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 18px;">Use it at checkout on your first order. We will only write when there is something worth sharing — new pieces, restocks and seasonal collections.</p>' +
      '<p style="text-align:center;margin:0;"><a href="' + SITE + '" style="background:#2A1F18;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;font-size:14px;">Browse the Souk</a></p>',
    unsubUrl
  );
}

async function sendEmail(payload) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error("Resend " + r.status + ": " + t.slice(0, 200));
  }
  return r.json();
}

async function sendBatch(payloads) {
  const r = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payloads),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error("Resend batch " + r.status + ": " + t.slice(0, 200));
  }
  return r.json();
}

function unsubPage(msg) {
  return (
    "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Souk3D</title></head>" +
    "<body style='background:#FAF6EF;font-family:Georgia,serif;text-align:center;padding:80px 20px;color:#2A1F18;'>" +
    "<div style='font-size:26px;font-weight:700;'>Souk3D</div>" +
    "<p style='font-size:16px;color:#666;margin-top:16px;'>" + esc(msg) + "</p>" +
    "<a href='" + SITE + "' style='color:#D4881F;'>Back to the store</a></body></html>"
  );
}

export default async function handler(req, res) {
  try {
    // Public one-click unsubscribe link from emails.
    if (req.method === "GET") {
      const token = String(req.query.unsub || "").trim();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      if (!token) return res.status(400).send(unsubPage("That unsubscribe link looks incomplete."));
      const { data, error } = await admin
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .select("email")
        .maybeSingle();
      if (error || !data) return res.status(404).send(unsubPage("We could not find that subscription. You may already be unsubscribed."));
      return res.status(200).send(unsubPage("You are unsubscribed. We will not email you again — ma'a salama."));
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const action = String(body.action || "subscribe");

    // ---- Public: subscribe from the storefront ----
    if (action === "subscribe") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });

      const { data: existing } = await admin
        .from("newsletter_subscribers")
        .select("id, status, unsubscribe_token")
        .eq("email", email)
        .maybeSingle();

      let token;
      let isNew = false;
      if (existing) {
        token = existing.unsubscribe_token;
        if (existing.status !== "subscribed") {
          await admin
            .from("newsletter_subscribers")
            .update({ status: "subscribed", unsubscribed_at: null })
            .eq("id", existing.id);
          isNew = true; // resubscribed — welcome them back
        }
      } else {
        const ins = await admin
          .from("newsletter_subscribers")
          .insert({ email: email, source: String(body.source || "site") })
          .select("unsubscribe_token")
          .single();
        if (ins.error) throw ins.error;
        token = ins.data.unsubscribe_token;
        isNew = true;
      }

      if (isNew) {
        const unsubUrl = SITE + "/api/newsletter?unsub=" + token;
        try {
          await sendEmail({
            from: FROM_EMAIL,
            to: email,
            reply_to: REPLY_TO,
            subject: "Welcome to the Souk3D family ✦ Here is 10% off",
            html: welcomeHtml(unsubUrl),
          });
        } catch (e) {
          console.error("Welcome email failed:", e.message);
          // Subscription still succeeded; do not fail the request.
        }
      }
      return res.status(200).json({ ok: true, already: !isNew });
    }

    // ---- Admin actions below ----
    const user = await requireAdmin(req);
    if (!user) return res.status(401).json({ error: "Not authorised." });

    if (action === "list") {
      const { data, error } = await admin
        .from("newsletter_subscribers")
        .select("id, email, status, source, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json({ subscribers: data || [] });
    }

    if (action === "send") {
      const subject = String(body.subject || "").trim();
      const message = String(body.message || "").trim();
      if (!subject) return res.status(400).json({ error: "Please add a subject line." });
      if (!message) return res.status(400).json({ error: "Please write the email body." });

      const inner = paragraphs(message);

      // Test send: only to the signed-in admin.
      if (body.test) {
        await sendEmail({
          from: FROM_EMAIL,
          to: user.email,
          reply_to: REPLY_TO,
          subject: "[TEST] " + subject,
          html: shell(inner, SITE),
        });
        return res.status(200).json({ ok: true, sent: 1, test: true });
      }

      const { data: subs, error } = await admin
        .from("newsletter_subscribers")
        .select("email, unsubscribe_token")
        .eq("status", "subscribed");
      if (error) throw error;
      if (!subs || subs.length === 0) return res.status(400).json({ error: "There are no subscribers yet." });

      let sent = 0;
      const failed = [];
      // Resend batch accepts up to 100 emails per call.
      for (let i = 0; i < subs.length; i += 100) {
        const chunk = subs.slice(i, i + 100).map(function (s) {
          return {
            from: FROM_EMAIL,
            to: s.email,
            reply_to: REPLY_TO,
            subject: subject,
            html: shell(inner, SITE + "/api/newsletter?unsub=" + s.unsubscribe_token),
          };
        });
        try {
          await sendBatch(chunk);
          sent += chunk.length;
        } catch (e) {
          console.error("Campaign chunk failed:", e.message);
          failed.push(chunk.length);
        }
      }
      const failedCount = failed.reduce(function (a, b) { return a + b; }, 0);
      return res.status(200).json({ ok: true, sent: sent, failed: failedCount });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (e) {
    console.error("newsletter error:", e);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
