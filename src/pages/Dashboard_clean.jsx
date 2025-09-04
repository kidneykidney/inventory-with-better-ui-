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
  Alert
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../api/dashboard';

// Enhanced color scheme matching the login page
const DASHBOARD_COLORS = {
  primary: '#00D4AA',
  secondary: '#00B894',
  accent: '#00F5FF',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF6B6B',
  info: '#2196F3',
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceElevated: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  glow: 'rgba(0, 212, 170, 0.3)'
};

// Enhanced StatCard component with cleaner, more professional styling
const StatCard = ({ title, value, icon, color = 'primary', subtitle, loading = false }) => {
  const getCardColors = () => {
    switch (color) {
      case 'primary': return { main: DASHBOARD_COLORS.primary, bg: 'rgba(0, 212, 170, 0.1)' };
      case 'secondary': return { main: DASHBOARD_COLORS.secondary, bg: 'rgba(0, 184, 148, 0.1)' };
      case 'success': return { main: DASHBOARD_COLORS.success, bg: 'rgba(76, 175, 80, 0.1)' };
      case 'warning': return { main: DASHBOARD_COLORS.warning, bg: 'rgba(255, 152, 0, 0.1)' };
      case 'error': return { main: DASHBOARD_COLORS.error, bg: 'rgba(255, 107, 107, 0.1)' };
      case 'info': return { main: DASHBOARD_COLORS.info, bg: 'rgba(33, 150, 243, 0.1)' };
      default: return { main: DASHBOARD_COLORS.primary, bg: 'rgba(0, 212, 170, 0.1)' };
    }
  };

  const cardColors = getCardColors();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card sx={{ 
        height: '160px',
        background: 'rgba(26, 26, 26, 0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          border: `1px solid ${cardColors.main}`,
          boxShadow: `0 8px 25px ${cardColors.main}20`
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
        
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ 
              color: DASHBOARD_COLORS.textSecondary,
              fontWeight: 500,
              fontSize: '0.9rem'
            }}>
              {title}
            </Typography>
            <Box sx={{ 
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: cardColors.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.cloneElement(icon, { 
                sx: { fontSize: 20, color: cardColors.main } 
              })}
            </Box>
          </Box>
          
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700,
              color: DASHBOARD_COLORS.text,
              fontSize: '2rem',
              mb: 0.5
            }}>
              {loading ? (
                <CircularProgress size={28} sx={{ color: cardColors.main }} />
              ) : (
                typeof value === 'object' ? JSON.stringify(value) : (value || 0)
              )}
            </Typography>
            
            {subtitle && (
              <Typography variant="caption" sx={{ 
                color: DASHBOARD_COLORS.textSecondary,
                fontSize: '0.8rem'
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
    background: 'rgba(26, 26, 26, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid rgba(255, 255, 255, 0.1)`,
    borderRadius: 2
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ 
          color: DASHBOARD_COLORS.text,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Assessment sx={{ color: DASHBOARD_COLORS.primary, fontSize: 20 }} />
          Recent Activities
        </Typography>
        <Chip 
          label={`${activities?.length || 0} items`} 
          size="small" 
          sx={{
            backgroundColor: `${DASHBOARD_COLORS.primary}20`,
            color: DASHBOARD_COLORS.primary,
            fontWeight: 600,
            fontSize: '0.75rem'
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: DASHBOARD_COLORS.primary }} />
        </Box>
      ) : activities && activities.length > 0 ? (
        <Box sx={{ maxHeight: '280px', overflowY: 'auto' }}>
          {activities.map((activity, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: 2,
                px: 1,
                borderRadius: 1,
                borderBottom: index < activities.length - 1 ? `1px solid rgba(255, 255, 255, 0.05)` : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }
              }}
            >
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: activity.status === 'approved' ? DASHBOARD_COLORS.success : 
                                activity.status === 'pending' ? DASHBOARD_COLORS.warning :
                                activity.status === 'rejected' ? DASHBOARD_COLORS.error : DASHBOARD_COLORS.primary,
                mr: 2,
                flexShrink: 0
              }} />
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ 
                  color: DASHBOARD_COLORS.text,
                  fontWeight: 500,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.description || activity.title || activity.action || 'Unknown activity'}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: DASHBOARD_COLORS.textSecondary,
                  fontSize: '0.75rem'
                }}>
                  {activity.date ? new Date(activity.date).toLocaleDateString() : 
                   activity.timestamp || 'Unknown time'}
                </Typography>
              </Box>
              
              <Chip
                label={activity.status || 'active'}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  minWidth: 60,
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
          py: 4,
          color: DASHBOARD_COLORS.textSecondary 
        }}>
          <Assessment sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
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
      background: 'rgba(26, 26, 26, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid rgba(255, 152, 0, 0.3)`,
      borderRadius: 2
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ 
            color: DASHBOARD_COLORS.text,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <WarningIcon sx={{ color: DASHBOARD_COLORS.warning, fontSize: 20 }} />
            Low Stock Items
          </Typography>
          <Chip 
            label={`${lowStockItems?.length || 0} items`} 
            size="small" 
            sx={{
              backgroundColor: `${DASHBOARD_COLORS.warning}20`,
              color: DASHBOARD_COLORS.warning,
              fontWeight: 600
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: DASHBOARD_COLORS.warning }} />
          </Box>
        ) : lowStockItems && lowStockItems.length > 0 ? (
          <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
            {lowStockItems.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 2,
                  px: 1,
                  borderRadius: 1,
                  borderBottom: index < lowStockItems.length - 1 ? `1px solid rgba(255, 255, 255, 0.05)` : 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.05)'
                  }
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ 
                    color: DASHBOARD_COLORS.text,
                    fontWeight: 500,
                    mb: 0.5
                  }}>
                    {item.name || item.product_name || 'Unknown Product'}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: DASHBOARD_COLORS.textSecondary,
                    fontSize: '0.75rem'
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
            py: 4,
            color: DASHBOARD_COLORS.textSecondary
          }}>
            <Typography variant="body2">All items are well stocked</Typography>
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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      p: 3
    }}>
      <Container maxWidth="xl">
        {/* Clean Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            p: 3,
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: `1px solid rgba(0, 212, 170, 0.2)`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DashboardIcon sx={{ fontSize: 32, color: DASHBOARD_COLORS.primary }} />
              <Box>
                <Typography variant="h4" sx={{ 
                  color: DASHBOARD_COLORS.text,
                  fontWeight: 700,
                  mb: 0.5
                }}>
                  Dashboard
                </Typography>
                <Typography variant="subtitle1" sx={{ 
                  color: DASHBOARD_COLORS.textSecondary
                }}>
                  Live College Incubation Inventory Management System
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ 
                color: DASHBOARD_COLORS.textSecondary 
              }}>
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
              <IconButton 
                onClick={handleRefresh}
                sx={{ 
                  color: DASHBOARD_COLORS.primary,
                  backgroundColor: `${DASHBOARD_COLORS.primary}10`,
                  '&:hover': { backgroundColor: `${DASHBOARD_COLORS.primary}20` }
                }}
              >
                <RefreshIcon />
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
          <Grid container spacing={3} sx={{ mb: 4 }}>
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
                value={stats.total_value ? `$${stats.total_value.toFixed(2)}` : '$0.00'}
                icon={<MonetizationOnIcon />}
                color="success"
                subtitle="Total asset value"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Students"
                value={`${stats.active_students} of ${stats.total_students}`}
                icon={<GroupIcon />}
                color="info"
                subtitle="Registered users"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Orders"
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
          <Grid container spacing={3} sx={{ mb: 4 }}>
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
                title="Recent Orders"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <RecentActivities activities={activities} loading={loading} />
            </Grid>
            <Grid item xs={12} md={4}>
              <LowStockAlert lowStockItems={lowStockItems} loading={loading} />
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Dashboard;
