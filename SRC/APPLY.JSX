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

