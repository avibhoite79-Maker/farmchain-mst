# FarmChain - Quick start (Windows)

You need: Node.js LTS, Git, and the BridgeKey browser extension (MetaMask turned OFF).
Open the project folder in Antigravity, then use its Terminal. You will open 3 terminals.

## A. One time: put your wallet details in
1. contracts-project\.env  (copy .env.example to .env)
   PRIVATE_KEY=<your BridgeKey test wallet key>
   FARMER_ADDRESS=<your BridgeKey address>
   TRANSPORTER_ADDRESS=<your BridgeKey address>
   RETAILER_ADDRESS=<your BridgeKey address>
2. backend\.env       (copy .env.example to .env)   - no changes needed
3. frontend\.env      (copy .env.example to .env)   - VITE_NETWORK=mst

## B. Deploy the contract to MST Testnet (once)
cd contracts-project
npm install
npx hardhat test
npm run deploy:mst
npm run demo:mst          (creates real transactions and writes DEPLOYMENT.md)

## C. Run the app (every time)
Terminal 1:  cd backend      then   npm install   then   npm start
Terminal 2:  cd frontend     then   npm install   then   npm run dev
Open http://localhost:5173 and press "Connect wallet" (BridgeKey).

## D. Demo order
Farmer -> create batch (QR label appears)
Retailer -> place order and pay
Transporter -> move to next step (twice)
Retailer -> confirm receipt (farmer is paid)
Customer -> scan the QR, see the journey
