import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, CircularProgress } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import inventoryService from '../services/inventoryService';

function StatCard({ title, value, icon, color }) {
  return (
    <Paper sx={{ p: 3, textAlign: 'center', flex: 1, minWidth: 200 }}>
      <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
        <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
      </Box>
      <Typography variant="h4" component="div" color={color}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Paper>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_products: 0,
    total_students: 0,
    pending_orders: 0,
    issued_orders: 0,
    low_stock_alerts: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await inventoryService.getDashboardStats();
        setStats(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Make sure the backend server is running on http://localhost:8001
          </Typography>
        </Paper>
      </Container>
    );
  }

  const recentActivity = [
    'Database initialized with sample data',
    `${stats.total_products} products loaded`,
    `${stats.total_students} students registered`,
    `${stats.pending_orders} orders pending approval`,
    stats.low_stock_alerts > 0 ? `${stats.low_stock_alerts} items need restocking` : 'All items adequately stocked'
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Incubation Inventory Dashboard
      </Typography>
      
      <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
        <StatCard
          title="Total Products"
          value={stats.total_products}
          icon={<InventoryIcon />}
          color="#1976d2"
        />
        <StatCard
          title="Total Students"
          value={stats.total_students}
          icon={<PeopleIcon />}
          color="#2e7d32"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pending_orders}
          icon={<AssignmentIcon />}
          color="#ed6c02"
        />
        <StatCard
          title="Issued Orders"
          value={stats.issued_orders}
          icon={<TrendingUpIcon />}
          color="#9c27b0"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.low_stock_alerts}
          icon={<WarningIcon />}
          color={stats.low_stock_alerts > 0 ? "#d32f2f" : "#2e7d32"}
        />
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Box>
          {recentActivity.map((activity, index) => (
            <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • {activity}
            </Typography>
          ))}
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • View all products in the Inventory section
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Add new students and manage their information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Create new orders with drag-and-drop functionality
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Generate invoices and track order status
        </Typography>
      </Paper>
    </Container>
  );
}

export default Dashboard;
