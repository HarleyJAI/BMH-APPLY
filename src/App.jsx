import { useState, useEffect } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "https://wilhuljumgshlgmnpuya.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbGh1bGp1bWdzaGxnbW5wdXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODc4NjksImV4cCI6MjA5MTg2Mzg2OX0.Z_9DDK4n0PGbEjAZjPO_cc_j_DvFvvRAF829xDCvJW8";

const headers = {
  "apikey":        SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "return=representation",
};

async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error((await r.json()).message);
  return r.json();
}

async function sbPost(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json()).message);
  return r.json();
}

async function sbPatch(table, id, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Update failed"); }
}

// ─── CONSTANTS ─────────────────────────────────────────────────────
const LANE_LABELS = {
  concierge_home_draws:        "Concierge",
  clinical_trials:             "Clinical Trials",
  wellness_events:             "Wellness",
  pediatric_support:           "Pediatric",
  premium_concierge:           "Premium",
  rapid_response:              "Rapid Response",
  routine_specimen_collection: "Routine",
};

const LANES = Object.entries(LANE_LABELS).map(([value, label]) => ({ value, label }));

// ─── ENV CHECK ─────────────────────────────────────────────────────
// This app requires a real browser environment with network access to
// supabase.co. It will not function inside sandboxed iframe previews
// (e.g. Claude.ai artifacts). Run locally with Vite or deploy to
// Netlify/Vercel for full functionality.

const CAPS = [
  { key: "adult_draws",         label: "Adult draws" },
  { key: "pediatric_draws",     label: "Pediatric" },
  { key: "geriatric_draws",     label: "Geriatric" },
  { key: "hard_stick",          label: "Hard stick" },
  { key: "specimen_processing", label: "Specimen proc." },
  { key: "centrifuge_access",   label: "Centrifuge" },
  { key: "same_day_available",  label: "Same-day" },
  { key: "weekend_available",   label: "Weekends" },
  { key: "urgent_stat_ready",   label: "STAT ready" },
  { key: "own_vehicle",         label: "Own vehicle" },
];

