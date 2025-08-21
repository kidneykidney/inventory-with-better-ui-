import axios from 'axios';
import { InventoryItem, Category, Supplier } from '../types/inventory';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const inventoryService = {
  // Inventory Items
  getAllItems: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/inventory');
    return response.data;
  },

  getItemById: async (id: string): Promise<InventoryItem> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  createItem: async (item: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>): Promise<InventoryItem> => {
    const response = await api.post('/inventory', item);
    return response.data;
  },

  updateItem: async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await api.put(`/inventory/${id}`, item);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },

  // Categories
  getAllCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Suppliers
  getAllSuppliers: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  // Search and Filter
  searchItems: async (searchTerm: string): Promise<InventoryItem[]> => {
    const response = await api.get(`/inventory/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  filterItems: async (filters: any): Promise<InventoryItem[]> => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/inventory/filter?${queryParams}`);
    return response.data;
  },
};

export default inventoryService;
