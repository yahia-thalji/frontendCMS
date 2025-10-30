import { supabase } from './supabase';
import { Item, Supplier, Invoice, Location, Shipment, Currency } from '@/types';
import { toSnakeCase, toCamelCase, parseDates, mapLocationFields } from './dataMapper';
import { 
  checkSupplierRelationships, 
  checkItemRelationships, 
  checkLocationRelationships,
  checkInvoiceRelationships,
  checkShipmentRelationships,
  RelationshipCheck 
} from './relationshipChecker';

type SubscriptionCallback<T> = (data: T[]) => void;
type UnsubscribeFunction = () => void;

class SupabaseStorage<T extends { id?: string }> {
  private tableName: string;
  private subscribers: Set<SubscriptionCallback<T>> = new Set();
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private isLocationTable: boolean;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.isLocationTable = tableName.includes('locations');
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

  private transformFromDB(data: Record<string, unknown>): T {
    let transformed = toCamelCase(data);
    
    if (this.isLocationTable) {
      transformed = mapLocationFields(transformed, false);
    }
    
    transformed = parseDates(transformed);
    
    return transformed as T;
  }

  private transformToDB(data: Record<string, unknown>): Record<string, unknown> {
    let transformed = { ...data };
    
    if (this.isLocationTable) {
      transformed = mapLocationFields(transformed, true);
    }
    
    transformed = toSnakeCase(transformed);
    
    return transformed;
  }

  async getAll(): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => this.transformFromDB(item as Record<string, unknown>));
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
      return this.transformFromDB(data as Record<string, unknown>);
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return null;
    }
  }

  async add(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T | null> {
    try {
      const dbItem = this.transformToDB(item as Record<string, unknown>);
      
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([dbItem])
        .select()
        .single();

      if (error) throw error;
      await this.notifySubscribers();
      return this.transformFromDB(data as Record<string, unknown>);
    } catch (error) {
      console.error(`Error adding ${this.tableName}:`, error);
      return null;
    }
  }

  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T | null> {
    try {
      const dbUpdates = this.transformToDB(updates as Record<string, unknown>);
      
      const { data, error } = await supabase
        .from(this.tableName)
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await this.notifySubscribers();
      return this.transformFromDB(data as Record<string, unknown>);
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * فحص العلاقات قبل الحذف
   */
  async checkRelationships(id: string): Promise<RelationshipCheck> {
    if (this.tableName.includes('suppliers')) {
      return await checkSupplierRelationships(id);
    } else if (this.tableName.includes('items')) {
      return await checkItemRelationships(id);
    } else if (this.tableName.includes('locations')) {
      return await checkLocationRelationships(id);
    } else if (this.tableName.includes('invoices')) {
      return await checkInvoiceRelationships(id);
    } else if (this.tableName.includes('shipments')) {
      return await checkShipmentRelationships(id);
    }
    
    return {
      canDelete: true,
      relatedEntities: [],
      message: 'يمكن الحذف'
    };
  }

  async delete(id: string): Promise<{ success: boolean; message: string; relatedEntities?: RelationshipCheck['relatedEntities'] }> {
    try {
      // فحص العلاقات أولاً
      const relationshipCheck = await this.checkRelationships(id);
      
      if (!relationshipCheck.canDelete) {
        return {
          success: false,
          message: relationshipCheck.message,
          relatedEntities: relationshipCheck.relatedEntities
        };
      }
      
      // إذا كان يمكن الحذف، قم بالحذف
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await this.notifySubscribers();
      return {
        success: true,
        message: 'تم الحذف بنجاح'
      };
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return {
        success: false,
        message: 'حدث خطأ أثناء الحذف'
      };
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

// Counter type for auto-numbering
interface Counter {
  id?: string;
  entity_type: string;
  current_number: number;
  prefix: string;
  created_at?: string;
  updated_at?: string;
}

class CountersStorage extends SupabaseStorage<Counter> {
  async getNextNumber(entityType: string, prefix: string): Promise<string> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('entity_type', entityType)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let currentNumber = 1;
      
      if (existing) {
        currentNumber = (existing.current_number || 0) + 1;
        await supabase
          .from(this.tableName)
          .update({ current_number: currentNumber })
          .eq('id', existing.id);
      } else {
        await supabase
          .from(this.tableName)
          .insert([{ entity_type: entityType, current_number: currentNumber, prefix }]);
      }

      return `${prefix}${String(currentNumber).padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating number:', error);
      return `${prefix}${String(Date.now()).slice(-6)}`;
    }
  }
}

export const SupabaseItemsStorage = new SupabaseStorage<Item>('app_d7698bc563_items');
export const SupabaseSuppliersStorage = new SupabaseStorage<Supplier>('app_d7698bc563_suppliers');
export const SupabaseInvoicesStorage = new SupabaseStorage<Invoice>('app_d7698bc563_invoices');
export const SupabaseLocationsStorage = new SupabaseStorage<Location>('app_d7698bc563_locations');
export const SupabaseShipmentsStorage = new SupabaseStorage<Shipment>('app_d7698bc563_shipments');
export const SupabaseCurrenciesStorage = new SupabaseStorage<Currency>('app_d7698bc563_currencies');
export const SupabaseCountersStorage = new CountersStorage('app_d7698bc563_auto_numbers');