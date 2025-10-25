import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Item, Supplier, Location, Shipment, Invoice } from '@/types';

// تحويل التواريخ من وإلى Firestore
const convertDates = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  
  // تحويل التواريخ إلى Timestamp للحفظ
  if (converted.createdAt instanceof Date) {
    converted.createdAt = Timestamp.fromDate(converted.createdAt);
  }
  if (converted.updatedAt instanceof Date) {
    converted.updatedAt = Timestamp.fromDate(converted.updatedAt);
  }
  if (converted.departureDate instanceof Date) {
    converted.departureDate = Timestamp.fromDate(converted.departureDate);
  }
  if (converted.arrivalDate instanceof Date) {
    converted.arrivalDate = Timestamp.fromDate(converted.arrivalDate);
  }
  if (converted.dueDate instanceof Date) {
    converted.dueDate = Timestamp.fromDate(converted.dueDate);
  }
  if (converted.issueDate instanceof Date) {
    converted.issueDate = Timestamp.fromDate(converted.issueDate);
  }
  
  return converted;
};

const convertFromFirestore = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  
  // تحويل Timestamp إلى Date
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  if (converted.departureDate?.toDate) {
    converted.departureDate = converted.departureDate.toDate();
  }
  if (converted.arrivalDate?.toDate) {
    converted.arrivalDate = converted.arrivalDate.toDate();
  }
  if (converted.dueDate?.toDate) {
    converted.dueDate = converted.dueDate.toDate();
  }
  if (converted.issueDate?.toDate) {
    converted.issueDate = converted.issueDate.toDate();
  }
  
  return converted;
};

// إدارة الأصناف السحابية
export const CloudItemsStorage = {
  getAll: async (): Promise<Item[]> => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'items'), orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Item));
    } catch (error) {
      console.error('خطأ في جلب الأصناف:', error);
      return [];
    }
  },

  add: async (item: Omit<Item, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'items'), convertDates(item));
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إضافة الصنف:', error);
      throw error;
    }
  },

  update: async (id: string, item: Partial<Item>): Promise<void> => {
    try {
      const itemRef = doc(db, 'items', id);
      await updateDoc(itemRef, convertDates({ ...item, updatedAt: new Date() }));
    } catch (error) {
      console.error('خطأ في تحديث الصنف:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'items', id));
    } catch (error) {
      console.error('خطأ في حذف الصنف:', error);
      throw error;
    }
  },

  onSnapshot: (callback: (items: Item[]) => void) => {
    return onSnapshot(query(collection(db, 'items'), orderBy('createdAt', 'desc')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Item));
      callback(items);
    });
  }
};

// إدارة الموردين السحابية
export const CloudSuppliersStorage = {
  getAll: async (): Promise<Supplier[]> => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'suppliers'), orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Supplier));
    } catch (error) {
      console.error('خطأ في جلب الموردين:', error);
      return [];
    }
  },

  add: async (supplier: Omit<Supplier, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), convertDates(supplier));
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إضافة المورد:', error);
      throw error;
    }
  },

  update: async (id: string, supplier: Partial<Supplier>): Promise<void> => {
    try {
      const supplierRef = doc(db, 'suppliers', id);
      await updateDoc(supplierRef, convertDates({ ...supplier, updatedAt: new Date() }));
    } catch (error) {
      console.error('خطأ في تحديث المورد:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      console.error('خطأ في حذف المورد:', error);
      throw error;
    }
  },

  onSnapshot: (callback: (suppliers: Supplier[]) => void) => {
    return onSnapshot(query(collection(db, 'suppliers'), orderBy('createdAt', 'desc')), (snapshot) => {
      const suppliers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Supplier));
      callback(suppliers);
    });
  }
};

// إدارة المواقع السحابية
export const CloudLocationsStorage = {
  getAll: async (): Promise<Location[]> => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'locations'), orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Location));
    } catch (error) {
      console.error('خطأ في جلب المواقع:', error);
      return [];
    }
  },

  add: async (location: Omit<Location, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'locations'), convertDates(location));
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إضافة الموقع:', error);
      throw error;
    }
  },

  update: async (id: string, location: Partial<Location>): Promise<void> => {
    try {
      const locationRef = doc(db, 'locations', id);
      await updateDoc(locationRef, convertDates({ ...location, updatedAt: new Date() }));
    } catch (error) {
      console.error('خطأ في تحديث الموقع:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'locations', id));
    } catch (error) {
      console.error('خطأ في حذف الموقع:', error);
      throw error;
    }
  },

  onSnapshot: (callback: (locations: Location[]) => void) => {
    return onSnapshot(query(collection(db, 'locations'), orderBy('createdAt', 'desc')), (snapshot) => {
      const locations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Location));
      callback(locations);
    });
  }
};

