import { useState } from "react";
import { id as hashName, isAddress } from "ethers";
import { connect } from "../lib/chain.js";
import { Notice, useAction } from "../lib/useAction.jsx";

const ROLES = { Farmer: "FARMER_ROLE", Transporter: "TRANSPORTER_ROLE", Retailer: "RETAILER_ROLE" };

export default function Admin() {
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Farmer");
  const { busy, error, done, run } = useAction();

  async function submit(e) {
    e.preventDefault();
    await run(async () => {
      if (!isAddress(address)) throw new Error("That is not a valid wallet address.");
      const { contract } = await connect();
      const tx = await contract.registerParticipant(address, hashName(ROLES[role]));
      await tx.wait();
    }, `${role} registered.`);
  }

  return (
    <section className="glass-panel mx-auto max-w-xl space-y-4 p-6">
      <h2 className="text-xl font-bold text-white">Register participants</h2>
      <p className="text-sm text-slate-400">Only the wallet that deployed the contract can do this. If you listed your address in the deploy settings, you can skip this page.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="field">Wallet address<input className="input" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." /></label>
        <label className="field">Role
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <button className="btn" disabled={busy}>Register {role.toLowerCase()}</button>
      </form>
      <Notice busy={busy} error={error} done={done} />
    </section>
  );
}
