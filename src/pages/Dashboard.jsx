import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { sampleInventoryItems } from '../data/sampleData';

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
  // Calculate statistics from sample data
  const totalItems = sampleInventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = sampleInventoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = sampleInventoryItems.filter(item => 
    item.quantity > 0 && item.quantity <= item.minStockLevel
  ).length;
  const outOfStockItems = sampleInventoryItems.filter(item => item.quantity === 0).length;

  const stats = {
    totalItems,
    totalValue,
    lowStockItems,
    outOfStockItems,
  };

  const recentActivity = [
    'Added 5 Laptop Computers to inventory',
    'Updated price for Wireless Mouse',
    'Office Chair stock is running low',
    'Wireless Mouse is out of stock'
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={<InventoryIcon />}
          color="#1976d2"
        />
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          icon={<AttachMoneyIcon />}
          color="#2e7d32"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockItems}
          icon={<WarningIcon />}
          color="#ed6c02"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockItems}
          icon={<TrendingUpIcon />}
          color="#d32f2f"
        />
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        {recentActivity.length > 0 ? (
          <Box>
            {recentActivity.map((activity, index) => (
              <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • {activity}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No recent activity. Start by adding some inventory items!
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default Dashboard;