const RISK = {
  unknown:  { bg: "#f1f5f9", text: "#64748b", dot: "#94a3b8" },
  low:      { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  medium:   { bg: "#fffbeb", text: "#b45309", dot: "#f59e0b" },
  high:     { bg: "#fff1f2", text: "#be123c", dot: "#f43f5e" },
  critical: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
};

const STATUS = {
  pre_onboarding: { bg: "#f8fafc", text: "#475569", label: "Pre-onboarding" },
  in_progress:    { bg: "#eff6ff", text: "#1d4ed8", label: "In progress" },
  active:         { bg: "#f0fdf4", text: "#15803d", label: "Active" },
  inactive:       { bg: "#f8fafc", text: "#94a3b8", label: "Inactive" },
  suspended:      { bg: "#fff1f2", text: "#be123c", label: "Suspended" },
};

// ─── GLOBAL STYLES ─────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

  input, select, textarea {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    color: #0f172a;
    padding: 9px 12px;
    outline: none;
    width: 100%;
    transition: border-color .15s, box-shadow .15s;
  }
  input:focus, select:focus, textarea:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px #6366f115;
  }
  select option { background: #fff; }
  textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

  .pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
    padding: 3px 9px; border-radius: 20px;
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  .toggle { display: flex; align-items: center; gap: 9px; padding: 9px 12px;
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px;
    cursor: pointer; user-select: none; transition: border-color .12s, background .12s; }
  .toggle.on { border-color: #6366f1; background: #eef2ff; }
  .toggle-box { width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid #cbd5e1;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    transition: background .12s, border-color .12s; }
  .toggle.on .toggle-box { background: #6366f1; border-color: #6366f1; }
  .toggle-box::after { content: ''; width: 7px; height: 4px;
    border-left: 1.5px solid #fff; border-bottom: 1.5px solid #fff;
    transform: rotate(-45deg) translateY(-1px); opacity: 0; }
  .toggle.on .toggle-box::after { opacity: 1; }
  .toggle-lbl { font-family: 'DM Mono', monospace; font-size: 11px; color: #64748b; }
  .toggle.on .toggle-lbl { color: #4f46e5; }

  .card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
    box-shadow: 0 1px 4px #0000000a; }
  .section-hd {
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .18em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px;
  }
  .section-hd::after { content: ''; flex: 1; height: 1px; background: #f1f5f9; }

  .btn-primary {
    background: #0f172a; border: none; border-radius: 9px; color: #fff;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; padding: 12px 28px;
    transition: background .15s, transform .1s; letter-spacing: .01em;
  }
  .btn-primary:hover { background: #1e293b; transform: translateY(-1px); }
  .btn-primary:active { transform: none; }
  .btn-primary:disabled { opacity: .4; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: none; border: 1.5px solid #e2e8f0; border-radius: 8px;
    color: #64748b; cursor: pointer; font-family: 'DM Mono', monospace;
    font-size: 11px; padding: 7px 14px; letter-spacing: .05em;
    text-transform: uppercase; transition: border-color .15s, color .15s;
  }
  .btn-ghost:hover { border-color: #6366f1; color: #4f46e5; }

  .field-label {
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .1em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; display: block;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px; }
  .span-2 { grid-column: span 2; }
  .span-3 { grid-column: span 3; }

  @media (max-width: 640px) {
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .span-2, .span-3 { grid-column: span 1; }
  }
`;

// ─── SHARED COMPONENTS ─────────────────────────────────────────────

function ScoreBadge({ score }) {
  const color = !score ? "#94a3b8" : score >= 8 ? "#15803d" : score >= 6 ? "#b45309" : "#be123c";
  const bg    = !score ? "#f8fafc" : score >= 8 ? "#f0fdf4" : score >= 6 ? "#fffbeb" : "#fff1f2";
  return (
    <div style={{ width: 40, height: 40, borderRadius: 8, background: bg, color,
      fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "DM Mono, monospace",
      border: `1.5px solid ${color}30`, flexShrink: 0 }}>
      {score ?? "—"}
    </div>
  );
}

function CompDot({ ok, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
        background: ok ? "#22c55e" : "#f43f5e" }} />
      <span style={{ fontSize: 11, color: ok ? "#15803d" : "#dc2626",
        fontFamily: "DM Mono, monospace" }}>{label}</span>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className={`toggle${checked ? " on" : ""}`} onClick={() => onChange(!checked)}>
      <span className="toggle-box" />
      <span className="toggle-lbl">{label}</span>
    </label>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}

// ─── SIDEBAR NAV ───────────────────────────────────────────────────

function Sidebar({ page, setPage, counts }) {
  const nav = [
    { key: "dashboard",  icon: "▤", label: "Dashboard",       sub: `${counts.total} contractors` },
    { key: "intake",     icon: "＋", label: "Add Contractor",  sub: "New intake form" },
    { key: "import",     icon: "↑", label: "CSV Import",      sub: "Bulk upload" },
    { key: "onboarding", icon: "✦", label: "Onboarding Form", sub: "Public application" },
  ];

  return (
    <div style={{ width: 220, background: "#fff", borderRight: "1.5px solid #e2e8f0",
      display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh",
      position: "sticky", top: 0 }}>

      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#0f172a",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>B</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", lineHeight: 1.2 }}>BMH Registry</div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "DM Mono, monospace", letterSpacing: ".04em" }}>
              Phlebotomist Network
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {nav.map(({ key, icon, label, sub }) => {
          const active = page === key;
          return (
            <div key={key} onClick={() => setPage(key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 9, cursor: "pointer", marginBottom: 3,
              background: active ? "#f1f5f9" : "transparent",
              transition: "background .12s",
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0,
                color: active ? "#4f46e5" : "#94a3b8" }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? "#0f172a" : "#475569" }}>{label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "DM Mono, monospace" }}>{sub}</div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Status footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: "Active",  value: counts.active,  color: "#15803d" },
            { label: "Gaps",    value: counts.gaps,    color: "#b45309" },
            { label: "Pending", value: counts.pending, color: "#0369a1" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#f8fafc", borderRadius: 6,
              padding: "4px 8px", textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "DM Mono, monospace" }}>{value}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", fontFamily: "DM Mono, monospace",
                textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ────────────────────────────────────────────────

function DetailPanel({ p, onClose, onRefresh }) {
  if (!p) return null;
  const creds = p.phlebotomist_credentials?.[0]  || {};
  const cap   = p.phlebotomist_capabilities?.[0] || {};
  const pay   = p.phlebotomist_pay?.[0]           || {};
  const terrs = p.phlebotomist_territories        || [];
  const lanes = (p.service_lanes || []).filter(l => l.active);

  const [dnuModal, setDnuModal]   = useState(false);
  const [dnuReason, setDnuReason] = useState("");
  const [dnuLoading, setDnuLoad] = useState(false);
  const [dnuError, setDnuError]   = useState("");

  // ── EDIT MODE ──
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [editForm, setEditForm] = useState({
    full_name: p.full_name || "",
    phone:     p.phone || "",
    email:     p.email || "",
    city:      p.city || "",
    state:     p.state || "",
    zip_code:  p.zip_code || "",
    travel_radius_miles: p.travel_radius_miles || "",
    onboarding_status:   p.onboarding_status || "pre_onboarding",
    agreement_status:    p.agreement_status || "not_signed",
    compliance_risk_level: p.compliance_risk_level || "unknown",
    operational_fit_score: p.operational_fit_score || "",
    notes: p.notes || "",
  });
  const sE = (k, v) => setEditForm(x => ({ ...x, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setSaveErr("");
    try {
      await sbPatch("phlebotomists", p.id, {
        ...editForm,
        travel_radius_miles:   editForm.travel_radius_miles ? parseInt(editForm.travel_radius_miles) : null,
        operational_fit_score: editForm.operational_fit_score ? parseInt(editForm.operational_fit_score) : null,
      });
      setEditing(false);
      onRefresh();
    } catch(e) { setSaveErr(e.message); }
    setSaving(false);
  };

  const EInput = ({ k, placeholder, type="text", style={} }) => (
    <input type={type} value={editForm[k]} onChange={e => sE(k, e.target.value)}
      placeholder={placeholder}
      style={{ width:"100%", background:"#fff", border:"1.5px solid #3b9ede",
        borderRadius:7, padding:"6px 9px", fontFamily:"inherit",
        fontSize:12, color:"#0f172a", outline:"none", ...style }} />
  );

  const ESelect = ({ k, options }) => (
    <select value={editForm[k]} onChange={e => sE(k, e.target.value)}
      style={{ width:"100%", background:"#fff", border:"1.5px solid #3b9ede",
        borderRadius:7, padding:"6px 9px", fontFamily:"inherit",
        fontSize:12, color:"#0f172a", outline:"none" }}>
      {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
    </select>
  );

  const isDNU = !!p.do_not_use;

  const handleFlagDNU = async () => {
    if (!dnuReason.trim()) { setDnuError("A reason is required."); return; }
    setDnuLoad(true); setDnuError("");
    try {
      await sbPatch("phlebotomists", p.id, {
        do_not_use: true,
        do_not_use_reason: dnuReason.trim(),
        do_not_use_at: new Date().toISOString(),
        do_not_use_by: "Admin",
      });
      setDnuModal(false);
      onRefresh();
    } catch(e) { setDnuError(e.message); }
    setDnuLoad(false);
  };

  const handleClearDNU = async () => {
    if (!confirm("Remove Do Not Use flag for " + p.full_name + "?")) return;
    try {
      await sbPatch("phlebotomists", p.id, {
        do_not_use: false, do_not_use_reason: null,
        do_not_use_at: null, do_not_use_by: null,
      });
      onRefresh();
    } catch(e) { alert(e.message); }
  };

  const Row = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 0", borderBottom: "1px solid #f8fafc" }}>
      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "DM Mono, monospace",
        textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#0f172a", fontFamily: "DM Mono, monospace",
        textAlign: "right", maxWidth: "58%" }}>{value ?? <span style={{ color: "#cbd5e1" }}>—</span>}</span>
    </div>
  );

  const Bool = ({ v }) => v
    ? <span style={{ color: "#15803d", fontFamily: "DM Mono, monospace", fontSize: 12 }}>✓ Yes</span>
    : <span style={{ color: "#f43f5e", fontFamily: "DM Mono, monospace", fontSize: 12 }}>✗ No</span>;

  const Sec = ({ title }) => (
    <div style={{ fontSize: 10, fontFamily: "DM Mono, monospace", letterSpacing: ".15em",
      textTransform: "uppercase", color: "#94a3b8", marginTop: 20, marginBottom: 8,
      paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>{title}</div>
  );

  return (
    <div style={{ width: 360, background: isDNU ? "#fff5f5" : "#fff",
      borderLeft: `1.5px solid ${isDNU ? "#fecaca" : "#e2e8f0"}`,
      overflowY: "auto", flexShrink: 0, height: "100vh", position: "sticky",
      top: 0, padding: "24px 22px" }}>

      {/* DNU Modal */}
      {dnuModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 28px 24px",
            width: 420, boxShadow: "0 20px 60px #00000030" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
              Flag as Do Not Use
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 18, lineHeight: 1.6 }}>
              This will mark <strong>{p.full_name}</strong> with a red flag visible to all admins. They will remain in the registry for audit purposes.
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em",
              textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>
              Reason <span style={{ color: "#e53e3e" }}>*</span>
            </div>
            <textarea
              value={dnuReason}
              onChange={e => setDnuReason(e.target.value)}
              placeholder="Explain why this phlebotomist should not be used..."
              style={{ width: "100%", minHeight: 90, border: "1.5px solid #e2e8f0",
                borderRadius: 9, padding: "10px 12px", fontFamily: "inherit",
                fontSize: 13, outline: "none", resize: "vertical", marginBottom: 4 }}
            />
            {dnuError && (
              <div style={{ fontSize: 12, color: "#c53030", marginBottom: 10,
                fontFamily: "DM Mono, monospace" }}>{dnuError}</div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => { setDnuModal(false); setDnuReason(""); setDnuError(""); }}
                style={{ flex: 1, background: "none", border: "1.5px solid #e2e8f0",
                  borderRadius: 9, padding: "10px", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, color: "#64748b" }}>
                Cancel
              </button>
              <button onClick={handleFlagDNU} disabled={dnuLoading}
                style={{ flex: 1, background: "#dc2626", border: "none",
                  borderRadius: 9, padding: "10px", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  color: "#fff", opacity: dnuLoading ? .5 : 1 }}>
                {dnuLoading ? "Flagging…" : "🚫 Confirm Flag"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing
            ? <EInput k="full_name" placeholder="Full name" style={{ fontSize:15, fontWeight:700, marginBottom:4 }} />
            : <div style={{ fontSize: 18, fontWeight: 800,
                color: isDNU ? "#991b1b" : "#0f172a", marginBottom: 3 }}>{p.full_name}</div>
          }
          <div style={{ fontSize: 11, color: isDNU ? "#f87171" : "#94a3b8",
            fontFamily: "DM Mono, monospace" }}>{p.city}, {p.state}</div>
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0, marginLeft:8 }}>
          {!editing && !isDNU && (
            <button onClick={() => setEditing(true)}
              style={{ background:"#0d1b2a", border:"none", borderRadius:7,
                padding:"6px 12px", cursor:"pointer", fontSize:11,
                fontWeight:600, color:"#fff" }}>Edit</button>
          )}
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none",
            borderRadius: 7, width: 30, height: 30, cursor: "pointer",
            fontSize: 16, color: "#64748b", display: "flex", alignItems: "center",
            justifyContent: "center" }}>×</button>
        </div>
      </div>

      {/* DNU Banner */}
      {isDNU && (
        <div style={{ background: "#dc2626", borderRadius: 10, padding: "12px 14px",
          marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff",
            letterSpacing: ".04em", marginBottom: 4 }}>🚫 DO NOT USE</div>
          <div style={{ fontSize: 11, color: "#fecaca", lineHeight: 1.6,
            fontFamily: "DM Mono, monospace" }}>{p.do_not_use_reason}</div>
          {p.do_not_use_at && (
            <div style={{ fontSize: 10, color: "#fca5a5", marginTop: 6,
              fontFamily: "DM Mono, monospace" }}>
              Flagged {new Date(p.do_not_use_at).toLocaleDateString()}
              {p.do_not_use_by ? ` by ${p.do_not_use_by}` : ""}
            </div>
          )}
          <button onClick={handleClearDNU}
            style={{ marginTop: 10, background: "rgba(255,255,255,.15)", border: "none",
              borderRadius: 6, padding: "5px 12px", color: "#fff", cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>
            Remove Flag
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span className="pill" style={{
          background: STATUS[p.onboarding_status]?.bg || "#f8fafc",
          color:      STATUS[p.onboarding_status]?.text || "#475569" }}>
          {STATUS[p.onboarding_status]?.label || p.onboarding_status}
        </span>
        <span className="pill" style={{
          background: RISK[p.compliance_risk_level]?.bg || "#f1f5f9",
          color:      RISK[p.compliance_risk_level]?.text || "#64748b" }}>
          <span className="dot" style={{ background: RISK[p.compliance_risk_level]?.dot || "#94a3b8" }} />
          {p.compliance_risk_level} risk
        </span>
        <span className="pill" style={{ background: "#f8fafc", color: "#475569" }}>
          Score: {p.operational_fit_score ?? "—"}/10
        </span>
      </div>

      {/* DNU Flag Button */}
      {!isDNU && (
        <button onClick={() => setDnuModal(true)}
          style={{ width: "100%", background: "none", border: "1.5px solid #fecaca",
            borderRadius: 9, padding: "9px 14px", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: 600,
            color: "#dc2626", marginBottom: 16, transition: "all .12s" }}
          onMouseOver={e => e.target.style.background="#fff5f5"}
          onMouseOut={e => e.target.style.background="none"}>
          🚫 Flag as Do Not Use
        </button>
      )}

      <Sec title="Contact" />
      {editing ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>Phone</div><EInput k="phone" placeholder="Phone"/></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>Email</div><EInput k="email" placeholder="Email" type="email"/></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>City</div><EInput k="city" placeholder="City"/></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>State</div><EInput k="state" placeholder="ST"/></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>ZIP</div><EInput k="zip_code" placeholder="00000"/></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>Radius (mi)</div><EInput k="travel_radius_miles" placeholder="0" type="number"/></div>
        </div>
      ) : (
        <>
          <Row label="Phone"  value={p.phone} />
          <Row label="Email"  value={p.email} />
          <Row label="Radius" value={p.travel_radius_miles ? `${p.travel_radius_miles} mi` : null} />
        </>
      )}

      <Sec title="Status & Score" />
      {editing ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>Onboarding Status</div>
            <ESelect k="onboarding_status" options={[["pre_onboarding","Pre-Onboarding"],["in_progress","In Progress"],["active","Active"],["inactive","Inactive"],["suspended","Suspended"]]} /></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>Agreement</div>
            <ESelect k="agreement_status" options={[["not_signed","Not Signed"],["sent","Sent"],["signed","Signed"]]} /></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>Risk Level</div>
            <ESelect k="compliance_risk_level" options={[["unknown","Unknown"],["low","Low"],["medium","Medium"],["high","High"]]} /></div>
          <div><div style={{ fontSize:10, color:"#94a3b8", fontFamily:"DM Mono,monospace", textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>Score (1-10)</div>
            <EInput k="operational_fit_score" placeholder="1-10" type="number"/></div>
        </div>
      ) : null}

      <Sec title="Credentials" />
      <Row label="Cert type"   value={creds.cert_type} />
      <Row label="Cert #"      value={creds.cert_number} />
      <Row label="Issuing body" value={creds.issuing_body} />
      <Row label="Cert exp."   value={creds.expiration_date} />
      <Row label="CPR/BLS"     value={<Bool v={creds.cpr_bls_current} />} />
      <Row label="CPR exp."    value={creds.cpr_bls_expiration} />
      <Row label="Insurance"   value={<Bool v={creds.liability_insurance} />} />
      <Row label="Ins. exp."   value={creds.insurance_expiration} />
      <Row label="Background"  value={creds.background_check_status?.replace(/_/g, " ")} />
      <Row label="Driver lic." value={<Bool v={creds.driver_license} />} />

      <Sec title="Capabilities" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 0" }}>
        {CAPS.map(({ key, label }) => (
          <CompDot key={key} ok={!!cap[key]} label={label} />
        ))}
      </div>
      {cap.preferred_lab_dropoff && (
        <div style={{ marginTop: 10 }}>
          <Row label="Pref. lab" value={cap.preferred_lab_dropoff} />
        </div>
      )}

      <Sec title="Compensation" />
      <Row label="Pay model"    value={pay.pay_model?.replace(/_/g, " ")} />
      <Row label="Per-draw"     value={pay.per_draw_rate ? `$${pay.per_draw_rate}` : null} />
      <Row label="Hourly"       value={pay.hourly_rate ? `$${pay.hourly_rate}/hr` : null} />
      <Row label="Travel reimb." value={<Bool v={pay.travel_reimbursement} />} />
      <Row label="Mileage"      value={pay.mileage_rate ? `$${pay.mileage_rate}/mi` : null} />

      <Sec title="Territories" />
      {terrs.length ? terrs.map((t, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between",
          padding: "7px 0", borderBottom: "1px solid #f8fafc" }}>
          <span style={{ fontSize: 12, color: "#0f172a",
            fontFamily: "DM Mono, monospace" }}>{t.county}, {t.state}</span>
          <span style={{ fontSize: 11, color: "#94a3b8",
            fontFamily: "DM Mono, monospace" }}>{t.territory_type}</span>
        </div>
      )) : <div style={{ fontSize: 12, color: "#94a3b8",
        fontFamily: "DM Mono, monospace" }}>None on file</div>}

      <Sec title="Service Lanes" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {lanes.length ? lanes.map(l => (
          <span key={l.lane_name} className="pill"
            style={{ background: "#eff6ff", color: "#1d4ed8" }}>
            {LANE_LABELS[l.lane_name] || l.lane_name}
          </span>
        )) : <span style={{ fontSize: 12, color: "#94a3b8",
          fontFamily: "DM Mono, monospace" }}>None assigned</span>}
      </div>

      <Sec title="Notes" />
      {editing ? (
        <textarea value={editForm.notes} onChange={e => sE("notes", e.target.value)}
          placeholder="Notes about this phlebotomist..."
          style={{ width:"100%", minHeight:72, border:"1.5px solid #3b9ede",
            borderRadius:9, padding:"8px 10px", fontFamily:"inherit",
            fontSize:12, color:"#0f172a", outline:"none", resize:"vertical",
            lineHeight:1.6, marginBottom:4 }} />
      ) : p.notes ? (
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7,
          background: "#f8fafc", borderRadius: 8, padding: 12 }}>{p.notes}</div>
      ) : (
        <div style={{ fontSize:12, color:"#94a3b8", fontFamily:"DM Mono,monospace" }}>No notes</div>
      )}

      {/* ── EDIT ACTION BUTTONS ── */}
      {editing && (
        <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
          {saveErr && <div style={{ fontSize:11, color:"#c53030", marginBottom:10,
            fontFamily:"DM Mono,monospace", background:"#fff5f5",
            border:"1px solid #fecaca", borderRadius:7, padding:"6px 10px" }}>{saveErr}</div>}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { setEditing(false); setSaveErr(""); }}
              style={{ flex:1, background:"none", border:"1.5px solid #e2e8f0",
                borderRadius:9, padding:"10px", cursor:"pointer",
                fontFamily:"inherit", fontSize:13, color:"#64748b" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex:1, background:"#0d1b2a", border:"none",
                borderRadius:9, padding:"10px", cursor:"pointer",
                fontFamily:"inherit", fontSize:13, fontWeight:700,
                color:"#fff", opacity: saving ? .5 : 1 }}>
              {saving ? "Saving…" : "Save Changes ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardPage({ data, loading, error, onSelect, selected }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const hasGap = p => {
    const c = p.phlebotomist_credentials?.[0] || {};
    return !c.cpr_bls_current || !c.liability_insurance
      || c.background_check_status !== "clear" || p.agreement_status !== "signed";
  };

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !search
      || p.full_name.toLowerCase().includes(q)
      || (p.city || "").toLowerCase().includes(q)
      || (p.state || "").toLowerCase().includes(q);
    const matchF =
      filter === "all"           ? true :
      filter === "active"        ? p.onboarding_status === "active" && !p.do_not_use :
      filter === "gaps"          ? hasGap(p) && !p.do_not_use :
      filter === "pre_onboarding"? p.onboarding_status === "pre_onboarding" && !p.do_not_use :
      filter === "do_not_use"    ? p.do_not_use === true : true;
    return matchQ && matchF;
  });

  const counts = {
    all:            data.filter(p => !p.do_not_use).length,
    active:         data.filter(p => p.onboarding_status === "active" && !p.do_not_use).length,
    gaps:           data.filter(p => hasGap(p) && !p.do_not_use).length,
    pre_onboarding: data.filter(p => p.onboarding_status === "pre_onboarding" && !p.do_not_use).length,
    do_not_use:     data.filter(p => p.do_not_use).length,
  };

  const FILTERS = [
    { key: "all",            label: "All" },
    { key: "active",         label: "Active" },
    { key: "gaps",           label: "Has Gaps" },
    { key: "pre_onboarding", label: "Pre-Onboarding" },
    { key: "do_not_use",     label: "🚫 Do Not Use" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a",
            marginBottom: 4 }}>Contractor Registry</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Compliance status, capabilities, and service lane assignments
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: "Total",         value: counts.all,            color: "#4f46e5", bg: "#eef2ff" },
            { label: "Active",        value: counts.active,         color: "#15803d", bg: "#f0fdf4" },
            { label: "Compliance Gaps", value: counts.gaps,         color: "#b45309", bg: "#fffbeb" },
            { label: "Pre-Onboarding", value: counts.pre_onboarding, color: "#0369a1", bg: "#f0f9ff" },
            { label: "🚫 Do Not Use", value: counts.do_not_use,     color: "#dc2626", bg: "#fff5f5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "DM Mono, monospace",
                textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, city, state..."
            style={{ flex: 1, minWidth: 200 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {FILTERS.map(({ key, label }) => (
              <button key={key}
                onClick={() => setFilter(key)}
                style={{
                  background: filter === key ? "#0f172a" : "#fff",
                  border: `1.5px solid ${filter === key ? "#0f172a" : "#e2e8f0"}`,
                  borderRadius: 8, color: filter === key ? "#fff" : "#64748b",
                  cursor: "pointer", fontFamily: "DM Mono, monospace",
                  fontSize: 11, padding: "7px 13px", transition: "all .15s",
                  whiteSpace: "nowrap",
                }}>
                {label} <span style={{ opacity: .55 }}>({counts[key]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8",
            fontFamily: "DM Mono, monospace", fontSize: 13 }}>Loading registry…</div>
        )}
        {error && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a",
            borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e", marginBottom: 4 }}>
              Cannot reach Supabase
            </div>
            <div style={{ fontSize: 12, color: "#b45309", fontFamily: "DM Mono, monospace", lineHeight: 1.6 }}>
              This app must run in a real browser environment.<br />
              Run locally: <strong>npm run dev</strong> · or deploy to Netlify / Vercel.<br />
              Sandboxed previews (like Claude artifacts) block external API calls.
            </div>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8",
            fontFamily: "DM Mono, monospace", fontSize: 13 }}>
            No contractors match this filter.
          </div>
        )}
        {!loading && !error && (
          <div style={{ display: "grid",
            gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 14 }}>
            {filtered.map(p => {
              const creds   = p.phlebotomist_credentials?.[0] || {};
              const lanes   = (p.service_lanes || []).filter(l => l.active);
              const gapCount = [
                !creds.cpr_bls_current, !creds.liability_insurance,
                creds.background_check_status !== "clear",
                p.agreement_status !== "signed", !p.phone, !p.email,
              ].filter(Boolean).length;
              const risk   = RISK[p.compliance_risk_level]  || RISK.unknown;
              const stat   = STATUS[p.onboarding_status]    || STATUS.pre_onboarding;
              const active = selected?.id === p.id;

              return (
                <div key={p.id} onClick={() => onSelect(active ? null : p)}
                  className="card" style={{
                    padding: "18px 20px", cursor: "pointer",
                    background: p.do_not_use ? "#fff5f5" : "#fff",
                    border: `1.5px solid ${p.do_not_use ? "#fca5a5" : active ? "#6366f1" : "#e2e8f0"}`,
                    boxShadow: active ? "0 0 0 3px #6366f115" : "0 1px 4px #0000000a",
                    transition: "border-color .15s",
                    opacity: p.do_not_use ? 0.9 : 1,
                  }}>
                  {p.do_not_use && (
                    <div style={{ background: "#dc2626", borderRadius: 7,
                      padding: "6px 10px", marginBottom: 12,
                      display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>🚫</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#fff",
                          letterSpacing: ".06em" }}>DO NOT USE</div>
                        {p.do_not_use_reason && (
                          <div style={{ fontSize: 10, color: "#fecaca",
                            fontFamily: "DM Mono, monospace", marginTop: 1,
                            whiteSpace: "nowrap", overflow: "hidden",
                            textOverflow: "ellipsis", maxWidth: 260 }}>
                            {p.do_not_use_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12,
                    alignItems: "flex-start", marginBottom: 14 }}>
                    <ScoreBadge score={p.operational_fit_score} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15,
                        color: p.do_not_use ? "#991b1b" : "#0f172a", marginBottom: 2 }}>{p.full_name}</div>
                      <div style={{ fontSize: 11, color: p.do_not_use ? "#f87171" : "#94a3b8",
                        fontFamily: "DM Mono, monospace" }}>
                        {p.city}{p.state ? `, ${p.state}` : ""}
                        {p.travel_radius_miles ? ` · ${p.travel_radius_miles}mi` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column",
                      alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                      <span className="pill"
                        style={{ background: stat.bg, color: stat.text }}>
                        {stat.label}
                      </span>
                      <span className="pill"
                        style={{ background: risk.bg, color: risk.text }}>
                        <span className="dot" style={{ background: risk.dot }} />
                        {p.compliance_risk_level}
                      </span>
                    </div>
                  </div>

                  {/* Compliance grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "5px 12px", padding: "10px 12px", background: "#f8fafc",
                    borderRadius: 8, border: "1px solid #f1f5f9", marginBottom: 12 }}>
                    <CompDot ok={!!creds.cpr_bls_current}                   label="CPR/BLS" />
                    <CompDot ok={!!creds.liability_insurance}                label="Insurance" />
                    <CompDot ok={creds.background_check_status === "clear"}  label="Background" />
                    <CompDot ok={p.agreement_status === "signed"}            label="Agreement" />
                    <CompDot ok={!!p.phone}                                  label="Phone" />
                    <CompDot ok={!!p.email}                                  label="Email" />
                  </div>

                  {/* Lanes */}
                  {lanes.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap",
                      gap: 5, marginBottom: gapCount > 0 ? 10 : 0 }}>
                      {lanes.map(l => (
                        <span key={l.lane_name} className="pill"
                          style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                          {LANE_LABELS[l.lane_name] || l.lane_name}
                        </span>
                      ))}
                    </div>
                  )}

                  {gapCount > 0 && (
                    <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace",
                      color: "#b45309", background: "#fffbeb",
                      border: "1px solid #fde68a", borderRadius: 6, padding: "5px 10px" }}>
                      ⚠ {gapCount} gap{gapCount > 1 ? "s" : ""} pending
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DetailPanel p={selected} onClose={() => onSelect(null)} onRefresh={() => { fetchData(); onSelect(null); }} />
    </div>
  );
}

// ─── INTAKE PAGE ───────────────────────────────────────────────────

const emptyTerr = () => ({ county: "", state: "", zip_code: "", territory_type: "primary" });

function IntakePage({ onSuccess }) {
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", city: "", state: "", zip_code: "",
    travel_radius_miles: "", onboarding_status: "pre_onboarding",
    agreement_status: "not_signed", compliance_risk_level: "unknown",
    operational_fit_score: null, notes: "",
  });
  const [creds, setCreds] = useState({
    cert_type: "", cert_number: "", issuing_body: "", expiration_date: "",
    cpr_bls_current: false, cpr_bls_expiration: "",
    liability_insurance: false, insurance_expiration: "",
    background_check_status: "not_submitted", background_check_date: "",
    driver_license: false,
  });
  const [caps, setCaps]         = useState(Object.fromEntries(CAPS.map(c => [c.key, false])));
  const [preferredLab, setLab]  = useState("");
  const [pay, setPay]           = useState({ pay_model: "per_draw", per_draw_rate: "", hourly_rate: "", travel_reimbursement: false, mileage_rate: "" });
  const [territories, setTerrs] = useState([emptyTerr()]);
  const [lanes, setLanes]       = useState([]);
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const sF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const sC = (k, v) => setCreds(p => ({ ...p, [k]: v }));
  const sP = (k, v) => setPay(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setStatus({ type: "error", msg: "Full name is required." }); return; }
    setLoading(true); setStatus(null);
    try {
      const [phleb] = await sbPost("phlebotomists", {
        ...form,
        travel_radius_miles:   form.travel_radius_miles ? parseInt(form.travel_radius_miles) : null,
        operational_fit_score: form.operational_fit_score,
      });
      const id = phleb.id;

      const credPayload = { phlebotomist_id: id, ...creds };
      ["expiration_date","cpr_bls_expiration","insurance_expiration","background_check_date"]
        .forEach(k => { if (!credPayload[k]) delete credPayload[k]; });
      await sbPost("phlebotomist_credentials", credPayload);

      await sbPost("phlebotomist_capabilities", {
        phlebotomist_id: id, ...caps, preferred_lab_dropoff: preferredLab || null,
      });

      const payPayload = { phlebotomist_id: id, ...pay };
      ["per_draw_rate","hourly_rate","mileage_rate"]
        .forEach(k => { if (!payPayload[k]) delete payPayload[k]; });
      await sbPost("phlebotomist_pay", payPayload);

      for (const t of territories.filter(t => t.state.trim()))
        await sbPost("phlebotomist_territories", { phlebotomist_id: id, ...t });

      for (const lane of lanes)
        await sbPost("service_lanes", { phlebotomist_id: id, lane_name: lane, active: true });

      setStatus({ type: "success", msg: `✓ ${form.full_name} added to the registry.` });
      onSuccess();
    } catch (e) { setStatus({ type: "error", msg: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", maxWidth: 820 }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
          Add Contractor
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          New phlebotomist onboarding · All data saves directly to Supabase
        </div>
      </div>

      {/* IDENTITY */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <div className="section-hd">Identity</div>
        <div className="grid-2" style={{ gap: 14 }}>
          <div className="span-2">
            <Field label="Full name *">
              <input value={form.full_name} onChange={e => sF("full_name", e.target.value)} placeholder="First Last" />
            </Field>
          </div>
          <Field label="Phone">
            <input value={form.phone} onChange={e => sF("phone", e.target.value)} placeholder="(000) 000-0000" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => sF("email", e.target.value)} placeholder="name@email.com" />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={e => sF("city", e.target.value)} />
          </Field>
          <Field label="State">
            <input value={form.state} onChange={e => sF("state", e.target.value)} placeholder="MD" maxLength={2} />
          </Field>
          <Field label="ZIP Code">
            <input value={form.zip_code} onChange={e => sF("zip_code", e.target.value)} />
          </Field>
          <Field label="Travel radius (miles)">
            <input type="number" value={form.travel_radius_miles} onChange={e => sF("travel_radius_miles", e.target.value)} placeholder="30" />
          </Field>
        </div>
      </div>

      {/* STATUS */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <div className="section-hd">Status & Scoring</div>
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <Field label="Onboarding status">
            <select value={form.onboarding_status} onChange={e => sF("onboarding_status", e.target.value)}>
              <option value="pre_onboarding">Pre-onboarding</option>
              <option value="in_progress">In progress</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </Field>
          <Field label="Agreement status">
            <select value={form.agreement_status} onChange={e => sF("agreement_status", e.target.value)}>
              <option value="not_signed">Not signed</option>
              <option value="pending">Pending</option>
              <option value="signed">Signed</option>
            </select>
          </Field>
          <Field label="Compliance risk">
            <select value={form.compliance_risk_level} onChange={e => sF("compliance_risk_level", e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
        </div>
        <Field label="Operational fit score (1–10)">
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => {
              const sel = form.operational_fit_score === n;
              return (
                <button key={n} onClick={() => sF("operational_fit_score", n)} style={{
                  width: 38, height: 38, borderRadius: 7, border: `1.5px solid ${sel ? "#6366f1" : "#e2e8f0"}`,
                  background: sel ? "#6366f1" : "#fff", color: sel ? "#fff" : "#64748b",
                  cursor: "pointer", fontFamily: "DM Mono, monospace", fontWeight: sel ? 700 : 400,
                  fontSize: 13, transition: "all .12s",
                }}>{n}</button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* CREDENTIALS */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <div className="section-hd">Credentials</div>
        <div className="grid-3" style={{ marginBottom: 14 }}>
          <Field label="Cert type"><input value={creds.cert_type} onChange={e => sC("cert_type", e.target.value)} placeholder="NPA / ASCP / AMT" /></Field>
          <Field label="Cert number"><input value={creds.cert_number} onChange={e => sC("cert_number", e.target.value)} /></Field>
          <Field label="Issuing body"><input value={creds.issuing_body} onChange={e => sC("issuing_body", e.target.value)} /></Field>
          <Field label="Cert expiration"><input type="date" value={creds.expiration_date} onChange={e => sC("expiration_date", e.target.value)} /></Field>
          <Field label="CPR/BLS expiration"><input type="date" value={creds.cpr_bls_expiration} onChange={e => sC("cpr_bls_expiration", e.target.value)} /></Field>
          <Field label="Insurance expiration"><input type="date" value={creds.insurance_expiration} onChange={e => sC("insurance_expiration", e.target.value)} /></Field>
          <Field label="Background check">
            <select value={creds.background_check_status} onChange={e => sC("background_check_status", e.target.value)}>
              <option value="not_submitted">Not submitted</option>
              <option value="pending">Pending</option>
              <option value="clear">Clear</option>
              <option value="flagged">Flagged</option>
            </select>
          </Field>
          <Field label="BG check date"><input type="date" value={creds.background_check_date} onChange={e => sC("background_check_date", e.target.value)} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <Toggle checked={creds.cpr_bls_current}    onChange={v => sC("cpr_bls_current", v)}    label="CPR/BLS current" />
          <Toggle checked={creds.liability_insurance} onChange={v => sC("liability_insurance", v)} label="Liability insurance" />
          <Toggle checked={creds.driver_license}      onChange={v => sC("driver_license", v)}      label="Driver license" />
        </div>
      </div>

      {/* CAPABILITIES */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <div className="section-hd">Capabilities</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14 }}>
          {CAPS.map(({ key, label }) => (
            <Toggle key={key} checked={caps[key]} onChange={v => setCaps(p => ({ ...p, [key]: v }))} label={label} />
          ))}
        </div>
        <Field label="Preferred lab drop-off">
          <input value={preferredLab} onChange={e => setLab(e.target.value)} placeholder="LabCorp Hagerstown, Quest Frederick..." />
        </Field>
      </div>

      {/* PAY */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <div className="section-hd">Compensation</div>
        <div className="grid-4" style={{ marginBottom: 14 }}>
          <Field label="Pay model">
            <select value={pay.pay_model} onChange={e => sP("pay_model", e.target.value)}>
              <option value="per_draw">Per draw</option>
              <option value="hourly">Hourly</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Per-draw ($)"><input type="number" value={pay.per_draw_rate} onChange={e => sP("per_draw_rate", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Hourly rate ($)"><input type="number" value={pay.hourly_rate} onChange={e => sP("hourly_rate", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Mileage ($/mi)"><input type="number" step=".001" value={pay.mileage_rate} onChange={e => sP("mileage_rate", e.target.value)} placeholder="0.670" /></Field>
        </div>
        <Toggle checked={pay.travel_reimbursement} onChange={v => sP("travel_reimbursement", v)} label="Travel reimbursement required" />
      </div>

      {/* TERRITORIES */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <div className="section-hd">Territory Coverage</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {territories.map((t, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 130px 32px", gap: 8, alignItems: "end" }}>
              <Field label={i === 0 ? "County" : ""}>
                <input value={t.county} onChange={e => setTerrs(p => p.map((r, j) => j === i ? { ...r, county: e.target.value } : r))} placeholder="County name" />
              </Field>
              <Field label={i === 0 ? "State" : ""}>
                <input value={t.state} onChange={e => setTerrs(p => p.map((r, j) => j === i ? { ...r, state: e.target.value } : r))} placeholder="ST" maxLength={2} />
              </Field>
              <Field label={i === 0 ? "Type" : ""}>
                <select value={t.territory_type} onChange={e => setTerrs(p => p.map((r, j) => j === i ? { ...r, territory_type: e.target.value } : r))}>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="occasional">Occasional</option>
                </select>
              </Field>
              <button onClick={() => setTerrs(p => p.filter((_, j) => j !== i))}
                style={{ height: 38, background: "none", border: "1.5px solid #e2e8f0",
                  borderRadius: 7, color: "#94a3b8", cursor: "pointer", fontSize: 16,
                  transition: "border-color .12s, color .12s", marginTop: i === 0 ? 21 : 0 }}
                onMouseEnter={e => { e.target.style.borderColor = "#f43f5e"; e.target.style.color = "#f43f5e"; }}
                onMouseLeave={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.color = "#94a3b8"; }}>×</button>
            </div>
          ))}
        </div>
        <button className="btn-ghost" onClick={() => setTerrs(p => [...p, emptyTerr()])}>+ Add territory</button>
      </div>

      {/* SERVICE LANES */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <div className="section-hd">Service Lanes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {LANES.map(({ value, label }) => (
            <label key={value}
              className={`toggle${lanes.includes(value) ? " on" : ""}`}
              onClick={() => setLanes(p => p.includes(value) ? p.filter(x => x !== value) : [...p, value])}>
              <span className="toggle-box" />
              <span className="toggle-lbl">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* NOTES */}
      <div className="card" style={{ padding: "22px 24px", marginBottom: 28 }}>
        <div className="section-hd">Admin Notes</div>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => sF("notes", e.target.value)}
            placeholder="Experience notes, referral source, follow-up flags..." />
        </Field>
      </div>

      {/* SUBMIT */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving…" : "Add to Registry"}
        </button>
        {status && (
          <div style={{
            fontSize: 12, fontFamily: "DM Mono, monospace",
            padding: "9px 14px", borderRadius: 7,
            background: status.type === "success" ? "#f0fdf4" : "#fff1f2",
            border: `1px solid ${status.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
            color: status.type === "success" ? "#15803d" : "#be123c",
          }}>{status.msg}</div>
        )}
      </div>
    </div>
  );
}

// ─── CSV IMPORT PAGE ───────────────────────────────────────────────

// Maps Tags field from fleet export to service lanes
function tagsToLanes(tags) {
  if (!tags || tags === "-") return [];
  const t = tags.toLowerCase();
  const lanes = [];
  if (t.includes("phleb")) lanes.push("routine_specimen_collection");
  if (t.includes("mlb"))   lanes.push("premium_concierge");
  if (t.includes("uds"))   lanes.push("routine_specimen_collection");
  if (t.includes("pediatric")) lanes.push("pediatric_support");
  if (t.includes("centrifuge")) lanes.push("clinical_trials");
  return [...new Set(lanes)];
}

// Cleans phone numbers from scientific notation and formatting
function cleanPhone(raw) {
  if (!raw || raw === "-") return null;
  const str = String(raw).replace(/\D/g, "");
  if (str.length < 7 || str.length > 15) return null;
  return str.startsWith("1") && str.length === 11 ? str : str;
}

// Maps fleet status to onboarding_status enum
function mapStatus(status) {
  if (!status || status === "-") return "pre_onboarding";
  const s = status.toLowerCase();
  if (s === "blocked") return "suspended";
  if (s === "active" || s === "idle" || s === "offline") return "pre_onboarding";
  return "pre_onboarding";
}

// Determines if a row is a real phlebotomist (not test/admin/junk)
function isValidPhleb(row) {
  const name = `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim();
  if (!name || name.length < 2) return false;
  const junkNames = ["testing", "test", "yourhealth", "your health", "oconnor hospital",
    "manhattan labs", "st john", "pedialabs", "pedia", "bob barker", "hitesh", "neeraj",
    "khushboo", "rohit", "aditya", "gsgs", "abc", "ash gaba", "awax"];
  if (junkNames.some(j => name.toLowerCase().includes(j))) return false;
  const team = (row["Team"] || "").toLowerCase();
  if (team === "don`t use" || team === "null" || team === "test team") return false;
  return true;
}

// Parse CSV text into array of objects
function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  // Find header row (first row with "First Name" or "Email")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes("First Name") || lines[i].includes("Email")) {
      headerIdx = i; break;
    }
  }

  const headers = lines[headerIdx].split("\t").map(h => h.trim());
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const vals = lines[i].split("\t");
    if (vals.length < 3) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || "").trim(); });
    rows.push(obj);
  }
  return rows;
}

