import { BrowserProvider, Contract } from "ethers";
import deployment from "../contract/deployment.json";

export const API = import.meta.env.VITE_API_URL ?? "";
export const STATUS = ["Harvested", "In Transit", "Delivered", "Sold"];
export const EXPLORER = (import.meta.env.VITE_EXPLORER_URL || "").replace(/\/$/, "");
export const CONTRACT_ADDRESS = deployment.address;

// VITE_NETWORK = "local" (Hardhat node) or "mst" (MST Testnet)
const NETWORK = import.meta.env.VITE_NETWORK || "local";
export const SYMBOL = NETWORK === "mst" ? "MSTC" : "ETH";
export const NETWORK_LABEL = NETWORK === "mst" ? "MST Testnet" : "Local network";

// Verify these values in the MST docs / faucet page. If they differ, change them here
// and in contracts-project/hardhat.config.js.
const MST_TESTNET = {
  chainId: "0x" + (91562037).toString(16),
  chainName: "MST Testnet",
  rpcUrls: ["https://testnetrpc.mstblockchain.com"],
  nativeCurrency: { name: "MSTC", symbol: "MSTC", decimals: 18 },
  blockExplorerUrls: ["https://testnet.mstscan.com"],
};

// ---- Wallet picker: prefers BridgeKey when several wallets are installed ----
const announced = [];
if (typeof window !== "undefined") {
  // EIP-6963: modern wallets announce themselves, so two wallets don't fight over window.ethereum.
  window.addEventListener("eip6963:announceProvider", (e) => announced.push(e.detail));
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

let chosen = null;
let chosenName = "";
async function getWallet() {
  if (chosen) return chosen;
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((r) => setTimeout(r, 300));
  const bridgeKey = announced.find((p) => /bridge/i.test(p.info?.name || ""));
  const legacy = window.ethereum?.providers?.find?.((p) => p.isBridgeKey || p.isBridgekey);
  chosen = bridgeKey?.provider || legacy || window.ethereum || null;
  chosenName =
    bridgeKey?.info?.name ||
    (legacy ? "BridgeKey" : announced.find((p) => p.provider === chosen)?.info?.name || (chosen ? "Wallet" : ""));
  return chosen;
}
export const walletName = () => chosenName;

// Returns the already-connected account without opening a popup.
export async function silentAccount() {
  const w = await getWallet();
  if (!w) return null;
  const accounts = await w.request({ method: "eth_accounts" });
  return accounts[0] || null;
}

export function watchAccounts(cb) {
  getWallet().then((w) => w?.on?.("accountsChanged", (a) => cb(a[0] || null)));
}

// Asks the wallet to switch to (or add) MST Testnet.
async function ensureNetwork(wallet) {
  if (NETWORK !== "mst") return;
  try {
    await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: MST_TESTNET.chainId }] });
  } catch (e) {
    const unknownChain = e.code === 4902 || e.code === -32603 || /unrecognized|not added/i.test(e.message || "");
    if (!unknownChain) throw e;
    await wallet.request({ method: "wallet_addEthereumChain", params: [MST_TESTNET] });
  }
}

// Opens the wallet and returns a contract connected to the user's account.
export async function connect() {
  const wallet = await getWallet();
  if (!wallet) {
    throw new Error("No wallet found. Install the BridgeKey extension, then refresh this page.");
  }
  if (!deployment.address) throw new Error("Contract not deployed yet. Run the deploy script (see QUICKSTART.md).");
  await wallet.request({ method: "eth_requestAccounts" });
  await ensureNetwork(wallet);
  const provider = new BrowserProvider(wallet);
  const signer = await provider.getSigner();
  const contract = new Contract(deployment.address, deployment.abi, signer);
  return { contract, account: await signer.getAddress() };
}

// Turns raw blockchain errors into readable messages.
export function errorText(e) {
  return e?.reason || e?.shortMessage || e?.info?.error?.message || e?.message || "Something went wrong";
}

export const short = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "-");
export const fmtDate = (ts) => new Date(ts * 1000).toLocaleString();
export const txLink = (hash) => (EXPLORER ? `${EXPLORER}/tx/${hash}` : null);
export function timeAgo(ts) {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
