import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../lib/chain.js";
import QRCodeImage, { traceUrl } from "../components/QRCodeImage.jsx";

const BADGE = {
  Harvested: "bg-lime-500/20 text-lime-300",
  "In Transit": "bg-amber-500/20 text-amber-300",
  Delivered: "bg-sky-500/20 text-sky-300",
  Sold: "bg-emerald-500/20 text-emerald-300",
};

export default function Batches() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/batches`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load batches");
        setList(j);
      })
      .catch((e) => setError(e.message));
  }, []);

  const count = (s) => (list || []).filter((b) => b.status === s).length;
  const stats = list && [
    ["Batches tracked", list.length],
    ["On the road", count("In Transit")],
    ["Delivered", count("Delivered")],
    ["Farmers paid", list.filter((b) => b.paid).length],
  ];

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-extrabold text-white">All batches</h2>
      {error && <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
      {!list && !error && <p className="text-sm text-slate-400">Loading from the blockchain...</p>}
      {list && (
        <>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(([k, v]) => (
              <div key={k} className="glass-panel p-4">
                <dt className="text-xs text-slate-400">{k}</dt>
                <dd className="text-3xl font-extrabold text-brand-400">{v}</dd>
              </div>
            ))}
          </dl>
          {list.length === 0 && <p className="text-sm text-slate-400">No batches yet.</p>}
          <ul className="space-y-3">
            {list.map((b) => (
              <li key={b.id} className="glass-panel flex items-center gap-4 p-3">
                <QRCodeImage value={traceUrl(b.id)} size={84} />
                <div className="min-w-0 flex-1">
                  <Link to={`/trace/${b.id}`} className="font-bold text-white hover:underline">{b.cropName}</Link>
                  <p className="text-sm text-slate-400">{b.origin} - {b.quantity} kg - Batch #{b.id}</p>
                </div>
                <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${BADGE[b.status]}`}>{b.status}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
