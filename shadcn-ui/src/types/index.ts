export interface Item {
  id: string;
  name: string;
  type: string;
  referenceNumber: string;
  specifications: string;
  price: number;
  unit: string;
  supplierId: string;
  locationId?: string;
  quantity: number;
  currencyId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  paymentTerms: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  isBaseCurrency: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  currencyId?: string;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'shelf' | 'section';
  capacity: number;
  currentStock: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  billOfLading: string;
  containerNumber: string;
  status: 'in_transit' | 'arrived' | 'customs' | 'delivered';
  departureDate: string;
  arrivalDate?: string | null;
  shippingCost: number;
  customsFees: number;
  insurance?: number;
  currencyId?: string;
  items?: ShipmentItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ShipmentItem {
  itemId: string;
  quantity: number;
  weight?: number;
  volume?: number;
}

export interface CostDistribution {
  itemId: string;
  shippingCostPerUnit: number;
  customsFeesPerUnit: number;
  insurancePerUnit: number;
  totalCostPerUnit: number;
}

export interface ReportData {
  [key: string]: string | number | boolean | ReportData | ReportData[];
}

export interface Report {
  id: string;
  type: 'inventory' | 'supplier' | 'shipping' | 'cost_analysis';
  title: string;
  data: ReportData;
  generatedAt: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'overdue_invoice' | 'shipment_arrived' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SearchResult {
  type: 'item' | 'supplier' | 'invoice' | 'shipment' | 'location';
  id: string;
  title: string;
  description: string;
  url: string;
}