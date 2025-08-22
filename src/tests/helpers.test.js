import { describe, it, expect } from 'vitest';
import { formatCurrency, getStockStatus, searchItems } from '../utils/helpers';

describe('Helper Functions', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(999.99)).toBe('$999.99');
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('should determine stock status correctly', () => {
    expect(getStockStatus(0, 5)).toEqual({ 
      label: 'Out of Stock', 
      color: 'error', 
      severity: 'high' 
    });
    
    expect(getStockStatus(3, 5)).toEqual({ 
      label: 'Low Stock', 
      color: 'warning', 
      severity: 'medium' 
    });
    
    expect(getStockStatus(10, 5)).toEqual({ 
      label: 'In Stock', 
      color: 'success', 
      severity: 'low' 
    });
  });

  it('should search items correctly', () => {
    const items = [
      { name: 'Laptop', description: 'Gaming laptop', category: 'Electronics' },
      { name: 'Chair', description: 'Office chair', category: 'Furniture' }
    ];

    const results = searchItems(items, 'laptop');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Laptop');
  });
});
