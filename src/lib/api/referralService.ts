import { backend_url } from "@/constants/env_variable";
import { Referral } from "@/lib/types/consultation"; // Assuming Referral type includes `id`
import { useUserStore } from "@/stores/useUserStore";

// Helper to format referralType array to string
const formatReferralTypeToString = (types: string[]): string => {
    return types.join("\n"); // Join with newline
};

// Helper to parse referralType string back to array
const parseReferralTypeToArray = (typeString: string | null | undefined): string[] => {
    if (!typeString) return [];
    return typeString.split("\n").filter(t => t.trim() !== ''); // Split by newline
}

/**
 * Fetches all referrals for a specific visit.
 * Parses the referral_type string back into an array.
 */
export async function getReferralsByVisit(visitId: number): Promise<Referral[]> {
    if (!visitId) throw new Error("visitId is required");
    const token = useUserStore.getState().user?.token;
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${backend_url}/api/referrals?visit_id=${visitId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch referrals: ${res.status}`);
    const referrals = await res.json();

    // Parse the referral_type string back into an array for the frontend
    return referrals.map((ref: any) => ({
        ...ref,
        referralType: parseReferralTypeToArray(ref.referral_type), // Convert DB string to array
        referralDate: ref.referral_date.slice(0, 10) // Format date YYYY-MM-DD
    }));
}

/**
 * Creates a new referral for a visit.
 */
export async function createReferral(data: Omit<Referral, 'id'>, visitId: number) {
    if (!visitId) throw new Error("visitId is required");
    const token = useUserStore.getState().user?.token;
    if (!token) throw new Error("User not authenticated");

    const payload = {
        ...data,
        visit_id: visitId,
        referralType: formatReferralTypeToString(data.referralType), // Convert array to DB string
    };

    const res = await fetch(`${backend_url}/api/referrals`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Failed to create referral: ${res.status}`);
    const newReferral = await res.json();
    // Parse type back for immediate use if needed
    return { ...newReferral, referralType: parseReferralTypeToArray(newReferral.referral_type) };
}

/**
 * Updates an existing referral.
 */
export async function updateReferral(data: Referral) {
    if (!data.id) throw new Error("Referral ID is required for update");
    const token = useUserStore.getState().user?.token;
    if (!token) throw new Error("User not authenticated");

    const payload = {
        ...data,
        referralType: formatReferralTypeToString(data.referralType), // Convert array to DB string
    };

    const res = await fetch(`${backend_url}/api/referrals/${data.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Failed to update referral: ${res.status}`);
    const updatedReferral = await res.json();
    // Parse type back
    return { ...updatedReferral, referralType: parseReferralTypeToArray(updatedReferral.referral_type) };
}