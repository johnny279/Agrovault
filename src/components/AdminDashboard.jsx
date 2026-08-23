import { useState } from "react";
import DashboardTabs from "./DashboardTabs";
import HistoryTab from "./HistoryTab";

function AdminDashboard({ cooperative, marketplace, provider, account, isSuperAdmin, onActionComplete }) {
  const [farmerAddress, setFarmerAddress] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [batchId, setBatchId] = useState("");
  const [loanId, setLoanId] = useState("");
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
      <section className="card">
        <h3>Onboard a Farmer</h3>
        <input
          type="text"
          placeholder="Farmer wallet address (0x...)"
          value={farmerAddress}
          onChange={(e) => setFarmerAddress(e.target.value)}
        />
        <button
          disabled={busy || !farmerAddress}
          onClick={() =>
            runAction(
              () => cooperative.onboardFarmer(farmerAddress),
              "Farmer onboarded successfully."
            )
          }
        >
          Onboard Farmer
        </button>
      </section>

      <section className="card">
        <h3>Onboard a Buyer</h3>
        <input
          type="text"
          placeholder="Buyer wallet address (0x...)"
          value={buyerAddress}
          onChange={(e) => setBuyerAddress(e.target.value)}
        />
        <button
          disabled={busy || !buyerAddress}
          onClick={() =>
            runAction(
              () => cooperative.onboardBuyer(buyerAddress),
              "Buyer onboarded successfully."
            )
          }
        >
          Onboard Buyer
        </button>
      </section>

      <section className="card">
        <h3>Approve a Produce Batch</h3>
        <input
          type="number"
          placeholder="Batch ID"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
        />
        <button
          disabled={busy || !batchId}
          onClick={() =>
            runAction(
              () => marketplace.approveBatch(batchId),
              `Batch #${batchId} approved.`
            )
          }
        >
          Approve Batch
        </button>
      </section>

      <section className="card">
        <h3>Approve or Reject a Loan</h3>
        <input
          type="number"
          placeholder="Loan ID"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
        />
        <div className="button-row">
          <button
            disabled={busy || !loanId}
            onClick={() =>
              runAction(
                () => cooperative.approveLoan(loanId),
                `Loan #${loanId} approved.`
              )
            }
          >
            Approve Loan
          </button>
          <button
            disabled={busy || !loanId}
            onClick={() =>
              runAction(
                () => cooperative.rejectLoan(loanId),
                `Loan #${loanId} rejected.`
              )
            }
          >
            Reject Loan
          </button>
        </div>
      </section>

      {isSuperAdmin && (
        <section className="card card--full">
          <h3>Super Admin: Manage Admins</h3>
          <p className="hint">Only you (Super Admin) can add, remove, or transfer this role.</p>
          <AdminManagement cooperative={cooperative} runAction={runAction} busy={busy} />
        </section>
      )}

      {status && <p className="status card--full">{status}</p>}
    </div>
  );

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      <DashboardTabs
        tabs={[
          { label: "Overview", content: overview },
          {
            label: "History",
            content: (
              <HistoryTab
                role="Admin"
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

function AdminManagement({ cooperative, runAction, busy }) {
  const [newAdmin, setNewAdmin] = useState("");
  const [removeAddr, setRemoveAddr] = useState("");
  const [transferAddr, setTransferAddr] = useState("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  function handleTransferClick() {
    if (!confirmTransfer) {
      setConfirmTransfer(true);
      return;
    }
    runAction(
      () => cooperative.transferSuperAdmin(transferAddr),
      "Super Admin role transferred. You are no longer the Super Admin."
    );
    setTransferAddr("");
    setConfirmTransfer(false);
  }

  return (
    <>
      <div className="sub-section">
        <input
          type="text"
          placeholder="New admin address (0x...)"
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
        />
        <button
          disabled={busy || !newAdmin}
          onClick={() =>
            runAction(() => cooperative.addAdmin(newAdmin), "New admin added.")
          }
        >
          Add Admin
        </button>
      </div>

      <div className="sub-section">
        <input
          type="text"
          placeholder="Admin address to remove (0x...)"
          value={removeAddr}
          onChange={(e) => setRemoveAddr(e.target.value)}
        />
        <button
          disabled={busy || !removeAddr}
          onClick={() =>
            runAction(() => cooperative.removeAdmin(removeAddr), "Admin removed.")
          }
        >
          Remove Admin
        </button>
      </div>

      <div className="sub-section">
        <input
          type="text"
          placeholder="New Super Admin address (must already be an Admin)"
          value={transferAddr}
          onChange={(e) => {
            setTransferAddr(e.target.value);
            setConfirmTransfer(false);
          }}
        />
        {confirmTransfer && (
          <p className="hint" style={{ color: "var(--danger)" }}>
            This will permanently transfer Super Admin rights to this address.
            You will lose the ability to add/remove admins or transfer this
            role again. Click again to confirm.
          </p>
        )}
        <button
          disabled={busy || !transferAddr}
          onClick={handleTransferClick}
        >
          {confirmTransfer ? "Confirm Transfer" : "Transfer Super Admin"}
        </button>
      </div>
    </>
  );
}

export default AdminDashboard;