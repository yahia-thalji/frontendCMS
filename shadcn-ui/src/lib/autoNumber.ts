import { SupabaseCountersStorage } from './supabaseStorage';

export const generateItemNumber = async (): Promise<string> => {
  try {
    const counter = await SupabaseCountersStorage.updateCounter('items');
    return `ITEM-${String(counter).padStart(6, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم الصنف:', error);
    return `ITEM-${Date.now()}`;
  }
};

export const generateSupplierNumber = async (): Promise<string> => {
  try {
    const counter = await SupabaseCountersStorage.updateCounter('suppliers');
    return `SUP-${String(counter).padStart(6, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم المورد:', error);
    return `SUP-${Date.now()}`;
  }
};

export const generateLocationNumber = async (): Promise<string> => {
  try {
    const counter = await SupabaseCountersStorage.updateCounter('locations');
    return `LOC-${String(counter).padStart(6, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم الموقع:', error);
    return `LOC-${Date.now()}`;
  }
};

export const generateContainerNumber = async (): Promise<string> => {
  try {
    const counter = await SupabaseCountersStorage.updateCounter('containers');
    return `CONT-${String(counter).padStart(6, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم الحاوية:', error);
    return `CONT-${Date.now()}`;
  }
};

export const generateBillOfLading = async (): Promise<string> => {
  try {
    const counter = await SupabaseCountersStorage.updateCounter('bill_of_lading');
    return `BOL-${String(counter).padStart(6, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم بوليصة الشحن:', error);
    return `BOL-${Date.now()}`;
  }
};

export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    const counter = await SupabaseCountersStorage.updateCounter('invoices');
    return `INV-${String(counter).padStart(6, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم الفاتورة:', error);
    return `INV-${Date.now()}`;
  }
};