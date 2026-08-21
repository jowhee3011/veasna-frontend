import { PersonIcon } from "@/assets/icons";

export function PatientPageHeader() {
    return (
        <div className="flex items-center gap-3 mb-4">
            <PersonIcon className="h-8 w-8 text-[var(--primary-strong)]"/>
            <h1 className="text-3xl font-bold">Patient List</h1>
        </div>
    )
}