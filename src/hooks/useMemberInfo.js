import { useState, useEffect, useCallback } from "react";

// Matches the Role enum in Cooperative.sol
export const ROLES = {
  0: "None",
  1: "Admin",
  2: "Farmer",
  3: "Buyer",
};

// Matches the MemberStatus enum in Cooperative.sol
export const STATUSES = {
  0: "Unregistered",
  1: "Pending",
  2: "Active",
  3: "Trusted",
};

export function useMemberInfo(cooperative, account) {
  const [memberInfo, setMemberInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const refresh = useCallback(async () => {
    if (!cooperative || !account) {
      setMemberInfo(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await cooperative.getMember(account);
      const superAdminAddress = await cooperative.superAdmin();

      setMemberInfo({
        address: data.memberAddress,
        role: Number(data.role),
        roleName: ROLES[Number(data.role)],
        status: Number(data.status),
        statusName: STATUSES[Number(data.status)],
        totalDeposits: data.totalDeposits,
        currentBalance: data.currentBalance,
        successfulSales: Number(data.successfulSales),
        joinDate: Number(data.joinDate),
        activeLoanId: Number(data.activeLoanId),
      });

      setIsSuperAdmin(superAdminAddress.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error("Failed to fetch member info:", err);
      setMemberInfo(null);
    } finally {
      setLoading(false);
    }
  }, [cooperative, account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { memberInfo, loading, isSuperAdmin, refresh };
}