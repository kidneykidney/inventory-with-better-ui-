import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Inventory,
  TrendingUp,
  Warning,
  AttachMoney,
  People,
  Assignment,
  ShoppingCart,
  Category,
} from '@mui/icons-material';

function StatCard({ title, value, icon, color, subtitle, progress }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.contrastText`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1, borderRadius: 1, height: 6 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        total_products: 42,
        low_stock_count: 5,
        out_of_stock_count: 2,
        total_value: 15750.50,
        active_students: 128,
        pending_orders: 7,
        categories: 8,
        recent_orders: 12,
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📊 Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your College Incubation Inventory Management System
        </Typography>
      </Box>

      {/* Alerts */}
      <Box sx={{ mb: 3 }}>
        {stats.out_of_stock_count > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <strong>{stats.out_of_stock_count}</strong> items are out of stock!
          </Alert>
        )}
        {stats.low_stock_count > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <strong>{stats.low_stock_count}</strong> items are running low on stock.
          </Alert>
        )}
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.total_products}
            icon={<Inventory />}
            color="primary"
            subtitle="Electrical & Electronic Items"
            progress={85}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value"
            value={`$${stats.total_value?.toLocaleString()}`}
            icon={<AttachMoney />}
            color="success"
            subtitle="Inventory Worth"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Students"
            value={stats.active_students}
            icon={<People />}
            color="info"
            subtitle="Registered Users"
            progress={75}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Orders"
            value={stats.pending_orders}
            icon={<ShoppingCart />}
            color="warning"
            subtitle="Awaiting Approval"
          />
        </Grid>
      </Grid>

      {/* Secondary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={stats.categories}
            icon={<Category />}
            color="secondary"
            subtitle="Product Categories"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={stats.low_stock_count}
            icon={<Warning />}
            color="warning"
            subtitle="Need Restocking"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Orders"
            value={stats.recent_orders}
            icon={<TrendingUp />}
            color="info"
            subtitle="This Week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Out of Stock"
            value={stats.out_of_stock_count}
            icon={<Assignment />}
            color="error"
            subtitle="Urgent Restocking"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🚀 Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Add New Product" color="primary" clickable />
            <Chip label="Process Orders" color="secondary" clickable />
            <Chip label="Student Registration" color="info" clickable />
            <Chip label="Generate Reports" color="success" clickable />
            <Chip label="Low Stock Alert" color="warning" clickable />
            <Chip label="System Settings" variant="outlined" clickable />
          </Box>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📈 Recent Activity
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Arduino Uno R3 borrowed by John Doe</Typography>
              <Chip label="2 hours ago" size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">New student registration: Alice Smith</Typography>
              <Chip label="4 hours ago" size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Raspberry Pi 4 stock updated (+10 units)</Typography>
              <Chip label="1 day ago" size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">LED Strip inventory below threshold</Typography>
              <Chip label="2 days ago" size="small" color="warning" />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;
