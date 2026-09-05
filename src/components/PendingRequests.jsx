import { useState, useEffect, useCallback } from "react";
import { shortenAddress } from "../utils/format";

const ROLE_LABELS = { 2: "Farmer", 3: "Buyer" };

function PendingRequests({ cooperative, onActionComplete }) {
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyAddress, setBusyAddress] = useState(null);
  const [status, setStatus] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const pending = await cooperative.getPendingRequests();
      setRequests(pending.filter((r) => r.exists));
    } catch (err) {
      console.error(err);
      setError("Failed to load pending requests.");
    } finally {
      setLoading(false);
    }
  }, [cooperative]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleApprove(address) {
    setBusyAddress(address);
    setStatus("");
    try {
      const tx = await cooperative.approveJoinRequest(address);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus(`${shortenAddress(address)} approved and onboarded.`);
      await loadRequests();
      onActionComplete?.();
    } catch (err) {
      console.error(err);
      setStatus(err.reason || err.message || "Approval failed.");
    } finally {
      setBusyAddress(null);
    }
  }

  async function handleReject(address) {
    setBusyAddress(address);
    setStatus("");
    try {
      const tx = await cooperative.rejectJoinRequest(address);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus(`${shortenAddress(address)}'s request rejected.`);
      await loadRequests();
      onActionComplete?.();
    } catch (err) {
      console.error(err);
      setStatus(err.reason || err.message || "Rejection failed.");
    } finally {
      setBusyAddress(null);
    }
  }

  if (loading) {
    return <p className="hint">Loading pending join requests...</p>;
  }

  if (error) {
    return (
      <>
        <p className="status">{error}</p>
        <button onClick={loadRequests}>Retry</button>
      </>
    );
  }

  if (requests.length === 0) {
    return <p className="hint">No pending join requests.</p>;
  }

  return (
    <>
      {requests.map((req) => (
        <div key={req.requester} className="sub-section history-item">
          <div className="history-item-main">
            <span className="history-item-title">
              {shortenAddress(req.requester)} — wants to join as{" "}
              {ROLE_LABELS[Number(req.requestedRole)] || "Unknown"}
            </span>
            <span className="history-item-detail">
              Requested {new Date(Number(req.requestTimestamp) * 1000).toLocaleString()}
            </span>
          </div>
          <div className="button-row">
            <button
              disabled={busyAddress === req.requester}
              onClick={() => handleApprove(req.requester)}
            >
              Approve
            </button>
            <button
              disabled={busyAddress === req.requester}
              onClick={() => handleReject(req.requester)}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
      {status && <p className="status">{status}</p>}
    </>
  );
}

export default PendingRequests;