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
  createdAt: Date;
  updatedAt?: Date;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  paymentTerms: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  items: InvoiceItem[];
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  customsFees?: number;
  insurance?: number;
  total?: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  issueDate?: Date;
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InvoiceItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'shelf' | 'section';
  capacity: number;
  currentStock: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  billOfLading: string;
  containerNumber: string;
  status: 'in_transit' | 'arrived' | 'customs' | 'delivered';
  departureDate: Date;
  arrivalDate?: Date | null;
  shippingCost: number;
  customsFees: number;
  insurance?: number;
  items?: ShipmentItem[];
  createdAt?: Date;
  updatedAt?: Date;
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
  [key: string]: string | number | boolean | Date | ReportData | ReportData[];
}

export interface Report {
  id: string;
  type: 'inventory' | 'supplier' | 'shipping' | 'cost_analysis';
  title: string;
  data: ReportData;
  generatedAt: Date;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'overdue_invoice' | 'shipment_arrived' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface SearchResult {
  type: 'item' | 'supplier' | 'invoice' | 'shipment' | 'location';
  id: string;
  title: string;
  description: string;
  url: string;
}