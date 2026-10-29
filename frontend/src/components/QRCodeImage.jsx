import { useEffect, useState } from "react";
import QRCode from "qrcode";

// The link a QR code opens. Uses VITE_PUBLIC_URL if set, otherwise the address the site is open on.
export const traceUrl = (id) =>
  `${(import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, "")}/trace/${id}`;

export const qrOptions = (width) => ({
  width,
  margin: 2,
  errorCorrectionLevel: "M",
  color: { dark: "#14392a", light: "#ffffff" },
});

export default function QRCodeImage({ value, size = 200 }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, qrOptions(size * 2)).then((url) => live && setSrc(url));
    return () => { live = false; };
  }, [value, size]);
  return src
    ? <img src={src} width={size} height={size} alt="QR code" className="rounded-md bg-white" />
    : <div style={{ width: size, height: size }} />;
}
