// نظام فحص الترابط بين الجداول
import { supabase } from './supabase';

export interface RelationshipCheck {
  canDelete: boolean;
  relatedEntities: {
    type: string;
    count: number;
    items: string[];
  }[];
  message: string;
}

/**
 * فحص ما إذا كان المورد مرتبط بأصناف أو فواتير
 */
export async function checkSupplierRelationships(supplierId: string): Promise<RelationshipCheck> {
  const relatedEntities: RelationshipCheck['relatedEntities'] = [];
  
  // فحص الأصناف المرتبطة
  const { data: items, error: itemsError } = await supabase
    .from('app_d7698bc563_items')
    .select('id, name')
    .eq('supplier_id', supplierId);
  
  if (!itemsError && items && items.length > 0) {
    relatedEntities.push({
      type: 'الأصناف',
      count: items.length,
      items: items.slice(0, 5).map(item => item.name)
    });
  }
  
  // فحص الفواتير المرتبطة
  const { data: invoices, error: invoicesError } = await supabase
    .from('app_d7698bc563_invoices')
    .select('id, invoice_number')
    .eq('supplier_id', supplierId);
  
  if (!invoicesError && invoices && invoices.length > 0) {
    relatedEntities.push({
      type: 'الفواتير',
      count: invoices.length,
      items: invoices.slice(0, 5).map(inv => inv.invoice_number)
    });
  }
  
  const canDelete = relatedEntities.length === 0;
  const message = canDelete 
    ? 'يمكن حذف هذا المورد'
    : `لا يمكن حذف هذا المورد لأنه مرتبط بـ ${relatedEntities.map(e => `${e.count} ${e.type}`).join(' و ')}`;
  
  return { canDelete, relatedEntities, message };
}

/**
 * فحص ما إذا كان الصنف مرتبط بفواتير أو شحنات
 */
export async function checkItemRelationships(itemId: string): Promise<RelationshipCheck> {
  const relatedEntities: RelationshipCheck['relatedEntities'] = [];
  
  // فحص الفواتير المرتبطة (items هو JSON array في جدول الفواتير)
  const { data: invoices, error: invoicesError } = await supabase
    .from('app_d7698bc563_invoices')
    .select('id, invoice_number, items');
  
  if (!invoicesError && invoices) {
    const relatedInvoices = invoices.filter(inv => {
      const items = inv.items as Array<{ itemId: string; quantity: number; unitPrice: number }>;
      return items && items.some(i => i.itemId === itemId);
    });
    
    if (relatedInvoices.length > 0) {
      relatedEntities.push({
        type: 'الفواتير',
        count: relatedInvoices.length,
        items: relatedInvoices.slice(0, 5).map(inv => inv.invoice_number)
      });
    }
  }
  
  // فحص الشحنات المرتبطة (items هو JSON array في جدول الشحنات)
  const { data: shipments, error: shipmentsError } = await supabase
    .from('app_d7698bc563_shipments')
    .select('id, shipment_number, items');
  
  if (!shipmentsError && shipments) {
    const relatedShipments = shipments.filter(ship => {
      const items = ship.items as Array<{ itemId: string; quantity: number }>;
      return items && items.some(i => i.itemId === itemId);
    });
    
    if (relatedShipments.length > 0) {
      relatedEntities.push({
        type: 'الشحنات',
        count: relatedShipments.length,
        items: relatedShipments.slice(0, 5).map(ship => ship.shipment_number)
      });
    }
  }
  
  const canDelete = relatedEntities.length === 0;
  const message = canDelete 
    ? 'يمكن حذف هذا الصنف'
    : `لا يمكن حذف هذا الصنف لأنه مرتبط بـ ${relatedEntities.map(e => `${e.count} ${e.type}`).join(' و ')}`;
  
  return { canDelete, relatedEntities, message };
}

/**
 * فحص ما إذا كان الموقع مرتبط بأصناف
 */
export async function checkLocationRelationships(locationId: string): Promise<RelationshipCheck> {
  const relatedEntities: RelationshipCheck['relatedEntities'] = [];
  
  // فحص الأصناف المرتبطة
  const { data: items, error: itemsError } = await supabase
    .from('app_d7698bc563_items')
    .select('id, name')
    .eq('location_id', locationId);
  
  if (!itemsError && items && items.length > 0) {
    relatedEntities.push({
      type: 'الأصناف',
      count: items.length,
      items: items.slice(0, 5).map(item => item.name)
    });
  }
  
  const canDelete = relatedEntities.length === 0;
  const message = canDelete 
    ? 'يمكن حذف هذا الموقع'
    : `لا يمكن حذف هذا الموقع لأنه يحتوي على ${relatedEntities[0].count} ${relatedEntities[0].type}`;
  
  return { canDelete, relatedEntities, message };
}

/**
 * فحص ما إذا كانت الفاتورة مرتبطة بشحنات (في المستقبل)
 */
export async function checkInvoiceRelationships(invoiceId: string): Promise<RelationshipCheck> {
  // حالياً الفواتير ليس لها علاقات تمنع الحذف
  // يمكن إضافة فحوصات إضافية في المستقبل
  return {
    canDelete: true,
    relatedEntities: [],
    message: 'يمكن حذف هذه الفاتورة'
  };
}

/**
 * فحص ما إذا كانت الشحنة مرتبطة بعناصر أخرى (في المستقبل)
 */
export async function checkShipmentRelationships(shipmentId: string): Promise<RelationshipCheck> {
  // حالياً الشحنات ليس لها علاقات تمنع الحذف
  // يمكن إضافة فحوصات إضافية في المستقبل
  return {
    canDelete: true,
    relatedEntities: [],
    message: 'يمكن حذف هذه الشحنة'
  };
}