import { useState } from "react";

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || "https://wilhuljumgshlgmnpuya.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbGh1bGp1bWdzaGxnbW5wdXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODc4NjksImV4cCI6MjA5MTg2Mzg2OX0.Z_9DDK4n0PGbEjAZjPO_cc_j_DvFvvRAF829xDCvJW8";

const H = {
  "Content-Type":  "application/json",
  "apikey":        SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Prefer":        "return=representation",
};

async function post(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers: H, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json()).message || "Submission failed");
  return r.json();
}

const STEPS = [
  { id: 1, label: "Personal info",    icon: "01" },
  { id: 2, label: "Credentials",      icon: "02" },
  { id: 3, label: "Capabilities",     icon: "03" },
  { id: 4, label: "Coverage",         icon: "04" },
  { id: 5, label: "Compensation",     icon: "05" },
];

const CAPS = [
  { key: "adult_draws",         label: "Adult draws" },
  { key: "pediatric_draws",     label: "Pediatric draws" },
  { key: "geriatric_draws",     label: "Geriatric / senior" },
  { key: "hard_stick",          label: "Hard stick" },
  { key: "specimen_processing", label: "Specimen processing" },
  { key: "centrifuge_access",   label: "Centrifuge access" },
  { key: "same_day_available",  label: "Same-day available" },
  { key: "weekend_available",   label: "Weekend available" },
  { key: "urgent_stat_ready",   label: "Urgent / STAT ready" },
  { key: "own_vehicle",         label: "Own vehicle" },
];

