import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Accepts a FarmChain link (".../trace/12") or a plain batch number.
export function parseBatchId(text) {
  const t = String(text || "").trim();
  const m = t.match(/\/trace\/(\d+)/);
  if (m) return m[1];
  return /^\d+$/.test(t) ? t : null;
}

export default function QRScanner({ onBatch }) {
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const done = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    const started = scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          const id = parseBatchId(text);
          if (!id) { setHint("That QR code is not a FarmChain batch. Try another one."); return; }
          if (done.current) return;
          done.current = true;
          onBatch(id);
        },
        () => {}
      )
      .catch(() =>
        setError("Could not open the camera. Allow camera access. On a phone, the page must be opened with https.")
      );
    return () => {
      started
        .then(() => scanner.stop())
        .catch(() => {})
        .then(() => { try { scanner.clear(); } catch { /* ignore */ } });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="my-3 max-w-sm">
      <div id="qr-reader" />
      {error && <p className="mt-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
      {hint && <p className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{hint}</p>}
    </div>
  );
}
