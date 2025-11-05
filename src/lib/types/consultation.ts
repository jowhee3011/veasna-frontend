// src/lib/types/consultation.ts

export interface Referral {
  id?: number;
  visit_id?: number;
  referralDate: string; 
  referralType: string[]; 
  illness: string;
  duration: string;
  reason: string;
  last_updated_at?: string;
  last_updated_by?: number;
  created_at?: string;
}

export interface Consultation {
  id?: number;
  visit_id?: number;
  notes: string;
  prescription: string;
  requireReferral: boolean; 
  referral: Referral | null; 
  last_updated_at?: string;
  last_updated_by?: number;
  created_at?: string;
}