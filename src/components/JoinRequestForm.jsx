import { useState, useEffect, useCallback } from "react";

function JoinRequestForm({ cooperative, account, onActionComplete }) {
  const [selectedRole, setSelectedRole] = useState("2"); // Role.Farmer = 2
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const checkExistingRequest = useCallback(async () => {
    if (!cooperative || !account) return;
    setLoading(true);
    try {
      const request = await cooperative.joinRequests(account);
      setExistingRequest(request.exists ? request : null);
    } catch (err) {
      console.error("Failed to check join request status:", err);
    } finally {
      setLoading(false);
    }
  }, [cooperative, account]);

  useEffect(() => {
    checkExistingRequest();
  }, [checkExistingRequest]);

  async function handleSubmit() {
    setBusy(true);
    setStatus("");
    try {
      const tx = await cooperative.requestToJoin(Number(selectedRole));
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Request submitted.");
      await checkExistingRequest();
      onActionComplete?.();
    } catch (err) {
      console.error(err);
      setStatus(err.reason || err.message || "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="hint">Checking your membership status...</p>;
  }

  if (existingRequest) {
    const roleLabel = Number(existingRequest.requestedRole) === 2 ? "Farmer" : "Buyer";
    const requestedAt = new Date(Number(existingRequest.requestTimestamp) * 1000).toLocaleString();
    return (
      <>
        <p className="hint">
          Your request to join as a <strong>{roleLabel}</strong> is pending admin
          review. Requested {requestedAt}.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="hint">
        Not a member yet? Request to join as a Farmer or Buyer, and an admin
        will review your request.
      </p>
      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
        <option value="2">Farmer</option>
        <option value="3">Buyer</option>
      </select>
      <button disabled={busy} onClick={handleSubmit}>
        {busy ? "Submitting..." : "Request to Join"}
      </button>
      {status && <p className="status">{status}</p>}
    </>
  );
}

export default JoinRequestForm;