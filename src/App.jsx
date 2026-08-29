import { useWallet } from "./hooks/useWallet";
import { useMemberInfo } from "./hooks/useMemberInfo";
import { shortenAddress } from "./utils/format";
import AdminDashboard from "./components/AdminDashboard";
import MemberDashboard from "./components/MemberDashboard";
import AuditorDashboard from "./components/AuditorDashboard";
import LandingPage from "./components/LandingPage";
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
  connectViaWalletConnect,
  provider,
  discoveredWallets,
} = useWallet();

  const { memberInfo, loading, isSuperAdmin, refresh } = useMemberInfo(cooperative, account);

  if (!account) {
    return (
      <div className="app">
       <LandingPage
  connectWallet={connectWallet}
  connectViaWalletConnect={connectViaWalletConnect}
  connecting={connecting}
  error={error}
  discoveredWallets={discoveredWallets}
/>
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
        <AuditorDashboard
          cooperative={cooperative}
          marketplace={marketplace}
          provider={provider}
          account={account}
        />
      )}
    </div>
  );
}

export default App;