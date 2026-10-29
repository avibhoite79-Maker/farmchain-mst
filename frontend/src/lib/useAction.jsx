import { useState } from "react";
import { errorText } from "./chain.js";

// Wraps an async action with loading + error + success state.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function run(fn, successMsg) {
    setBusy(true); setError(""); setDone("");
    try {
      const out = await fn();
      setDone(successMsg || "Done");
      return out;
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, done, run };
}

export function Notice({ error, done, busy }) {
  const base = "mt-3 rounded-xl border px-3 py-2 text-xs font-medium";
  if (busy) return <p className={`${base} border-amber-500/40 bg-amber-500/10 text-amber-300`}>Waiting for your wallet and the network...</p>;
  if (error) return <p className={`${base} border-rose-500/40 bg-rose-500/10 text-rose-300`}>{error}</p>;
  if (done) return <p className={`${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-300`}>{done}</p>;
  return null;
}
