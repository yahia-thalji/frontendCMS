import { Item, Supplier, Location, Shipment, Invoice } from '@/types';

// مفاتيح التخزين المحلي
const STORAGE_KEYS = {
  ITEMS: 'import_system_items',
  SUPPLIERS: 'import_system_suppliers',
  LOCATIONS: 'import_system_locations',
  SHIPMENTS: 'import_system_shipments',
  INVOICES: 'import_system_invoices',
  COUNTERS: 'import_system_counters'
};

// نوع العدادات للأرقام التسلسلية
interface Counters {
  items: number;
  suppliers: number;
  locations: number;
  shipments: number;
  invoices: number;
  containers: number;
  billOfLading: number;
}

// نوع البيانات المستوردة
interface ImportData {
  items?: Item[];
  suppliers?: Supplier[];
  locations?: Location[];
  shipments?: Shipment[];
  invoices?: Invoice[];
  counters?: Counters;
  exportDate?: string;
}

// الحصول على البيانات من التخزين المحلي
export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    // تحويل التواريخ من النصوص إلى كائنات Date
    if (Array.isArray(parsed)) {
      return parsed.map((item: Record<string, unknown>) => {
        if (item.createdAt) item.createdAt = new Date(item.createdAt as string);
        if (item.departureDate) item.departureDate = new Date(item.departureDate as string);
        if (item.arrivalDate) item.arrivalDate = new Date(item.arrivalDate as string);
        if (item.dueDate) item.dueDate = new Date(item.dueDate as string);
        return item;
      }) as T;
    }
    
    return parsed;
  } catch (error) {
    console.error('خطأ في قراءة البيانات من التخزين المحلي:', error);
    return defaultValue;
  }
};

// حفظ البيانات في التخزين المحلي
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('خطأ في حفظ البيانات في التخزين المحلي:', error);
  }
};

// إدارة الأصناف
export const ItemsStorage = {
  getAll: (): Item[] => getFromLocalStorage(STORAGE_KEYS.ITEMS, []),
  save: (items: Item[]): void => saveToLocalStorage(STORAGE_KEYS.ITEMS, items),
  add: (item: Item): void => {
    const items = ItemsStorage.getAll();
    items.push(item);
    ItemsStorage.save(items);
  },
  update: (id: string, updatedItem: Item): void => {
    const items = ItemsStorage.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = updatedItem;
      ItemsStorage.save(items);
    }
  },
  delete: (id: string): void => {
    const items = ItemsStorage.getAll();
    const filteredItems = items.filter(item => item.id !== id);
    ItemsStorage.save(filteredItems);
  }
};

// إدارة الموردين
export const SuppliersStorage = {
  getAll: (): Supplier[] => getFromLocalStorage(STORAGE_KEYS.SUPPLIERS, []),
  save: (suppliers: Supplier[]): void => saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, suppliers),
  add: (supplier: Supplier): void => {
    const suppliers = SuppliersStorage.getAll();
    suppliers.push(supplier);
    SuppliersStorage.save(suppliers);
  },
  update: (id: string, updatedSupplier: Supplier): void => {
    const suppliers = SuppliersStorage.getAll();
    const index = suppliers.findIndex(supplier => supplier.id === id);
    if (index !== -1) {
      suppliers[index] = updatedSupplier;
      SuppliersStorage.save(suppliers);
    }
  },
  delete: (id: string): void => {
    const suppliers = SuppliersStorage.getAll();
    const filteredSuppliers = suppliers.filter(supplier => supplier.id !== id);
    SuppliersStorage.save(filteredSuppliers);
  }
};

// إدارة المواقع
export const LocationsStorage = {
  getAll: (): Location[] => getFromLocalStorage(STORAGE_KEYS.LOCATIONS, []),
  save: (locations: Location[]): void => saveToLocalStorage(STORAGE_KEYS.LOCATIONS, locations),
  add: (location: Location): void => {
    const locations = LocationsStorage.getAll();
    locations.push(location);
    LocationsStorage.save(locations);
  },
  update: (id: string, updatedLocation: Location): void => {
    const locations = LocationsStorage.getAll();
    const index = locations.findIndex(location => location.id === id);
    if (index !== -1) {
      locations[index] = updatedLocation;
      LocationsStorage.save(locations);
    }
  },
  delete: (id: string): void => {
    const locations = LocationsStorage.getAll();
    const filteredLocations = locations.filter(location => location.id !== id);
    LocationsStorage.save(filteredLocations);
  }
};

