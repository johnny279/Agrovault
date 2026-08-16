import { useWallet } from "./hooks/useWallet";
import { useMemberInfo } from "./hooks/useMemberInfo";
import { shortenAddress } from "./utils/format";
import AdminDashboard from "./components/AdminDashboard";
import MemberDashboard from "./components/MemberDashboard";
import "./App.css";

function App() {
  const {
    account,
    connecting,
    error,
    isWrongNetwork,
    connectWallet,
    cooperative,
    marketplace,
    usdcToken,
    provider,
  } = useWallet();

  const { memberInfo, loading, isSuperAdmin, refresh } = useMemberInfo(cooperative, account);

  if (!account) {
    return (
      <div className="app">
        <div className="landing">
          <header className="landing-nav">
            <span className="landing-logo">AgroVault</span>
          </header>

          <section className="hero">
            <span className="hero-badge">Live on Sepolia Testnet</span>
            <h1>Save, borrow, and trade produce — all on-chain.</h1>
            <p className="hero-sub">
              AgroVault is a blockchain cooperative for farmers and buyers.
              Deposit savings, unlock loans against your balance, and trade
              produce directly — with every transaction transparent and
              verifiable.
            </p>
            <button onClick={connectWallet} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
            {error && <p className="error">{error}</p>}
          </section>

          <section className="feature-grid">
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

          <footer className="landing-footer">
            <p>Requires MetaMask and Sepolia testnet ETH.</p>
          </footer>
        </div>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="app">
        <div className="connect-screen">
          <h1>Wrong Network</h1>
          <p>Please switch MetaMask to the Sepolia testnet.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="connect-screen">
          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>AgroVault</h1>
        <div className="account-info">
          {shortenAddress(account)} · {memberInfo?.roleName || "Unknown"}
        </div>
      </header>

      {memberInfo?.roleName === "Admin" ? (
        <AdminDashboard
          cooperative={cooperative}
          marketplace={marketplace}
          provider={provider}
          account={account}
          isSuperAdmin={isSuperAdmin}
          onActionComplete={refresh}
        />
      ) : memberInfo?.roleName === "Farmer" || memberInfo?.roleName === "Buyer" ? (
        <MemberDashboard
          cooperative={cooperative}
          marketplace={marketplace}
          usdcToken={usdcToken}
          provider={provider}
          account={account}
          memberInfo={memberInfo}
          onActionComplete={refresh}
        />
      ) : (
        <div className="connect-screen">
          <p>Dashboard for your role ({memberInfo?.roleName || "unregistered"}) coming soon.</p>
        </div>
      )}
    </div>
  );
}

export default App;