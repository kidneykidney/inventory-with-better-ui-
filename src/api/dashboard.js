const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const dashboardAPI = {
  // Get dashboard statistics
  async getStats() {
    try {
      const [products, students, orders, categories] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/students`),
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/categories`)
      ]);

      const [productsData, studentsData, ordersData, categoriesData] = await Promise.all([
        products.ok ? products.json() : [],
        students.ok ? students.json() : [],
        orders.ok ? orders.json() : [],
        categories.ok ? categories.json() : []
      ]);

      // Calculate statistics
      const stats = {
        // Product statistics
        total_products: Array.isArray(productsData) ? productsData.length : 0,
        active_products: Array.isArray(productsData) ? productsData.filter(p => p.status === 'active').length : 0,
        low_stock_count: Array.isArray(productsData) ? productsData.filter(p => 
          p.status === 'active' && 
          p.quantity_available <= (p.minimum_stock_level || 5)
        ).length : 0,
        out_of_stock_count: Array.isArray(productsData) ? productsData.filter(p => 
          p.status === 'active' && p.quantity_available === 0
        ).length : 0,
        
        // Calculate total inventory value
        total_value: Array.isArray(productsData) ? productsData
          .filter(p => p.status === 'active')
          .reduce((sum, p) => sum + (p.quantity_available * p.unit_price), 0) : 0,
        
        // Student statistics
        total_students: Array.isArray(studentsData) ? studentsData.length : 0,
        active_students: Array.isArray(studentsData) ? studentsData.filter(s => s.is_active).length : 0,
        
        // Order statistics
        total_orders: Array.isArray(ordersData) ? ordersData.length : 0,
        pending_orders: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'pending').length : 0,
        approved_orders: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'approved').length : 0,
        completed_orders: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'completed').length : 0,
        returned_orders: Array.isArray(ordersData) ? ordersData.filter(o => o.status === 'returned').length : 0,
        
        // Recent orders (last 7 days)
        recent_orders: Array.isArray(ordersData) ? ordersData.filter(o => {
          const orderDate = new Date(o.requested_date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        }).length : 0,
        
        // Category count
        categories: Array.isArray(categoriesData) ? categoriesData.length : 0,
        
        // Raw data for detailed analysis
        products: productsData,
        students: studentsData,
        orders: ordersData,
        categories: categoriesData
      };

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get low stock items
  async getLowStockItems() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();
      
      if (!Array.isArray(products)) {
        return [];
      }
      
      return products.filter(p => 
        p.status === 'active' && 
        p.quantity_available <= (p.minimum_stock_level || 5)
      ).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        current_stock: p.quantity_available,
        minimum_stock: p.minimum_stock_level,
        shortage: (p.minimum_stock_level || 5) - p.quantity_available
      }));
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  },

  // Get recent activities
  async getRecentActivities() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const orders = await response.json();
      
      if (!Array.isArray(orders)) {
        return [];
      }
      
      // Sort by most recent and take last 10
      const recentOrders = orders
        .sort((a, b) => new Date(b.requested_date) - new Date(a.requested_date))
        .slice(0, 10);
      
      return recentOrders.map(order => ({
        id: order.id,
        type: 'order',
        description: `Order ${order.order_number} by ${order.student_name || 'Unknown Student'}`,
        status: order.status,
        date: order.requested_date,
        value: order.total_value
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  // Get overdue orders
  async getOverdueOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
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

  // Get monthly statistics
  async getMonthlyStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      const orders = await response.json();
      
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
