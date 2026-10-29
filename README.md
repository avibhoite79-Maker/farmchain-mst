# FarmChain - Trust in every Harvest

Blockchain supply-chain tracker: Farmer -> Transporter -> Retailer -> Customer.

## Folder structure
- contracts-project : Solidity smart contract + Hardhat (build this FIRST)
- backend           : Node.js + Express API (reads the chain, makes QR codes)
- frontend          : React (Vite) app with MetaMask

## How the pieces talk
- Anything that CHANGES data (create batch, update status, pay) is signed in MetaMask by the user's own wallet.
  No private keys are stored on the server.
- The backend only READS the chain (for the public QR trace page) and generates QR codes.

## Run it locally (needs 3 terminals) - see STEPS below

### Terminal 1 - local blockchain
cd contracts-project
npm install
npx hardhat test              # run the tests
npx hardhat node              # leave running; prints 20 test accounts

### Terminal 2 - deploy, then backend
cd contracts-project
npx hardhat run scripts/deploy.js --network localhost
# ^ writes deployment.json into backend/ and frontend/src/contract/
cd ../backend
npm install
cp .env.example .env
npm start                     # http://localhost:5000

### Terminal 3 - frontend
cd frontend
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173

### BridgeKey Wallet Setup (MST Testnet)

FarmChain uses BridgeKey for wallet interactions on the MST Testnet.

1. Open your BridgeKey wallet and connect to the supported MST Testnet.
2. Use a dedicated test wallet for development and testing.
3. Obtain test MSTC tokens from the official MST faucet if required.
4. Configure the MST RPC endpoint and deployed smart contract addresses in the appropriate environment files.
5. Start the frontend and backend using the installation commands above.

**Security:** Never commit private keys, recovery phrases, or wallet credentials to GitHub.


### Demo flow
Farmer: create batch -> QR code appears
Retailer: place order (pays into escrow)
Transporter: Picked up -> Delivered
Retailer: confirm receipt -> farmer is paid automatically
Anyone: open /trace/1 (or scan the QR) to see the journey

## Testing on MST Testnet with BridgeKey (MSTC tokens)
The contract uses the chain's native coin (MSTC on MST) for prices and escrow, so no extra token contract is needed.

1. Create a NEW throwaway wallet for deploying (do not use your main wallet's key). Fund it from the MST faucet.
2. contracts-project/.env : set PRIVATE_KEY (throwaway), and FARMER_ADDRESS / TRANSPORTER_ADDRESS / RETAILER_ADDRESS
   to your BridgeKey wallet address (the same address can hold all three roles for testing).
3. Deploy:   npx hardhat run scripts/deploy.js --network mstTestnet
4. backend/.env  : RPC_URL=https://testnetrpc.mstblockchain.com ; then npm start
5. frontend/.env : VITE_NETWORK=mst ; then npm run dev -- --host
6. Open the site inside BridgeKey's dApp browser (if available) using http://<PC-Wi-Fi-IP>:5173
   (set VITE_API_URL and FRONTEND_URL to the same PC IP so the phone can reach the backend).
Network values (chain ID 91562037, RPC https://testnetrpc.mstblockchain.com) come from community and MST repos: confirm them in the MST docs.

## QR code features
- Farmer: after creating a batch, a printable crate label appears (print, download PNG, copy link).
- Transporter and Retailer: "Scan crate QR" fills in the batch number from the camera.
- Customer: /scan opens the camera; scanning shows the full journey. Also /batches lists every batch with its QR.
- Trace page: shows verification checks, a link to the contract on the block explorer, and a printable label.

### Phone camera needs HTTPS
Browsers only allow the camera on https (or localhost). Pick one:
1. `cd frontend && npm run dev:https` then open https://<PC-IP>:5173 on the phone (accept the certificate warning).
2. Public link: `npx ngrok http 5173` (or a Cloudflare tunnel). Put the https link in frontend/.env as VITE_PUBLIC_URL
   so printed QR codes always open the right address.
3. Deploy the frontend to Vercel/Netlify and the backend to Render/Railway (set VITE_API_URL to the backend URL).
The Vite proxy sends /api to the backend, so the phone only needs to reach port 5173.
