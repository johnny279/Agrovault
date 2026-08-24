import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import {
  COOPERATIVE_ADDRESS,
  MARKETPLACE_ADDRESS,
  USDC_ADDRESS,
  SEPOLIA_CHAIN_ID,
  WALLETCONNECT_PROJECT_ID,
} from "../config";
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
  const [discoveredWallets, setDiscoveredWallets] = useState([]);

  const activeRawProviderRef = useRef(null);
  const wcProviderRef = useRef(null); // reused across connect attempts so we don't re-init every click

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

  // Shared setup: wraps whichever raw provider (injected or WalletConnect)
  // in an ethers BrowserProvider and builds the contract instances.
  const hydrateFromProvider = useCallback(async (targetProvider) => {
    const browserProvider = new ethers.BrowserProvider(targetProvider);
    const accounts = await browserProvider.send("eth_requestAccounts", []);
    const network = await browserProvider.getNetwork();
    const currentSigner = await browserProvider.getSigner();

    const cooperativeContract = new ethers.Contract(COOPERATIVE_ADDRESS, CooperativeABI.abi, currentSigner);
    const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, ProduceMarketplaceABI.abi, currentSigner);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, MockUSDCABI.abi, currentSigner);

    setProvider(browserProvider);
    setSigner(currentSigner);
    setAccount(accounts[0]);
    setChainId(Number(network.chainId));
    setCooperative(cooperativeContract);
    setMarketplace(marketplaceContract);
    setUsdcToken(usdcContract);
  }, []);

  const connectWallet = useCallback(
    async (injectedProvider) => {
      setError(null);

      // Fall back to window.ethereum for wallets that don't support EIP-6963 yet
      const targetProvider = injectedProvider || window.ethereum;

      if (!targetProvider) {
        setError("No browser wallet found. Install MetaMask, or use WalletConnect to link a mobile wallet.");
        return;
      }

      setConnecting(true);
      try {
        activeRawProviderRef.current = targetProvider;
        await hydrateFromProvider(targetProvider);
      } catch (err) {
        console.error(err);
        activeRawProviderRef.current = null;
        setError(err.message || "Failed to connect wallet.");
      } finally {
        setConnecting(false);
      }
    },
    [hydrateFromProvider]
  );

  const connectWalletConnect = useCallback(async () => {
    setError(null);

    if (!WALLETCONNECT_PROJECT_ID) {
      setError("WalletConnect isn't configured (missing VITE_WALLETCONNECT_PROJECT_ID).");
      return;
    }

    setConnecting(true);
    try {
      const wcProvider =
        wcProviderRef.current ||
        (await EthereumProvider.init({
          projectId: WALLETCONNECT_PROJECT_ID,
          chains: [SEPOLIA_CHAIN_ID],
          showQrModal: true,
          metadata: {
            name: "AgroVault",
            description: "Cooperative savings, lending, and produce marketplace on Sepolia",
            url: window.location.origin,
            icons: [`${window.location.origin}/favicon.svg`],
          },
        }));

      wcProviderRef.current = wcProvider;

      // On desktop this pops the QR modal; on mobile it shows/deep-links to installed wallet apps.
      if (!wcProvider.session) {
        await wcProvider.connect();
      }

      activeRawProviderRef.current = wcProvider;
      await hydrateFromProvider(wcProvider);
    } catch (err) {
      console.error(err);
      activeRawProviderRef.current = null;
      // Don't show an error if the user just closed the modal
      if (err?.message && !/closed|rejected/i.test(err.message)) {
        setError(err.message || "Failed to connect via WalletConnect.");
      }
    } finally {
      setConnecting(false);
    }
  }, [hydrateFromProvider]);

  const disconnectWallet = useCallback(() => {
    const rawProvider = activeRawProviderRef.current;
    if (rawProvider?.disconnect) {
      rawProvider.disconnect().catch(() => {});
    }
    activeRawProviderRef.current = null;
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setCooperative(null);
    setMarketplace(null);
    setUsdcToken(null);
    setChainId(null);
  }, []);

  // Listen for account/network changes, and for WalletConnect sessions ending
  // from the mobile wallet's side ("disconnect" event).
  useEffect(() => {
    const rawProvider = activeRawProviderRef.current;
    if (!rawProvider || !rawProvider.on) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet(rawProvider);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    rawProvider.on("accountsChanged", handleAccountsChanged);
    rawProvider.on("chainChanged", handleChainChanged);
    rawProvider.on("disconnect", handleDisconnect);

    return () => {
      rawProvider.removeListener?.("accountsChanged", handleAccountsChanged);
      rawProvider.removeListener?.("chainChanged", handleChainChanged);
      rawProvider.removeListener?.("disconnect", handleDisconnect);
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
    connectWalletConnect,
    disconnectWallet,
    discoveredWallets,
  };
}