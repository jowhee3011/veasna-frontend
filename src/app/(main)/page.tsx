"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { FullSearchBar } from '@/components/patient-list/FullSearchBar';
import { PatientTable } from '@/components/patient-list/PatientTable';
import { useRouter } from 'next/navigation';
// import { getAllPatients } from '@/lib/api/patient/getAllPatients';
// import { addPatient } from '@/lib/api/patient/addPatient';
import { Patient } from '@/lib/types/patient';
import { LocationIcon, PlusIcon } from '@/assets/icons';
import { PatientPageHeader } from '@/components/patient-list/PageHeader';
// import { SAMPLE_PATIENTS } from '@/sampleData/SAMPLE_PATIENTS';
import LocationsDropdown from '@/components/shared/LocationsDropdown';
import { usePatients } from '../hooks/usePatients';
import { useLocationStore } from '@/stores/useLocationStore';

  
export default function PatientListPage() {

  const location = useLocationStore((state) => state.location)
  const retrievedPatients = usePatients(location).patients;

  console.log("retrieved:", retrievedPatients)

  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>(retrievedPatients);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) {
      return patients;
    }

    // is there a toLowerCase for khmer strings?
    const searchLower = searchTerm.toLowerCase()

    return patients.filter((patient) => {
      const searchNum = parseInt(searchLower, 10);
      const queueMatch = (() => {
        const numMatch = patient.queue_no.match(/^\d+/); // Extract leading digits
        if (!numMatch) return false;
        const queueNum = parseInt(numMatch[0], 10);
        return !isNaN(searchNum) && queueNum >= searchNum;
      })();
    
      return (
        patient.english_name.toLowerCase().includes(searchLower) ||
        patient.khmer_name.toLowerCase().includes(searchLower) ||
        queueMatch
      );
    });
  }, [patients, searchTerm])

    const handleSearchChange = (term: string) => {
      setSearchTerm(term);
    }
    
    // to edit with backend  
    const handleAddPatient = () => {
      console.log('Add new patient Clicked');
      router.push('/patient-form?mode=new');
    };

    // to edit with backend
    const handleViewPatient = (patientId: number) => {
      console.log('Viewing Patient, ', patientId);
      router.push(`/patient-form?mode=view&id=${patientId}`);
    }
  
    // to edit with backend
    const handleEditPatient = (patientId: number) => {
      console.log('Edit patient Clicked:', patientId);
      router.push(`/patient-form?mode=edit&id=${patientId}`);
    };
  
    // to edit with backend
    const handleDeletePatient = (patientId: number) => {
      if (window.confirm('Are you sure you want to delete this patient?')){
        // temporarily show that it was deleted here
        setPatients(prevPatients => prevPatients.filter(patient => patient.id !== patientId))
        console.log('Delete patient Clicked:', patientId);      
      }
    };
    
    useEffect(() => {
      setPatients(retrievedPatients);
    }, [retrievedPatients]);
  
    return (
      <div className="min-h-screen p-6">
        <div className="flex flex-col gap-2 max-w-7xl mx-auto">
          <PatientPageHeader/>

          <div className='flex items-center justify-between'>
            <FullSearchBar
              placeholder= "Search for Patient by English Name or Khmer Name"
              onSearchChange={handleSearchChange}
            />

            <button
              onClick={handleAddPatient}
              className="ml-4 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition"
            >
              <PlusIcon className="w-5 h-5"/>
            </button>
          </div>

          <div className='flex'>
            <LocationIcon 
              width={24}
              height={24}
            />
            <LocationsDropdown />
          </div>  

          <PatientTable
            patients={filteredPatients}
            onViewPatient={handleViewPatient}
            onEditPatient={handleEditPatient}
            onDeletePatient={handleDeletePatient}
          />
        </div>
      </div>
    )
}
