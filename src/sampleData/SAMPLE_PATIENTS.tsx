import { Patient } from "@/lib/types/patient";

/*************** MOCK DATA ********************/
export const SAMPLE_PATIENTS: Patient[] = [
    {
      id: 1,
      queue_no: "2A",
      english_name: "Sovannary",
      khmer_name: "សុវណ្ណារី",
      date_of_birth: "01/01/2011",
      age: 14,
      sex: "F" as const,
      phone_number: "+855 12 345 678",
      address: "Phnom Penh, Cambodia",
      faceId: 1,
      lastUpdated: "13-07-2025"
    },
    {
      id: 2,
      queue_no: "3B",
      english_name: "Piseth",
      khmer_name: "ពិសិដ្ឋ",
      date_of_birth: "12/05/2002",
      age: 23,
      sex: "M" as const,
      phone_number: "+855 98 765 432",
      address: "Battambang, Cambodia",
      faceId: 2,
      lastUpdated: "29-07-2025"
    },
    {
      id: 3,
      queue_no: "4C",
      english_name: "Sopheap",
      khmer_name: "សុភាព",
      date_of_birth: "20/11/1995",
      age: 29,
      sex: "F" as const,
      phone_number: "+855 97 111 222",
      address: "Siem Reap, Cambodia",
      faceId: 3,
      lastUpdated: "28-07-2025"
    },
    {
      id: 4,
      queue_no: "1D",
      english_name: "Ratanak",
      khmer_name: "រតនៈ",
      date_of_birth: "15/03/1988",
      age: 37,
      sex: "M" as const,
      phone_number: "+855 88 999 333",
      address: "Kampot, Cambodia",
      faceId: 4,
      lastUpdated: "30-07-2025"
    },
    {
      id: 5,
      queue_no: "5E",
      english_name: "Chanthy",
      khmer_name: "ចន្ធី",
      date_of_birth: "08/08/2010",
      age: 15,
      sex: "F" as const,
      phone_number: "+855 11 123 456",
      address: "Takeo, Cambodia",
      faceId: 5,
      lastUpdated: "30-07-2025"
    },
    {
      id: 6,
      queue_no: "12A",
      english_name: "Kosal",
      khmer_name: "កុសល",
      date_of_birth: "01/01/1970",
      age: 55,
      sex: "M" as const,
      phone_number: "+855 85 111 111",
      address: "Kandal, Cambodia",
      faceId: 6,
      lastUpdated: "20-07-2025"
    },
    {
      id: 7,
      queue_no: "6F",
      english_name: "Dara",
      khmer_name: "ដារ៉ា",
      date_of_birth: "22/02/2000",
      age: 25,
      sex: "F" as const,
      phone_number: "+855 95 222 222",
      address: "Prey Veng, Cambodia",
      faceId: 7,
      lastUpdated: "25-07-2025"
    },
    {
      id: 8,
      queue_no: "10B",
      english_name: "Vichea",
      khmer_name: "វិជ្ជា",
      date_of_birth: "09/09/1999",
      age: 25,
      sex: "M" as const,
      phone_number: "+855 16 888 999",
      address: "Kampong Cham, Cambodia",
      faceId: 8,
      lastUpdated: "27-07-2025"
    },
    {
      id: 9,
      queue_no: "3A",
      english_name: "Sreypov",
      khmer_name: "ស្រីពៅ",
      date_of_birth: "03/03/1985",
      age: 40,
      sex: "F" as const,
      phone_number: "+855 93 777 444",
      address: "Banteay Meanchey, Cambodia",
      faceId: 9,
      lastUpdated: "22-07-2025"
    },
    {
      id: 10,
      queue_no: "2B",
      english_name: "Borey",
      khmer_name: "បូរី",
      date_of_birth: "11/11/2015",
      age: 9,
      sex: "M" as const,
      phone_number: "+855 17 555 000",
      address: "Pursat, Cambodia",
      faceId: 10,
      lastUpdated: "19-07-2025"
    }
];
  