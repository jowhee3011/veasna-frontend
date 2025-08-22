"use client";

import PatientTabs from "@/components/patient-form/patientTabs";
import { useSearchParams } from "next/navigation";
import { useRouter } from 'next/navigation';
import { PatientFormData } from "@/lib/types/PatientData";
import { EditIcon, EyeIcon, PlusIcon } from "@/assets/icons";
import { useState } from "react";
// import { addPatient } from "@/lib/api/patient/addPatient";

// Create an empty PatientData for every create ot edit request
const initialPatientData: PatientFormData = {
    // Patient's Info
    queue_no: '',
    english_name: '',
    khmer_name: '',
    date_of_birth: '',
    age: 0,
    sex: "M",
    phone_number: '',
    address: '',
    // faceId: '',
    created_at: '',
    // Vitals
    height_cm: 0,
    weight_kg: 0,
    bmi: 0,
    category: '',
    is_below_third_percentile: false,
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    additional_notes: '',
    // HEF
    knows_about_hef: '',
    has_hef: '',
    use_hef_reason: ''
}

export default function PatientForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const mode = searchParams.get('mode') || 'new';
    const patientId = searchParams.get('id');

    const isNew  = mode === 'new';
    const isEdit = mode === 'edit';
    const isView = mode === 'view';

    // Local state that accumulates changes from all tabs
    const [localPatient, setLocalPatient] = useState<PatientFormData>(initialPatientData);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // useEffect(() => {
    //     if ((isEdit || isView) && patientId) {
    //         // insert loadPatientData logic here
    //         console.log('Loading patient data for ID:', patientId);
    //         loadPatientData(patientId);
    //     }
    // }, [isEdit, isView, patientId]);

    // const loadPatientData = await (id: string) => {
    //     setIsLoading(true);
    //     // try {
    //     //     // API Call for patientID calling
    //     //     // const response  = await fetch(`/api/patients/${id}`);
    //     //     // if (response.ok) {
    //     //         const patientData = await response.json();
    //     //         setLocalPatient(patientData);
    //     //     } else {
    //     //         console.error('Failed to load patient data');
    //     //         // handle error by showing a toast notificaiton
    //     //     }
        
    //     // } catch (error) {
    //     //     console.error('Error loading patient Data: ', error);
    //     //     // handle the erorr by showing toast notificaiton
    //     // } finally {
    //     //     setIsLoading(false);
    //     // }
    // };

    const handleSave = async () => {

        if (isView) return;

        setIsSaving(true);
        try {
            if (isEdit && patientId) {
                // Case 1 : updating existing patient
                // api call for finding the patient's id and updating the information

            } else if (isNew) {
                // Case 2 : Creating a new Patient
                // api cal for inserting new patient, addPatient(localPatient);

                
            }
            router.push('/');
        } catch (error) {
            console.error('Error saving patient:', error);
        } finally {
            setIsSaving(false);
        }
    }

    const handleCancel = () => {
        // Case 3: Cancel - no chnages made to database
        // Optionally show confirmation dialog if there are unsaved changes if possible
        router.push('/');
    }

    const updateLocalPatient = (updates: Partial<PatientFormData>) => {

        if (isView) return;
        setLocalPatient(prev => ({ ...prev, ...updates}));
    };

    const getTitle = () => {
        if (isView) return 'View Patient';
        if (isEdit) return `Edit Patient: ${localPatient.english_name}`;
        return 'Add New Patient';
    };

    const getIcon = () => {
        if (isView) return <EyeIcon className="h-8 w-8 text-green-500"/>
        if (isEdit) return <EditIcon className="h-8 w-8 text-blue-600"/>
        else return <PlusIcon className="h-8 w-8 text-green-600"/> 
    }

    if (isLoading) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='text-lg'>Loading patient data...</div>
            </div>
        );
    }


    return (
        <div className='min-h-screen'>
            <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:pxuct-8'>
                <div className='mb-6 flex items-center gap-2'>
                    {getIcon()}
                    <h1 className='text-2xl font-bold'>
                        {getTitle()}
                    </h1>
                </div>

                <div className='rounded-lg shadow'>
                    <PatientTabs
                        patient={localPatient}
                        onUpdatePatient={updateLocalPatient}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isSaving={isSaving}
                        mode={mode}
                    />
                </div>
            </div>
        </div>
    )
}
