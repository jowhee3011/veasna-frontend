"use client"

import { PlusIcon } from "@/assets/icons";
import { FullSearchBar } from "@/components/patient-list/FullSearchBar";
import { PatientPageHeader } from "@/components/patient-list/PageHeader";
import { PatientTable } from "@/components/patient-list/PatientTable";
import { Location } from "@/lib/types/location";
import { PatientInfo } from "@/lib/types/patient";
import { useLocationStore } from "@/stores/useLocationStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDataStore } from "@/stores/useLocationDataStore";
import toast from "react-hot-toast";
import { exportReferralsByDate } from "@/lib/api/exportService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateToYYYYMMDD } from "@/components/ui/date-picker";
import { deletePatient } from "@/lib/api/patient/deletePatient";
import { useUserStore } from "@/stores/useUserStore";

export default function PatientListPage() {

  const router = useRouter();
  const token = useUserStore((state) => state.user?.token);

  const location: Location | null = useLocationStore((state) => state.currentLocation)
  const date : Date = new Date();
  const dateOnly: string = date.toISOString().slice(0, 10);

  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const location_patients = useDataStore((state) => state.all_patients)
  const fetchData = useDataStore((state) => state.fetchData)

  const filteredPatients: PatientInfo[] = useMemo(() => {
    if (!searchTerm.trim()) {
      return patients;
    }

    const searchLower = searchTerm.toLowerCase();

    return patients.filter((patient) => {
      const engName = patient.english_name?.toLowerCase() || "";
      const khmerName = patient.khmer_name?.toLowerCase() || "";

      return engName.includes(searchLower) || khmerName.includes(searchLower);
    });
  }, [patients, searchTerm]);


  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  }
  
  // TODO
  const handleAddPatient = () => {
    console.log('Add new patient Clicked');
    toast.error('Still not completed :(')
    // router.push('/patient-form?mode=new');
  };

  const handleViewPatient = (patientId: number) => {
    console.log('Viewing Patient, ', patientId);
    router.push(`/patient-details?id=${patientId}`);
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    if (!selectedDate) {
      toast.error("Please select a date first!");
      return;
    }

    const dateString = formatDateToYYYYMMDD(selectedDate);

    const promise = exportReferralsByDate(dateString, format);
    toast.promise(promise, {
      loading: `Generating ${format.toUpperCase()}...`,
      success: `Download starting!`,
      error: (err) => err.message || 'Failed to export referrals.',
    });
  };

  const handleDeletePatient = async (patientId: number) => {
    if (!token) {
      toast.error("You must be logged in to delete patients");
      return;
    }

    // Find patient name for confirmation message
    const patient = patients.find(p => p.id === patientId);
    const patientName = patient?.english_name || `Patient ${patientId}`;

    if (window.confirm(
      `⚠️ WARNING: This will permanently delete ${patientName} and ALL associated data:\n` +
      `• All visits\n` +
      `• All consultations and referrals\n` +
      `• All medical records\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you absolutely sure?`
    )) {
      const result = await deletePatient(patientId, token);
      
      if (result.success) {
        // Remove from local state
        setPatients(prevPatients => prevPatients.filter(p => p.id !== patientId));
        toast.success(`${patientName} deleted successfully`);
        
        // Optionally refresh data from server
        fetchData();
      } else {
        toast.error(`Failed to delete patient: ${result.error}`);
      }
    }
  };

  useEffect(() => {
    if (location) fetchData(); // Only fetch if location is set
  }, [location, fetchData]);

  useEffect(() => {
    setPatients(location_patients)
  }, [location_patients])

  return (
    <div>
      <PatientPageHeader/>

      <div className='flex items-center justify-between mb-4.5'>
        <FullSearchBar
          placeholder= "Search for Patient by English Name or Khmer Name"
          onSearchChange={handleSearchChange}
        />

        <div className="flex items-center gap-2 ml-4">
            {/* Date Picker and Export Button */}
            <DatePicker date={selectedDate} setDate={setSelectedDate} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hover:bg-blue-500">
                  <Download className="w-4 h-4" />
                  {/* Export Referrals */}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>As PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>As Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Patient Button */}
            <Button onClick={handleAddPatient} className="bg-green-500 hover:bg-green-600 rounded-full">
              <PlusIcon className="w-8 h-8 text-black"/>
            </Button>
        </div>
      </div>

      <PatientTable
        patients={filteredPatients}
        onViewPatient={handleViewPatient}
        onDeletePatient={handleDeletePatient}
      />  
    </div>
  )
}