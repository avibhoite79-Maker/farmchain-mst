import { useState } from "react";
import { ScanLine } from "lucide-react";
import QRScanner from "./QRScanner.jsx";

// Batch number input with a "Scan crate QR" button that fills it in.
export default function BatchField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <label className="field">Batch number
        <input className="input" type="number" min="1" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type it or scan the crate" />
      </label>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(!open)}>
        <ScanLine size={15} /> {open ? "Close camera" : "Scan crate QR"}
      </button>
      {open && <QRScanner onBatch={(id) => { onChange(id); setOpen(false); }} />}
    </div>
  );
}
