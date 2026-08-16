# AgroVault

A blockchain-based cooperative platform connecting farmers and buyers, built on the Sepolia testnet. AgroVault lets members save USDC, borrow against their savings, and trade produce directly — with every transaction transparent and verifiable on-chain.

🔗 **Live App:** [https://agrovault-eight.vercel.app](https://agrovault-eight.vercel.app)
📜 **Smart Contracts Repo:** [https://github.com/johnny279/agrovault-contracts](https://github.com/johnny279/agrovault-contracts)

## Features

- **Savings & Lending** — Deposit USDC into the cooperative pool, unlock loans scaled to your balance and trust tier
- **Produce Marketplace** — Farmers list produce batches; buyers purchase directly through on-chain escrow
- **Role-Based Dashboards** — Separate views for Admins, Farmers, Buyers, and read-only Auditors
- **On-Chain Activity History** — Every deposit, loan, and sale is verifiable directly from contract events

## Requirements

- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH ([faucet](https://sepoliafaucet.com/))

## Tech Stack

- **Frontend:** React (Vite), Ethers.js
- **Smart Contracts:** Solidity, Hardhat
- **Network:** Ethereum Sepolia Testnet

## Running Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` and connect your MetaMask wallet.
