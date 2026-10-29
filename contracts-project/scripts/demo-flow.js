// Runs the full FarmChain flow on the chosen network with ONE wallet (the deployer)
// and writes every transaction hash to ../DEPLOYMENT.md for your submission.
//   npx hardhat run scripts/demo-flow.js --network mstTestnet
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const EXPLORER = (process.env.EXPLORER_URL || "https://testnet.mstscan.com").replace(/\/$/, "");

async function main() {
  const { ethers } = hre;
  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();
  const net = await ethers.provider.getNetwork();

  const deployment = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../backend/deployment.json"), "utf8")
  );
  if (!deployment.address) throw new Error("Deploy first: npx hardhat run scripts/deploy.js --network mstTestnet");
  const fc = await ethers.getContractAt("FarmChain", deployment.address, signer);

  const txs = [];
  const step = async (label, promise) => {
    const tx = await promise;
    const rc = await tx.wait();
    txs.push({ label, hash: tx.hash, block: rc.blockNumber });
    console.log(`${label}: ${tx.hash}`);
  };

  // Give the deployer all three roles (skipped if it already has them)
  for (const [name, role] of [
    ["Farmer", await fc.FARMER_ROLE()],
    ["Transporter", await fc.TRANSPORTER_ROLE()],
    ["Retailer", await fc.RETAILER_ROLE()],
  ]) {
    if (!(await fc.hasRole(role, me))) await step(`Register ${name} role`, fc.registerParticipant(me, role));
  }

  const price = ethers.parseEther("0.001");
  await step("Farmer creates batch (Alphonso Mango)", fc.createBatch("Alphonso Mango", 100, "Ratnagiri, Maharashtra", price));
  const id = await fc.batchCount();
  await step("Retailer places order (payment into escrow)", fc.placeOrder(id, { value: price }));
  await step("Transporter: picked up (In Transit)", fc.updateStatus(id, 1, "Picked up from farm gate"));
  await step("Transporter: delivered", fc.updateStatus(id, 2, "Delivered to retail shop"));
  await step("Retailer confirms receipt (farmer paid)", fc.confirmReceipt(id, "Received and verified"));

  const rows = txs
    .map((t) => `| ${t.label} | [\`${t.hash}\`](${EXPLORER}/tx/${t.hash}) | ${t.block} |`)
    .join("\n");

  const md = `# FarmChain - Deployment and transactions

- Network: chain ID ${net.chainId}
- Contract address: [\`${deployment.address}\`](${EXPLORER}/address/${deployment.address})
- Demo batch ID: ${id}
- Generated: ${new Date().toISOString()}

| Step | Transaction hash | Block |
|---|---|---|
${rows}
`;
  const out = path.resolve(__dirname, "../../DEPLOYMENT.md");
  fs.writeFileSync(out, md);
  console.log("\nSaved", out);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
