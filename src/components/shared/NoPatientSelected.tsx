import { PersonIcon } from "@/assets/icons";

export default function NoPatientSelected() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 mt-4">
      <PersonIcon className="h-8 w-8 text-blue-600" />
      <h2 className="text-lg font-semibold mb-2">No Patient Selected</h2>
      <p className="text-center text-sm">
        Please select a patient from the list to view their details.
      </p>
    </div>
  );
}
