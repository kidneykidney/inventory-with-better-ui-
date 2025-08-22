// Sample inventory data for development
export const sampleInventoryItems = [
  {
    id: '1',
    name: 'Laptop Computer',
    description: 'High-performance business laptop',
    quantity: 15,
    price: 999.99,
    category: 'Electronics',
    supplier: 'Tech Corp',
    minStockLevel: 5,
    isActive: true,
    dateAdded: new Date('2024-01-15'),
    lastUpdated: new Date('2024-08-20')
  },
  {
    id: '2',
    name: 'Office Chair',
    description: 'Ergonomic office chair with lumbar support',
    quantity: 3,
    price: 299.99,
    category: 'Furniture',
    supplier: 'Office Solutions',
    minStockLevel: 5,
    isActive: true,
    dateAdded: new Date('2024-02-10'),
    lastUpdated: new Date('2024-08-19')
  },
  {
    id: '3',
    name: 'Wireless Mouse',
    description: 'Bluetooth wireless mouse',
    quantity: 0,
    price: 49.99,
    category: 'Electronics',
    supplier: 'Tech Corp',
    minStockLevel: 10,
    isActive: true,
    dateAdded: new Date('2024-03-05'),
    lastUpdated: new Date('2024-08-18')
  },
  {
    id: '4',
    name: 'Desk Organizer',
    description: 'Wooden desk organizer with compartments',
    quantity: 25,
    price: 39.99,
    category: 'Office Supplies',
    supplier: 'Office Solutions',
    minStockLevel: 8,
    isActive: true,
    dateAdded: new Date('2024-04-12'),
    lastUpdated: new Date('2024-08-17')
  }
];

export const sampleCategories = [
  { id: '1', name: 'Electronics', description: 'Electronic devices and accessories' },
  { id: '2', name: 'Furniture', description: 'Office and home furniture' },
  { id: '3', name: 'Office Supplies', description: 'General office supplies and stationery' },
  { id: '4', name: 'Software', description: 'Software licenses and subscriptions' }
];

export const sampleSuppliers = [
  { 
    id: '1', 
    name: 'Tech Corp', 
    email: 'orders@techcorp.com', 
    phone: '+1-555-0123', 
    address: '123 Tech Street, Silicon Valley, CA 94000' 
  },
  { 
    id: '2', 
    name: 'Office Solutions', 
    email: 'sales@officesolutions.com', 
    phone: '+1-555-0456', 
    address: '456 Business Ave, New York, NY 10001' 
  }
];