function ImportPage({ onSuccess }) {
  const [stage, setStage]       = useState("upload");   // upload | preview | importing | done
  const [rawRows, setRawRows]   = useState([]);
  const [validRows, setValid]   = useState([]);
  const [skipped, setSkipped]   = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: [] });
  const [dragOver, setDragOver] = useState(false);

  const processFile = (text) => {
    const all = parseCSV(text);
    const valid = all.filter(isValidPhleb);
    const skip  = all.filter(r => !isValidPhleb(r));
    setRawRows(all);
    setValid(valid);
    setSkipped(skip);
    setStage("preview");
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = e => processFile(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setStage("importing");
    setProgress({ done: 0, total: validRows.length, errors: [] });
    const errors = [];
    const CHUNK = 25;

    for (let i = 0; i < validRows.length; i += CHUNK) {
      const chunk = validRows.slice(i, i + CHUNK);
      for (const row of chunk) {
        try {
          const firstName = (row["First Name"] || "").trim();
          const lastName  = (row["Last Name"]  || "").trim();
          const fullName  = [firstName, lastName].filter(Boolean).join(" ");
          const phone     = cleanPhone(row["Phone"]);
          const email     = row["Email"]?.trim() || null;
          const rating    = parseInt(row["Rating"]);
          const score     = isNaN(rating) ? null : Math.min(rating * 2, 10);
          const lanes     = tagsToLanes(row["Tags"] || "");
          const tags      = row["Tags"] || "";

          const [phleb] = await sbPost("phlebotomists", {
            full_name:             fullName,
            phone:                 phone,
            email:                 email || undefined,
            onboarding_status:     mapStatus(row["Status"]),
            agreement_status:      "not_signed",
            compliance_risk_level: "unknown",
            operational_fit_score: score,
            notes: `Imported from fleet export. Team: ${row["Team"] || "-"}. Tags: ${tags}. Reg: ${row["Registration Date"] || "-"}.`,
          });

          const id = phleb.id;
          await sbPost("phlebotomist_credentials", { phlebotomist_id: id, cpr_bls_current: false, liability_insurance: false, background_check_status: "not_submitted", driver_license: false });
          await sbPost("phlebotomist_capabilities", {
            phlebotomist_id: id,
            adult_draws: true,
            pediatric_draws: tags.toLowerCase().includes("pediatric"),
            own_vehicle: false,
            urgent_stat_ready: false,
            same_day_available: false,
            weekend_available: false,
          });
          await sbPost("phlebotomist_pay", { phlebotomist_id: id, pay_model: "per_draw", travel_reimbursement: false });
          if (lanes.length) {
            for (const lane of [...new Set(lanes)]) {
              await sbPost("service_lanes", { phlebotomist_id: id, lane_name: lane, active: true });
            }
          }
        } catch (e) {
          errors.push({ name: `${row["First Name"]} ${row["Last Name"]}`, err: e.message });
        }
        setProgress(p => ({ ...p, done: p.done + 1, errors }));
      }
      // Small delay between chunks to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }
    setProgress(p => ({ ...p, errors }));
    setStage("done");
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>CSV Import</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Bulk import phlebotomists from your fleet export — filters junk rows automatically
        </div>
      </div>

      {/* UPLOAD STAGE */}
      {stage === "upload" && (
        <>
          {/* Format info */}
          <div className="card" style={{ padding: "18px 22px", marginBottom: 16 }}>
            <div className="section-hd">Accepted format</div>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8 }}>
              Tab-separated export from your fleet system (Tookan / dispatch platform) with columns:<br />
              <code style={{ fontSize: 11, background: "#f8fafc", padding: "2px 6px", borderRadius: 4, color: "#4f46e5" }}>
                Id · Username · First Name · Last Name · Email · Phone · Device Type · Device Version · Team · Tags · Rating · Status · Registration Date
              </code>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "#6366f1" : "#e2e8f0"}`,
              borderRadius: 14, padding: "52px 24px", textAlign: "center",
              background: dragOver ? "#eef2ff" : "#f8fafc",
              transition: "all .15s", cursor: "pointer",
              marginBottom: 16,
            }}
            onClick={() => document.getElementById("csv-input").click()}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>
              Drop your CSV or TSV file here
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>or click to browse</div>
            <input id="csv-input" type="file" accept=".csv,.tsv,.txt" style={{ display: "none" }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Paste option */}
          <div className="card" style={{ padding: "18px 22px" }}>
            <div className="section-hd">Or paste data directly</div>
            <textarea
              placeholder="Paste your tab-separated data here (include the header row)..."
              style={{ width: "100%", minHeight: 120, fontFamily: "DM Mono, monospace", fontSize: 12,
                background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
                padding: 12, color: "#0f172a", resize: "vertical" }}
              onChange={e => { if (e.target.value.includes("\t")) processFile(e.target.value); }}
            />
          </div>
        </>
      )}

      {/* PREVIEW STAGE */}
      {stage === "preview" && (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total rows",  value: rawRows.length,   color: "#4f46e5", bg: "#eef2ff" },
              { label: "Will import", value: validRows.length, color: "#15803d", bg: "#f0fdf4" },
              { label: "Skipped",     value: skipped.length,   color: "#b45309", bg: "#fffbeb" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="card" style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "DM Mono, monospace",
                  textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", fontWeight: 600,
              fontSize: 14, color: "#0f172a" }}>
              Preview — first 10 rows to import
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Name", "Email", "Phone", "Tags", "Rating", "Status", "Lanes"].map(h => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left",
                        fontFamily: "DM Mono, monospace", fontSize: 10, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: ".08em",
                        borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 10).map((row, i) => {
                    const lanes = tagsToLanes(row["Tags"] || "");
                    const phone = cleanPhone(row["Phone"]);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "8px 14px", fontWeight: 500, color: "#0f172a" }}>
                          {row["First Name"]} {row["Last Name"]}
                        </td>
                        <td style={{ padding: "8px 14px", color: "#64748b", fontFamily: "DM Mono, monospace" }}>
                          {row["Email"] || "—"}
                        </td>
                        <td style={{ padding: "8px 14px", color: "#64748b", fontFamily: "DM Mono, monospace" }}>
                          {phone || <span style={{ color: "#f43f5e" }}>invalid</span>}
                        </td>
                        <td style={{ padding: "8px 14px", color: "#64748b", fontSize: 11 }}>
                          {row["Tags"] || "—"}
                        </td>
                        <td style={{ padding: "8px 14px", color: "#64748b" }}>
                          {row["Rating"] || "—"}
                        </td>
                        <td style={{ padding: "8px 14px" }}>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10,
                            background: "#f0fdf4", color: "#15803d",
                            fontFamily: "DM Mono, monospace" }}>
                            {row["Status"] || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 14px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {lanes.map(l => (
                              <span key={l} style={{ fontSize: 10, padding: "2px 6px",
                                borderRadius: 4, background: "#eff6ff", color: "#1d4ed8",
                                fontFamily: "DM Mono, monospace" }}>
                                {LANE_LABELS[l] || l}
                              </span>
                            ))}
                            {!lanes.length && <span style={{ color: "#94a3b8", fontSize: 11 }}>—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {validRows.length > 10 && (
              <div style={{ padding: "10px 18px", fontSize: 12, color: "#94a3b8",
                fontFamily: "DM Mono, monospace", borderTop: "1px solid #f1f5f9" }}>
                + {validRows.length - 10} more rows...
              </div>
            )}
          </div>

          {/* Skipped rows info */}
          {skipped.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, fontSize: 12,
              color: "#92400e", fontFamily: "DM Mono, monospace" }}>
              ⚠ {skipped.length} rows skipped — test accounts, incomplete entries, or non-phlebotomist records
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={handleImport}>
              Import {validRows.length} Phlebotomists
            </button>
            <button className="btn-ghost" onClick={() => { setStage("upload"); setRawRows([]); setValid([]); }}>
              Start over
            </button>
          </div>
        </>
      )}

      {/* IMPORTING STAGE */}
      {stage === "importing" && (
        <div className="card" style={{ padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#0f172a", marginBottom: 8 }}>
            Importing {progress.done} of {progress.total}...
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
            Processing in batches of 25 — do not close this window
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 99, height: 10,
            overflow: "hidden", maxWidth: 480, margin: "0 auto 12px" }}>
            <div style={{ height: "100%", borderRadius: 99, background: "#6366f1",
              width: `${pct}%`, transition: "width .3s" }} />
          </div>
          <div style={{ fontSize: 13, fontFamily: "DM Mono, monospace", color: "#6366f1",
            fontWeight: 600 }}>{pct}%</div>
          {progress.errors.length > 0 && (
            <div style={{ marginTop: 16, fontSize: 12, color: "#b45309",
              fontFamily: "DM Mono, monospace" }}>
              {progress.errors.length} errors so far
            </div>
          )}
        </div>
      )}

      {/* DONE STAGE */}
      {stage === "done" && (
        <div className="card" style={{ padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#0f172a", marginBottom: 8 }}>
            Import complete
          </div>
          <div style={{ fontSize: 15, color: "#15803d", marginBottom: 6 }}>
            {progress.done - progress.errors.length} phlebotomists added to the registry
          </div>
          {progress.errors.length > 0 && (
            <div style={{ fontSize: 13, color: "#b45309", marginBottom: 20 }}>
              {progress.errors.length} rows failed — see details below
            </div>
          )}
          {progress.errors.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
              padding: 14, textAlign: "left", marginBottom: 20, maxHeight: 200, overflowY: "auto" }}>
              {progress.errors.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: "#92400e",
                  fontFamily: "DM Mono, monospace", padding: "3px 0" }}>
                  {e.name}: {e.err}
                </div>
              ))}
            </div>
          )}
          <button className="btn-primary" onClick={() => { onSuccess(); }}>
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ONBOARDING PAGE ───────────────────────────────────────────────

const OB_STEPS = [
  {id:1,label:"Personal info",icon:"01"},
  {id:2,label:"Credentials",icon:"02"},
  {id:3,label:"Capabilities",icon:"03"},
  {id:4,label:"Coverage",icon:"04"},
  {id:5,label:"Compensation",icon:"05"},
];

const OB_CAPS = [
  {key:"adult_draws",label:"Adult draws"},{key:"pediatric_draws",label:"Pediatric draws"},
  {key:"geriatric_draws",label:"Geriatric / senior"},{key:"hard_stick",label:"Hard stick"},
  {key:"specimen_processing",label:"Specimen processing"},{key:"centrifuge_access",label:"Centrifuge access"},
  {key:"same_day_available",label:"Same-day available"},{key:"weekend_available",label:"Weekend available"},
  {key:"urgent_stat_ready",label:"Urgent / STAT ready"},{key:"own_vehicle",label:"Own vehicle"},
];

const OB_LANES = [
  {value:"concierge_home_draws",label:"Concierge home draws"},
  {value:"clinical_trials",label:"Clinical trials"},
  {value:"wellness_events",label:"Wellness events"},
  {value:"pediatric_support",label:"Pediatric support"},
  {value:"premium_concierge",label:"Premium concierge"},
  {value:"rapid_response",label:"Rapid response"},
  {value:"routine_specimen_collection",label:"Routine specimen collection"},
];

const OB_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  .ob-root{display:grid;grid-template-columns:260px 1fr;min-height:100vh;font-family:'Epilogue',sans-serif;}
  .ob-side{background:#0d1b2a;padding:32px 24px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;}
  .ob-logo{display:flex;align-items:center;gap:10px;margin-bottom:32px;}
  .ob-mark{width:36px;height:36px;background:#e8f4fd;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#0d1b2a;flex-shrink:0;}
  .ob-brand{font-size:12px;font-weight:600;color:#fff;line-height:1.3;}
  .ob-brand span{display:block;font-size:10px;font-weight:400;color:#4a6fa5;letter-spacing:.06em;text-transform:uppercase;}
  .ob-hed{font-size:20px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-.4px;margin-bottom:6px;}
  .ob-sub{font-size:12px;color:#4a6fa5;line-height:1.6;margin-bottom:28px;}
  .ob-steps{list-style:none;display:flex;flex-direction:column;gap:3px;flex:1;}
  .ob-step{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;}
  .ob-step.active{background:rgba(255,255,255,.07);}
  .ob-step.done{opacity:.55;}
  .ob-step.upcoming{opacity:.28;}
  .ob-num{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;flex-shrink:0;}
  .ob-step.active .ob-num{background:#3b9ede;color:#fff;}
  .ob-step.done .ob-num{background:#1a5c38;color:#5de6a0;font-size:13px;}
  .ob-step.upcoming .ob-num{background:rgba(255,255,255,.06);color:#4a6fa5;}
  .ob-slabel{font-size:12px;font-weight:500;color:#fff;}
  .ob-foot{margin-top:auto;padding-top:20px;border-top:0.5px solid rgba(255,255,255,.08);font-family:'JetBrains Mono',monospace;font-size:10px;color:#2d4a6a;letter-spacing:.04em;}
  .ob-main{padding:40px 48px 80px;background:#f8fafc;overflow-y:auto;}
  .ob-shell{max-width:620px;}
  .ob-prog{height:3px;background:#e2e8f0;border-radius:99px;margin-bottom:36px;overflow:hidden;}
  .ob-prog-fill{height:100%;background:#3b9ede;border-radius:99px;transition:width .4s ease;}
  .ob-step-hdr{margin-bottom:28px;}
  .ob-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3b9ede;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px;}
  .ob-title{font-size:24px;font-weight:800;letter-spacing:-.4px;color:#0d1b2a;margin-bottom:4px;}
  .ob-desc{font-size:13px;color:#64748b;line-height:1.6;}
  .ob-flabel{display:block;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#475569;margin-bottom:5px;}
  .ob-flabel .req{color:#e53e3e;}
  .ob-fgroup{margin-bottom:16px;}
  .ob-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
  .ob-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;}
  .ob-input{width:100%;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 13px;font-family:'Epilogue',sans-serif;font-size:13px;color:#0d1b2a;outline:none;transition:border-color .15s,box-shadow .15s;}
  .ob-input:focus{border-color:#3b9ede;box-shadow:0 0 0 3px rgba(59,158,222,.1);}
  .ob-input::placeholder{color:#cbd5e0;}
  .ob-chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;}
  .ob-chip{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;cursor:pointer;user-select:none;transition:border-color .12s,background .12s;}
  .ob-chip:hover{border-color:#93c5fd;}
  .ob-chip.on{border-color:#3b9ede;background:#eff8ff;}
  .ob-check-box{width:16px;height:16px;border-radius:4px;border:1.5px solid #cbd5e0;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .12s;}
  .ob-chip.on .ob-check-box{background:#3b9ede;border-color:#3b9ede;}
  .ob-check-mark{width:8px;height:5px;border-left:1.5px solid #fff;border-bottom:1.5px solid #fff;transform:rotate(-45deg) translateY(-1px);opacity:0;transition:opacity .1s;}
  .ob-chip.on .ob-check-mark{opacity:1;}
  .ob-chip-lbl{font-size:12px;font-weight:500;color:#475569;}
  .ob-chip.on .ob-chip-lbl{color:#1e3a5f;}
  .ob-hr{border:none;border-top:1px solid #f1f5f9;margin:20px 0;}
  .ob-mini-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;}
  .ob-terr-row{display:grid;grid-template-columns:1fr 60px 120px 32px;gap:8px;align-items:end;margin-bottom:8px;}
  .ob-btn-rm{width:32px;height:38px;background:none;border:1.5px solid #e2e8f0;border-radius:8px;color:#94a3b8;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
  .ob-btn-rm:hover{border-color:#fca5a5;color:#ef4444;}
  .ob-btn-add-terr{width:100%;background:none;border:1.5px dashed #cbd5e0;border-radius:9px;color:#94a3b8;cursor:pointer;font-size:12px;padding:9px;font-family:'Epilogue',sans-serif;transition:border-color .12s,color .12s;}
  .ob-btn-add-terr:hover{border-color:#3b9ede;color:#3b9ede;}
  .ob-score-row{display:flex;gap:5px;margin-bottom:16px;}
  .ob-score-btn{width:38px;height:38px;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;color:#94a3b8;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;transition:all .12s;}
  .ob-score-btn:hover{border-color:#3b9ede;color:#3b9ede;}
  .ob-score-btn.sel{background:#0d1b2a;border-color:#0d1b2a;color:#fff;font-weight:500;}
  .ob-nav{display:flex;justify-content:space-between;align-items:center;margin-top:36px;padding-top:24px;border-top:1px solid #f1f5f9;}
  .ob-btn-back{background:none;border:1.5px solid #e2e8f0;border-radius:10px;color:#64748b;cursor:pointer;font-family:'Epilogue',sans-serif;font-size:13px;font-weight:500;padding:10px 22px;transition:all .12s;}
  .ob-btn-back:hover{border-color:#94a3b8;color:#0d1b2a;}
  .ob-btn-next{background:#0d1b2a;border:none;border-radius:10px;color:#fff;cursor:pointer;font-family:'Epilogue',sans-serif;font-size:13px;font-weight:700;padding:10px 26px;transition:all .12s;}
  .ob-btn-next:hover{background:#1a3a5c;}
  .ob-btn-submit{background:#1a5c38;border:none;border-radius:10px;color:#fff;cursor:pointer;font-family:'Epilogue',sans-serif;font-size:13px;font-weight:700;padding:10px 26px;transition:all .12s;}
  .ob-btn-submit:hover{background:#0f3d25;}
  .ob-btn-submit:disabled{opacity:.4;cursor:not-allowed;}
  .ob-alert{padding:10px 14px;border-radius:8px;font-size:12px;margin-top:12px;font-family:'JetBrains Mono',monospace;}
  .ob-alert.error{background:#fff5f5;border:1px solid #fecaca;color:#c53030;}
  .ob-success{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 40px;min-height:400px;}
  .ob-success-icon{width:64px;height:64px;background:#f0fff4;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;border:1.5px solid #9ae6b4;}
  .ob-success-title{font-size:24px;font-weight:800;color:#0d1b2a;margin-bottom:8px;letter-spacing:-.4px;}
  .ob-success-msg{font-size:13px;color:#64748b;line-height:1.7;max-width:380px;margin-bottom:20px;}
  .ob-success-id{font-family:'JetBrains Mono',monospace;font-size:10px;color:#94a3b8;background:#f8fafc;border:1px solid #e2e8f0;padding:6px 14px;border-radius:6px;letter-spacing:.06em;margin-bottom:24px;}
  @media(max-width:860px){.ob-root{grid-template-columns:1fr;}.ob-side{position:static;height:auto;padding:24px;}.ob-steps{flex-direction:row;flex-wrap:wrap;gap:6px;}.ob-main{padding:24px 20px 60px;}}
`;

function ObChip({ checked, onChange, label }) {
  return (
    <div className={`ob-chip${checked ? " on" : ""}`} onClick={onChange}>
      <div className="ob-check-box"><div className="ob-check-mark" /></div>
      <span className="ob-chip-lbl">{label}</span>
    </div>
  );
}

function ObField({ label, required, children }) {
  return (
    <div className="ob-fgroup">
      <label className="ob-flabel">{label}{required && <span className="req"> *</span>}</label>
      {children}
    </div>
  );
}

function OnboardingPage({ onSuccess }) {
  const [step, setStep]     = useState(1);
  const [done, setDone]     = useState(false);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");
  const [savedId, setSaved] = useState("");

  const [p, setP] = useState({ full_name:"", phone:"", email:"", city:"", state:"", zip_code:"", travel_radius_miles:"" });
  const [c, setC] = useState({ cert_type:"", cert_number:"", issuing_body:"", expiration_date:"", cpr_bls_current:false, cpr_bls_expiration:"", liability_insurance:false, insurance_expiration:"", background_check_status:"not_submitted", driver_license:false });
  const [caps, setCaps]   = useState(Object.fromEntries(OB_CAPS.map(x => [x.key, false])));
  const [lab, setLab]     = useState("");
  const [lanes, setLanes] = useState([]);
  const [terrs, setTerrs] = useState([{ county:"", state:"", territory_type:"primary" }]);
  const [pay, setPay]     = useState({ pay_model:"per_draw", per_draw_rate:"", hourly_rate:"", travel_reimbursement:false, mileage_rate:"" });
  const [score, setScore] = useState(null);
  const [notes, setNotes] = useState("");

  const pct = ((step - 1) / (OB_STEPS.length - 1)) * 100;
  const sP  = (k, v) => setP(x => ({ ...x, [k]: v }));
  const sC  = (k, v) => setC(x => ({ ...x, [k]: v }));
  const sPy = (k, v) => setPay(x => ({ ...x, [k]: v }));

  const stepState = s => s < step ? "done" : s === step ? "active" : "upcoming";

  const goNext = () => {
    if (step === 1 && !p.full_name.trim()) { setError("Full name is required."); return; }
    if (step === 1 && !p.phone.trim())     { setError("Phone number is required."); return; }
    setError("");
    if (step < OB_STEPS.length) { setStep(s => s + 1); }
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoad(true); setError("");
    try {
      const [phleb] = await sbPost("phlebotomists", {
        ...p,
        travel_radius_miles: p.travel_radius_miles ? parseInt(p.travel_radius_miles) : null,
        onboarding_status: "in_progress",
        agreement_status: "not_signed",
        compliance_risk_level: "unknown",
        operational_fit_score: score,
        notes: notes || "Self-submitted via BMH onboarding form",
      });
      const id = phleb.id;
      setSaved(id);

      const credBody = { phlebotomist_id: id, ...c };
      ["expiration_date","cpr_bls_expiration","insurance_expiration"]
        .forEach(k => { if (!credBody[k]) delete credBody[k]; });
      await sbPost("phlebotomist_credentials", credBody);
      await sbPost("phlebotomist_capabilities", { phlebotomist_id: id, ...caps, preferred_lab_dropoff: lab || null });

      const payBody = { phlebotomist_id: id, ...pay };
      ["per_draw_rate","hourly_rate","mileage_rate"]
        .forEach(k => { payBody[k] = payBody[k] ? parseFloat(payBody[k]) : null; });
      await sbPost("phlebotomist_pay", payBody);

      for (const t of terrs.filter(t => t.state.trim()))
        await sbPost("phlebotomist_territories", { phlebotomist_id: id, ...t });
      for (const lane of lanes)
        await sbPost("service_lanes", { phlebotomist_id: id, lane_name: lane, active: true });

      setDone(true);
    } catch (e) { setError(e.message); }
    setLoad(false);
  };

  const Sidebar = () => (
    <div className="ob-side">
      <div className="ob-logo">
        <div className="ob-mark">B</div>
        <div className="ob-brand">Beyond Mobile Health<span>Phlebotomist network</span></div>
      </div>
      {done ? (
        <>
          <div className="ob-hed">Application submitted</div>
          <div className="ob-sub">Our team will review your profile and reach out within 2–3 business days.</div>
        </>
      ) : (
        <>
          <div className="ob-hed">Join the BMH network</div>
          <div className="ob-sub">Complete your contractor profile. Takes about 5 minutes.</div>
          <ul className="ob-steps">
            {OB_STEPS.map(s => (
              <li key={s.id} className={`ob-step ${stepState(s.id)}`}>
                <div className="ob-num">{stepState(s.id) === "done" ? "✓" : s.icon}</div>
                <span className="ob-slabel">{s.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="ob-foot">HIPAA compliant · Secure submission<br />© {new Date().getFullYear()} Beyond Mobile Health</div>
    </div>
  );

  if (done) return (
    <div className="ob-root" style={{ flex: 1, overflow: "hidden" }}>
      <style>{OB_CSS}</style>
      <Sidebar />
      <div className="ob-main" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div className="ob-success">
          <div className="ob-success-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#1a5c38" strokeWidth="1.5"/>
              <path d="M8 14.5L12 18.5L20 10" stroke="#1a5c38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="ob-success-title">You're in the system.</div>
          <div className="ob-success-msg">Thank you for applying to the BMH Phlebotomist Network. Your profile is now under review. You'll hear from our team within 2–3 business days.</div>
          {savedId && <div className="ob-success-id">REFERENCE ID · {savedId.slice(0,8).toUpperCase()}</div>}
          <button className="ob-btn-submit" onClick={() => { setDone(false); setStep(1); onSuccess(); }}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ob-root" style={{ flex: 1, overflow: "hidden" }}>
      <style>{OB_CSS}</style>
      <Sidebar />
      <div className="ob-main">
        <div className="ob-shell">
          <div className="ob-prog"><div className="ob-prog-fill" style={{ width: `${pct}%` }} /></div>

          {step === 1 && (
            <>
              <div className="ob-step-hdr">
                <div className="ob-eyebrow">Step 01 of 05</div>
                <div className="ob-title">Personal information</div>
                <div className="ob-desc">Basic contact info — how BMH will reach you for assignments.</div>
              </div>
              <ObField label="Full name" required><input className="ob-input" value={p.full_name} onChange={e => sP("full_name", e.target.value)} placeholder="First and last name" /></ObField>
              <div className="ob-grid2">
                <ObField label="Phone" required><input className="ob-input" value={p.phone} onChange={e => sP("phone", e.target.value)} placeholder="(000) 000-0000" /></ObField>
                <ObField label="Email"><input className="ob-input" type="email" value={p.email} onChange={e => sP("email", e.target.value)} placeholder="you@email.com" /></ObField>
              </div>
              <div className="ob-grid3">
                <ObField label="City"><input className="ob-input" value={p.city} onChange={e => sP("city", e.target.value)} placeholder="City" /></ObField>
                <ObField label="State"><input className="ob-input" value={p.state} onChange={e => sP("state", e.target.value)} placeholder="MD" maxLength={2} /></ObField>
                <ObField label="ZIP"><input className="ob-input" value={p.zip_code} onChange={e => sP("zip_code", e.target.value)} placeholder="00000" /></ObField>
              </div>
              <ObField label="Travel radius (miles)"><input className="ob-input" type="number" value={p.travel_radius_miles} onChange={e => sP("travel_radius_miles", e.target.value)} placeholder="How far will you travel?" /></ObField>
            </>
          )}

          {step === 2 && (
            <>
              <div className="ob-step-hdr">
                <div className="ob-eyebrow">Step 02 of 05</div>
                <div className="ob-title">Credentials & compliance</div>
                <div className="ob-desc">Your certifications and compliance docs. Verified before activation.</div>
              </div>
              <div className="ob-mini-lbl">Phlebotomy certification</div>
              <div className="ob-grid3">
                <ObField label="Cert type">
                  <select className="ob-input" value={c.cert_type} onChange={e => sC("cert_type", e.target.value)}>
                    <option value="">Select</option>
                    {["NPA","ASCP","AMT","NCCT","NCCPT","Other"].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </ObField>
                <ObField label="Cert number"><input className="ob-input" value={c.cert_number} onChange={e => sC("cert_number", e.target.value)} placeholder="Certificate #" /></ObField>
                <ObField label="Expiration"><input className="ob-input" type="date" value={c.expiration_date} onChange={e => sC("expiration_date", e.target.value)} /></ObField>
              </div>
              <ObField label="Issuing body"><input className="ob-input" value={c.issuing_body} onChange={e => sC("issuing_body", e.target.value)} placeholder="e.g. National Phlebotomy Association" /></ObField>
              <hr className="ob-hr" />
              <div className="ob-mini-lbl">Additional compliance</div>
              <div className="ob-chip-grid" style={{ gridTemplateColumns:"1fr 1fr 1fr", marginBottom:14 }}>
                <ObChip checked={c.cpr_bls_current}    onChange={() => sC("cpr_bls_current", !c.cpr_bls_current)}       label="CPR/BLS current" />
                <ObChip checked={c.liability_insurance} onChange={() => sC("liability_insurance", !c.liability_insurance)} label="Liability insurance" />
                <ObChip checked={c.driver_license}      onChange={() => sC("driver_license", !c.driver_license)}           label="Driver license" />
              </div>
              <div className="ob-grid3">
                <ObField label="CPR/BLS exp."><input className="ob-input" type="date" value={c.cpr_bls_expiration} onChange={e => sC("cpr_bls_expiration", e.target.value)} /></ObField>
                <ObField label="Insurance exp."><input className="ob-input" type="date" value={c.insurance_expiration} onChange={e => sC("insurance_expiration", e.target.value)} /></ObField>
                <ObField label="Background check">
                  <select className="ob-input" value={c.background_check_status} onChange={e => sC("background_check_status", e.target.value)}>
                    <option value="not_submitted">Not submitted</option>
                    <option value="pending">Pending</option>
                    <option value="clear">Clear</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </ObField>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="ob-step-hdr">
                <div className="ob-eyebrow">Step 03 of 05</div>
                <div className="ob-title">Skills & availability</div>
                <div className="ob-desc">Select everything that applies to your current skillset.</div>
              </div>
              <div className="ob-mini-lbl">Draw capabilities & availability</div>
              <div className="ob-chip-grid" style={{ marginBottom:16 }}>
                {OB_CAPS.map(({ key, label }) => (
                  <ObChip key={key} checked={caps[key]} onChange={() => setCaps(x => ({ ...x, [key]: !x[key] }))} label={label} />
                ))}
              </div>
              <ObField label="Preferred lab drop-off"><input className="ob-input" value={lab} onChange={e => setLab(e.target.value)} placeholder="e.g. LabCorp Hagerstown, Quest Frederick..." /></ObField>
              <hr className="ob-hr" />
              <div className="ob-mini-lbl">Service lanes — select all you qualify for</div>
              <div className="ob-chip-grid">
                {OB_LANES.map(({ value, label }) => (
                  <ObChip key={value} checked={lanes.includes(value)} onChange={() => setLanes(x => x.includes(value) ? x.filter(v => v !== value) : [...x, value])} label={label} />
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="ob-step-hdr">
                <div className="ob-eyebrow">Step 04 of 05</div>
                <div className="ob-title">Territory coverage</div>
                <div className="ob-desc">Where do you operate? Add all counties and states you regularly cover.</div>
              </div>
              <div style={{ marginBottom: 10 }}>
                {terrs.map((t, i) => (
                  <div key={i} className="ob-terr-row">
                    <div>
                      {i === 0 && <label className="ob-flabel">County</label>}
                      <input className="ob-input" value={t.county} onChange={e => setTerrs(x => x.map((r, j) => j === i ? { ...r, county: e.target.value } : r))} placeholder="County name" />
                    </div>
                    <div>
                      {i === 0 && <label className="ob-flabel">State</label>}
                      <input className="ob-input" value={t.state} onChange={e => setTerrs(x => x.map((r, j) => j === i ? { ...r, state: e.target.value } : r))} placeholder="ST" maxLength={2} />
                    </div>
                    <div>
                      {i === 0 && <label className="ob-flabel">Type</label>}
                      <select className="ob-input" value={t.territory_type} onChange={e => setTerrs(x => x.map((r, j) => j === i ? { ...r, territory_type: e.target.value } : r))}>
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                        <option value="occasional">Occasional</option>
                      </select>
                    </div>
                    <button className="ob-btn-rm" style={{ marginTop: i === 0 ? 20 : 0 }} onClick={() => setTerrs(x => x.filter((_, j) => j !== i))}>×</button>
                  </div>
                ))}
              </div>
              <button className="ob-btn-add-terr" onClick={() => setTerrs(x => [...x, { county:"", state:"", territory_type:"primary" }])}>+ Add territory</button>
            </>
          )}

          {step === 5 && (
            <>
              <div className="ob-step-hdr">
                <div className="ob-eyebrow">Step 05 of 05</div>
                <div className="ob-title">Compensation & final details</div>
                <div className="ob-desc">Pay preferences. All rates are negotiable during onboarding.</div>
              </div>
              <div className="ob-grid2">
                <ObField label="Pay model">
                  <select className="ob-input" value={pay.pay_model} onChange={e => sPy("pay_model", e.target.value)}>
                    <option value="per_draw">Per draw</option>
                    <option value="hourly">Hourly</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </ObField>
                <ObField label="Per-draw rate ($)"><input className="ob-input" type="number" value={pay.per_draw_rate} onChange={e => sPy("per_draw_rate", e.target.value)} placeholder="0.00" /></ObField>
              </div>
              <div className="ob-grid2">
                <ObField label="Hourly rate ($)"><input className="ob-input" type="number" value={pay.hourly_rate} onChange={e => sPy("hourly_rate", e.target.value)} placeholder="0.00" /></ObField>
                <ObField label="Mileage rate ($/mi)"><input className="ob-input" type="number" step=".001" value={pay.mileage_rate} onChange={e => sPy("mileage_rate", e.target.value)} placeholder="0.670" /></ObField>
              </div>
              <div className="ob-chip-grid" style={{ gridTemplateColumns:"1fr", marginBottom:18 }}>
                <ObChip checked={pay.travel_reimbursement} onChange={() => sPy("travel_reimbursement", !pay.travel_reimbursement)} label="I require travel reimbursement" />
              </div>
              <hr className="ob-hr" />
              <div className="ob-mini-lbl">Self-assessment score (1–10)</div>
              <div className="ob-score-row">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} className={`ob-score-btn${score === n ? " sel" : ""}`} onClick={() => setScore(n)}>{n}</button>
                ))}
              </div>
              <ObField label="Additional notes">
                <textarea className="ob-input" style={{ minHeight:80, resize:"vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Specialties, preferred hours, anything else..." />
              </ObField>
            </>
          )}

          {error && <div className="ob-alert error">{error}</div>}

          <div className="ob-nav">
            {step > 1
              ? <button className="ob-btn-back" onClick={() => { setError(""); setStep(s => s - 1); }}>← Back</button>
              : <div />
            }
            {step < OB_STEPS.length
              ? <button className="ob-btn-next" onClick={goNext}>Continue →</button>
              : <button className="ob-btn-submit" onClick={goNext} disabled={loading}>{loading ? "Submitting…" : "Submit application ✓"}</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]       = useState("dashboard");
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const rows = await sbGet(
        "phlebotomists?select=id,full_name,city,state,onboarding_status,compliance_risk_level,operational_fit_score,agreement_status,travel_radius_miles,phone,email,notes,do_not_use,do_not_use_reason,do_not_use_at,do_not_use_by,phlebotomist_credentials(cert_type,cert_number,issuing_body,expiration_date,cpr_bls_current,cpr_bls_expiration,liability_insurance,insurance_expiration,background_check_status,background_check_date,driver_license),phlebotomist_capabilities(adult_draws,pediatric_draws,geriatric_draws,hard_stick,specimen_processing,centrifuge_access,urgent_stat_ready,same_day_available,weekend_available,own_vehicle,preferred_lab_dropoff),phlebotomist_pay(pay_model,per_draw_rate,hourly_rate,travel_reimbursement,mileage_rate),phlebotomist_territories(county,state,territory_type),service_lanes(lane_name,active)&order=do_not_use.asc,operational_fit_score.desc.nullslast"
      );
      setData(rows);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const hasGap = p => {
    const c = p.phlebotomist_credentials?.[0] || {};
    return !c.cpr_bls_current || !c.liability_insurance
      || c.background_check_status !== "clear" || p.agreement_status !== "signed";
  };

  const counts = {
    total:   data.length,
    active:  data.filter(p => p.onboarding_status === "active").length,
    gaps:    data.filter(hasGap).length,
    pending: data.filter(p => ["pre_onboarding","in_progress"].includes(p.onboarding_status)).length,
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar page={page} setPage={p => { setPage(p); setSelected(null); }} counts={counts} />
        {page === "dashboard" && (
          <DashboardPage
            data={data} loading={loading} error={error}
            onSelect={setSelected} selected={selected}
          />
        )}
        {page === "intake" && (
          <IntakePage onSuccess={() => { fetchData(); setPage("dashboard"); }} />
        )}
        {page === "import" && (
          <ImportPage onSuccess={() => { fetchData(); setPage("dashboard"); }} />
        )}
        {page === "onboarding" && (
          <OnboardingPage onSuccess={() => { fetchData(); setPage("dashboard"); }} />
        )}
      </div>
    </>
  );
}
