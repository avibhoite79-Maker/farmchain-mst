import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "../components/QRScanner.jsx";

export default function Scan() {
  const nav = useNavigate();
  const [manual, setManual] = useState("");
  return (
    <section className="glass-panel mx-auto max-w-xl space-y-4 p-6">
      <h2 className="text-xl font-bold text-white">Scan a crate</h2>
      <p className="text-sm text-slate-400">Point your camera at the FarmChain QR code to see where your food came from.</p>
      <QRScanner onBatch={(id) => nav(`/trace/${id}`)} />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (manual) nav(`/trace/${manual}`); }}>
        <input className="input" type="number" min="1" placeholder="Or type the batch number" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn">Open</button>
      </form>
    </section>
  );
}
