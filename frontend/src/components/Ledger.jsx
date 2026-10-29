import { Blocks, ExternalLink } from "lucide-react";
import { SYMBOL, short, timeAgo, txLink } from "../lib/chain.js";

const TITLES = {
  BatchCreated: "New crop batch created",
  OrderPlaced: "Payment locked in escrow",
  StatusUpdated: "Status updated",
  PaymentReleased: "Farmer paid from escrow",
};

export default function Ledger({ items }) {
  return (
    <div className="glass-panel space-y-4 p-5">
      <h3 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-white">
        <Blocks size={16} className="text-mst-400" /> Live on-chain ledger
      </h3>
      {items.length === 0 && <p className="text-xs text-slate-400">No transactions yet. Create a batch to see the first one.</p>}
      <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {items.map((tx) => {
          const href = txLink(tx.hash);
          const sub = [`Batch #${tx.batchId}`, tx.status, tx.amount ? `${tx.amount} ${SYMBOL}` : null].filter(Boolean).join(" - ");
          return (
            <div key={tx.hash + tx.type} className="space-y-1 rounded-xl border border-slate-800 bg-slate-900 p-3">
              <div className="flex justify-between gap-2 text-xs font-bold text-slate-200">
                <span>{TITLES[tx.type] || tx.type}</span>
                <span className="whitespace-nowrap font-mono text-[10px] font-normal text-slate-500">{tx.time ? timeAgo(tx.time) : ""}</span>
              </div>
              <div className="text-[11px] text-slate-400">{sub}</div>
              <div className="border-t border-slate-800 pt-1 font-mono text-[10px] text-mst-400">
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                    {short(tx.hash)} <ExternalLink size={10} />
                  </a>
                ) : short(tx.hash)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
