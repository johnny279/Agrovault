import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { useDisconnect } from "@reown/appkit-controllers/react";
import {
  COOPERATIVE_ADDRESS,
  MARKETPLACE_ADDRESS,
  SEPOLIA_CHAIN_ID,
  USDC_ADDRESS,
} from "../config";
import CooperativeABI from "../contracts/Cooperative.json";
import ProduceMarketplaceABI from "../contracts/ProduceMarketplace.json";
import MockUSDCABI from "../contracts/MockUSDC.json";

const emptyWalletState = {
  provider: null,
  signer: null,
  cooperative: null,
  marketplace: null,
  usdcToken: null,
};

function normalizeChainId(chainId) {
  if (chainId === null || chainId === undefined) {
    return null;
  }

  return typeof chainId === "string" ? Number(chainId) : Number(chainId);
}

export function useWallet() {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount({ namespace: "eip155" });
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId: appKitChainId, switchNetwork } = useAppKitNetwork();
  const { disconnect } = useDisconnect();

  const [walletState, setWalletState] = useState(emptyWalletState);
  const [providerChainId, setProviderChainId] = useState(null);
  const [error, setError] = useState(null);

  const chainId = normalizeChainId(appKitChainId) ?? providerChainId;

  useEffect(() => {
    let cancelled = false;

    async function initContracts() {
      if (!isConnected || !walletProvider || !address) {
        setWalletState(emptyWalletState);
        setProviderChainId(null);
        setError(null);
        return;
      }

      try {
        setError(null);

        const browserProvider = new ethers.BrowserProvider(walletProvider, "any");
        const currentSigner = await browserProvider.getSigner(address);
        const network = await browserProvider.getNetwork();

        if (cancelled) {
          return;
        }

        setProviderChainId(Number(network.chainId));
        setWalletState({
          provider: browserProvider,
          signer: currentSigner,
          cooperative: new ethers.Contract(COOPERATIVE_ADDRESS, CooperativeABI.abi, currentSigner),
          marketplace: new ethers.Contract(
            MARKETPLACE_ADDRESS,
            ProduceMarketplaceABI.abi,
            currentSigner
          ),
          usdcToken: new ethers.Contract(USDC_ADDRESS, MockUSDCABI.abi, currentSigner),
        });
      } catch (initError) {
        if (cancelled) {
          return;
        }

        console.error("Failed to initialize wallet contracts:", initError);
        setWalletState(emptyWalletState);
        setProviderChainId(null);
        setError(initError?.message || "Failed to initialize wallet connection.");
      }
    }

    initContracts();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, walletProvider]);

  useEffect(() => {
    if (!walletProvider?.on) {
      return undefined;
    }

    const handleChainChanged = (nextChainId) => {
      setProviderChainId(normalizeChainId(nextChainId));
    };

    const handleDisconnect = () => {
      setWalletState(emptyWalletState);
      setProviderChainId(null);
    };

    walletProvider.on("chainChanged", handleChainChanged);
    walletProvider.on("disconnect", handleDisconnect);

    return () => {
      walletProvider.removeListener?.("chainChanged", handleChainChanged);
      walletProvider.removeListener?.("disconnect", handleDisconnect);
    };
  }, [walletProvider]);

  const connectWallet = useCallback(() => open(), [open]);
  const disconnectWallet = useCallback(() => disconnect({ namespace: "eip155" }), [disconnect]);
  const switchToSepolia = useCallback(() => switchNetwork({ id: SEPOLIA_CHAIN_ID }), [switchNetwork]);

  return useMemo(
    () => ({
      account: address,
      chainId,
      isWrongNetwork: chainId !== null && chainId !== SEPOLIA_CHAIN_ID,
      connecting: status === "connecting" || status === "reconnecting",
      error,
      connectWallet,
      disconnectWallet,
      switchToSepolia,
      discoveredWallets: [],
      ...walletState,
    }),
    [
      address,
      chainId,
      connectWallet,
      disconnectWallet,
      error,
      status,
      switchToSepolia,
      walletState,
    ]
  );
}
