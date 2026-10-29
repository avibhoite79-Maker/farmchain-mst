import { Link, NavLink } from "react-router-dom";
import { Sprout, Wallet } from "lucide-react";
import { useWallet } from "../lib/wallet.jsx";
import { NETWORK_LABEL, short } from "../lib/chain.js";

const link = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
    isActive ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"
  }`;

export default function Header() {
  const { account, name, error, connectWallet } = useWallet();
  return (
    <header className="no-print sticky top-0 z-40 glass-panel rounded-none border-x-0 border-t-0 border-slate-800/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 shadow-lg shadow-brand-500/20">
            <Sprout size={22} className="text-slate-950" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">FarmChain</span>
              <span className="rounded-full border border-mst-500/30 bg-mst-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mst-400">{NETWORK_LABEL}</span>
            </div>
            <p className="hidden text-xs font-medium text-brand-400 sm:block">Trust in Every Harvest</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
          <NavLink to="/" end className={link}>Dashboard</NavLink>
          <NavLink to="/batches" className={link}>Batches</NavLink>
          <NavLink to="/scan" className={link}>Scan</NavLink>
          <NavLink to="/admin" className={link}>Admin</NavLink>
        </nav>

        <button
          onClick={connectWallet}
          title={error || "Connect your wallet"}
          className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900 px-3.5 py-2 text-xs font-semibold hover:bg-slate-800"
        >
          <span className={`h-2 w-2 rounded-full ${account ? "bg-emerald-500" : "bg-rose-500"}`} />
          <Wallet size={14} className="text-slate-400" />
          <span className="font-mono text-slate-200">
            {account ? `${short(account)}${name ? ` (${name})` : ""}` : "Connect wallet"}
          </span>
        </button>
      </div>
      {error && <p className="bg-rose-500/10 px-4 py-1 text-center text-xs text-rose-300">{error}</p>}
    </header>
  );
}
