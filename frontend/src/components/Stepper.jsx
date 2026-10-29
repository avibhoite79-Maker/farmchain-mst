import { Check, ShoppingBag, Sprout, Store, Truck } from "lucide-react";
import { STATUS } from "../lib/chain.js";

const STEPS = [
  { label: "1. Farm harvest", icon: Sprout, status: "Harvested" },
  { label: "2. In transit", icon: Truck, status: "In Transit" },
  { label: "3. Delivered to retailer", icon: Store, status: "Delivered" },
  { label: "4. Sold - farmer paid", icon: ShoppingBag, status: "Sold" },
];

export default function Stepper({ batch, history }) {
  const current = STATUS.indexOf(batch.status);
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-800/80 pt-6 md:grid-cols-4">
      {STEPS.map((s, i) => {
        const note = history.find((h) => h.status === s.status)?.note;
        const Icon = s.icon;
        const state = i === current ? "glass-panel-glow" : i < current ? "border-slate-700 bg-slate-900/80" : "border-slate-800 bg-slate-900/50 opacity-60";
        return (
          <div key={s.status} className={`rounded-xl border p-4 transition ${state}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-400">
                {i < current ? <Check size={14} /> : i + 1}
              </span>
              <Icon size={20} className="text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">{s.label}</h4>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">{note || "Waiting"}</p>
          </div>
        );
      })}
    </div>
  );
}
