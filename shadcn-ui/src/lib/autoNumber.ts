// مكتبة توليد الأرقام التلقائية
export class AutoNumberGenerator {
  private static counters: Record<string, number> = {
    invoice: 1,
    supplier: 1,
    item: 1,
    location: 1,
    shipment: 1,
  };

  // توليد رقم فاتورة
  static generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const number = String(this.counters.invoice).padStart(3, '0');
    this.counters.invoice++;
    return `INV-${year}${month}-${number}`;
  }

  // توليد رقم مورد
  static generateSupplierNumber(): string {
    const year = new Date().getFullYear();
    const number = String(this.counters.supplier).padStart(4, '0');
    this.counters.supplier++;
    return `SUP-${year}-${number}`;
  }

  // توليد رقم صنف
  static generateItemNumber(): string {
    const year = new Date().getFullYear();
    const number = String(this.counters.item).padStart(4, '0');
    this.counters.item++;
    return `ITM-${year}-${number}`;
  }

  // توليد رقم موقع
  static generateLocationNumber(): string {
    const year = new Date().getFullYear();
    const number = String(this.counters.location).padStart(3, '0');
    this.counters.location++;
    return `LOC-${year}-${number}`;
  }

  // توليد رقم شحنة
  static generateShipmentNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const number = String(this.counters.shipment).padStart(3, '0');
    this.counters.shipment++;
    return `SH-${year}${month}-${number}`;
  }

  // توليد رقم بوليصة شحن
  static generateBillOfLading(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BL-${year}${month}${day}-${random}`;
  }

  // توليد رقم حاوية
  static generateContainerNumber(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = Array.from({length: 4}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const checkDigit = Math.floor(Math.random() * 10);
    return `${prefix}${number}${checkDigit}`;
  }

  // إعادة تعيين العدادات (للاختبار)
  static resetCounters(): void {
    this.counters = {
      invoice: 1,
      supplier: 1,
      item: 1,
      location: 1,
      shipment: 1,
    };
  }

  // تحديث العداد لنوع معين
  static updateCounter(type: string, value: number): void {
    if (Object.prototype.hasOwnProperty.call(this.counters, type)) {
      this.counters[type] = value;
    }
  }

  // الحصول على العداد الحالي
  static getCurrentCounter(type: string): number {
    return this.counters[type] || 0;
  }
}