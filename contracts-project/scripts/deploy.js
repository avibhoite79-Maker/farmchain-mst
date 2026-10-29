const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const FarmChain = await hre.ethers.getContractFactory("FarmChain");
  const fc = await FarmChain.deploy();
  await fc.waitForDeployment();
  const address = await fc.getAddress();
  const receipt = await fc.deploymentTransaction().wait();
  console.log("FarmChain deployed to:", address);

  // Optionally register wallets from .env
  const roles = [
    ["FARMER_ADDRESS", await fc.FARMER_ROLE()],
    ["TRANSPORTER_ADDRESS", await fc.TRANSPORTER_ROLE()],
    ["RETAILER_ADDRESS", await fc.RETAILER_ROLE()],
  ];
  for (const [envName, role] of roles) {
    if (process.env[envName]) {
      await (await fc.registerParticipant(process.env[envName], role)).wait();
      console.log("Registered", envName, process.env[envName]);
    }
  }

  // Save address + ABI for backend and frontend
  const artifact = await hre.artifacts.readArtifact("FarmChain");
  const data = JSON.stringify({ address, block: receipt.blockNumber, abi: artifact.abi }, null, 2);
  const targets = [
    path.resolve(__dirname, "../../backend/deployment.json"),
    path.resolve(__dirname, "../../frontend/src/contract/deployment.json"),
  ];
  for (const t of targets) {
    fs.writeFileSync(t, data);
    console.log("Wrote", t);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
