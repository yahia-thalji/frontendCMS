import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olpfqwkvgvfxblmdlksj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scGZxd2t2Z3ZmeGJsbWRsa3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzA5OTYsImV4cCI6MjA3NzE0Njk5Nn0._gv01HN4xjmFJfu1tUnxiLnf_YOInIrQvMIbX1-adYw';

export const supabase = createClient(supabaseUrl, supabaseKey);

// أنواع البيانات
export interface SupabaseItem {
  id: string;
  item_number: string;
  name: string;
  description: string;
  supplier_id: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseSupplier {
  id: string;
  supplier_number: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseLocation {
  id: string;
  location_number: string;
  name: string;
  type: string;
  address: string;
  capacity: number;
  current_usage: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseShipment {
  id: string;
  container_number: string;
  bill_of_lading: string;
  supplier_id: string;
  departure_date: string;
  arrival_date: string;
  status: string;
  items: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}