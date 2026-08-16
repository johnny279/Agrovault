import { useState, useEffect, useCallback } from "react";
import DashboardTabs from "./DashboardTabs";
import HistoryTab from "./HistoryTab";

function AuditorDashboard({ cooperative, marketplace, provider, account }) {
  const [totalLoans, setTotalLoans] = useState(null);
  const [totalBatches, setTotalBatches] = useState(null);
  const [totalAdmins, setTotalAdmins] = useState(null);

  const refreshStats = useCallback(async () => {
    if (!cooperative || !marketplace) return;
    try {
      const [loanCount, batchCount, adminCount] = await Promise.all([
        cooperative.loanCounter(),
        marketplace.batchCounter(),
        cooperative.adminCount(),
      ]);
      setTotalLoans(Number(loanCount));
      setTotalBatches(Number(batchCount));
      setTotalAdmins(Number(adminCount));
    } catch (err) {
      console.error("Failed to fetch coop stats:", err);
    }
  }, [cooperative, marketplace]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const overview = (
    <div className="dashboard-grid">
      <section className="card">
        <h3>Admins</h3>
        <p className="hint">{totalAdmins !== null ? totalAdmins : "..."} active admin(s) managing the cooperative.</p>
      </section>

      <section className="card">
        <h3>Loans Issued</h3>
        <p className="hint">{totalLoans !== null ? totalLoans : "..."} total loan(s) requested to date.</p>
      </section>

      <section className="card">
        <h3>Produce Batches</h3>
        <p className="hint">{totalBatches !== null ? totalBatches : "..."} total batch(es) logged to date.</p>
      </section>

      <section className="card card--full">
        <h3>About This View</h3>
        <p className="hint">
          You're viewing AgroVault as an unregistered visitor. This read-only dashboard
          reflects general cooperative activity — deposits, loans, and produce sales are
          independently verifiable on-chain. Contact an admin to be onboarded as a
          Farmer or Buyer.
        </p>
      </section>
    </div>
  );

  return (
    <div className="dashboard">
      <h2>Cooperative Overview</h2>
      <DashboardTabs
        tabs={[
          { label: "Overview", content: overview },
          {
            label: "History",
            content: (
              <HistoryTab
                role="Auditor"
                cooperative={cooperative}
                marketplace={marketplace}
                provider={provider}
                account={account}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

export default AuditorDashboard; 