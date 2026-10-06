import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_URL = supabaseUrl;

export type ServiceType = 'Manicure' | 'Gel-X' | 'Pedicure' | 'Full Hair Services' | 'Barber Services' | 'Brows & Lashes' | 'Makeup Services' | 'Hair' | "Men's" | 'Makeup' | 'Nails' | 'Skincare' | 'Other';

export type Worker = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  rating: number;
  image_url: string | null;
  specialty: ServiceType | null;
  phone: string | null;
  created_at: string;
};

export type StudioSettings = {
  id: number;
  admin_phone: string | null;
  updated_at: string;
};

export type WorkerCategory = {
  worker_id: string;
  category: ServiceType;
};

export type WorkerServiceAssignment = {
  worker_id: string;
  service_id: string;
  is_available: boolean;
};

export type Service = {
  id: string;
  name: string;
  type: ServiceType;
  duration: number;
  price: number;
  description: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  customer_name: string;
  phone: string;
  service_id: string;
  worker_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  services?: Service;
  workers?: Worker;
};

export type Review = {
  id: string;
  worker_id: string;
  rating: number;
  feedback: string | null;
  customer_name: string | null;
  created_at: string;
  workers?: Worker;
};
