import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Inventory2 as Inventory2Icon,
  MonetizationOn as MonetizationOnIcon,
  Group as GroupIcon,
  LocalShipping as LocalShippingIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Block as BlockIcon,
  Dashboard as DashboardIcon,
  Assessment,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../api/dashboard';

// Enhanced color scheme matching the app theme
const DASHBOARD_COLORS = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  accent: '#10B981',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  glow: 'rgba(59, 130, 246, 0.1)'
};

// Enhanced StatCard component with cleaner, more professional styling
const StatCard = ({ title, value, icon, color = 'primary', subtitle, loading = false }) => {
  const getCardColors = () => {
    switch (color) {
      case 'primary': return { main: DASHBOARD_COLORS.primary, bg: 'rgba(59, 130, 246, 0.1)' };
      case 'secondary': return { main: DASHBOARD_COLORS.secondary, bg: 'rgba(107, 114, 128, 0.1)' };
      case 'success': return { main: DASHBOARD_COLORS.success, bg: 'rgba(16, 185, 129, 0.1)' };
      case 'warning': return { main: DASHBOARD_COLORS.warning, bg: 'rgba(245, 158, 11, 0.1)' };
      case 'error': return { main: DASHBOARD_COLORS.error, bg: 'rgba(239, 68, 68, 0.1)' };
      case 'info': return { main: DASHBOARD_COLORS.info, bg: 'rgba(59, 130, 246, 0.1)' };
      default: return { main: DASHBOARD_COLORS.primary, bg: 'rgba(59, 130, 246, 0.1)' };
    }
  };

  const cardColors = getCardColors();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card sx={{ 
        height: '85px',
        background: '#FFFFFF',
        border: `1px solid ${DASHBOARD_COLORS.border}`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: '#CBD5E1',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        overflow: 'hidden',
        '&:hover': {
          borderColor: cardColors.main,
          boxShadow: `0 4px 15px ${cardColors.main}20`
        }
      }}>
        {/* Simple top accent line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: cardColors.main
          }}
        />
        
        <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5}}>
            <Typography variant="subtitle2" sx={{ 
              color: DASHBOARD_COLORS.textSecondary,
              fontWeight: 500,
              fontSize: '0.7rem'
            }}>
              {title}
            </Typography>
            <Box sx={{ 
              width: 125,
              height: 26,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pr: 1
            }}>
              {React.cloneElement(icon, { 
                sx: { fontSize: 32, color: cardColors.main } 
              })}
            </Box>
          </Box>
          
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              color: DASHBOARD_COLORS.text,
              fontSize: '1.3rem',
              mb: 0.2,
              lineHeight: 1
            }}>
              {loading ? (
                <CircularProgress size={20} sx={{ color: cardColors.main }} />
              ) : (
                typeof value === 'object' ? JSON.stringify(value) : (value || 0)
              )}
            </Typography>
            
            {subtitle && (
              <Typography variant="caption" sx={{ 
                color: DASHBOARD_COLORS.textSecondary,
                fontSize: '0.65rem'
              }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Clean and simple Recent Activities component
const RecentActivities = ({ activities, loading = false }) => (
  <Card sx={{ 
    height: '100%',
    width: '100%',
    background: DASHBOARD_COLORS.surface,
    border: `1px solid ${DASHBOARD_COLORS.border}`,
    borderRadius: 2,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ 
          color: DASHBOARD_COLORS.text,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '0.85rem'
        }}>
          <Assessment sx={{ color: DASHBOARD_COLORS.primary, fontSize: 16 }} />
          Recent Activities
        </Typography>
        <Chip 
          label={`${activities?.length || 0}`} 
          size="small" 
          sx={{
            backgroundColor: `${DASHBOARD_COLORS.primary}20`,
            color: DASHBOARD_COLORS.primary,
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 18,
            minWidth: 24
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <CircularProgress sx={{ color: DASHBOARD_COLORS.primary }} size={20} />
        </Box>
      ) : activities && activities.length > 0 ? (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {activities.slice(0, 4).map((activity, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 0.75,
                px: 0.5,
                borderRadius: 1,
                borderBottom: index < Math.min(activities.length, 4) - 1 ? `1px solid ${DASHBOARD_COLORS.border}` : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.04)'
                }
              }}
            >

              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ 
                  color: DASHBOARD_COLORS.text,
                  fontWeight: 500,
                  mb: 0.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem'
                }}>
                  {activity.description || activity.title || activity.action || 'Unknown activity'}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: DASHBOARD_COLORS.textSecondary,
                  fontSize: '0.65rem'
                }}>
                  {activity.date ? new Date(activity.date).toLocaleDateString() : 
                   activity.timestamp || 'Unknown time'}
                </Typography>
              </Box>
              
              <Chip
                label={activity.status || 'active'}
                size="small"
                sx={{
                  fontSize: '0.6rem',
                  height: 16,
                  minWidth: 45,
                  backgroundColor: activity.status === 'approved' || activity.status === 'completed' ? `${DASHBOARD_COLORS.success}15` :
                                  activity.status === 'pending' ? `${DASHBOARD_COLORS.warning}15` :
                                  activity.status === 'rejected' ? `${DASHBOARD_COLORS.error}15` : `${DASHBOARD_COLORS.primary}15`,
                  color: activity.status === 'approved' || activity.status === 'completed' ? DASHBOARD_COLORS.success :
                         activity.status === 'pending' ? DASHBOARD_COLORS.warning :
                         activity.status === 'rejected' ? DASHBOARD_COLORS.error : DASHBOARD_COLORS.primary
                }}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 2,
          color: DASHBOARD_COLORS.textSecondary 
        }}>
          <Assessment sx={{ fontSize: 24, mb: 0.5, opacity: 0.5 }} />
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            No recent activities
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

// Clean and simple Low Stock Alert component
const LowStockAlert = ({ lowStockItems, loading }) => {
  return (
    <Card sx={{
      height: '100%',
      width: '100%',
      background: DASHBOARD_COLORS.surface,
      border: `1px solid ${DASHBOARD_COLORS.warning}`,
      borderRadius: 2,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ 
            color: DASHBOARD_COLORS.text,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.85rem'
          }}>
            <WarningIcon sx={{ color: DASHBOARD_COLORS.warning, fontSize: 16 }} />
            Low Stock Items
          </Typography>
          <Chip 
            label={`${lowStockItems?.length || 0}`} 
            size="small" 
            sx={{
              backgroundColor: `${DASHBOARD_COLORS.warning}20`,
              color: DASHBOARD_COLORS.warning,
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 18,
              minWidth: 24
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress sx={{ color: DASHBOARD_COLORS.warning }} size={20} />
          </Box>
        ) : lowStockItems && lowStockItems.length > 0 ? (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {lowStockItems.slice(0, 6).map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.75,
                  px: 0.5,
                  borderRadius: 1,
                  borderBottom: index < Math.min(lowStockItems.length, 6) - 1 ? `1px solid ${DASHBOARD_COLORS.border}` : 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 158, 11, 0.05)'
                  }
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ 
                    color: DASHBOARD_COLORS.text,
                    fontWeight: 500,
                    mb: 0.2,
                    fontSize: '0.75rem'
                  }}>
                    {item.name || item.product_name || 'Unknown Product'}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: DASHBOARD_COLORS.textSecondary,
                    fontSize: '0.65rem'
                  }}>
                    Stock: {item.stock || item.quantity || 0} units
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 2,
            color: DASHBOARD_COLORS.textSecondary
          }}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>All items are well stocked</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Category Overview Component
const CategoryOverview = ({ loading }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch real category data from API
        const response = await fetch('http://localhost:8000/api/categories');
        if (response.ok) {
          const categoryData = await response.json();
          setCategories(categoryData);
        } else {
          console.error('Failed to fetch categories');
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  return (
    <Card sx={{
      height: '100%',
      width: '100%',
      background: DASHBOARD_COLORS.surface,
      border: `1px solid ${DASHBOARD_COLORS.border}`,
      borderRadius: 2,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ 
            color: DASHBOARD_COLORS.text,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.85rem'
          }}>
            <CategoryIcon sx={{ color: DASHBOARD_COLORS.primary, fontSize: 16 }} />
            Product Categories
          </Typography>
          <Chip 
            label={`${categories?.length || 0}`} 
            size="small" 
            sx={{
              backgroundColor: `${DASHBOARD_COLORS.primary}20`,
              color: DASHBOARD_COLORS.primary,
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 18,
              minWidth: 24
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress sx={{ color: DASHBOARD_COLORS.primary }} size={20} />
          </Box>
        ) : categories && categories.length > 0 ? (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {categories.map((category, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.75,
                  px: 0.5,
                  borderRadius: 1,
                  borderBottom: index < categories.length - 1 ? `1px solid ${DASHBOARD_COLORS.border}` : 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.05)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ 
                    color: DASHBOARD_COLORS.text,
                    fontWeight: 500,
                    fontSize: '0.75rem'
                  }}>
                    {category.name}
                  </Typography>
                </Box>
                <Chip
                  label={category.count}
                  size="small"
                  sx={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                    fontWeight: 600,
                    minWidth: 20,
                    height: 16,
                    fontSize: '0.65rem'
                  }}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 2,
            color: DASHBOARD_COLORS.textSecondary
          }}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>No categories found</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_value: 0,
    total_students: 0,
    active_students: 0,
    total_orders: 0,
    pending_orders: 0,
    approved_orders: 0,
    completed_orders: 0,
    recent_orders: 0,
    categories: 0
  });
  const [activities, setActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashStats, recentActivities, lowStock] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getLowStockItems()
      ]);

      setStats(dashStats || {});
      setActivities(recentActivities || []);
      setLowStockItems(lowStock || []);
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (error) {
    return (
      <Box sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          }
        >
          Error loading dashboard: {error}. Click refresh to try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100vh',
      background: DASHBOARD_COLORS.background,
      p: 3,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Container maxWidth="xl" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2,
            p: 1.5,
            background: DASHBOARD_COLORS.surface,
            borderRadius: 1.5,
            border: `1px solid ${DASHBOARD_COLORS.border}`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DashboardIcon sx={{ fontSize: 20, color: DASHBOARD_COLORS.primary }} />
              <Box>
                <Typography variant="h6" sx={{ 
                  color: DASHBOARD_COLORS.text,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  lineHeight: 1
                }}>
                  Dashboard
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: DASHBOARD_COLORS.textSecondary,
                  fontSize: '0.7rem'
                }}>
                  College Incubation Inventory System
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ 
                color: DASHBOARD_COLORS.textSecondary,
                fontSize: '0.65rem'
              }}>
                {new Date().toLocaleTimeString()}
              </Typography>
              <IconButton 
                onClick={handleRefresh}
                size="small"
                sx={{ 
                  color: DASHBOARD_COLORS.primary,
                  backgroundColor: `${DASHBOARD_COLORS.primary}10`,
                  '&:hover': { backgroundColor: `${DASHBOARD_COLORS.primary}20` },
                  width: 28,
                  height: 28
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Products"
                value={stats.total_products}
                icon={<Inventory2Icon />}
                color="primary"
                subtitle="Active items"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Inventory Value"
                value={stats.total_value ? `₹${stats.total_value.toFixed(2)}` : '₹0.00'}
                icon={<MonetizationOnIcon />}
                color="success"
                subtitle="Total asset value"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Students"
                value={stats.total_students}
                icon={<GroupIcon />}
                color="info"
                subtitle="Registered users"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Lending"
                value={stats.pending_orders}
                icon={<LocalShippingIcon />}
                color="warning"
                subtitle="Awaiting approval"
                loading={loading}
              />
            </Grid>
          </Grid>
        </motion.div>

        {/* Secondary Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Categories"
                value={stats.categories}
                icon={<CategoryIcon />}
                color="secondary"
                subtitle="Product categories"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Low Stock Items"
                value={stats.low_stock_count || 0}
                icon={<WarningIcon />}
                color="warning"
                subtitle="Need restocking"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Recent Lending"
                value={stats.recent_orders || 0}
                icon={<TimelineIcon />}
                color="info"
                subtitle="This week"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Out of Stock"
                value={stats.out_of_stock_count}
                icon={<BlockIcon />}
                color="error"
                subtitle="Urgent restocking"
                loading={loading}
              />
            </Grid>
          </Grid>
        </motion.div>

        {/* Dashboard Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* First Row of Cards */}
          <Grid container spacing={3} sx={{ flex: 1, mb: 3 }}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', height: '100%' }}>
              <RecentActivities activities={activities} loading={loading} />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', height: '100%' }}>
              <LowStockAlert lowStockItems={lowStockItems} loading={loading} />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', height: '100%' }}>
              <CategoryOverview loading={loading} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
