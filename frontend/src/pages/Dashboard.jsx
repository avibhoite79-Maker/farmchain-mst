import { useCallback, useEffect, useState } from "react";
import { API, SYMBOL, short } from "../lib/chain.js";
import Stepper from "../components/Stepper.jsx";
import Ledger from "../components/Ledger.jsx";
import { CustomerPanel, FarmerPanel, RetailerPanel, TransporterPanel } from "../components/Panels.jsx";

const ROLES = [["farmer", "Farmer"], ["transporter", "Transporter"], ["retailer", "Retailer"], ["customer", "Customer"]];

export default function Dashboard() {
  const [role, setRole] = useState("farmer");
  const [batches, setBatches] = useState(null);
  const [activeId, setActiveId] = useState("");
  const [history, setHistory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [b, a] = await Promise.all([
        fetch(`${API}/api/batches`).then((r) => r.json()),
        fetch(`${API}/api/activity`).then((r) => r.json()),
      ]);
      if (!Array.isArray(b)) throw new Error(b.error || "Could not load batches");
      setBatches(b);
      setActivity(Array.isArray(a) ? a : []);
      setError("");
    } catch (e) {
      setError(`${e.message}. Is the backend running on port 5000?`);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const active = batches?.find((b) => b.id === activeId) || batches?.[0];

  useEffect(() => {
    if (!active) { setHistory([]); return; }
    fetch(`${API}/api/batch/${active.id}`)
      .then((r) => r.json())
      .then((j) => setHistory(j.history || []))
      .catch(() => setHistory([]));
  }, [active?.id, active?.status]);

  const changed = (id) => { if (id) setActiveId(String(id)); refresh(); };

  return (
    <div className="space-y-6">
      <div className="glass-panel relative overflow-hidden p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            {active ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-brand-500/30 bg-brand-500/20 px-2.5 py-1 text-xs font-bold text-brand-400">ACTIVE TRACKING BATCH</span>
                  <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-sm text-slate-300">#{active.id}</span>
                </div>
                <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{active.cropName}</h1>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Grown at <span className="font-semibold text-emerald-400">{active.origin}</span> - {active.quantity} kg - {active.price} {SYMBOL} - farmer wallet {short(active.farmer)}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Trust in every harvest</h1>
                <p className="mt-1 text-sm text-slate-400">
                  {batches ? "No batches yet. Stay on Farmer and create the first one." : "Loading from the blockchain..."}
                </p>
              </>
            )}
          </div>

          {batches?.length > 0 && (
            <select className="input !w-auto" value={active?.id || ""} onChange={(e) => setActiveId(e.target.value)}>
              {batches.map((b) => <option key={b.id} value={b.id}>#{b.id} - {b.cropName}</option>)}
            </select>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
        {active && <Stepper batch={active} history={history} />}
      </div>

      <nav className="flex w-fit flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
        {ROLES.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRole(key)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              role === key ? "border border-slate-700 bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {role === "farmer" && <FarmerPanel onChanged={changed} />}
          {role === "transporter" && <TransporterPanel batch={active} onChanged={changed} />}
          {role === "retailer" && <RetailerPanel batch={active} onChanged={changed} />}
          {role === "customer" && <CustomerPanel batch={active} />}
        </div>
        <Ledger items={activity} />
      </div>
    </div>
  );
}
