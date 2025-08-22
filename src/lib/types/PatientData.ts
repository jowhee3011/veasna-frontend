export interface PatientFormData {
    // Patient Info
    queue_no: string;
    english_name: string;
    khmer_name: string;
    date_of_birth: string;
    age: number;
    sex: "M" | "F";
    phone_number: string;
    address: string;
    // faceId: number;
    created_at: string;
    // Vitals
    height_cm: number;
    weight_kg: number;
    bmi: number;
    category: string;
    is_below_third_percentile: boolean;
    blood_pressure_systolic: string;
    blood_pressure_diastolic: string;
    temperature: string;
    additional_notes: string;
    // HEF
    knows_about_hef: string;
    has_hef: string;
    use_hef_reason: string;
}
