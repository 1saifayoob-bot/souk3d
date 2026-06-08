import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const ROLES = ["super_admin", "admin", "lister"];

export default async function handler(req, res) {
  const authz = req.headers.authorization || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData || !userData.user) return res.status(401).json({ error: "Invalid session" });
  const callerId = userData.user.id;

  const { data: prof } = await admin.from("profiles").select("role").eq("id", callerId).single();
  if (!prof || prof.role !== "super_admin") return res.status(403).json({ error: "Super Admin access only" });

  const action = req.method === "GET" ? "list" : (req.body && req.body.action);

  try {
    if (action === "list") {
      const { data, error } = await admin.from("profiles").select("id, email, role, created_at").order("created_at");
      if (error) throw error;
      return res.status(200).json({ users: data || [] });
    }
    if (action === "create") {
      const { email, password, role } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      const r = ROLES.includes(role) ? role : "lister";
      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      await admin.from("profiles").upsert({ id: created.user.id, email, role: r });
      return res.status(200).json({ ok: true, id: created.user.id });
    }
    if (action === "setrole") {
      const { id, role } = req.body || {};
      const r = ROLES.includes(role) ? role : "lister";
      if (id === callerId && r !== "super_admin") return res.status(400).json({ error: "You cannot change your own Super Admin role" });
      const { error } = await admin.from("profiles").update({ role: r }).eq("id", id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    if (action === "delete") {
      const { id } = req.body || {};
      if (id === callerId) return res.status(400).json({ error: "You cannot delete your own account" });
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error("admin-users error", e);
    return res.status(500).json({ error: e.message });
  }
}
