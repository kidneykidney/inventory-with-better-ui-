import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Paper
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  People as StudentsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as RevenueIcon,
  Assessment as AnalyticsIcon
} from '@mui/icons-material';
import { 
  SimpleContainer, 
  SimpleSection, 
  SimpleStatsCard, 
  SimpleCard,
  SimpleLoading 
} from './SimpleComponents';

const API_BASE_URL = 'http://localhost:8000';

const MinimalDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalStudents: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load basic stats
      const [productsRes, ordersRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products`).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/api/orders`).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/api/students`).catch(() => ({ ok: false }))
      ]);

      const products = productsRes.ok ? await productsRes.json() : { data: [] };
      const orders = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const students = studentsRes.ok ? await studentsRes.json() : { data: [] };

      // Calculate stats
      const productsData = products.data || products || [];
      const ordersData = orders.data || orders || [];
      const studentsData = students.data || students || [];

      const lowStockCount = productsData.filter(p => 
        (p.quantity || 0) < 10 || p.status === 'low_stock'
      ).length;

      const pendingOrdersCount = ordersData.filter(o => 
        o.status === 'pending' || o.status === 'processing'
      ).length;

      const totalRevenue = ordersData
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

      setStats({
        totalProducts: productsData.length,
        totalOrders: ordersData.length,
        totalStudents: studentsData.length,
        totalRevenue,
        lowStockProducts: lowStockCount,
        pendingOrders: pendingOrdersCount,
        recentActivity: ordersData.slice(0, 5) // Last 5 orders
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = () => [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: <InventoryIcon />,
      color: '#3B82F6',
      subtitle: `${stats.lowStockProducts} low stock`,
      trend: stats.lowStockProducts > 0 ? 'down' : 'stable'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <OrdersIcon />,
      color: '#10B981',
      subtitle: `${stats.pendingOrders} pending`,
      trend: stats.pendingOrders > 0 ? 'up' : 'stable'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <StudentsIcon />,
      color: '#8B5CF6',
      subtitle: 'Active users',
      trend: 'stable'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <RevenueIcon />,
      color: '#F59E0B',
      subtitle: 'This period',
      trend: 'up'
    }
  ];

  const getQuickActions = () => [
    { title: 'Add Product', description: 'Add new inventory item', path: '/products' },
    { title: 'New Lending', description: 'Create new lending', path: '/orders' },
    { title: 'Add Student', description: 'Register new student', path: '/students' },
    { title: 'View Analytics', description: 'Check reports', path: '/analytics' }
  ];

  if (loading) {
    return (
      <SimpleContainer>
        <SimpleLoading message="Loading dashboard..." size={50} sx={{ py: 8 }} />
      </SimpleContainer>
    );
  }

  return (
    <SimpleContainer>
      <SimpleSection
        title="Dashboard"
        description="Overview of your inventory management system"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getStatCards().map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <SimpleStatsCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
            />
          </Grid>
        ))}
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <SimpleCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {getQuickActions().map((action, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid #E5E7EB',
                      '&:hover': {
                        borderColor: '#3B82F6',
                        backgroundColor: '#F8FAFC'
                      }
                    }}
                    onClick={() => {
                      // Navigation will be implemented
                      console.log('Navigate to:', action.path);
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {action.description}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          </SimpleCard>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <SimpleCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Activity
              </Typography>
              {stats.recentActivity.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No recent activity
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {stats.recentActivity.map((activity, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        backgroundColor: '#F8FAFC',
                        borderRadius: 1,
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Lending #{activity.order_id || activity.id}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {activity.student_name || 'Unknown Student'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'Date unknown'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            ₹{(activity.total_amount || 0).toLocaleString()}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: activity.status === 'completed' ? 'success.main' : 
                                     activity.status === 'pending' ? 'warning.main' : 'text.secondary'
                            }}
                          >
                            {activity.status || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </SimpleCard>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <SimpleCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                System Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: '#10B981',
                      margin: '0 auto 8px'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Database
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Connected
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: '#10B981',
                      margin: '0 auto 8px'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      API Server
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Online
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: stats.lowStockProducts > 0 ? '#F59E0B' : '#10B981',
                      margin: '0 auto 8px'
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Inventory
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {stats.lowStockProducts > 0 ? `${stats.lowStockProducts} Low Stock` : 'All Good'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </SimpleCard>
        </Grid>
      </Grid>
    </SimpleContainer>
  );
};

export default MinimalDashboard;
