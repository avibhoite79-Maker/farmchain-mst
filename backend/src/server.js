import "dotenv/config";
import express from "express";
import cors from "cors";
import QRCode from "qrcode";
import fs from "node:fs";
import { JsonRpcProvider, Contract, formatEther } from "ethers";

const deployment = JSON.parse(
  fs.readFileSync(new URL("../deployment.json", import.meta.url), "utf8")
);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const STATUS = ["Harvested", "In Transit", "Delivered", "Sold"];

if (!deployment.address) {
  console.warn("deployment.json is empty. Deploy the contract first (see README).");
}

const provider = new JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
const contract = new Contract(
  deployment.address || "0x0000000000000000000000000000000000000000",
  deployment.abi,
  provider
);

const toBatch = (b) => ({
  id: b.id.toString(),
  cropName: b.cropName,
  quantity: b.quantity.toString(),
  origin: b.origin,
  harvestDate: Number(b.harvestDate),
  price: formatEther(b.price),
  farmer: b.farmer,
  currentOwner: b.currentOwner,
  retailer: b.retailer,
  paid: b.paid,
  status: STATUS[Number(b.status)],
});

const toUpdate = (u) => ({
  status: STATUS[Number(u.status)],
  by: u.by,
  note: u.note,
  timestamp: Number(u.timestamp),
});

const app = express();
app.use(cors());

app.get("/", (_req, res) => res.json({ app: "FarmChain API", ok: true }));

// All batches (newest first)
app.get("/api/batches", async (_req, res) => {
  try {
    const count = Number(await contract.batchCount());
    const list = [];
    for (let id = count; id >= 1; id--) list.push(toBatch(await contract.getBatch(id)));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.shortMessage || e.message });
  }
});

// One batch + its journey
app.get("/api/batch/:id", async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const [batch, history] = await Promise.all([contract.getBatch(id), contract.getHistory(id)]);
    res.json({ batch: toBatch(batch), history: history.map(toUpdate) });
  } catch (e) {
    const notFound = (e.reason || e.message || "").includes("does not exist");
    res
      .status(notFound ? 404 : 500)
      .json({ error: notFound ? "Batch not found" : e.shortMessage || e.message });
  }
});

// QR code image (PNG) that opens the public trace page
app.get("/api/qr/:id", async (req, res) => {
  try {
    const png = await QRCode.toBuffer(`${FRONTEND_URL}/trace/${req.params.id}`, {
      width: 320,
      margin: 2,
    });
    res.type("png").send(png);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Recent on-chain activity (real transaction hashes) for the dashboard ledger
const blockTimes = new Map();
async function blockTime(n) {
  if (!blockTimes.has(n)) {
    const b = await provider.getBlock(n);
    blockTimes.set(n, b ? Number(b.timestamp) : 0);
  }
  return blockTimes.get(n);
}

app.get("/api/activity", async (_req, res) => {
  try {
    const from = Number(deployment.block || 0);
    const names = ["BatchCreated", "OrderPlaced", "StatusUpdated", "PaymentReleased"];
    const groups = await Promise.all(names.map((n) => contract.queryFilter(n, from, "latest")));
    const logs = groups
      .flat()
      .sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index)
      .slice(0, 25);
    const items = [];
    for (const ev of logs) {
      const type = ev.fragment.name;
      const item = {
        type,
        batchId: ev.args.id.toString(),
        hash: ev.transactionHash,
        block: ev.blockNumber,
        time: await blockTime(ev.blockNumber),
      };
      if (type === "StatusUpdated") item.status = STATUS[Number(ev.args.status)];
      if (type === "OrderPlaced" || type === "PaymentReleased") item.amount = formatEther(ev.args.amount);
      items.push(item);
    }
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.shortMessage || e.message });
  }
});

app.listen(PORT, () => console.log(`FarmChain API running on http://localhost:${PORT}`));
