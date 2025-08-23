import React, { useState } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  Box, 
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

// Import our modules
import OrderManagement from './pages/OrderManagement';
import Dashboard from './pages/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#10b981',
    },
    secondary: {
      main: '#059669',
    },
  },
});

const drawerWidth = 280;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModule, setSelectedModule] = useState('orders'); // Start with orders

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'inventory', label: 'Inventory Management', icon: <InventoryIcon /> },
    { id: 'students', label: 'Student Management', icon: <PeopleIcon /> },
    { id: 'orders', label: 'Order Management', icon: <ShoppingCartIcon /> },
    { id: 'invoicing', label: 'Invoicing & Billing', icon: <ReceiptIcon /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <AssessmentIcon /> },
    { id: 'tools', label: 'Tools & Utilities', icon: <BuildIcon /> },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon /> },
  ];

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderContent = () => {
    switch (selectedModule) {
      case 'orders':
        return <OrderManagement />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {menuItems.find(item => item.id === selectedModule)?.label || 'Module'}
            </Typography>
            <Typography variant="body1">
              This module is coming soon! Currently working on the Order Management system.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: '#10b981'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleToggleSidebar}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              College Incubation Inventory System
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={sidebarOpen}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    selected={selectedModule === item.id}
                    onClick={() => setSelectedModule(item.id)}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: '#f9fafb',
            marginLeft: sidebarOpen ? `${drawerWidth}px` : 0,
            width: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%',
            transition: (theme) =>
              theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            height: '100vh',
            overflow: 'auto',
            paddingTop: '64px',
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
