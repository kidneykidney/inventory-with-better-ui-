import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  IconButton
} from '@mui/material';
import {
  Inventory2 as Inventory2Icon,
  MonetizationOn as MonetizationOnIcon,
  Group as GroupIcon,
  LocalShipping as LocalShippingIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { dashboardAPI } from '../api/dashboard';
import { 
  SimpleContainer, 
  SimpleSection, 
  SimpleGrid, 
  SimpleStatsCard, 
  SimpleLoading,
  SimpleCard 
} from '../components/SimpleComponents';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProducts: 0,
      totalStudents: 0,
      totalOrders: 0,
      totalRevenue: 0
    },
    recentActivities: [],
    lowStockProducts: []
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
      
      const [statsResponse, activitiesResponse, lowStockResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getLowStockItems()
      ]);
      
      setDashboardData({
        stats: statsResponse.data,
        recentActivities: activitiesResponse.data,
        lowStockProducts: lowStockResponse.data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SimpleContainer>
        <SimpleLoading message="Loading dashboard..." size={50} sx={{ py: 8 }} />
      </SimpleContainer>
    );
  }

  if (error) {
    return (
      <SimpleContainer>
        <Box sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            action={
              <IconButton
                aria-label="refresh"
                color="inherit"
                size="small"
                onClick={loadDashboardData}
              >
                <RefreshIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Box>
      </SimpleContainer>
    );
  }

  const statsCards = [
    {
      title: 'Total Products',
      value: dashboardData.stats.totalProducts?.toLocaleString() || '0',
      icon: <Inventory2Icon />,
      change: '+12% from last month',
      changeType: 'positive'
    },
    {
      title: 'Total Students',
      value: dashboardData.stats.totalStudents?.toLocaleString() || '0',
      icon: <GroupIcon />,
      change: '+8% from last month',
      changeType: 'positive'
    },
    {
      title: 'Total Orders',
      value: dashboardData.stats.totalOrders?.toLocaleString() || '0',
      icon: <LocalShippingIcon />,
      change: '+15% from last month',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: `₹${(dashboardData.stats.totalRevenue || 0).toLocaleString()}`,
      icon: <MonetizationOnIcon />,
      change: '+22% from last month',
      changeType: 'positive'
    }
  ];

  return (
    <SimpleContainer>
      {/* Header */}
      <SimpleSection
        title="Dashboard"
        description="Overview of your inventory management system"
        headerAction={
          <IconButton
            onClick={loadDashboardData}
            disabled={loading}
            sx={{ color: 'text.secondary' }}
          >
            <RefreshIcon />
          </IconButton>
        }
      />

      {/* Stats Grid */}
      <SimpleGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <SimpleStatsCard
            key={index}
            title={card.title}
            value={card.value}
            change={card.change}
            changeType={card.changeType}
            icon={card.icon}
          />
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ xs: 1, lg: 2 }} gap={4}>
        {/* Recent Activities */}
        <SimpleCard sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recent Activities
          </Typography>
          
          {dashboardData.recentActivities.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No recent activities
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dashboardData.recentActivities.slice(0, 5).map((activity, index) => (
                <Box key={index} sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:last-child': { mb: 0 }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {activity.type}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: activity.type === 'success' ? '#10B981' : 
                                     activity.type === 'warning' ? '#F59E0B' : 
                                     activity.type === 'error' ? '#EF4444' : '#3B82F6',
                      flexShrink: 0,
                      mt: 0.5
                    }} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </SimpleCard>

        {/* Low Stock Alerts */}
        <SimpleCard sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ color: '#F59E0B' }} />
            Low Stock Alerts
          </Typography>
          
          {dashboardData.lowStockProducts.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                All products are well stocked
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dashboardData.lowStockProducts.slice(0, 5).map((product, index) => (
                <Box key={index} sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'warning.main',
                  borderRadius: 1,
                  backgroundColor: 'rgba(245, 158, 11, 0.04)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Category: {product.category}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                        {product.quantity} left
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Min: {product.minimum_quantity}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </SimpleCard>
      </SimpleGrid>

      {/* Quick Actions */}
      <SimpleSection
        title="Quick Actions"
        description="Common tasks and shortcuts"
        sx={{ mt: 4 }}
      />
      
      <SimpleGrid cols={{ xs: 1, sm: 2, md: 4 }} gap={3}>
        {[
          { title: 'Add Product', description: 'Add new inventory item', color: 'primary' },
          { title: 'Register Student', description: 'Add new student profile', color: 'secondary' },
          { title: 'Create Order', description: 'Process new order', color: 'success' },
          { title: 'Generate Report', description: 'Export data reports', color: 'info' }
        ].map((action, index) => (
          <SimpleCard key={index} sx={{ 
            p: 3, 
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: 2
            },
            transition: 'all 0.2s ease-in-out'
          }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              {action.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {action.description}
            </Typography>
          </SimpleCard>
        ))}
      </SimpleGrid>
    </SimpleContainer>
  );
};

export default Dashboard;
