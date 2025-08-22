export interface Patient {
    id: number;
    queue_no: string;
    english_name: string;
    khmer_name: string;
    date_of_birth: string;
    age: number;
    sex: 'M' | 'F';
    phone_number: string;
    address: string;
    created_at: string;
}