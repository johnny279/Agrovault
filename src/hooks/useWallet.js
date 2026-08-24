import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { COOPERATIVE_ADDRESS, MARKETPLACE_ADDRESS, USDC_ADDRESS, SEPOLIA_CHAIN_ID } from "../config";
import CooperativeABI from "../contracts/Cooperative.json";
import ProduceMarketplaceABI from "../contracts/ProduceMarketplace.json";
import MockUSDCABI from "../contracts/MockUSDC.json";

export function useWallet() {
  // 1. Pull connection state and address directly from AppKit
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [cooperative, setCooperative] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [usdcToken, setUsdcToken] = useState(null);
  const [chainId, setChainId] = useState(null);

  // 2. Initialize Ethers contracts whenever AppKit connects a wallet
  useEffect(() => {
    async function initContracts() {
      if (isConnected && walletProvider) {
        try {
          const browserProvider = new ethers.BrowserProvider(walletProvider);
          const currentSigner = await browserProvider.getSigner();
          const network = await browserProvider.getNetwork();

          const cooperativeContract = new ethers.Contract(
            COOPERATIVE_ADDRESS,
            CooperativeABI.abi,
            currentSigner
          );
          const marketplaceContract = new ethers.Contract(
            MARKETPLACE_ADDRESS,
            ProduceMarketplaceABI.abi,
            currentSigner
          );
          const usdcContract = new ethers.Contract(
            USDC_ADDRESS,
            MockUSDCABI.abi,
            currentSigner
          );

          setProvider(browserProvider);
          setSigner(currentSigner);
          setChainId(Number(network.chainId));
          setCooperative(cooperativeContract);
          setMarketplace(marketplaceContract);
          setUsdcToken(usdcContract);
        } catch (error) {
          console.error("Failed to initialize contracts:", error);
        }
      } else {
        // Clear state if user disconnects via the AppKit modal
        setProvider(null);
        setSigner(null);
        setChainId(null);
        setCooperative(null);
        setMarketplace(null);
        setUsdcToken(null);
      }
    }

    initContracts();
  }, [isConnected, walletProvider]);

  const isWrongNetwork = chainId !== null && chainId !== SEPOLIA_CHAIN_ID;

  return {
    account: address,
    provider,
    signer,
    cooperative,
    marketplace,
    usdcToken,
    chainId,
    isWrongNetwork,
    
    // We export these as dummies so your App.jsx doesn't break.
    // The <appkit-button /> in your LandingPage handles all of this automatically now!
    connecting: false,
    error: null,
    connectWallet: () => {}, 
    disconnectWallet: () => {},
    discoveredWallets: [],
  };
}