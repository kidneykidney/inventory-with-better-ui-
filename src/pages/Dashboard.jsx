import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Inventory,
  School,
  ShoppingCart,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Info,
  AttachMoney,
  ExpandMore,
  ExpandLess,
  Refresh,
  Assignment,
  AssignmentTurnedIn,
  AssignmentReturn,
  Pending,
  People,
  Category
} from '@mui/icons-material';
import { dashboardAPI } from '../api/dashboard';

// StatCard component with enhanced styling
const StatCard = ({ title, value, icon, color = 'primary', subtitle, loading = false, trend }) => (
  <Card sx={{ 
    height: '100%', 
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 3
    }
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          backgroundColor: `${color}.light`,
          color: `${color}.contrastText`,
          mr: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
        {loading ? <CircularProgress size={24} /> : (typeof value === 'object' ? JSON.stringify(value) : (value || 0))}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <TrendingUp fontSize="small" color="success" />
          <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
            {trend}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

// Enhanced Recent Activities component
const RecentActivities = ({ activities, loading = false }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          📈 Recent Activities
        </Typography>
        <Chip label={`${activities.length} items`} size="small" variant="outlined" />
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      ) : activities.length > 0 ? (
        <List dense>
          {activities.map((activity, index) => (
            <ListItem key={index} disableGutters sx={{ py: 1 }}>
              <ListItemIcon>
                {activity.type === 'order' ? (
                  activity.status === 'pending' ? <Pending fontSize="small" color="warning" /> :
                  activity.status === 'approved' ? <AssignmentTurnedIn fontSize="small" color="primary" /> :
                  activity.status === 'completed' ? <CheckCircle fontSize="small" color="success" /> :
                  <Assignment fontSize="small" />
                ) : (
                  <Info fontSize="small" color="info" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={activity.description}
                secondary={`${new Date(activity.date).toLocaleDateString()} ${activity.value ? `• $${parseFloat(activity.value).toFixed(2)}` : ''}`}
                primaryTypographyProps={{ fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.8rem' }}
              />
              <Chip 
                label={activity.status} 
                size="small" 
                color={
                  activity.status === 'completed' ? 'success' :
                  activity.status === 'approved' ? 'primary' :
                  activity.status === 'pending' ? 'warning' : 'default'
                }
                variant="outlined"
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No recent activities
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Low Stock Alert component
const LowStockAlert = ({ lowStockItems, loading }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" color="warning.main">
            ⚠️ Low Stock Items
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              label={`${lowStockItems.length} items`} 
              size="small" 
              color="warning" 
              variant="outlined" 
            />
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              sx={{ ml: 1 }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        
        {lowStockItems.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {lowStockItems.length} items need restocking
          </Alert>
        )}
        
        <Collapse in={expanded}>
          {loading ? (
            <CircularProgress size={24} />
          ) : lowStockItems.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Minimum</TableCell>
                    <TableCell align="right">Needed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell align="right">{item.current_stock}</TableCell>
                      <TableCell align="right">{item.minimum_stock || 5}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {Math.max(0, (item.minimum_stock || 5) - item.current_stock)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              All items are sufficiently stocked ✅
            </Typography>
          )}
        </Collapse>
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
  const [overdueOrders, setOverdueOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashStats, recentActivities, lowStock, overdue] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getLowStockItems(),
        dashboardAPI.getOverdueOrders()
      ]);

      setStats(dashStats);
      setActivities(recentActivities);
      setLowStockItems(lowStock);
      setOverdueOrders(overdue);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
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
              <Refresh />
            </IconButton>
          }
        >
          Error loading dashboard: {error}. Click refresh to try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 Real-Time Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live College Incubation Inventory Management System
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <Tooltip title={loading ? "Loading..." : "Refresh dashboard"}>
            <span>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts Section */}
      <Box sx={{ mb: 3 }}>
        {stats.out_of_stock_count > 0 && (
          <Alert severity="error" icon={<Error />} sx={{ mb: 1 }}>
            <strong>{stats.out_of_stock_count}</strong> items are completely out of stock!
          </Alert>
        )}
        {stats.low_stock_count > 0 && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 1 }}>
            <strong>{stats.low_stock_count}</strong> items are running low on stock and need restocking.
          </Alert>
        )}
        {overdueOrders.length > 0 && (
          <Alert severity="info" icon={<Info />} sx={{ mb: 1 }}>
            <strong>{overdueOrders.length}</strong> orders are overdue for return.
          </Alert>
        )}
        {stats.pending_orders > 5 && (
          <Alert severity="info" icon={<Info />} sx={{ mb: 1 }}>
            You have <strong>{stats.pending_orders}</strong> pending orders waiting for approval.
          </Alert>
        )}
      </Box>
      
      {/* Main Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={typeof stats.total_products === 'number' ? stats.total_products : 0}
            icon={<Inventory />}
            color="primary"
            subtitle={`${typeof stats.active_products === 'number' ? stats.active_products : 0} active items`}
            loading={loading}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Inventory Value"
            value={`$${stats.total_value?.toLocaleString ? stats.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`}
            icon={<AttachMoney />}
            color="success"
            subtitle="Total asset value"
            loading={loading}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Active Students"
            value={typeof stats.active_students === 'number' ? stats.active_students : 0}
            icon={<People />}
            color="info"
            subtitle={`of ${typeof stats.total_students === 'number' ? stats.total_students : 0} registered`}
            loading={loading}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Orders"
            value={typeof stats.pending_orders === 'number' ? stats.pending_orders : 0}
            icon={<ShoppingCart />}
            color="warning"
            subtitle="Awaiting approval"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Secondary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={typeof stats.categories === 'number' ? stats.categories : 0}
            icon={<Category />}
            color="secondary"
            subtitle="Product categories"
            loading={loading}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={typeof stats.low_stock_count === 'number' ? stats.low_stock_count : 0}
            icon={<Warning />}
            color="warning"
            subtitle="Need restocking"
            loading={loading}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Orders"
            value={typeof stats.recent_orders === 'number' ? stats.recent_orders : 0}
            icon={<TrendingUp />}
            color="info"
            subtitle="This week"
            loading={loading}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Out of Stock"
            value={typeof stats.out_of_stock_count === 'number' ? stats.out_of_stock_count : 0}
            icon={<Assignment />}
            color="error"
            subtitle="Urgent restocking"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* System Overview and Activities */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              📋 System Overview
            </Typography>
            {loading ? (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
              </Box>
            ) : (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid xs={6} md={3}>
                  <Box textAlign="center" sx={{ p: 2, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                      {typeof stats.total_orders === 'number' ? stats.total_orders : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={6} md={3}>
                  <Box textAlign="center" sx={{ p: 2, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                    <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {typeof stats.completed_orders === 'number' ? stats.completed_orders : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={6} md={3}>
                  <Box textAlign="center" sx={{ p: 2, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                    <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {typeof stats.approved_orders === 'number' ? stats.approved_orders : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                </Grid>
                <Grid xs={6} md={3}>
                  <Box textAlign="center" sx={{ p: 2, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                    <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
                      {overdueOrders.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
        <Grid xs={12} md={4}>
          <RecentActivities activities={activities} loading={loading} />
        </Grid>
      </Grid>

      {/* Low Stock Items */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12}>
          <LowStockAlert lowStockItems={lowStockItems} loading={loading} />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🚀 Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Add New Product" color="primary" clickable />
            <Chip label="Process Orders" color="secondary" clickable />
            <Chip label="Student Registration" color="info" clickable />
            <Chip label="Generate Reports" color="success" clickable />
            <Chip label="Restock Items" color="warning" clickable />
            <Chip label="System Settings" variant="outlined" clickable />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
