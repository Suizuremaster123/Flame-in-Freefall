"use client";
// SI-assisted: written with Claude Code (Anthropic); see README "Use of AI (SI)".
// The one screen: product line, then Scenario | Run | Result, plus the receipt drawer and the print-only report header.
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "@/lib/ui/motion";
import { fmtBand, sig } from "@/lib/ui/format";
import { ScenarioPanel, fmtProv } from "./ScenarioPanel";
import { RunPanel } from "./RunPanel";
import { ResultPanel } from "./ResultPanel";
import { useSim } from "./store";
import { Onboarding } from "./Onboarding";

export const PRODUCT = "EmberAtlas is an SI-powered cabin fire simulator for spacecraft and lunar habitats. It's built from, ranks, and is checked against NASA's ISS fire experiments in PSI, so engineers can test a cabin design before flight and see exactly which NASA evidence backs every result.";

export function SimApp() {
  const { a, topOpen, set } = useSim();
  return (
    <div className="space-y-4">
      <div className="border-b border-line pb-3" data-noprint>
        <button type="button" className="flex w-full items-start gap-2 text-left" aria-expanded={topOpen} onClick={() => set({ topOpen: !topOpen })}>
          <span aria-hidden className="mt-0.5 text-faint">{topOpen ? "▾" : "▸"}</span>
          <span className={`measure text-[16px] ${topOpen ? "" : "truncate"}`}>{PRODUCT}</span>
        </button>
        {topOpen && <a className="ml-5 text-[13px] text-mute underline underline-offset-2" href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noreferrer" data-testid="psi-resource-link">
          Built on NASA PSI Data Repository: Combustion Science</a>}
      </div>
      <PrintHeader />
      {!a ? <Onboarding /> : (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
          <div className="min-w-0 lg:sticky lg:top-16 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto lg:pr-1" data-noprint><ScenarioPanel /></div>
          <div className="min-w-0"><RunPanel /></div>
          <div className="min-w-0"><ResultPanel /></div>
        </div>
      )}
      <ReceiptDrawer />
    </div>
  );
}

function PrintHeader() {
  const { a } = useSim();
  if (!a) return null;
  return (
    <div className="hidden print:block">
      <h1 className="text-[24px] font-semibold">EmberAtlas run report · {a.name}</h1>
      <p className="text-[12px]">{PRODUCT}</p>
      <p className="num text-[12px]">O₂ {sig(a.cabin.x_o2 * 100)}% · {sig(a.cabin.P_Pa / 1e3)} kPa · {sig(a.cabin.gravity_g)} g · V {a.cabin.V_m3 == null ? "∅" : sig(a.cabin.V_m3)} m³ · flow {sig(a.cabin.flow_m_s * 100)} cm/s · {a.items.length} item(s) · detector {a.detection.type} at {sig(a.detection.distance_m)} m · agent {a.suppression.agent}</p>
    </div>
  );
}

function ReceiptDrawer() {
  const { receipt, set } = useSim();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && set({ receipt: null });
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [set]);
  return (
    <AnimatePresence>
      {receipt && (
        <motion.div key="scrim" className="fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => set({ receipt: null })} data-noprint>
          <motion.div role="dialog" aria-label={`Receipt: ${receipt.title}`} onClick={(e) => e.stopPropagation()}
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={spring.gentle}
            className="absolute right-0 top-0 h-full w-full max-w-[440px] space-y-3 overflow-y-auto border-l border-line bg-panel p-4 shadow-2xl">
            <div className="flex justify-between"><p className="label">Receipt</p><button type="button" className="btn" onClick={() => set({ receipt: null })}>Close</button></div>
            <h3 className="text-[20px] font-semibold">{receipt.title}</h3>
            <p className="num text-[24px]">{receipt.value == null ? "∅ No data" : sig(receipt.value)} <span className="text-[14px] text-mute">{receipt.units}</span>
              {receipt.band && <span className="ml-1 text-[13px] text-mute">p05–p95 {fmtBand(receipt.band.p05, receipt.band.p95)}</span>}</p>
            {receipt.note && <p className="text-[13px] text-mute">{receipt.note}</p>}
            <p className="label">Traces to</p>
            <ul className="space-y-1 text-[13px]">{receipt.sources.map((s, i) => <li key={i} className="border-l-2 border-line pl-2">{fmtProv(s)}</li>)}</ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