const LANES = [
  { value: "concierge_home_draws",        label: "Concierge home draws" },
  { value: "clinical_trials",             label: "Clinical trials" },
  { value: "wellness_events",             label: "Wellness events" },
  { value: "pediatric_support",           label: "Pediatric support" },
  { value: "premium_concierge",           label: "Premium concierge" },
  { value: "rapid_response",              label: "Rapid response" },
  { value: "routine_specimen_collection", label: "Routine specimen collection" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    font-family: 'Epilogue', sans-serif;
    background: #f4f6f9;
    color: #0d1b2a;
    min-height: 100vh;
  }

  .root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 300px 1fr;
  }

  /* ── SIDEBAR ── */
  .side {
    background: #0d1b2a;
    padding: 40px 28px;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 48px;
  }

  .logo-mark {
    width: 42px;
    height: 42px;
    background: #e8f4fd;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 800;
    color: #0d1b2a;
    flex-shrink: 0;
  }

  .logo-text { line-height: 1.3; }
  .logo-name {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
  }
  .logo-sub {
    font-size: 10px;
    font-weight: 400;
    color: #4a6fa5;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .side-hed {
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    line-height: 1.2;
    letter-spacing: -.5px;
    margin-bottom: 10px;
  }

  .side-sub {
    font-size: 13px;
    color: #4a6fa5;
    line-height: 1.7;
    margin-bottom: 44px;
  }

  .steps {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px;
    border-radius: 10px;
    transition: background .15s;
  }

  .step.active   { background: rgba(255,255,255,.08); }
  .step.done     { opacity: .55; }
  .step.upcoming { opacity: .28; }

  .step-num {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    flex-shrink: 0;
  }

  .step.active   .step-num { background: #3b9ede; color: #fff; }
  .step.done     .step-num { background: #1a5c38; color: #5de6a0; font-size: 14px; }
  .step.upcoming .step-num { background: rgba(255,255,255,.06); color: #4a6fa5; }

  .step-label { font-size: 13px; font-weight: 500; color: #fff; }

  .side-footer {
    margin-top: auto;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,.06);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #2d4a6a;
    letter-spacing: .04em;
    line-height: 1.8;
  }

  /* ── MAIN ── */
  .main {
    padding: 56px 52px 80px;
    overflow-y: auto;
    min-height: 100vh;
  }

  .shell { max-width: 640px; }

  /* Progress */
  .prog {
    height: 3px;
    background: #e2e8f0;
    border-radius: 99px;
    margin-bottom: 44px;
    overflow: hidden;
  }
  .prog-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b9ede, #2a7bc2);
    border-radius: 99px;
    transition: width .4s cubic-bezier(.4,0,.2,1);
  }

  /* Step header */
  .step-hdr { margin-bottom: 32px; }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #3b9ede;
    letter-spacing: .18em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -.5px;
    color: #0d1b2a;
    margin-bottom: 6px;
  }
  .desc { font-size: 14px; color: #64748b; line-height: 1.6; }

  /* Fields */
  .fgroup { margin-bottom: 18px; }
  .flabel {
    display: block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #475569;
    margin-bottom: 6px;
  }
  .flabel .req { color: #e53e3e; }

  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px; }

  input[type="text"],
  input[type="email"],
  input[type="tel"],
  input[type="number"],
  input[type="date"],
  select,
  textarea {
    width: 100%;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    font-family: 'Epilogue', sans-serif;
    font-size: 14px;
    color: #0d1b2a;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    appearance: none;
  }

  input:focus, select:focus, textarea:focus {
    border-color: #3b9ede;
    box-shadow: 0 0 0 3px rgba(59,158,222,.12);
  }

  input::placeholder { color: #c8d5e4; }
  textarea { resize: vertical; min-height: 84px; line-height: 1.6; }

  /* Chips */
  .chip-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
    margin-bottom: 18px;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 13px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    transition: border-color .12s, background .12s;
  }
  .chip:hover { border-color: #93c5fd; }
  .chip.on { border-color: #3b9ede; background: #eff8ff; }

  .cbox {
    width: 17px;
    height: 17px;
    border-radius: 5px;
    border: 1.5px solid #cbd5e0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .12s;
  }
  .chip.on .cbox { background: #3b9ede; border-color: #3b9ede; }
  .cmark {
    width: 8px; height: 5px;
    border-left: 1.5px solid #fff;
    border-bottom: 1.5px solid #fff;
    transform: rotate(-45deg) translateY(-1px);
    opacity: 0;
    transition: opacity .1s;
  }
  .chip.on .cmark { opacity: 1; }
  .chip-lbl { font-size: 13px; font-weight: 500; color: #475569; }
  .chip.on .chip-lbl { color: #1e3a5f; }

  /* Territory */
  .terr-row {
    display: grid;
    grid-template-columns: 1fr 62px 120px 34px;
    gap: 8px;
    align-items: end;
    margin-bottom: 8px;
  }
  .btn-rm {
    width: 34px; height: 42px;
    background: none;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .12s;
  }
  .btn-rm:hover { border-color: #fca5a5; color: #ef4444; }
  .btn-add-terr {
    width: 100%;
    background: none;
    border: 1.5px dashed #cbd5e0;
    border-radius: 9px;
    color: #94a3b8;
    cursor: pointer;
    font-family: 'Epilogue', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 10px;
    transition: all .15s;
  }
  .btn-add-terr:hover { border-color: #3b9ede; color: #3b9ede; }

  /* Score */
  .score-row { display: flex; gap: 6px; margin-bottom: 18px; }
  .score-btn {
    width: 40px; height: 40px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 9px;
    color: #94a3b8;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    transition: all .12s;
  }
  .score-btn:hover { border-color: #3b9ede; color: #3b9ede; }
  .score-btn.sel { background: #0d1b2a; border-color: #0d1b2a; color: #fff; font-weight: 700; }

  /* Divider */
  .hr { border: none; border-top: 1px solid #f1f5f9; margin: 22px 0; }
  .mini-lbl {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 12px;
  }

  /* Nav */
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #f1f5f9;
  }

  .btn-back {
    background: none;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    color: #64748b;
    cursor: pointer;
    font-family: 'Epilogue', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 11px 24px;
    transition: all .12s;
  }
  .btn-back:hover { border-color: #94a3b8; color: #0d1b2a; }

  .btn-next {
    background: #0d1b2a;
    border: none;
    border-radius: 10px;
    color: #fff;
    cursor: pointer;
    font-family: 'Epilogue', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 11px 32px;
    transition: all .12s;
  }
  .btn-next:hover { background: #1a3a5c; transform: translateY(-1px); }

  .btn-submit {
    background: #1a5c38;
    border: none;
    border-radius: 10px;
    color: #fff;
    cursor: pointer;
    font-family: 'Epilogue', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 11px 32px;
    transition: all .12s;
  }
  .btn-submit:hover { background: #0f3d25; transform: translateY(-1px); }
  .btn-submit:disabled { opacity: .45; cursor: not-allowed; transform: none; }

  /* Alert */
  .alert {
    padding: 11px 15px;
    border-radius: 9px;
    font-size: 12px;
    margin-top: 14px;
    font-family: 'JetBrains Mono', monospace;
  }
  .alert.error   { background: #fff5f5; border: 1px solid #fecaca; color: #c53030; }

  /* Success */
  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 40px;
    min-height: 100vh;
  }
  .success-icon {
    width: 72px;
    height: 72px;
    background: #f0fff4;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
    border: 1.5px solid #9ae6b4;
  }
  .success-title {
    font-size: 30px;
    font-weight: 800;
    color: #0d1b2a;
    letter-spacing: -.6px;
    margin-bottom: 12px;
  }
  .success-msg {
    font-size: 15px;
    color: #64748b;
    line-height: 1.8;
    max-width: 440px;
    margin-bottom: 28px;
  }
  .success-ref {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #94a3b8;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 8px 18px;
    border-radius: 6px;
    letter-spacing: .08em;
    margin-bottom: 32px;
  }
  .success-note {
    font-size: 13px;
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: .02em;
  }

  @media (max-width: 860px) {
    .root { grid-template-columns: 1fr; }
    .side { position: static; height: auto; padding: 28px 20px; }
    .steps { flex-direction: row; flex-wrap: wrap; gap: 6px; }
    .step { padding: 8px 10px; }
    .main { padding: 28px 20px 60px; }
    .g2, .g3 { grid-template-columns: 1fr; }
  }
`;

function Chip({ checked, onChange, label }) {
  return (
    <div className={`chip${checked ? " on" : ""}`} onClick={onChange}>
      <div className="cbox"><div className="cmark" /></div>
      <span className="chip-lbl">{label}</span>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="fgroup">
      <label className="flabel">{label}{required && <span className="req"> *</span>}</label>
      {children}
    </div>
  );
}

const emptyTerr = () => ({ county: "", state: "", territory_type: "primary" });

export default function Apply() {
  const [step, setStep]   = useState(1);
  const [done, setDone]   = useState(false);
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState("");
  const [refId, setRefId]  = useState("");

  const [p, setP] = useState({
    full_name: "", phone: "", email: "",
    city: "", state: "", zip_code: "", travel_radius_miles: "",
  });
  const [c, setC] = useState({
    cert_type: "", cert_number: "", issuing_body: "", expiration_date: "",
    cpr_bls_current: false, cpr_bls_expiration: "",
    liability_insurance: false, insurance_expiration: "",
    background_check_status: "not_submitted", driver_license: false,
  });
  const [caps, setCaps]   = useState(Object.fromEntries(CAPS.map(x => [x.key, false])));
  const [lab, setLab]     = useState("");
  const [lanes, setLanes] = useState([]);
  const [terrs, setTerrs] = useState([emptyTerr()]);
  const [pay, setPay]     = useState({
    pay_model: "per_draw", per_draw_rate: "", hourly_rate: "",
    travel_reimbursement: false, mileage_rate: "",
  });
  const [score, setScore] = useState(null);
  const [notes, setNotes] = useState("");

  const pct = ((step - 1) / (STEPS.length - 1)) * 100;
  const sP  = (k, v) => setP(x => ({ ...x, [k]: v }));
  const sC  = (k, v) => setC(x => ({ ...x, [k]: v }));
  const sPy = (k, v) => setPay(x => ({ ...x, [k]: v }));

  const stepState = s => s < step ? "done" : s === step ? "active" : "upcoming";

  const validate = () => {
    if (step === 1 && !p.full_name.trim()) return "Full name is required.";
    if (step === 1 && !p.phone.trim())     return "Phone number is required.";
    return "";
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step < STEPS.length) { setStep(s => s + 1); window.scrollTo(0, 0); }
    else submit();
  };

  const back = () => { setError(""); setStep(s => s - 1); window.scrollTo(0, 0); };

  const submit = async () => {
    setLoad(true); setError("");
    try {
      const [phleb] = await post("phlebotomists", {
        ...p,
        travel_radius_miles: p.travel_radius_miles ? parseInt(p.travel_radius_miles) : null,
        onboarding_status: "in_progress",
        agreement_status: "not_signed",
        compliance_risk_level: "unknown",
        operational_fit_score: score,
        notes: notes || "Self-submitted via BMH apply form",
      });
      const id = phleb.id;
      setRefId(id.slice(0, 8).toUpperCase());

      const credBody = { phlebotomist_id: id, ...c };
      ["expiration_date","cpr_bls_expiration","insurance_expiration"]
        .forEach(k => { if (!credBody[k]) delete credBody[k]; });
      await post("phlebotomist_credentials", credBody);

      await post("phlebotomist_capabilities", {
        phlebotomist_id: id, ...caps,
        preferred_lab_dropoff: lab || null,
      });

      const payBody = { phlebotomist_id: id, ...pay };
      ["per_draw_rate","hourly_rate","mileage_rate"]
        .forEach(k => { payBody[k] = payBody[k] ? parseFloat(payBody[k]) : null; });
      await post("phlebotomist_pay", payBody);

      for (const t of terrs.filter(t => t.state.trim()))
        await post("phlebotomist_territories", { phlebotomist_id: id, ...t });

      for (const lane of lanes)
        await post("service_lanes", { phlebotomist_id: id, lane_name: lane, active: true });

      setDone(true);
    } catch (e) { setError(e.message); }
    setLoad(false);
  };

  const Sidebar = () => (
    <div className="side">
      <div className="logo">
        <div className="logo-mark">B</div>
        <div className="logo-text">
          <div className="logo-name">Beyond Mobile Health</div>
          <div className="logo-sub">Phlebotomist Network</div>
        </div>
      </div>
      {done ? (
        <>
          <div className="side-hed">Application submitted</div>
          <div className="side-sub">Our team will review your profile and reach out within 2–3 business days.</div>
        </>
      ) : (
        <>
          <div className="side-hed">Join the BMH network</div>
          <div className="side-sub">Complete your contractor profile. Takes about 5 minutes. All fields are secure and HIPAA-compliant.</div>
          <ul className="steps">
            {STEPS.map(s => (
              <li key={s.id} className={`step ${stepState(s.id)}`}>
                <div className="step-num">{stepState(s.id) === "done" ? "✓" : s.icon}</div>
                <span className="step-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="side-footer">
        HIPAA COMPLIANT · SECURE SUBMISSION<br />
        © {new Date().getFullYear()} Beyond Mobile Health<br />
        beyondmobilehealth.com
      </div>
    </div>
  );

  if (done) return (
    <>
      <style>{CSS}</style>
      <div className="root">
        <Sidebar />
        <div className="main">
          <div className="success">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="15" stroke="#1a5c38" strokeWidth="2"/>
                <path d="M9 16.5L13.5 21L23 11.5" stroke="#1a5c38" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="success-title">You're in the system.</div>
            <div className="success-msg">
              Thank you for applying to the BMH Phlebotomist Network.
              Your profile is now under review. Our team will reach out
              within 2–3 business days to discuss next steps.
            </div>
            <div className="success-ref">REFERENCE ID · BMH-{refId}</div>
            <div className="success-note">
              Save this reference ID for your records.
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="root">
        <Sidebar />
        <div className="main">
          <div className="shell">
            <div className="prog">
              <div className="prog-fill" style={{ width: `${pct}%` }} />
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                <div className="step-hdr">
                  <div className="eyebrow">Step 01 of 05</div>
                  <div className="title">Personal information</div>
                  <div className="desc">Basic contact info — how BMH will reach you for assignments.</div>
                </div>
                <Field label="Full name" required>
                  <input type="text" value={p.full_name} onChange={e => sP("full_name", e.target.value)} placeholder="First and last name" />
                </Field>
                <div className="g2">
                  <Field label="Phone" required>
                    <input type="tel" value={p.phone} onChange={e => sP("phone", e.target.value)} placeholder="(000) 000-0000" />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={p.email} onChange={e => sP("email", e.target.value)} placeholder="you@email.com" />
                  </Field>
                </div>
                <div className="g3">
                  <Field label="City">
                    <input type="text" value={p.city} onChange={e => sP("city", e.target.value)} placeholder="City" />
                  </Field>
                  <Field label="State">
                    <input type="text" value={p.state} onChange={e => sP("state", e.target.value)} placeholder="MD" maxLength={2} />
                  </Field>
                  <Field label="ZIP">
                    <input type="text" value={p.zip_code} onChange={e => sP("zip_code", e.target.value)} placeholder="00000" />
                  </Field>
                </div>
                <Field label="Travel radius (miles)">
                  <input type="number" value={p.travel_radius_miles} onChange={e => sP("travel_radius_miles", e.target.value)} placeholder="How far will you travel?" />
                </Field>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                <div className="step-hdr">
                  <div className="eyebrow">Step 02 of 05</div>
                  <div className="title">Credentials & compliance</div>
                  <div className="desc">Your certifications and compliance docs. These will be verified before activation.</div>
                </div>
                <div className="mini-lbl">Phlebotomy certification</div>
                <div className="g3">
                  <Field label="Cert type">
                    <select value={c.cert_type} onChange={e => sC("cert_type", e.target.value)}>
                      <option value="">Select</option>
                      {["NPA","ASCP","AMT","NCCT","NCCPT","Other"].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cert number">
                    <input type="text" value={c.cert_number} onChange={e => sC("cert_number", e.target.value)} placeholder="Certificate #" />
                  </Field>
                  <Field label="Expiration">
                    <input type="date" value={c.expiration_date} onChange={e => sC("expiration_date", e.target.value)} />
                  </Field>
                </div>
                <Field label="Issuing body">
                  <input type="text" value={c.issuing_body} onChange={e => sC("issuing_body", e.target.value)} placeholder="e.g. National Phlebotomy Association" />
                </Field>
                <div className="hr" />
                <div className="mini-lbl">Additional compliance</div>
                <div className="chip-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 16 }}>
                  <Chip checked={c.cpr_bls_current}    onChange={() => sC("cpr_bls_current", !c.cpr_bls_current)}       label="CPR/BLS current" />
                  <Chip checked={c.liability_insurance} onChange={() => sC("liability_insurance", !c.liability_insurance)} label="Liability insurance" />
                  <Chip checked={c.driver_license}      onChange={() => sC("driver_license", !c.driver_license)}           label="Driver license" />
                </div>
                <div className="g3">
                  <Field label="CPR/BLS exp.">
                    <input type="date" value={c.cpr_bls_expiration} onChange={e => sC("cpr_bls_expiration", e.target.value)} />
                  </Field>
                  <Field label="Insurance exp.">
                    <input type="date" value={c.insurance_expiration} onChange={e => sC("insurance_expiration", e.target.value)} />
                  </Field>
                  <Field label="Background check">
                    <select value={c.background_check_status} onChange={e => sC("background_check_status", e.target.value)}>
                      <option value="not_submitted">Not submitted</option>
                      <option value="pending">Pending</option>
                      <option value="clear">Clear</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </Field>
                </div>
              </>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <>
                <div className="step-hdr">
                  <div className="eyebrow">Step 03 of 05</div>
                  <div className="title">Skills & availability</div>
                  <div className="desc">Select everything that applies to your current skillset.</div>
                </div>
                <div className="mini-lbl">Draw capabilities & availability</div>
                <div className="chip-grid" style={{ marginBottom: 18 }}>
                  {CAPS.map(({ key, label }) => (
                    <Chip key={key} checked={caps[key]} onChange={() => setCaps(x => ({ ...x, [key]: !x[key] }))} label={label} />
                  ))}
                </div>
                <Field label="Preferred lab drop-off">
                  <input type="text" value={lab} onChange={e => setLab(e.target.value)} placeholder="e.g. LabCorp Hagerstown, Quest Frederick..." />
                </Field>
                <div className="hr" />
                <div className="mini-lbl">Service lanes — select all you qualify for</div>
                <div className="chip-grid">
                  {LANES.map(({ value, label }) => (
                    <Chip key={value}
                      checked={lanes.includes(value)}
                      onChange={() => setLanes(x => x.includes(value) ? x.filter(v => v !== value) : [...x, value])}
                      label={label}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── STEP 4 ── */}
            {step === 4 && (
              <>
                <div className="step-hdr">
                  <div className="eyebrow">Step 04 of 05</div>
                  <div className="title">Territory coverage</div>
                  <div className="desc">Where do you operate? Add all counties and states you regularly cover.</div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  {terrs.map((t, i) => (
                    <div key={i} className="terr-row">
                      <div>
                        {i === 0 && <label className="flabel">County</label>}
                        <input type="text" value={t.county}
                          onChange={e => setTerrs(x => x.map((r, j) => j === i ? { ...r, county: e.target.value } : r))}
                          placeholder="County name" />
                      </div>
                      <div>
                        {i === 0 && <label className="flabel">State</label>}
                        <input type="text" value={t.state}
                          onChange={e => setTerrs(x => x.map((r, j) => j === i ? { ...r, state: e.target.value } : r))}
                          placeholder="ST" maxLength={2} />
                      </div>
                      <div>
                        {i === 0 && <label className="flabel">Type</label>}
                        <select value={t.territory_type}
                          onChange={e => setTerrs(x => x.map((r, j) => j === i ? { ...r, territory_type: e.target.value } : r))}>
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                          <option value="occasional">Occasional</option>
                        </select>
                      </div>
                      <button className="btn-rm"
                        style={{ marginTop: i === 0 ? 20 : 0 }}
                        onClick={() => setTerrs(x => x.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                </div>
                <button className="btn-add-terr"
                  onClick={() => setTerrs(x => [...x, emptyTerr()])}>
                  + Add territory
                </button>
              </>
            )}

            {/* ── STEP 5 ── */}
            {step === 5 && (
              <>
                <div className="step-hdr">
                  <div className="eyebrow">Step 05 of 05</div>
                  <div className="title">Compensation & final details</div>
                  <div className="desc">Pay preferences. All rates are negotiable during onboarding.</div>
                </div>
                <div className="g2">
                  <Field label="Pay model">
                    <select value={pay.pay_model} onChange={e => sPy("pay_model", e.target.value)}>
                      <option value="per_draw">Per draw</option>
                      <option value="hourly">Hourly</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </Field>
                  <Field label="Per-draw rate ($)">
                    <input type="number" value={pay.per_draw_rate} onChange={e => sPy("per_draw_rate", e.target.value)} placeholder="0.00" />
                  </Field>
                </div>
                <div className="g2">
                  <Field label="Hourly rate ($)">
                    <input type="number" value={pay.hourly_rate} onChange={e => sPy("hourly_rate", e.target.value)} placeholder="0.00" />
                  </Field>
                  <Field label="Mileage rate ($/mi)">
                    <input type="number" step=".001" value={pay.mileage_rate} onChange={e => sPy("mileage_rate", e.target.value)} placeholder="0.670" />
                  </Field>
                </div>
                <div className="chip-grid" style={{ gridTemplateColumns: "1fr", marginBottom: 20 }}>
                  <Chip checked={pay.travel_reimbursement} onChange={() => sPy("travel_reimbursement", !pay.travel_reimbursement)} label="I require travel reimbursement" />
                </div>
                <div className="hr" />
                <div className="mini-lbl">Self-assessment score (1–10)</div>
                <div className="score-row">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} className={`score-btn${score === n ? " sel" : ""}`} onClick={() => setScore(n)}>{n}</button>
                  ))}
                </div>
                <Field label="Additional notes">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Specialties, preferred hours, anything else we should know..." />
                </Field>
              </>
            )}

            {error && <div className="alert error">{error}</div>}

            <div className="nav">
              {step > 1
                ? <button className="btn-back" onClick={back}>← Back</button>
                : <div />
              }
              {step < STEPS.length
                ? <button className="btn-next" onClick={next}>Continue →</button>
                : <button className="btn-submit" onClick={next} disabled={loading}>
                    {loading ? "Submitting…" : "Submit application ✓"}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
