import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { API, CONTRACT_ADDRESS, EXPLORER, SYMBOL, fmtDate, short } from "../lib/chain.js";
import QRLabel from "../components/QRLabel.jsx";

export default function Trace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [query, setQuery] = useState(id || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null); setError(""); setQuery(id || "");
    if (!id) return;
    fetch(`${API}/api/batch/${id}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load this batch");
        setData(j);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const { batch, history } = data || {};

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <form className="no-print flex gap-2" onSubmit={(e) => { e.preventDefault(); if (query) nav(`/trace/${query}`); }}>
        <input className="input" type="number" min="1" placeholder="Batch number from the QR label" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn">Trace</button>
      </form>
      {!id && <p className="text-sm text-slate-400">Type the batch number, or <Link className="text-brand-400 underline" to="/scan">scan the QR code with your camera</Link>.</p>}
      {error && <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}

      {batch && (
        <>
          <div className="glass-panel p-6">
            <h2 className="text-3xl font-extrabold text-brand-400">{batch.cropName}</h2>
            <ul className="my-4 space-y-1 text-sm">
              <li className="flex items-center gap-2 text-emerald-400"><ShieldCheck size={16} /> Recorded on the blockchain. Past records cannot be edited.</li>
              <li className="text-slate-300">{history.length} handoff{history.length === 1 ? "" : "s"} logged from farm to shop.</li>
              <li className={batch.paid ? "text-emerald-400" : "text-amber-400"}>{batch.paid ? "Farmer has been paid in full." : "Farmer payment is still pending."}</li>
            </ul>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {[
                ["Grown at", batch.origin],
                ["Quantity", `${batch.quantity} kg`],
                ["Harvested", fmtDate(batch.harvestDate)],
                ["Price", `${batch.price} ${SYMBOL}`],
                ["Farmer wallet", short(batch.farmer)],
                ["Current status", batch.status],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-slate-400">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
            {EXPLORER && CONTRACT_ADDRESS && (
              <a className="no-print mt-4 inline-flex items-center gap-1 text-sm text-mst-400 hover:underline" href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">
                Check the smart contract on the block explorer <ExternalLink size={13} />
              </a>
            )}
          </div>

          <h3 className="no-print text-lg font-bold">Journey</h3>
          <ol className="no-print space-y-0 border-l-2 border-emerald-700 pl-5">
            {history.map((h, i) => (
              <li key={i} className="relative pb-6">
                <span className="absolute -left-[1.72rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-700 bg-brand-500" />
                <strong>{h.status}</strong>
                <p className="text-sm text-slate-300">{h.note}</p>
                <small className="text-slate-500">{fmtDate(h.timestamp)} by {short(h.by)}</small>
              </li>
            ))}
          </ol>

          <h3 className="no-print text-lg font-bold">Share or print this batch's QR code</h3>
          <QRLabel batch={batch} />
        </>
      )}
    </section>
  );
}
