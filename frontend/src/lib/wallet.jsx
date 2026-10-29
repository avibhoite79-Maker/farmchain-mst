import { createContext, useContext, useEffect, useState } from "react";
import { connect, errorText, silentAccount, walletName, watchAccounts } from "./chain.js";

const Ctx = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    silentAccount().then((a) => { setAccount(a); setName(walletName()); }).catch(() => {});
    watchAccounts(setAccount);
  }, []);

  async function connectWallet() {
    try {
      const r = await connect();
      setAccount(r.account);
      setName(walletName());
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }

  return <Ctx.Provider value={{ account, name, error, connectWallet }}>{children}</Ctx.Provider>;
}

export const useWallet = () => useContext(Ctx);