// إدارة الشحنات السحابية
export const CloudShipmentsStorage = {
  getAll: async (): Promise<Shipment[]> => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'shipments'), orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Shipment));
    } catch (error) {
      console.error('خطأ في جلب الشحنات:', error);
      return [];
    }
  },

  add: async (shipment: Omit<Shipment, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'shipments'), convertDates(shipment));
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إضافة الشحنة:', error);
      throw error;
    }
  },

  update: async (id: string, shipment: Partial<Shipment>): Promise<void> => {
    try {
      const shipmentRef = doc(db, 'shipments', id);
      await updateDoc(shipmentRef, convertDates({ ...shipment, updatedAt: new Date() }));
    } catch (error) {
      console.error('خطأ في تحديث الشحنة:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'shipments', id));
    } catch (error) {
      console.error('خطأ في حذف الشحنة:', error);
      throw error;
    }
  },

  onSnapshot: (callback: (shipments: Shipment[]) => void) => {
    return onSnapshot(query(collection(db, 'shipments'), orderBy('createdAt', 'desc')), (snapshot) => {
      const shipments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Shipment));
      callback(shipments);
    });
  }
};

// إدارة الفواتير السحابية
export const CloudInvoicesStorage = {
  getAll: async (): Promise<Invoice[]> => {
    try {
      const querySnapshot = await getDocs(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Invoice));
    } catch (error) {
      console.error('خطأ في جلب الفواتير:', error);
      return [];
    }
  },

  add: async (invoice: Omit<Invoice, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'invoices'), convertDates(invoice));
      return docRef.id;
    } catch (error) {
      console.error('خطأ في إضافة الفاتورة:', error);
      throw error;
    }
  },

  update: async (id: string, invoice: Partial<Invoice>): Promise<void> => {
    try {
      const invoiceRef = doc(db, 'invoices', id);
      await updateDoc(invoiceRef, convertDates({ ...invoice, updatedAt: new Date() }));
    } catch (error) {
      console.error('خطأ في تحديث الفاتورة:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (error) {
      console.error('خطأ في حذف الفاتورة:', error);
      throw error;
    }
  },

  onSnapshot: (callback: (invoices: Invoice[]) => void) => {
    return onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Invoice));
      callback(invoices);
    });
  }
};

// إدارة العدادات السحابية
export const CloudCountersStorage = {
  getCounters: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'counters'));
      if (querySnapshot.empty) {
        // إنشاء عدادات افتراضية
        const defaultCounters = {
          items: 1,
          suppliers: 1,
          locations: 1,
          shipments: 1,
          invoices: 1,
          containers: 1,
          billOfLading: 1
        };
        await addDoc(collection(db, 'counters'), defaultCounters);
        return defaultCounters;
      }
      return querySnapshot.docs[0].data();
    } catch (error) {
      console.error('خطأ في جلب العدادات:', error);
      return {
        items: 1,
        suppliers: 1,
        locations: 1,
        shipments: 1,
        invoices: 1,
        containers: 1,
        billOfLading: 1
      };
    }
  },

  updateCounter: async (type: string): Promise<number> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'counters'));
      if (!querySnapshot.empty) {
        const counterDoc = querySnapshot.docs[0];
        const currentCounters = counterDoc.data();
        const newValue = (currentCounters[type] || 0) + 1;
        
        await updateDoc(counterDoc.ref, {
          [type]: newValue
        });
        
        return newValue;
      }
      return 1;
    } catch (error) {
      console.error('خطأ في تحديث العداد:', error);
      return Date.now(); // fallback to timestamp
    }
  }
};

// دالة لنقل البيانات من localStorage إلى Firebase
export const migrateFromLocalStorage = async () => {
  try {
    // استيراد البيانات المحلية
    const { 
      ItemsStorage, 
      SuppliersStorage, 
      LocationsStorage, 
      ShipmentsStorage, 
      InvoicesStorage 
    } = await import('./localStorage');

    const batch = writeBatch(db);

    // نقل الأصناف
    const items = ItemsStorage.getAll();
    for (const item of items) {
      const { id, ...itemData } = item;
      const docRef = doc(collection(db, 'items'));
      batch.set(docRef, convertDates(itemData));
    }

    // نقل الموردين
    const suppliers = SuppliersStorage.getAll();
    for (const supplier of suppliers) {
      const { id, ...supplierData } = supplier;
      const docRef = doc(collection(db, 'suppliers'));
      batch.set(docRef, convertDates(supplierData));
    }

    // نقل المواقع
    const locations = LocationsStorage.getAll();
    for (const location of locations) {
      const { id, ...locationData } = location;
      const docRef = doc(collection(db, 'locations'));
      batch.set(docRef, convertDates(locationData));
    }

    // نقل الشحنات
    const shipments = ShipmentsStorage.getAll();
    for (const shipment of shipments) {
      const { id, ...shipmentData } = shipment;
      const docRef = doc(collection(db, 'shipments'));
      batch.set(docRef, convertDates(shipmentData));
    }

    // نقل الفواتير
    const invoices = InvoicesStorage.getAll();
    for (const invoice of invoices) {
      const { id, ...invoiceData } = invoice;
      const docRef = doc(collection(db, 'invoices'));
      batch.set(docRef, convertDates(invoiceData));
    }

    await batch.commit();
    console.log('تم نقل البيانات إلى Firebase بنجاح');
    
    return true;
  } catch (error) {
    console.error('خطأ في نقل البيانات:', error);
    return false;
  }
};