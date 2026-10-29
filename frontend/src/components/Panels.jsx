import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parseEther } from "ethers";
import { PlusCircle, QrCode, ScanLine, Store, Tractor, Truck } from "lucide-react";
import { STATUS, SYMBOL, connect } from "../lib/chain.js";
import { Notice, useAction } from "../lib/useAction.jsx";
import BatchField from "./BatchField.jsx";
import QRLabel from "./QRLabel.jsx";

const Title = ({ icon: Icon, color, children, badge }) => (
  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
    <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Icon size={20} className={color} /> {children}</h2>
    {badge && <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">{badge}</span>}
  </div>
);

// ---------------- Farmer ----------------
const EMPTY = { crop: "", qty: "", origin: "", price: "" };

export function FarmerPanel({ onChanged }) {
  const [form, setForm] = useState(EMPTY);
  const [created, setCreated] = useState(null);
  const { busy, error, done, run } = useAction();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setCreated(null);
    const info = { cropName: form.crop, origin: form.origin };
    const id = await run(async () => {
      const { contract } = await connect();
      const tx = await contract.createBatch(form.crop, BigInt(form.qty), form.origin, parseEther(form.price));
      const rc = await tx.wait();
      const ev = rc.logs
        .map((l) => { try { return contract.interface.parseLog(l); } catch { return null; } })
        .find((x) => x && x.name === "BatchCreated");
      return ev.args.id.toString();
    }, "Batch created on the blockchain.");
    if (id) { setCreated({ ...info, id }); setForm(EMPTY); onChanged(id); }
  }

  return (
    <div className="glass-panel space-y-5 p-6">
      <Title icon={Tractor} color="text-emerald-400" badge="0% middleman cut">Farmer portal</Title>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="field">Crop name<input className="input" required value={form.crop} onChange={set("crop")} placeholder="Alphonso mango" /></label>
          <label className="field">Quantity (kg)<input className="input" required type="number" min="1" value={form.qty} onChange={set("qty")} /></label>
          <label className="field">Price for the whole batch ({SYMBOL})<input className="input" required type="number" step="any" min="0" value={form.price} onChange={set("price")} /></label>
          <label className="field">Farm location<input className="input" required value={form.origin} onChange={set("origin")} placeholder="Village, district" /></label>
        </div>
        <p className="text-[11px] text-slate-500">The harvest date is recorded automatically by the blockchain.</p>
        <button className="btn" disabled={busy}><PlusCircle size={15} /> Create crop batch on MST</button>
      </form>
      <Notice busy={busy} error={error} done={done} />
      {created && (
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <h3 className="font-bold text-white">Your crate label is ready</h3>
          <p className="text-xs text-slate-400">Print it and stick it on the crate. Anyone who scans it sees this batch's journey.</p>
          <QRLabel batch={created} />
        </div>
      )}
    </div>
  );
}

// ---------------- Transporter ----------------
export function TransporterPanel({ batch, onChanged }) {
  const [id, setId] = useState(batch?.id || "");
  const [temp, setTemp] = useState("");
  const [hum, setHum] = useState("");
  const [where, setWhere] = useState("");
  const { busy, error, done, run } = useAction();
  useEffect(() => { if (batch) setId(batch.id); }, [batch?.id]);

  async function advance(e) {
    e.preventDefault();
    await run(async () => {
      const { contract } = await connect();
      const b = await contract.getBatch(BigInt(id));
      const next = Number(b.status) + 1;
      if (next > 2) throw new Error("This batch is already delivered.");
      const parts = [];
      if (temp) parts.push(`Temp ${temp} C`);
      if (hum) parts.push(`Humidity ${hum}%`);
      if (where) parts.push(where);
      const tx = await contract.updateStatus(BigInt(id), next, parts.join(", ") || STATUS[next]);
      await tx.wait();
      onChanged(id);
    }, "Status updated on the blockchain.");
  }

  return (
    <div className="glass-panel space-y-5 p-6">
      <Title icon={Truck} color="text-sky-400">Transporter cold-chain log</Title>
      <p className="text-xs text-slate-400">Scan the crate, add the sensor readings, then move the batch forward: Harvested, In Transit, Delivered. Readings are typed in (simulated IoT) and saved on-chain.</p>
      <form onSubmit={advance} className="space-y-4">
        <BatchField value={id} onChange={setId} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="field">Temperature (C)<input className="input" type="number" step="any" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="4.2" /></label>
          <label className="field">Humidity (%)<input className="input" type="number" step="any" value={hum} onChange={(e) => setHum(e.target.value)} placeholder="65" /></label>
          <label className="field">Location / vehicle<input className="input" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="MH-12-1234, Pune highway" /></label>
        </div>
        <button className="btn" disabled={busy || !id}>Move to next step</button>
      </form>
      <Notice busy={busy} error={error} done={done} />
    </div>
  );
}

// ---------------- Retailer ----------------
export function RetailerPanel({ batch, onChanged }) {
  const [id, setId] = useState(batch?.id || "");
  const [note, setNote] = useState("");
  const order = useAction();
  const confirm = useAction();
  useEffect(() => { if (batch) setId(batch.id); }, [batch?.id]);

  const placeOrder = () => order.run(async () => {
    const { contract } = await connect();
    const b = await contract.getBatch(BigInt(id));
    const tx = await contract.placeOrder(BigInt(id), { value: b.price });
    await tx.wait();
    onChanged(id);
  }, "Order placed. Your payment is held in escrow until you confirm delivery.");

  const confirmReceipt = () => confirm.run(async () => {
    const { contract } = await connect();
    const tx = await contract.confirmReceipt(BigInt(id), note || "Received and verified");
    await tx.wait();
    onChanged(id);
  }, "Receipt confirmed. The farmer has been paid.");

  return (
    <div className="glass-panel space-y-5 p-6">
      <Title icon={Store} color="text-purple-400">Retailer: order and receive</Title>
      <p className="text-xs text-slate-400">Order a batch to lock the payment. When the crate arrives, scan its QR to check it is the right batch, then confirm.</p>
      <BatchField value={id} onChange={setId} />
      <div>
        <button className="btn" disabled={!id || order.busy} onClick={placeOrder}>1. Place order and pay</button>
        <Notice {...order} />
      </div>
      <div className="space-y-3 border-t border-slate-800 pt-4">
        <label className="field">Inspection note (optional)<input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fresh, packaging intact" /></label>
        <button className="btn" disabled={!id || confirm.busy} onClick={confirmReceipt}>2. Confirm receipt and pay farmer</button>
        <Notice {...confirm} />
      </div>
    </div>
  );
}

// ---------------- Customer ----------------
export function CustomerPanel({ batch }) {
  return (
    <div className="glass-panel space-y-5 p-6">
      <Title icon={QrCode} color="text-purple-400">Customer: check your food</Title>
      <p className="text-xs text-slate-400">No wallet needed. Scan the QR code on the packaging to see where the food came from and whether the farmer was paid.</p>
      <div className="flex flex-wrap gap-3">
        <Link to="/scan" className="btn"><ScanLine size={15} /> Scan packaging QR</Link>
        {batch && <Link to={`/trace/${batch.id}`} className="btn btn-ghost">Open batch #{batch.id} journey</Link>}
      </div>
      {batch && (
        <div className="border-t border-slate-800 pt-4">
          <p className="mb-2 text-xs text-slate-400">Sample label for the selected batch:</p>
          <QRLabel batch={batch} />
        </div>
      )}
    </div>
  );
}
