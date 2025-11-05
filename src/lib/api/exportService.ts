import { backend_url } from "@/constants/env_variable";
import { useUserStore } from "@/stores/useUserStore";


export async function exportReferralsByDate(date: string, format: 'pdf' | 'excel') {
    const token = useUserStore.getState().user?.token;

    const response = await fetch(`${backend_url}/api/export/referrals-by-date?date=${date}&format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download file.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const disposition = response.headers.get('content-disposition');
    let filename = `referrals_${date}.${format}`; // A fallback filename
    if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
        }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}