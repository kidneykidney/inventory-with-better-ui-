const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const dashboardAPI = {
  // Get dashboard statistics from backend endpoint
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const stats = await response.json();
      
      // Map the backend response to frontend expected format
      return {
        total_products: stats.totalProducts || 0,
        active_products: stats.totalProducts || 0, // Backend doesn't distinguish, assume all are active
        low_stock_count: stats.lowStockItems || 0,
        out_of_stock_count: 0, // Will be calculated by low stock endpoint if needed
        total_value: stats.totalInventoryValue || 0,
        total_students: stats.totalStudents || 0,
        active_students: stats.totalStudents || 0, // Backend doesn't distinguish, assume all are active
        total_orders: stats.totalOrders || 0,
        pending_orders: stats.pendingOrders || 0,
        approved_orders: 0, // Calculate if needed
        completed_orders: 0, // Calculate if needed
        returned_orders: 0, // Calculate if needed
        recent_orders: 0, // Will be from recent activities
        categories: 0 // Will fetch separately if needed
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get low stock items from backend endpoint
  async getLowStockItems() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/low-stock`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const lowStockItems = await response.json();
      
      if (!Array.isArray(lowStockItems)) {
        return [];
      }
      
      return lowStockItems.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku || 'N/A',
        current_stock: item.quantity_available,
        minimum_stock: item.minimum_stock_level,
        shortage: Math.max(0, (item.minimum_stock_level || 5) - item.quantity_available)
      }));
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  },

  // Get recent activities from backend endpoint
  async getRecentActivities() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-activities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const activities = await response.json();
      
      if (!Array.isArray(activities)) {
        return [];
      }
      
      return activities.map(activity => ({
        id: activity.id || Math.random().toString(36),
        type: activity.type || 'order',
        description: activity.description || activity.title,
        status: activity.status,
        date: activity.timestamp,
        value: null // Backend doesn't provide value in activities
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  // Get overdue orders - fallback to orders endpoint since no specific backend endpoint yet
  async getOverdueOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const orders = await response.json();
      
      if (!Array.isArray(orders)) {
        return [];
      }
      
      const now = new Date();
      return orders.filter(order => {
        if (order.status !== 'approved') return false;
        if (!order.expected_return_date) return false;
        
        const returnDate = new Date(order.expected_return_date);
        return returnDate < now;
      }).map(order => ({
        id: order.id,
        order_number: order.order_number,
        student_name: order.student_name,
        expected_return_date: order.expected_return_date,
        days_overdue: Math.floor((now - new Date(order.expected_return_date)) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      console.error('Error fetching overdue orders:', error);
      return [];
    }
  },

  // Get monthly statistics - fallback to orders endpoint
  async getMonthlyStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const orders = await response.json();
      
      if (!Array.isArray(orders)) {
        return [];
      }
      
      const monthlyData = {};
      const now = new Date();
      
      // Get last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        monthlyData[monthKey] = {
          month: monthKey,
          orders: 0,
          value: 0
        };
      }
      
      // Process orders
      orders.forEach(order => {
        const orderDate = new Date(order.requested_date);
        const monthKey = orderDate.toISOString().slice(0, 7);
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].orders++;
          monthlyData[monthKey].value += parseFloat(order.total_value || 0);
        }
      });
      
      return Object.values(monthlyData).reverse();
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      throw error;
    }
  }
};
