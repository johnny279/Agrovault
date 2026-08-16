import { useState, useEffect, useCallback } from "react";
import { formatUSDC, toRawUSDC } from "../utils/format";
import DashboardTabs from "./DashboardTabs";
import HistoryTab from "./HistoryTab";

function MemberDashboard({ cooperative, marketplace, usdcToken, provider, account, memberInfo, onActionComplete }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function runAction(actionFn, successMessage) {
    setBusy(true);
    setStatus("");
    try {
      const tx = await actionFn();
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus(successMessage);
      onActionComplete?.();
    } catch (err) {
      console.error(err);
      setStatus(err.reason || err.message || "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  const overview = (
    <div className="dashboard-grid">
      <BalanceCard
        cooperative={cooperative}
        usdcToken={usdcToken}
        account={account}
        memberInfo={memberInfo}
        runAction={runAction}
        busy={busy}
      />

      {memberInfo.roleName === "Farmer" && (
        <FarmerSection
          cooperative={cooperative}
          marketplace={marketplace}
          usdcToken={usdcToken}
          account={account}
          memberInfo={memberInfo}
          runAction={runAction}
          busy={busy}
        />
      )}

      {memberInfo.roleName === "Buyer" && (
        <BuyerSection
          marketplace={marketplace}
          usdcToken={usdcToken}
          account={account}
          runAction={runAction}
          busy={busy}
        />
      )}

      {status && <p className="status card--full">{status}</p>}
    </div>
  );

  return (
    <div className="dashboard">
      <h2>{memberInfo.roleName} Dashboard</h2>
      <DashboardTabs
        tabs={[
          { label: "Overview", content: overview },
          {
            label: "History",
            content: (
              <HistoryTab
                role={memberInfo.roleName}
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

// ============ SAVINGS: DEPOSIT / WITHDRAW ============

function BalanceCard({ cooperative, usdcToken, account, memberInfo, runAction, busy }) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);

  const refreshWalletBalance = useCallback(async () => {
    if (!usdcToken || !account) return;
    try {
      const bal = await usdcToken.balanceOf(account);
      setWalletBalance(bal);
    } catch (err) {
      console.error("Failed to fetch wallet USDC balance:", err);
    }
  }, [usdcToken, account]);

  useEffect(() => {
    refreshWalletBalance();
  }, [refreshWalletBalance]);

  async function handleDeposit() {
    const raw = toRawUSDC(depositAmount);
    const approveTx = await usdcToken.approve(cooperative.target, raw);
    await approveTx.wait();
    await runAction(() => cooperative.deposit(raw), "Deposit successful.");
    setDepositAmount("");
    refreshWalletBalance();
  }

  async function handleWithdraw() {
    const raw = toRawUSDC(withdrawAmount);
    await runAction(() => cooperative.withdraw(raw), "Withdrawal successful.");
    setWithdrawAmount("");
    refreshWalletBalance();
  }

  return (
    <section className="card card--full">
      <h3>Your Balance</h3>
      <p className="hint">
        Coop balance: {formatUSDC(memberInfo.currentBalance)} USDC · Wallet balance:{" "}
        {walletBalance !== null ? formatUSDC(walletBalance) : "..."} USDC
      </p>

      <div className="sub-section">
        <input
          type="number"
          placeholder="Amount to deposit (USDC)"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <button disabled={busy || !depositAmount} onClick={handleDeposit}>
          Deposit
        </button>
      </div>

      <div className="sub-section">
        <input
          type="number"
          placeholder="Amount to withdraw (USDC)"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />
        <button disabled={busy || !withdrawAmount} onClick={handleWithdraw}>
          Withdraw
        </button>
      </div>
    </section>
  );
}

// ============ FARMER: PRODUCE + LOANS ============

function FarmerSection({ cooperative, marketplace, usdcToken, account, memberInfo, runAction, busy }) {
  const [cropVariety, setCropVariety] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [price, setPrice] = useState("");
  const [myBatches, setMyBatches] = useState([]);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanDuration, setLoanDuration] = useState("");
  const [maxLoan, setMaxLoan] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);

  const refreshFarmerData = useCallback(async () => {
    if (!marketplace || !cooperative || !account) return;
    try {
      const batchIds = await marketplace.getFarmerBatchIds(account);
      const batches = await Promise.all(
        batchIds.map((id) => marketplace.getBatch(id))
      );
      setMyBatches(batches);

      const max = await cooperative.getMaxLoanAmount(account);
      setMaxLoan(max);

      if (memberInfo.activeLoanId && memberInfo.activeLoanId !== 0) {
        const loan = await cooperative.getLoan(memberInfo.activeLoanId);
        setActiveLoan(loan);
      } else {
        setActiveLoan(null);
      }
    } catch (err) {
      console.error("Failed to fetch farmer data:", err);
    }
  }, [marketplace, cooperative, account, memberInfo.activeLoanId]);

  useEffect(() => {
    refreshFarmerData();
  }, [refreshFarmerData]);

  async function handleLogProduce() {
    await runAction(
      () => marketplace.logProduce(cropVariety, weightKg, toRawUSDC(price)),
      "Produce batch logged. Awaiting admin approval."
    );
    setCropVariety("");
    setWeightKg("");
    setPrice("");
    refreshFarmerData();
  }

  async function handleApplyLoan() {
    await runAction(
      () => cooperative.applyForLoan(toRawUSDC(loanAmount), loanDuration),
      "Loan application submitted."
    );
    setLoanAmount("");
    setLoanDuration("");
    refreshFarmerData();
  }

  async function handleRepayLoan() {
    if (!activeLoan) return;
    const [totalOwed] = await cooperative.previewRepaymentAmount(activeLoan.loanId);
    const approveTx = await usdcToken.approve(cooperative.target, totalOwed);
    await approveTx.wait();
    await runAction(
      () => cooperative.repayLoan(activeLoan.loanId),
      "Loan repaid successfully."
    );
    refreshFarmerData();
  }

  const batchStatusNames = ["Pending", "Available", "Sold"];

  return (
    <>
      <section className="card">
        <h3>Log a Produce Batch</h3>
        <input
          type="text"
          placeholder="Crop variety (e.g. Maize)"
          value={cropVariety}
          onChange={(e) => setCropVariety(e.target.value)}
        />
        <input
          type="number"
          placeholder="Weight (kg)"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price (USDC)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button
          disabled={busy || !cropVariety || !weightKg || !price}
          onClick={handleLogProduce}
        >
          Log Produce
        </button>
      </section>

      <section className="card">
        <h3>Your Produce Batches</h3>
        {myBatches.length === 0 && <p className="hint">No batches logged yet.</p>}
        {myBatches.map((batch) => (
          <div key={Number(batch.batchId)} className="status" style={{ marginBottom: "8px" }}>
            #{Number(batch.batchId)} · {batch.cropVariety} · {Number(batch.weightKg)}kg ·{" "}
            {formatUSDC(batch.price)} USDC · {batchStatusNames[Number(batch.status)]}
          </div>
        ))}
      </section>

      <section className="card card--full">
        <h3>Loans</h3>
        {maxLoan !== null && (
          <p className="hint">Your current loan limit: {formatUSDC(maxLoan)} USDC</p>
        )}

        {activeLoan && Number(activeLoan.status) !== 0 ? (
          <div>
            <p className="hint">
              Active loan #{Number(activeLoan.loanId)} · {formatUSDC(activeLoan.principal)} USDC ·{" "}
              status: {["None", "Pending", "Approved", "Rejected", "Repaid"][Number(activeLoan.status)]}
            </p>
            {Number(activeLoan.status) === 2 && (
              <button disabled={busy} onClick={handleRepayLoan}>
                Repay Loan
              </button>
            )}
          </div>
        ) : (
          <div className="sub-section">
            <input
              type="number"
              placeholder="Loan amount (USDC)"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
            <input
              type="number"
              placeholder="Duration (months)"
              value={loanDuration}
              onChange={(e) => setLoanDuration(e.target.value)}
            />
            <button
              disabled={busy || !loanAmount || !loanDuration}
              onClick={handleApplyLoan}
            >
              Apply for Loan
            </button>
          </div>
        )}
      </section>
    </>
  );
}

// ============ BUYER: BROWSE + PURCHASE ============

function BuyerSection({ marketplace, usdcToken, account, runAction, busy }) {
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const refreshBatches = useCallback(async () => {
    if (!marketplace) return;
    setLoadingBatches(true);
    try {
      const counter = await marketplace.batchCounter();
      const total = Number(counter);
      const ids = Array.from({ length: total }, (_, i) => i + 1);
      const batches = await Promise.all(ids.map((id) => marketplace.getBatch(id)));
      setAvailableBatches(batches.filter((b) => Number(b.status) === 1));
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoadingBatches(false);
    }
  }, [marketplace]);

  useEffect(() => {
    refreshBatches();
  }, [refreshBatches]);

  async function handlePurchase(batch) {
    const approveTx = await usdcToken.approve(marketplace.target, batch.price);
    await approveTx.wait();
    await runAction(
      () => marketplace.purchaseBatch(batch.batchId),
      `Batch #${Number(batch.batchId)} purchased.`
    );
    refreshBatches();
  }

  return (
    <section className="card card--full">
      <h3>Available Produce</h3>
      {loadingBatches && <p className="hint">Loading batches...</p>}
      {!loadingBatches && availableBatches.length === 0 && (
        <p className="hint">No produce available for purchase right now.</p>
      )}
      {availableBatches.map((batch) => (
        <div key={Number(batch.batchId)} className="status" style={{ marginBottom: "8px" }}>
          <div>
            #{Number(batch.batchId)} · {batch.cropVariety} · {Number(batch.weightKg)}kg ·{" "}
            {formatUSDC(batch.price)} USDC
          </div>
          <button disabled={busy} onClick={() => handlePurchase(batch)}>
            Purchase
          </button>
        </div>
      ))}
    </section>
  );
}

export default MemberDashboard;