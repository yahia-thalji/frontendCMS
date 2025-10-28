import { supabase } from './supabase';
import { Item, Supplier, Invoice, Location, Shipment } from '@/types';

type SubscriptionCallback<T> = (data: T[]) => void;
type UnsubscribeFunction = () => void;

class SupabaseStorage<T extends { id?: string }> {
  private tableName: string;
  private subscribers: Set<SubscriptionCallback<T>> = new Set();
  private channel: ReturnType<typeof supabase.channel> | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.setupRealtimeSubscription();
  }

  private setupRealtimeSubscription() {
    this.channel = supabase
      .channel(`${this.tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName
        },
        () => {
          this.notifySubscribers();
        }
      )
      .subscribe();
  }

  private async notifySubscribers() {
    const data = await this.getAll();
    this.subscribers.forEach(callback => callback(data));
  }

  async getAll(): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as T[];
    } catch (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return [];
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as T;
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return null;
    }
  }

  async add(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      await this.notifySubscribers();
      return data as T;
    } catch (error) {
      console.error(`Error adding ${this.tableName}:`, error);
      return null;
    }
  }

  async update(id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await this.notifySubscribers();
      return data as T;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await this.notifySubscribers();
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return false;
    }
  }

  subscribe(callback: SubscriptionCallback<T>): UnsubscribeFunction {
    this.subscribers.add(callback);
    this.getAll().then(data => callback(data));
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  cleanup() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    this.subscribers.clear();
  }
}

export const SupabaseItemsStorage = new SupabaseStorage<Item>('app_d7698bc563_items');
export const SupabaseSuppliersStorage = new SupabaseStorage<Supplier>('app_d7698bc563_suppliers');
export const SupabaseInvoicesStorage = new SupabaseStorage<Invoice>('app_d7698bc563_invoices');
export const SupabaseLocationsStorage = new SupabaseStorage<Location>('app_d7698bc563_locations');
export const SupabaseShipmentsStorage = new SupabaseStorage<Shipment>('app_d7698bc563_shipments');