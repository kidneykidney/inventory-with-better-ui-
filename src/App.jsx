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
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
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
  SupervisorAccount as SupervisorAccountIcon,
  ManageAccounts as ManageAccountsIcon,
  BarChart as BarChartIcon,
  Store as StoreIcon
} from '@mui/icons-material';

// Import our modules
import OrderManagement from './pages/OrderManagement';
import Dashboard from './pages/Dashboard';
import InstrumentCluster from './components/InstrumentCluster';
import PremiumAnalyticsDashboard from './pages/PremiumAnalyticsDashboard';
import ListView from './components/ListView';
import Students from './components/Students';
import Orders from './components/Orders';
import InvoiceManagement from './components/InvoiceManagement';
import InvoiceDashboard from './components/InvoiceDashboard';
import SettingsManagement from './components/SettingsManagement';
import LoginPage from './components/MinimalLoginPage';
import UserManagement from './components/UserManagement';
import NotificationSystem from './components/NotificationSystem';

// Import theme and components
import { lightMinimalTheme } from './theme/lightTheme';
import LoadingAnimation from './components/LoadingAnimation';
import { SimpleBadge, SimpleLoading } from './components/SimpleComponents';

// Import minimal styles
import './styles/minimal.css';

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
    if (hash && ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'settings', 'users'].includes(hash)) {
      return hash;
    }
    
    // Check localStorage for last visited page
    const savedModule = localStorage.getItem('selectedModule');
    if (savedModule && ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'settings', 'users'].includes(savedModule)) {
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
    // Only keep real system notifications, no mock data
    const systemNotifications = [];
    
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
      if (hash && ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'settings'].includes(hash)) {
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

  // Real-time notifications - only for actual system events
  useEffect(() => {
    if (isLoading) return;

    // Removed mock notification generation
    // Only real system events should generate notifications now
    
    return () => {
      // Cleanup if needed
    };
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
    { id: 'products', label: 'Products Management', icon: <InventoryIcon />, badge: 0, roles: ['main_admin', 'sub_admin'] },
    { id: 'students', label: 'Student Management', icon: <PeopleIcon />, badge: 0, roles: ['main_admin', 'sub_admin'] },
    { id: 'orders', label: 'Lending Management', icon: <StoreIcon />, badge: 0, roles: ['main_admin', 'sub_admin'] },
    { id: 'invoicing', label: 'Invoicing & Billing', icon: <ReceiptIcon />, badge: 0, roles: ['main_admin', 'sub_admin'] },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChartIcon />, badge: 0, roles: ['main_admin', 'sub_admin', 'viewer'] },
    { id: 'users', label: 'User Management', icon: <ManageAccountsIcon />, badge: 0, roles: ['main_admin'] },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon />, badge: 0, roles: ['main_admin'] },
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
          return <InstrumentCluster />;
        case 'users':
          return <UserManagement />;
        case 'settings':
          return <SettingsManagement />;
        default:
          return (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                {getAccessibleMenuItems().find(item => item.id === selectedModule)?.label || 'Module'}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                This module is coming soon! Currently working on the Product Management and Order Management system.
              </Typography>
            </Box>
          );
      }
    };

    return (
      <Box key={selectedModule} sx={{ height: '100%' }}>
        {getContent()}
      </Box>
    );
  };

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <ThemeProvider theme={lightMinimalTheme}>
        <CssBaseline />
        <SimpleLoading 
          size={50}
          message="Checking authentication..."
          sx={{ height: '100vh' }}
        />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={lightMinimalTheme}>
        <CssBaseline />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  if (isLoading) {
    return (
      <ThemeProvider theme={lightMinimalTheme}>
        <CssBaseline />
        <SimpleLoading 
          size={50}
          message="Loading Inventory System..."
          sx={{ height: '100vh' }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={lightMinimalTheme}>
      <CssBaseline />
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
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '48px !important', py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleToggleSidebar}
                edge="start"
                size="small"
                sx={{ mr: 1 }}
              >
                {sidebarOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
              </IconButton>
              
              <Typography 
                variant="subtitle1" 
                noWrap 
                component="div"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                College Incubation Inventory System
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                color="inherit"
                onClick={handleNotificationClick}
                size="small"
                sx={{ position: 'relative' }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px'
                    }
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
              
              <IconButton 
                color="inherit"
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                size="small"
              >
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Box>

              <Menu
                anchorEl={notificationAnchor}
                open={Boolean(notificationAnchor)}
                onClose={handleNotificationClose}
                PaperProps={{
                  sx: {
                    width: '400px',
                    maxHeight: '500px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
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
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Button
                      size="small"
                      onClick={markAllAsRead}
                      sx={{
                        color: '#3B82F6',
                        fontSize: '0.75rem',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.04)'
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
                      <Typography sx={{ color: '#64748B' }}>
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
                          backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                          borderBottom: '1px solid #F1F5F9',
                          p: 2,
                          display: 'block',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.08)'
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
                                  color: '#1E293B',
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
                                      backgroundColor: '#3B82F6',
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
                                    color: '#64748B',
                                    '&:hover': {
                                      color: '#EF4444',
                                      backgroundColor: 'rgba(239, 68, 68, 0.04)'
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
                                color: '#64748B',
                                mt: 0.5,
                                lineHeight: 1.4
                              }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#94A3B8',
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
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    mt: 1
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info */}
                <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {currentUser?.full_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#1E293B', fontWeight: 600 }}>
                        {currentUser?.full_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {currentUser?.email}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <SimpleBadge 
                          color={currentUser?.role === 'main_admin' ? 'error' : 'primary'}
                          size="small"
                        >
                          {currentUser?.role?.replace('_', ' ').toUpperCase()}
                        </SimpleBadge>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Menu Items */}
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                  <AccountIcon sx={{ mr: 2, color: '#64748B' }} />
                  <Typography>Profile Settings</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                  <SettingsIcon sx={{ mr: 2, color: '#64748B' }} />
                  <Typography>Preferences</Typography>
                </MenuItem>
                
                <Divider sx={{ my: 1, borderColor: '#E2E8F0' }} />
                
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    color: '#EF4444',
                    '&:hover': { 
                      backgroundColor: 'rgba(239, 68, 68, 0.04)' 
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
            className="sidebar-scrollbar"
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
            
            <Box sx={{ overflow: 'auto', flex: 1 }} className="scrollbar-thin">
              <List sx={{ px: 1, py: 2 }}>
                {getAccessibleMenuItems().map((item, index) => (
                  <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={selectedModule === item.id}
                      onClick={() => handleModuleChange(item.id)}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
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
                        {item.icon}
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
                        <SimpleBadge color="error" size="small">
                          {item.badge}
                        </SimpleBadge>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Footer */}
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                v2.0.0 - Professional Edition
              </Typography>
            </Box>
          </Drawer>

          {/* Main Content */}
          <Box
            component="main"
            className="scrollbar-thin"
            sx={{
              flexGrow: 1,
              background: '#F8FAFC',
              height: '100vh',
              overflow: 'auto',
              paddingTop: '64px',
              position: 'relative',
            }}
          >
            {renderContent()}
          </Box>
        </Box>
        
        {/* Notification System */}
        <NotificationSystem />
    </ThemeProvider>
  );
}

export default App;