// إدارة الشحنات
export const ShipmentsStorage = {
  getAll: (): Shipment[] => getFromLocalStorage(STORAGE_KEYS.SHIPMENTS, []),
  save: (shipments: Shipment[]): void => saveToLocalStorage(STORAGE_KEYS.SHIPMENTS, shipments),
  add: (shipment: Shipment): void => {
    const shipments = ShipmentsStorage.getAll();
    shipments.push(shipment);
    ShipmentsStorage.save(shipments);
  },
  update: (id: string, updatedShipment: Shipment): void => {
    const shipments = ShipmentsStorage.getAll();
    const index = shipments.findIndex(shipment => shipment.id === id);
    if (index !== -1) {
      shipments[index] = updatedShipment;
      ShipmentsStorage.save(shipments);
    }
  },
  delete: (id: string): void => {
    const shipments = ShipmentsStorage.getAll();
    const filteredShipments = shipments.filter(shipment => shipment.id !== id);
    ShipmentsStorage.save(filteredShipments);
  }
};

// إدارة الفواتير
export const InvoicesStorage = {
  getAll: (): Invoice[] => getFromLocalStorage(STORAGE_KEYS.INVOICES, []),
  save: (invoices: Invoice[]): void => saveToLocalStorage(STORAGE_KEYS.INVOICES, invoices),
  add: (invoice: Invoice): void => {
    const invoices = InvoicesStorage.getAll();
    invoices.push(invoice);
    InvoicesStorage.save(invoices);
  },
  update: (id: string, updatedInvoice: Invoice): void => {
    const invoices = InvoicesStorage.getAll();
    const index = invoices.findIndex(invoice => invoice.id === id);
    if (index !== -1) {
      invoices[index] = updatedInvoice;
      InvoicesStorage.save(invoices);
    }
  },
  delete: (id: string): void => {
    const invoices = InvoicesStorage.getAll();
    const filteredInvoices = invoices.filter(invoice => invoice.id !== id);
    InvoicesStorage.save(filteredInvoices);
  }
};

// إدارة العدادات للأرقام التسلسلية
export const CountersStorage = {
  getCounters: (): Counters => getFromLocalStorage(STORAGE_KEYS.COUNTERS, {
    items: 1,
    suppliers: 1,
    locations: 1,
    shipments: 1,
    invoices: 1,
    containers: 1,
    billOfLading: 1
  }),
  
  updateCounter: (type: keyof Counters): number => {
    const counters = CountersStorage.getCounters();
    counters[type] += 1;
    saveToLocalStorage(STORAGE_KEYS.COUNTERS, counters);
    return counters[type];
  },
  
  resetCounters: (): void => {
    saveToLocalStorage(STORAGE_KEYS.COUNTERS, {
      items: 1,
      suppliers: 1,
      locations: 1,
      shipments: 1,
      invoices: 1,
      containers: 1,
      billOfLading: 1
    });
  }
};

// تهيئة البيانات الأولية إذا لم تكن موجودة
export const initializeLocalStorage = (): void => {
  // تحقق من وجود البيانات، إذا لم تكن موجودة، استخدم البيانات الوهمية
  if (ItemsStorage.getAll().length === 0) {
    // يمكن إضافة بيانات أولية هنا إذا لزم الأمر
    console.log('تم تهيئة التخزين المحلي للأصناف');
  }
  
  if (SuppliersStorage.getAll().length === 0) {
    console.log('تم تهيئة التخزين المحلي للموردين');
  }
  
  if (LocationsStorage.getAll().length === 0) {
    console.log('تم تهيئة التخزين المحلي للمواقع');
  }
  
  if (ShipmentsStorage.getAll().length === 0) {
    console.log('تم تهيئة التخزين المحلي للشحنات');
  }
  
  if (InvoicesStorage.getAll().length === 0) {
    console.log('تم تهيئة التخزين المحلي للفواتير');
  }
};

// مسح جميع البيانات المحلية
export const clearAllLocalStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('تم مسح جميع البيانات المحلية');
};

// تصدير البيانات كـ JSON
export const exportData = () => {
  return {
    items: ItemsStorage.getAll(),
    suppliers: SuppliersStorage.getAll(),
    locations: LocationsStorage.getAll(),
    shipments: ShipmentsStorage.getAll(),
    invoices: InvoicesStorage.getAll(),
    counters: CountersStorage.getCounters(),
    exportDate: new Date().toISOString()
  };
};

// استيراد البيانات من JSON
export const importData = (data: ImportData): boolean => {
  try {
    if (data.items) ItemsStorage.save(data.items);
    if (data.suppliers) SuppliersStorage.save(data.suppliers);
    if (data.locations) LocationsStorage.save(data.locations);
    if (data.shipments) ShipmentsStorage.save(data.shipments);
    if (data.invoices) InvoicesStorage.save(data.invoices);
    if (data.counters) saveToLocalStorage(STORAGE_KEYS.COUNTERS, data.counters);
    
    console.log('تم استيراد البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في استيراد البيانات:', error);
    return false;
  }
};