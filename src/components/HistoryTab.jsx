import { useState, useEffect, useCallback } from "react";
import { formatUSDC, shortenAddress } from "../utils/format";
import { queryEventsChunked, attachTimestamps } from "../utils/eventHistory";

// How far back to search for events. ~100,000 blocks is roughly 2 weeks on Sepolia.
// Tip: for faster, more precise loads, find your contract's deployment block on
// Sepolia Etherscan and use that as a fixed starting point instead.
const LOOKBACK_BLOCKS = 100000;

function formatTimestamp(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString();
}

function HistoryTab({ role, cooperative, marketplace, provider, account }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!cooperative || !marketplace || !provider || !account) return;
    setLoading(true);
    setLoadError(null);

    try {
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - LOOKBACK_BLOCKS);
      const results = [];

      if (role === "Admin") {
        const [onboarded, approved, rejected, produceApproved, adminAdded, adminRemoved] = await Promise.all([
          queryEventsChunked(cooperative, cooperative.filters.MemberOnboarded(), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.LoanApproved(), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.LoanRejected(), fromBlock, latestBlock),
          queryEventsChunked(marketplace, marketplace.filters.ProduceApproved(), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.AdminAdded(), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.AdminRemoved(), fromBlock, latestBlock),
        ]);

        onboarded.forEach((log) => results.push({
          log, title: "Member onboarded",
          detail: `${shortenAddress(log.args.memberAddress)} joined as ${["None", "Admin", "Farmer", "Buyer"][Number(log.args.role)]}`,
        }));
        approved.forEach((log) => results.push({
          log, title: "Loan approved",
          detail: `Loan #${Number(log.args.loanId)} · ${formatUSDC(log.args.amount)} USDC to ${shortenAddress(log.args.applicant)}`,
        }));
        rejected.forEach((log) => results.push({
          log, title: "Loan rejected",
          detail: `Loan #${Number(log.args.loanId)} for ${shortenAddress(log.args.applicant)}`,
        }));
        produceApproved.forEach((log) => results.push({
          log, title: "Produce batch approved",
          detail: `Batch #${Number(log.args.batchId)} approved by ${shortenAddress(log.args.approvedBy)}`,
        }));
        adminAdded.forEach((log) => results.push({
          log, title: "Admin added",
          detail: `${shortenAddress(log.args.newAdmin)} added by ${shortenAddress(log.args.addedBy)}`,
        }));
        adminRemoved.forEach((log) => results.push({
          log, title: "Admin removed",
          detail: `${shortenAddress(log.args.removedAdmin)} removed by ${shortenAddress(log.args.removedBy)}`,
        }));
      } else {
        const [deposits, withdrawals, loanApplied, loanApproved, loanRejected, loanRepaid, produceRegistered, produceSold] = await Promise.all([
          queryEventsChunked(cooperative, cooperative.filters.DepositMade(account), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.WithdrawalMade(account), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.LoanApplied(null, account), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.LoanApproved(null, account), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.LoanRejected(null, account), fromBlock, latestBlock),
          queryEventsChunked(cooperative, cooperative.filters.LoanRepaid(null, account), fromBlock, latestBlock),
          role === "Farmer"
            ? queryEventsChunked(marketplace, marketplace.filters.ProduceRegistered(null, account), fromBlock, latestBlock)
            : Promise.resolve([]),
          role === "Farmer"
            ? queryEventsChunked(marketplace, marketplace.filters.ProduceSold(null, null, account), fromBlock, latestBlock)
            : queryEventsChunked(marketplace, marketplace.filters.ProduceSold(null, account), fromBlock, latestBlock),
        ]);

        deposits.forEach((log) => results.push({
          log, title: "Deposit",
          detail: `+${formatUSDC(log.args.amount)} USDC · new balance ${formatUSDC(log.args.newBalance)} USDC`,
        }));
        withdrawals.forEach((log) => results.push({
          log, title: "Withdrawal",
          detail: `-${formatUSDC(log.args.amount)} USDC · new balance ${formatUSDC(log.args.newBalance)} USDC`,
        }));
        loanApplied.forEach((log) => results.push({
          log, title: "Loan applied",
          detail: `Loan #${Number(log.args.loanId)} · ${formatUSDC(log.args.amount)} USDC requested`,
        }));
        loanApproved.forEach((log) => results.push({
          log, title: "Loan approved",
          detail: `Loan #${Number(log.args.loanId)} · ${formatUSDC(log.args.amount)} USDC disbursed`,
        }));
        loanRejected.forEach((log) => results.push({
          log, title: "Loan rejected",
          detail: `Loan #${Number(log.args.loanId)}`,
        }));
        loanRepaid.forEach((log) => results.push({
          log, title: "Loan repaid",
          detail: `Loan #${Number(log.args.loanId)} · ${formatUSDC(log.args.totalPaid)} USDC paid`,
        }));
        produceRegistered.forEach((log) => results.push({
          log, title: "Produce logged",
          detail: `Batch #${Number(log.args.batchId)} · ${log.args.cropVariety} · ${Number(log.args.weightKg)}kg`,
        }));
        produceSold.forEach((log) => results.push({
          log, title: role === "Farmer" ? "Produce sold" : "Produce purchased",
          detail: `Batch #${Number(log.args.batchId)} · ${formatUSDC(log.args.price)} USDC`,
        }));
      }

      const withTimestamps = await attachTimestamps(provider, results.map((r) => r.log));
      const merged = results
        .map((r, i) => ({
          ...r,
          timestamp: withTimestamps[i].timestamp,
          txHash: r.log.transactionHash,
          blockNumber: r.log.blockNumber,
        }))
        .sort((a, b) => b.blockNumber - a.blockNumber);

      setEntries(merged);
    } catch (err) {
      console.error("Failed to load history:", err);
      setLoadError("Couldn't load full history. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [role, cooperative, marketplace, provider, account]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <section className="card card--full">
      <h3>Activity History</h3>
      {loading && <p className="hint">Loading on-chain history...</p>}
      {loadError && <p className="error">{loadError}</p>}
      {!loading && entries.length === 0 && !loadError && (
        <p className="hint">No activity recorded yet.</p>
      )}
      <div className="history-list">
        {entries.map((entry) => (
          <div key={entry.txHash + "-" + entry.title} className="history-item">
            <div className="history-item-main">
              <span className="history-item-title">{entry.title}</span>
              <span className="history-item-detail">{entry.detail}</span>
            </div>
            <div className="history-item-meta">
              <span>{formatTimestamp(entry.timestamp)}</span>
              <a href={"https://sepolia.etherscan.io/tx/" + entry.txHash} target="_blank" rel="noopener noreferrer">
                View tx
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HistoryTab;