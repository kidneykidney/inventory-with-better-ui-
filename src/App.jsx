import React, { useState, useEffect } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
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
  Typography,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
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
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';

// Import our modules
import OrderManagement from './pages/OrderManagement';
import Dashboard from './pages/Dashboard';
import ListView from './components/ListView';
import Students from './components/Students';
import Orders from './components/Orders';
import InvoiceManagement from './components/InvoiceManagement';
import InvoiceDashboard from './components/InvoiceDashboard';

// Import theme and components
import { darkMatteTheme, animationVariants } from './theme/darkTheme';
import LoadingAnimation from './components/LoadingAnimation';
import { AnimatedBadge, GlowEffect } from './components/AnimatedComponents';

const drawerWidth = 280;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModule, setSelectedModule] = useState('products'); // Start with products
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [notificationCount, setNotificationCount] = useState(5);

  // Simulate loading sequence
  useEffect(() => {
    const loadingSequence = async () => {
      const steps = [
        { message: 'Initializing system...', progress: 20 },
        { message: 'Loading modules...', progress: 40 },
        { message: 'Connecting to database...', progress: 60 },
        { message: 'Setting up interface...', progress: 80 },
        { message: 'Ready to go!', progress: 100 },
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoadingProgress(step.progress);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    };

    loadingSequence();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, badge: 0 },
    { id: 'products', label: 'Products Management', icon: <InventoryIcon />, badge: 2 },
    { id: 'students', label: 'Student Management', icon: <PeopleIcon />, badge: 1 },
    { id: 'orders', label: 'Order Management', icon: <ShoppingCartIcon />, badge: 3 },
    { id: 'invoicing', label: 'Invoicing & Billing', icon: <ReceiptIcon />, badge: 0 },
    { id: 'reports', label: 'Reports & Analytics', icon: <AssessmentIcon />, badge: 0 },
    { id: 'tools', label: 'Tools & Utilities', icon: <BuildIcon />, badge: 0 },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon />, badge: 1 },
  ];

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleModuleChange = (moduleId) => {
    setSelectedModule(moduleId);
  };

  const renderContent = () => {
    const contentVariants = {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    };

    const getContent = () => {
      switch (selectedModule) {
        case 'orders':
          return <ListView type="orders" />;
        case 'dashboard':
          return <Dashboard />;
        case 'products':
          return <ListView type="products" />;
        case 'students':
          return <ListView type="students" />;
        case 'invoicing':
          return <InvoiceManagement />;
        case 'invoice-dashboard':
          return <InvoiceDashboard />;
        default:
          return (
            <Box sx={{ p: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h4" gutterBottom>
                  {menuItems.find(item => item.id === selectedModule)?.label || 'Module'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  This module is coming soon! Currently working on the Product Management and Order Management system.
                </Typography>
              </motion.div>
            </Box>
          );
      }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedModule}
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ height: '100%' }}
        >
          {getContent()}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={darkMatteTheme}>
        <CssBaseline />
        <LoadingAnimation 
          isLoading={isLoading} 
          progress={loadingProgress}
          message="Loading Inventory System..."
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkMatteTheme}>
      <CssBaseline />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {/* Header */}
          <AppBar 
            position="fixed" 
            sx={{ 
              zIndex: (theme) => theme.zIndex.drawer + 1,
              width: '100%',
              left: 0,
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleToggleSidebar}
                    edge="start"
                    sx={{ mr: 2 }}
                  >
                    <motion.div
                      animate={{ rotate: sidebarOpen ? 0 : 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
                    </motion.div>
                  </IconButton>
                </motion.div>
                
                <GlowEffect color="0, 212, 170" intensity={0.4}>
                  <Typography 
                    variant="h6" 
                    noWrap 
                    component="div"
                    sx={{
                      background: `linear-gradient(135deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 700,
                    }}
                  >
                    College Incubation Inventory System
                  </Typography>
                </GlowEffect>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnimatedBadge count={notificationCount}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton color="inherit">
                      <NotificationsIcon />
                    </IconButton>
                  </motion.div>
                </AnimatedBadge>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconButton color="inherit">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <AccountIcon />
                    </Avatar>
                  </IconButton>
                </motion.div>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Sidebar */}
          <Drawer
            variant="persistent"
            anchor="left"
            open={sidebarOpen}
            sx={{
              width: sidebarOpen ? drawerWidth : 0,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                position: 'relative',
                height: '100vh',
                transition: (theme) =>
                  theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  }),
              },
            }}
          >
            <Toolbar />
            
            {/* User Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Avatar 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    mx: 'auto', 
                    mb: 1,
                    background: `linear-gradient(135deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
                  }}
                >
                  <AccountIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Admin User
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  System Administrator
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label="Online" 
                    color="success" 
                    size="small" 
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>
            </motion.div>

            <Box sx={{ overflow: 'auto', flex: 1 }}>
              <List sx={{ px: 1, py: 2 }}>
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        selected={selectedModule === item.id}
                        onClick={() => handleModuleChange(item.id)}
                        sx={{
                          borderRadius: 2,
                          mx: 1,
                          '&.Mui-selected': {
                            background: `linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(108, 99, 255, 0.1) 100%)`,
                            borderLeft: '3px solid',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{ 
                            color: selectedModule === item.id ? 'primary.main' : 'text.secondary',
                            minWidth: 40,
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {item.icon}
                          </motion.div>
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: selectedModule === item.id ? 600 : 400,
                            color: selectedModule === item.id ? 'primary.main' : 'text.primary',
                          }}
                        />
                        {item.badge > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                          >
                            <Chip
                              label={item.badge}
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '0.7rem',
                                minWidth: '20px',
                                bgcolor: 'error.main',
                                color: 'white',
                              }}
                            />
                          </motion.div>
                        )}
                      </ListItemButton>
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            </Box>

            {/* Footer */}
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                v2.0.0 - Professional Edition
              </Typography>
            </Box>
          </Drawer>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              background: darkMatteTheme.palette.background.gradient,
              height: '100vh',
              overflow: 'auto',
              paddingTop: '64px',
              position: 'relative',
            }}
          >
            {/* Background pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.02,
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0);
                `,
                backgroundSize: '20px 20px',
                pointerEvents: 'none',
              }}
            />
            
            {renderContent()}
          </Box>
        </Box>
      </motion.div>
    </ThemeProvider>
  );
}

export default App;
