import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { COOPERATIVE_ADDRESS, MARKETPLACE_ADDRESS, USDC_ADDRESS, SEPOLIA_CHAIN_ID } from "../config";
import CooperativeABI from "../contracts/Cooperative.json";
import ProduceMarketplaceABI from "../contracts/ProduceMarketplace.json";
import MockUSDCABI from "../contracts/MockUSDC.json";
import { appKit } from "../walletConnectAppKit";

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
  const [discoveredWallets, setDiscoveredWallets] = useState([]);

  const activeRawProviderRef = useRef(null);

  // EIP-6963: listen for every installed wallet extension announcing itself
  useEffect(() => {
    function handleAnnouncement(event) {
      const { info, provider: injectedProvider } = event.detail;
      setDiscoveredWallets((prev) => {
        if (prev.some((w) => w.info.uuid === info.uuid)) return prev;
        return [...prev, { info, provider: injectedProvider }];
      });
    }

    window.addEventListener("eip6963:announceProvider", handleAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnouncement);
    };
  }, []);

// Listen for AppKit's WalletConnect session becoming available (mobile / QR flow)
useEffect(() => {
  const unsubscribe = appKit.subscribeProviders(async (state) => {
    const wcProvider = state["eip155"];
    if (!wcProvider) return;

    try {
      const browserProvider = new ethers.BrowserProvider(wcProvider);
      const accounts = wcProvider.accounts && wcProvider.accounts.length > 0
  ? wcProvider.accounts
  : await browserProvider.send("eth_requestAccounts", []);
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

      activeRawProviderRef.current = wcProvider;

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setCooperative(cooperativeContract);
      setMarketplace(marketplaceContract);
      setUsdcToken(usdcContract);
      setConnecting(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect via WalletConnect.");
      setConnecting(false);
    }
  });

  return () => {
    unsubscribe?.();
  };
}, []);

  const connectWallet = useCallback(async (injectedProvider) => {
    setError(null);

    // Fall back to window.ethereum for wallets that don't support EIP-6963 yet
    const targetProvider = injectedProvider || window.ethereum;

    if (!targetProvider) {
      setError("No wallet found. Please install MetaMask.");
      return;
    }

    setConnecting(true);

    try {
      const browserProvider = new ethers.BrowserProvider(targetProvider);
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

      activeRawProviderRef.current = targetProvider;

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

const connectViaWalletConnect = useCallback(async () => {
  setError(null);
  setConnecting(true);
  try {
    await appKit.open({ view: "Connect" });
  } catch (err) {
    console.error(err);
    setError(err.message || "Failed to open WalletConnect.");
    setConnecting(false);
  }
}, []);

  const disconnectWallet = useCallback(() => {
    activeRawProviderRef.current = null;
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setCooperative(null);
    setMarketplace(null);
    setUsdcToken(null);
    setChainId(null);
  }, []);

  // Listen for account or network changes on whichever wallet is actually connected
  useEffect(() => {
    const rawProvider = activeRawProviderRef.current;
    if (!rawProvider || !rawProvider.on) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet(rawProvider);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    rawProvider.on("accountsChanged", handleAccountsChanged);
    rawProvider.on("chainChanged", handleChainChanged);

    return () => {
      rawProvider.removeListener?.("accountsChanged", handleAccountsChanged);
      rawProvider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [account, connectWallet, disconnectWallet]);

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
  connectViaWalletConnect,  
  disconnectWallet,
  discoveredWallets,
};
}