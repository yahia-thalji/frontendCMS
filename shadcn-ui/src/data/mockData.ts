import { Item, Supplier, Invoice, Location, Shipment } from '@/types';

export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'شركة التجارة العالمية',
    address: 'شارع الملك فهد، الرياض، السعودية',
    phone: '+966501234567',
    email: 'info@globaltrade.com',
    paymentTerms: '30 يوم',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'مؤسسة الشرق الأوسط للاستيراد',
    address: 'منطقة الخليج التجاري، دبي، الإمارات',
    phone: '+971501234567',
    email: 'contact@middleeast.ae',
    paymentTerms: '45 يوم',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

export const mockLocations: Location[] = [
  {
    id: '1',
    name: 'المخزن الرئيسي - القسم أ',
    type: 'warehouse',
    capacity: 1000,
    currentStock: 750,
    description: 'مخزن للمواد الخام',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'الرف رقم 1',
    type: 'shelf',
    capacity: 200,
    currentStock: 150,
    description: 'رف للقطع الصغيرة',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockItems: Item[] = [
  {
    id: '1',
    name: 'مضخة مياه صناعية',
    type: 'معدات صناعية',
    referenceNumber: 'WP-001',
    specifications: 'قدرة 500 لتر/دقيقة، ضغط 10 بار',
    price: 2500,
    unit: 'قطعة',
    supplierId: '1',
    locationId: '1',
    quantity: 25,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'صمام تحكم هيدروليكي',
    type: 'قطع غيار',
    referenceNumber: 'HV-002',
    specifications: 'مقاس 2 بوصة، مقاوم للضغط العالي',
    price: 150,
    unit: 'قطعة',
    supplierId: '2',
    locationId: '2',
    quantity: 100,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    supplierId: '1',
    items: [
      { itemId: '1', quantity: 10, unitPrice: 2500, total: 25000 },
    ],
    subtotal: 25000,
    shippingCost: 2000,
    customsFees: 1500,
    insurance: 500,
    total: 29000,
    status: 'paid',
    issueDate: new Date('2024-01-20'),
    dueDate: new Date('2024-02-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
  },
];

export const mockShipments: Shipment[] = [
  {
    id: '1',
    shipmentNumber: 'SH-2024-001',
    billOfLading: 'BL-001234567',
    containerNumber: 'CONT-001',
    status: 'delivered',
    departureDate: new Date('2024-01-15'),
    arrivalDate: new Date('2024-01-25'),
    shippingCost: 5000,
    customsFees: 3000,
    insurance: 1000,
    items: [
      { itemId: '1', quantity: 25, weight: 500, volume: 10 },
      { itemId: '2', quantity: 50, weight: 100, volume: 2 },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-25'),
  },
];