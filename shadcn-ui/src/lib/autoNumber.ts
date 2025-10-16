import { CountersStorage } from './localStorage';

export class AutoNumberGenerator {
  // توليد رقم الفاتورة: INV-YYYYMM-XXX
  static generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const counter = CountersStorage.updateCounter('invoices');
    const sequence = String(counter).padStart(3, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  // توليد رقم المورد: SUP-YYYY-XXXX
  static generateSupplierNumber(): string {
    const year = new Date().getFullYear();
    const counter = CountersStorage.updateCounter('suppliers');
    const sequence = String(counter).padStart(4, '0');
    return `SUP-${year}-${sequence}`;
  }

  // توليد رقم الصنف: ITM-YYYY-XXXX
  static generateItemNumber(): string {
    const year = new Date().getFullYear();
    const counter = CountersStorage.updateCounter('items');
    const sequence = String(counter).padStart(4, '0');
    return `ITM-${year}-${sequence}`;
  }

  // توليد رقم الموقع: LOC-YYYY-XXX
  static generateLocationNumber(): string {
    const year = new Date().getFullYear();
    const counter = CountersStorage.updateCounter('locations');
    const sequence = String(counter).padStart(3, '0');
    return `LOC-${year}-${sequence}`;
  }

  // توليد رقم الشحنة: SH-YYYYMM-XXX
  static generateShipmentNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const counter = CountersStorage.updateCounter('shipments');
    const sequence = String(counter).padStart(3, '0');
    return `SH-${year}${month}-${sequence}`;
  }

  // توليد رقم الحاوية: ABCD123456X (تنسيق دولي)
  static generateContainerNumber(): string {
    const counter = CountersStorage.updateCounter('containers');
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    
    // توليد 4 أحرف عشوائية
    const randomLetters = Array.from({ length: 4 }, () => 
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    
    // رقم تسلسلي من 6 أرقام
    const sequence = String(counter).padStart(6, '0');
    
    // رقم تحقق (check digit) - مبسط
    const checkDigit = (counter % 10);
    
    return `${randomLetters}${sequence}${checkDigit}`;
  }

  // توليد رقم بوليصة الشحن: BL-YYYYMMDD-XXX
  static generateBillOfLading(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const counter = CountersStorage.updateCounter('billOfLading');
    const sequence = String(counter).padStart(3, '0');
    return `BL-${year}${month}${day}-${sequence}`;
  }

  // إعادة تعيين جميع العدادات
  static resetAllCounters(): void {
    CountersStorage.resetCounters();
  }

  // الحصول على العدادات الحالية
  static getCurrentCounters() {
    return CountersStorage.getCounters();
  }
}