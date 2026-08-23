import { useEffect, useRef, useState } from "react";
import HeroEmblem from "./HeroEmblem";
import WalletPicker from "./WalletPicker";

function useScrollReveal() {
  const containerRef = useRef(null);

  useEffect(() => {
    const nodes = containerRef.current.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return containerRef;
}

function LandingPage({ connectWallet, connecting, error, discoveredWallets }) {
  const containerRef = useScrollReveal();
  const [showPicker, setShowPicker] = useState(false);

  function handleConnectClick() {
    if (discoveredWallets.length === 0) {
      connectWallet(); // falls back to window.ethereum, or shows "not found" error
    } else if (discoveredWallets.length === 1) {
      connectWallet(discoveredWallets[0].provider);
    } else {
      setShowPicker(true);
    }
  }

  function handleWalletSelect(provider) {
    setShowPicker(false);
    connectWallet(provider);
  }

  return (
    <div className="landing" ref={containerRef}>
      <header className="landing-nav">
        <span className="landing-logo">AgroVault</span>
        <div className="nav-connect-wrap">
          <button onClick={handleConnectClick} disabled={connecting}>
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
          {error && <div className="nav-error-dropdown">{error}</div>}
        </div>
      </header>

      <section className="hero hero--split">
        <div className="hero-text">
          <span className="hero-badge">Live on Sepolia Testnet</span>
          <h1>Save, borrow, and trade produce — all on-chain.</h1>
          <p className="hero-sub">
            AgroVault is a blockchain cooperative for farmers and buyers.
            Deposit savings, unlock loans against your balance, and trade
            produce directly — with every transaction transparent and
            verifiable.
          </p>
          <button onClick={handleConnectClick} disabled={connecting} className="hero-cta">
            {connecting ? "Connecting..." : "Connect Wallet to Get Started"}
          </button>
        </div>
        <div className="hero-visual">
          <HeroEmblem />
        </div>
      </section>

      <section className="how-it-works reveal">
        <h2 className="section-title">How it works</h2>
        <div className="steps-row">
          <div className="step-item">
            <span className="step-number">1</span>
            <h3>Connect your wallet</h3>
            <p>Link MetaMask on the Sepolia testnet to get started.</p>
          </div>
          <div className="step-item">
            <span className="step-number">2</span>
            <h3>Get onboarded</h3>
            <p>An admin verifies and onboards you as a Farmer or Buyer.</p>
          </div>
          <div className="step-item">
            <span className="step-number">3</span>
            <h3>Save, borrow, or trade</h3>
            <p>Deposit savings, apply for loans, or buy and sell produce.</p>
          </div>
        </div>
      </section>

      <section className="feature-grid reveal">
        <div className="feature-card">
          <h3>Save & Borrow</h3>
          <p>
            Deposit USDC into the cooperative pool. Build your balance
            and unlock loans scaled to your savings and trust level.
          </p>
        </div>
        <div className="feature-card">
          <h3>Sell Produce</h3>
          <p>
            Farmers list approved produce batches. Buyers purchase
            directly — funds settle automatically through escrow.
          </p>
        </div>
        <div className="feature-card">
          <h3>Transparent by Design</h3>
          <p>
            Every deposit, loan, and sale lives on-chain. No hidden
            books — just a public, auditable ledger.
          </p>
        </div>
      </section>

      <section className="trust-section reveal">
        <h2 className="section-title">Built for trust</h2>
        <ul className="trust-list">
          <li>Smart contracts are deployed and verified on Etherscan.</li>
          <li>No admin can move funds without an on-chain transaction.</li>
          <li>Anyone can independently verify cooperative activity — no login required.</li>
          <li>Loan limits scale automatically with your savings and repayment history.</li>
        </ul>
      </section>

      <footer className="landing-footer">
        <div className="footer-links">
          <a href="https://github.com/johnny279/Agrovault" target="_blank" rel="noopener noreferrer">
            Frontend Repo
          </a>
          <a href="https://github.com/johnny279/agrovault-contracts" target="_blank" rel="noopener noreferrer">
            Smart Contracts
          </a>
        </div>
        <p>Requires MetaMask and Sepolia testnet ETH.</p>
      </footer>

      {showPicker && (
        <WalletPicker
          wallets={discoveredWallets}
          onSelect={handleWalletSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

export default LandingPage;