import { useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, Printer } from "lucide-react";
import QRCodeImage, { qrOptions, traceUrl } from "./QRCodeImage.jsx";

// A printable crate label: crop, origin, QR code and a short instruction.
export default function QRLabel({ batch }) {
  const url = traceUrl(batch.id);
  const [copied, setCopied] = useState(false);

  async function download() {
    const png = await QRCode.toDataURL(url, qrOptions(900));
    const a = document.createElement("a");
    a.href = png;
    a.download = `farmchain-batch-${batch.id}.png`;
    a.click();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="space-y-3">
      <div className="label-card rounded-xl border-2 border-emerald-700 p-5 text-center">
        <p className="font-extrabold text-emerald-800">FarmChain</p>
        <h3 className="text-xl font-extrabold">{batch.cropName}</h3>
        <p className="mb-2 text-sm text-slate-600">{batch.origin} - Batch #{batch.id}</p>
        <div className="flex justify-center"><QRCodeImage value={url} size={220} /></div>
        <p className="mt-1 text-sm font-semibold">Scan to see where this food came from.</p>
        <p className="break-all text-[10px] text-slate-500">{url}</p>
      </div>
      <div className="no-print flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => window.print()}><Printer size={15} /> Print label</button>
        <button type="button" className="btn btn-ghost" onClick={download}><Download size={15} /> Download QR</button>
        <button type="button" className="btn btn-ghost" onClick={copy}><Copy size={15} /> {copied ? "Link copied" : "Copy link"}</button>
      </div>
    </div>
  );
}
