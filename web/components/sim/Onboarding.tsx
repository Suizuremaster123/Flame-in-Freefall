"use client";
// SI-assisted: written with Claude Code (Anthropic); see README "Use of AI (SI)".
// First-run flow: selections are context only; the AI must source or request every scenario value.
import { useState } from "react";
import { ScenarioSchema } from "@/lib/sim/types";
import { MATERIALS } from "./data";
import { useSim } from "./store";

const CABINS = [
  ["custom", "I have a cabin in mind"],
  ["iss", "ISS / spacecraft cabin"],
  ["lunar", "Lunar habitat"],
  ["mars", "Mars habitat"],
] as const;

export function Onboarding() {
  const { set } = useSim();
  const [cabin, setCabin] = useState("custom");
  const [material, setMaterial] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function build() {
    setBusy(true); setError(null);
    const cabinLabel = CABINS.find(([id]) => id === cabin)?.[1] ?? cabin;
    const materialLabel = MATERIALS.find((m) => m.material_key === material)?.display_name ?? material;
    const text = [
      `Cabin context: ${cabinLabel}.`,
      materialLabel ? `Material of interest: ${materialLabel}.` : "Material is not chosen yet; ask me for it.",
      goal.trim(),
    ].filter(Boolean).join(" ");
    try {
      const res = await fetch("/api/scenario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `AI request failed (${res.status})`);
      const parsed = ScenarioSchema.safeParse(body.scenario);
      if (!parsed.success) throw new Error("The AI returned an incomplete scenario. Nothing was started; review the missing fields below.");
      set({ a: parsed.data, b: null, editing: "a", presetId: null, replay: false, ra: null, rb: null, frame: 0, interp: { state: "idle" }, runError: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI scenario builder unavailable.");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-4xl py-8 sm:py-14">
      <div className="max-w-2xl space-y-4">
        <p className="label">FIRST RUN · NO SCENARIO LOADED</p>
        <h1 className="display text-[clamp(2.4rem,7vw,5rem)] leading-[0.95]">Start with the question.</h1>
        <p className="measure text-[16px] text-mute">Choose the context you know, describe what you’re trying to find out, and EmberAtlas will draft the scenario. It will leave unsourced values empty for you to review—never inventing a cabin, threshold, or result.</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="panel space-y-4 p-4">
          <div><p className="label">Context</p><h2 className="mt-1 text-[20px] font-semibold">What are you testing?</h2></div>
          <label className="block text-[13px]"><span className="mb-1 block text-mute">Cabin context</span><select className="w-full" value={cabin} onChange={(e) => setCabin(e.target.value)}>{CABINS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="block text-[13px]"><span className="mb-1 block text-mute">Material (optional)</span><select className="w-full" value={material} onChange={(e) => setMaterial(e.target.value)}><option value="">Let AI identify it from my description</option>{MATERIALS.map((m) => <option key={m.material_key} value={m.material_key}>{m.display_name}</option>)}</select></label>
        </section>
        <section className="panel space-y-4 p-4">
          <div><p className="label">Intent</p><h2 className="mt-1 text-[20px] font-semibold">What are you trying to do?</h2></div>
          <textarea className="min-h-40 w-full" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Example: I need to know whether a SIBAL curtain could sustain a fire in a 34% oxygen lunar habitat, and what detector or suppression inputs I still need." />
          <button type="button" className="btn-accent w-full px-5 py-3 text-[16px]" disabled={busy || goal.trim().length < 3} onClick={build}>{busy ? "Building a sourced draft…" : "Build my scenario →"}</button>
          {error && <p className="text-[13px] text-warn" role="alert">{error}</p>}
        </section>
      </div>
      <p className="mt-5 max-w-2xl text-[12px] text-faint">AI needs a server-side <code>OPENAI_API_KEY</code> in Vercel. If it is missing, this screen reports that directly; no demo scenario is substituted.</p>
    </main>
  );
}
