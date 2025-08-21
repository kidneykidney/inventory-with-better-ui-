import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import {
  Inventory,
  TrendingUp,
  Warning,
  AttachMoney,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  // Mock data - replace with real data from your service
  const stats = {
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={<Inventory />}
          color="#1976d2"
        />
        
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          icon={<AttachMoney />}
          color="#2e7d32"
        />
        
        <StatCard
          title="Low Stock"
          value={stats.lowStockItems}
          icon={<Warning />}
          color="#ed6c02"
        />
        
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockItems}
          icon={<TrendingUp />}
          color="#d32f2f"
        />
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No recent activity. Start by adding some inventory items!
        </Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard;
