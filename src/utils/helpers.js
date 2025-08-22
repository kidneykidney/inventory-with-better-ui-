// Utility functions for the inventory management system

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const getStockStatus = (quantity, minStock) => {
  if (quantity === 0) {
    return { label: 'Out of Stock', color: 'error', severity: 'high' };
  }
  if (quantity <= minStock) {
    return { label: 'Low Stock', color: 'warning', severity: 'medium' };
  }
  return { label: 'In Stock', color: 'success', severity: 'low' };
};

export const calculateInventoryValue = (items) => {
  return items.reduce((total, item) => total + (item.quantity * item.price), 0);
};

export const getItemsByCategory = (items) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
};

export const searchItems = (items, searchTerm) => {
  if (!searchTerm) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term) ||
    item.category.toLowerCase().includes(term) ||
    item.supplier.toLowerCase().includes(term)
  );
};

export const sortItems = (items, sortBy, sortOrder = 'asc') => {
  return [...items].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
