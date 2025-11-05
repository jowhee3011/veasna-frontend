// src/lib/api/visit/referral/getReferrals.ts
import { backend_url } from "@/constants/env_variable";
import { Referral } from "@/lib/types/consultation";

export async function getReferrals(visitId: number): Promise<Referral[]> {
  try {
    const res = await fetch(`${backend_url}/api/referrals?visit_id=${visitId}`, {
      credentials: "include"
    });
    
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Failed to fetch referrals: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Get referrals error:", error);
    return [];
  }
}