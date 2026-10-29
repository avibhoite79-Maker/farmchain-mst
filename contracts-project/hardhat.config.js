require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const networks = {
  localhost: { url: "http://127.0.0.1:8545" },
};

if (accounts.length) {
  // MST Testnet. Verify these values in the MST docs before deploying.
  networks.mstTestnet = {
    url: process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com",
    chainId: 91562037,
    accounts,
  };
  // MST Mainnet (chain ID 4646). Get the RPC URL from docs.mstblockchain.com and put it in .env.
  if (process.env.MST_MAINNET_RPC_URL) {
    networks.mstMainnet = {
      url: process.env.MST_MAINNET_RPC_URL,
      chainId: 4646,
      accounts,
    };
  }
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // "paris" avoids the PUSH0 opcode, which some EVM chains don't support yet.
      evmVersion: "paris",
    },
  },
  networks,
};
