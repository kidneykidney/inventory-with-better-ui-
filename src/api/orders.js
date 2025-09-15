import { get, post, put, del } from './client';

// Orders API endpoints
export const ordersApi = {
  // Get all orders
  getAll: () => get('/api/orders'),
  
  // Get order by ID
  getById: (id) => get(`/api/orders/${id}`),
  
  // Create new order
  create: (orderData) => post('/api/orders', orderData),
  
  // Update order
  update: (id, orderData) => put(`/api/orders/${id}`, orderData),
  
  // Delete order
  delete: (id) => del(`/api/orders/${id}`),
  
  // Update order status
  updateStatus: (id, status) => put(`/api/orders/${id}/status`, { status }),
  
  // Get orders by student
  getByStudent: (studentId) => get(`/api/orders/student/${studentId}`),
  
  // Get order statistics
  getStats: () => get('/api/orders/stats'),
};

export default ordersApi;