import { SupabaseCountersStorage } from './supabaseStorage';

export const generateItemNumber = async (): Promise<string> => {
  return await SupabaseCountersStorage.getNextNumber('items', 'ITEM-');
};

export const generateSupplierNumber = async (): Promise<string> => {
  return await SupabaseCountersStorage.getNextNumber('suppliers', 'SUP-');
};

export const generateLocationNumber = async (): Promise<string> => {
  return await SupabaseCountersStorage.getNextNumber('locations', 'LOC-');
};

export const generateContainerNumber = async (): Promise<string> => {
  return await SupabaseCountersStorage.getNextNumber('containers', 'CONT-');
};

export const generateBillOfLading = async (): Promise<string> => {
  return await SupabaseCountersStorage.getNextNumber('bill_of_lading', 'BOL-');
};

export const generateInvoiceNumber = async (): Promise<string> => {
  return await SupabaseCountersStorage.getNextNumber('invoices', 'INV-');
};

export const generateShipmentNumber = async (): Promise<string> => {
  return await SupabaseCountersStorage.getNextNumber('shipments', 'SHIP-');
};