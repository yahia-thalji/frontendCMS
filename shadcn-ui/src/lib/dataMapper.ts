// Data Mapper: تحويل البيانات بين camelCase (Frontend) و snake_case (Database)

type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

// تحويل object من camelCase إلى snake_case
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item as Record<string, unknown>)) as unknown as Record<string, unknown>;
  }
  
  if (obj instanceof Date) {
    return obj as unknown as Record<string, unknown>;
  }
  
  if (typeof obj !== 'object') {
    return obj as unknown as Record<string, unknown>;
  }
  
  const result: Record<string, unknown> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      const value = obj[key];
      
      if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
        result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[snakeKey] = value.map(item => 
          item && typeof item === 'object' && !(item instanceof Date) 
            ? toSnakeCase(item as Record<string, unknown>)
            : item
        );
      } else {
        result[snakeKey] = value;
      }
    }
  }
  
  return result;
}

// تحويل object من snake_case إلى camelCase
export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item as Record<string, unknown>)) as unknown as Record<string, unknown>;
  }
  
  if (obj instanceof Date) {
    return obj as unknown as Record<string, unknown>;
  }
  
  if (typeof obj !== 'object') {
    return obj as unknown as Record<string, unknown>;
  }
  
  const result: Record<string, unknown> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = obj[key];
      
      if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
        result[camelKey] = toCamelCase(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[camelKey] = value.map(item => 
          item && typeof item === 'object' && !(item instanceof Date) 
            ? toCamelCase(item as Record<string, unknown>)
            : item
        );
      } else {
        result[camelKey] = value;
      }
    }
  }
  
  return result;
}

// تحويل التواريخ من string إلى Date objects
export function parseDates<T extends Record<string, unknown>>(obj: T, dateFields: string[] = ['createdAt', 'updatedAt', 'issueDate', 'dueDate', 'departureDate', 'arrivalDate']): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  for (const field of dateFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string) as unknown as T[Extract<keyof T, string>];
    }
  }
  
  return result;
}

// معالجة خاصة لحقل currentStock/current_usage
export function mapLocationFields(obj: Record<string, unknown>, toDatabase = false): Record<string, unknown> {
  if (!obj) return obj;
  
  const result = { ...obj };
  
  if (toDatabase) {
    // Frontend -> Database: currentStock -> current_usage
    if ('currentStock' in result) {
      result.current_usage = result.currentStock;
      delete result.currentStock;
    }
  } else {
    // Database -> Frontend: current_usage -> currentStock
    if ('current_usage' in result) {
      result.currentStock = result.current_usage;
      delete result.current_usage;
    }
  }
  
  return result;
}