import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const inventoryService = {
  getAllItems: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  getItemById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  createItem: async (item) => {
    const response = await api.post('/inventory', item);
    return response.data;
  },
  updateItem: async (id, item) => {
    const response = await api.put(`/inventory/${id}`, item);
    return response.data;
  },
  deleteItem: async (id) => {
    await api.delete(`/inventory/${id}`);
  },
  getAllCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  getAllSuppliers: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },
  searchItems: async (searchTerm) => {
    const response = await api.get(`/inventory/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },
  filterItems: async (filters) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/inventory/filter?${queryParams}`);
    return response.data;
  },
};

export default inventoryService;
