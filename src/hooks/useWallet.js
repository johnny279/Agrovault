import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { COOPERATIVE_ADDRESS, MARKETPLACE_ADDRESS, USDC_ADDRESS, SEPOLIA_CHAIN_ID } from "../config";
import CooperativeABI from "../contracts/Cooperative.json";
import ProduceMarketplaceABI from "../contracts/ProduceMarketplace.json";
import MockUSDCABI from "../contracts/MockUSDC.json";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [cooperative, setCooperative] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [usdcToken, setUsdcToken] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    setError(null);

    if (!window.ethereum) {
      setError("No wallet found. Please install MetaMask.");
      return;
    }

    setConnecting(true);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

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
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setCooperative(cooperativeContract);
      setMarketplace(marketplaceContract);
      setUsdcToken(usdcContract);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect wallet.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setCooperative(null);
    setMarketplace(null);
    setUsdcToken(null);
    setChainId(null);
  }, []);

  // Listen for account or network changes in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  const isWrongNetwork = chainId !== null && chainId !== SEPOLIA_CHAIN_ID;

  return {
    account,
    provider,
    signer,
    cooperative,
    marketplace,
    usdcToken,
    chainId,
    isWrongNetwork,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
  };
}
