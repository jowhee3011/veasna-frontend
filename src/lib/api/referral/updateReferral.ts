// src/lib/api/visit/referral/updateReferral.ts
import { backend_url } from "@/constants/env_variable";
import { Referral } from "@/lib/types/consultation";
import { useUserStore } from "@/stores/useUserStore";

export async function updateReferral(
  referralId: number,
  data: {
    referralDate: string;
    referralType: string;
    illness: string;
    duration: string;
    reason: string;
  }
): Promise<Referral> {
  const token = useUserStore.getState().user?.token;
  if (!token) throw new Error("User not authenticated");

  const res = await fetch(`${backend_url}/api/referrals/${referralId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update referral: ${res.status} ${text}`);
  }

  return res.json();
}