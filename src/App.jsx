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
  Chip,
  Menu,
  MenuItem,
  Badge,
  Paper,
  Tooltip,
  Button,
  Alert
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
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  SupervisorAccount as SupervisorAccountIcon
} from '@mui/icons-material';

// Import our modules
import OrderManagement from './pages/OrderManagement';
import Dashboard from './pages/Dashboard';
import ReportsAnalytics from './pages/ReportsAnalytics';
import PremiumAnalyticsDashboard from './pages/PremiumAnalyticsDashboard';
import ListView from './components/ListView';
import Students from './components/Students';
import Orders from './components/Orders';
import InvoiceManagement from './components/InvoiceManagement';
import InvoiceDashboard from './components/InvoiceDashboard';
import SettingsManagement from './components/SettingsManagement';
import LoginPage from './components/LoginPage';
import UserManagement from './components/UserManagement';

// Import theme and components
import { darkMatteTheme, animationVariants } from './theme/darkTheme';
import LoadingAnimation from './components/LoadingAnimation';
import { AnimatedBadge, GlowEffect } from './components/AnimatedComponents';

const drawerWidth = 280;
const API_BASE_URL = 'http://localhost:8000';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Get initial module from URL hash or localStorage, default to 'dashboard'
  const getInitialModule = () => {
    // Check URL hash first (e.g., #products, #reports)
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'tools', 'settings', 'users'].includes(hash)) {
      return hash;
    }
    
    // Check localStorage for last visited page
    const savedModule = localStorage.getItem('selectedModule');
    if (savedModule && ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'tools', 'settings', 'users'].includes(savedModule)) {
      return savedModule;
    }
    
    // Default to dashboard
    return 'dashboard';
  };
  
  const [selectedModule, setSelectedModule] = useState(getInitialModule());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Real notification system
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }
    
    setAuthLoading(false);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage and state
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('selectedModule');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserMenuAnchor(null);
  };

  // Generate real notifications based on system activity
  const generateNotifications = () => {
    const systemNotifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Low Stock Alert',
        message: '3 products are running low on stock',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false,
        action: () => setSelectedModule('products')
      },
      {
        id: 2,
        type: 'info',
        title: 'New Student Registration',
        message: '2 new students have been registered today',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        read: false,
        action: () => setSelectedModule('students')
      },
      {
        id: 3,
        type: 'success',
        title: 'Invoice Processed',
        message: 'Invoice #INV-2025-001 has been successfully processed',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        action: () => setSelectedModule('invoicing')
      },
      {
        id: 4,
        type: 'error',
        title: 'Order Delayed',
        message: 'Order #ORD-001 delivery has been delayed',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        read: false,
        action: () => setSelectedModule('orders')
      },
      {
        id: 5,
        type: 'info',
        title: 'System Backup Complete',
        message: 'Daily system backup completed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        read: true,
        action: () => setSelectedModule('settings')
      },
      {
        id: 6,
        type: 'warning',
        title: 'Maintenance Reminder',
        message: 'Scheduled maintenance in 2 hours',
        timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
        read: false,
        action: () => setSelectedModule('settings')
      }
    ];
    
    setNotifications(systemNotifications);
    const unread = systemNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

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
        await new Promise(resolve => setTimeout(resolve, 200));
        setLoadingProgress(step.progress);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsLoading(false);
      
      // Generate notifications after loading
      generateNotifications();
    };

    loadingSequence();
  }, []);

  // Listen for hash changes (browser navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'tools', 'settings'].includes(hash)) {
        setSelectedModule(hash);
        localStorage.setItem('selectedModule', hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if not present
    if (!window.location.hash) {
      window.location.hash = selectedModule;
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [selectedModule]);

  // Simulate real-time notifications
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      // Randomly generate new notifications
      const shouldGenerate = Math.random() < 0.3; // 30% chance every 30 seconds
      
      if (shouldGenerate) {
        const newNotificationTemplates = [
          {
            type: 'info',
            title: 'New Order Received',
            message: `Order #ORD-${Math.floor(Math.random() * 1000)} has been placed`,
            action: () => setSelectedModule('orders')
          },
          {
            type: 'warning',
            title: 'Stock Alert',
            message: `Product stock is running low`,
            action: () => setSelectedModule('products')
          },
          {
            type: 'success',
            title: 'Payment Received',
            message: `Payment for invoice #INV-${Math.floor(Math.random() * 1000)} received`,
            action: () => setSelectedModule('invoicing')
          },
          {
            type: 'info',
            title: 'Student Activity',
            message: `Student profile has been updated`,
            action: () => setSelectedModule('students')
          }
        ];

        const template = newNotificationTemplates[Math.floor(Math.random() * newNotificationTemplates.length)];
        const newNotification = {
          ...template,
          id: Date.now(),
          timestamp: new Date(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep only last 20
        setUnreadCount(prev => prev + 1);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  // Notification handlers
  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== notificationId)
    );
    // Update unread count if deleted notification was unread
    const deletedNotification = notifications.find(n => n.id === notificationId);
    if (deletedNotification && !deletedNotification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#FF9800' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#F44336' }} />;
      case 'info': 
      default: return <InfoIcon sx={{ color: '#2196F3' }} />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  // Function to add notification from other components
  const addNotification = (type, title, message, action = null) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      action
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    setUnreadCount(prev => prev + 1);
  };

  // Expose notification function to window for global access
  useEffect(() => {
    window.addNotification = addNotification;
    return () => {
      delete window.addNotification;
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, badge: 0, roles: ['main_admin', 'sub_admin', 'viewer'] },
    { id: 'products', label: 'Products Management', icon: <InventoryIcon />, badge: 2, roles: ['main_admin', 'sub_admin'] },
    { id: 'students', label: 'Student Management', icon: <PeopleIcon />, badge: 1, roles: ['main_admin', 'sub_admin'] },
    { id: 'orders', label: 'Order Management', icon: <ShoppingCartIcon />, badge: 3, roles: ['main_admin', 'sub_admin'] },
    { id: 'invoicing', label: 'Invoicing & Billing', icon: <ReceiptIcon />, badge: 0, roles: ['main_admin', 'sub_admin'] },
    { id: 'reports', label: 'Reports & Analytics', icon: <AssessmentIcon />, badge: 0, roles: ['main_admin', 'sub_admin', 'viewer'] },
    { id: 'tools', label: 'Tools & Utilities', icon: <BuildIcon />, badge: 0, roles: ['main_admin', 'sub_admin'] },
    { id: 'users', label: 'User Management', icon: <SupervisorAccountIcon />, badge: 0, roles: ['main_admin'] },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon />, badge: 1, roles: ['main_admin'] },
  ];

  // Filter menu items based on user role
  const getAccessibleMenuItems = () => {
    if (!currentUser) return [];
    return menuItems.filter(item => item.roles.includes(currentUser.role));
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleModuleChange = (moduleId) => {
    setSelectedModule(moduleId);
    // Save to localStorage for persistence
    localStorage.setItem('selectedModule', moduleId);
    // Update URL hash for browser navigation
    window.location.hash = moduleId;
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
        case 'reports':
          return <PremiumAnalyticsDashboard />;
        case 'users':
          return <UserManagement />;
        case 'settings':
          return <SettingsManagement />;
        default:
          return (
            <Box>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h4" gutterBottom>
                  {getAccessibleMenuItems().find(item => item.id === selectedModule)?.label || 'Module'}
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

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <ThemeProvider theme={darkMatteTheme}>
        <CssBaseline />
        <LoadingAnimation 
          isLoading={true} 
          progress={50}
          message="Checking authentication..."
        />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={darkMatteTheme}>
        <CssBaseline />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

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
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton 
                    color="inherit"
                    onClick={handleNotificationClick}
                    sx={{ position: 'relative' }}
                  >
                    <Badge 
                      badgeContent={unreadCount} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#FF4444',
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }
                      }}
                    >
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconButton 
                    color="inherit"
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {currentUser?.full_name?.charAt(0) || 'U'}
                    </Avatar>
                  </IconButton>
                </motion.div>
              </Box>

              {/* Notification Menu */}
              <Menu
                anchorEl={notificationAnchor}
                open={Boolean(notificationAnchor)}
                onClose={handleNotificationClose}
                PaperProps={{
                  sx: {
                    width: '400px',
                    maxHeight: '500px',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    mt: 1
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* Notification Header */}
                <Box sx={{ 
                  p: 2, 
                  borderBottom: '1px solid #2A2A2A',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Button
                      size="small"
                      onClick={markAllAsRead}
                      sx={{
                        color: '#00D4AA',
                        fontSize: '0.75rem',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 212, 170, 0.08)'
                        }
                      }}
                    >
                      Mark all as read
                    </Button>
                  )}
                </Box>

                {/* Notification List */}
                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography sx={{ color: '#888888' }}>
                        No notifications
                      </Typography>
                    </Box>
                  ) : (
                    notifications.map((notification) => (
                      <MenuItem
                        key={notification.id}
                        onClick={() => {
                          if (!notification.read) {
                            markNotificationAsRead(notification.id);
                          }
                          if (notification.action) {
                            notification.action();
                          }
                          handleNotificationClose();
                        }}
                        sx={{
                          backgroundColor: notification.read ? 'transparent' : 'rgba(0, 212, 170, 0.05)',
                          borderBottom: '1px solid #2A2A2A',
                          p: 2,
                          display: 'block',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 212, 170, 0.08)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ mt: 0.5 }}>
                            {getNotificationIcon(notification.type)}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  color: '#FFFFFF',
                                  fontWeight: notification.read ? 400 : 600,
                                  lineHeight: 1.3
                                }}
                              >
                                {notification.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                {!notification.read && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      backgroundColor: '#00D4AA',
                                      flexShrink: 0
                                    }}
                                  />
                                )}
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  sx={{
                                    color: '#888888',
                                    '&:hover': {
                                      color: '#FF4444',
                                      backgroundColor: 'rgba(255, 68, 68, 0.1)'
                                    }
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#CCCCCC',
                                mt: 0.5,
                                lineHeight: 1.4
                              }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#888888',
                                mt: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <ScheduleIcon sx={{ fontSize: '0.75rem' }} />
                              {formatTimeAgo(notification.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Box>
              </Menu>

              {/* User Menu */}
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    width: '250px',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    mt: 1
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info */}
                <Box sx={{ p: 2, borderBottom: '1px solid #2A2A2A' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {currentUser?.full_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {currentUser?.full_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888888' }}>
                        {currentUser?.email}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={currentUser?.role?.replace('_', ' ').toUpperCase()} 
                          size="small"
                          color={currentUser?.role === 'main_admin' ? 'error' : 'primary'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Menu Items */}
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                  <AccountIcon sx={{ mr: 2, color: '#888888' }} />
                  <Typography>Profile Settings</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                  <SettingsIcon sx={{ mr: 2, color: '#888888' }} />
                  <Typography>Preferences</Typography>
                </MenuItem>
                
                <Divider sx={{ my: 1, borderColor: '#2A2A2A' }} />
                
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    color: '#FF4444',
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 68, 68, 0.1)' 
                    }
                  }}
                >
                  <LogoutIcon sx={{ mr: 2 }} />
                  <Typography>Sign Out</Typography>
                </MenuItem>
              </Menu>
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
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentUser?.full_name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {currentUser?.role?.replace('_', ' ').toUpperCase() || 'USER'}
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
                {getAccessibleMenuItems().map((item, index) => (
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
