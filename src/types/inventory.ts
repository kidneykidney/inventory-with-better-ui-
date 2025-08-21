export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  supplier: string;
  dateAdded: Date;
  lastUpdated: Date;
  minStockLevel: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface InventoryFilter {
  category?: string;
  supplier?: string;
  minQuantity?: number;
  maxQuantity?: number;
  searchTerm?: string;
}
