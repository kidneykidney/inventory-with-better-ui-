import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Assignment as OrdersIcon,
  Category as CategoryIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Storage as DatabaseIcon,
  LocalShipping as SuppliersIcon,
  QrCode as QRCodeIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard'
  },
  {
    id: 'inventory',
    label: 'Inventory Management',
    icon: <InventoryIcon />,
    path: '/inventory',
    subItems: [
      { id: 'products', label: 'Products', icon: <InventoryIcon />, path: '/inventory/products' },
      { id: 'categories', label: 'Categories', icon: <CategoryIcon />, path: '/inventory/categories' },
      { id: 'low-stock', label: 'Low Stock Alerts', icon: <NotificationsIcon />, path: '/inventory/low-stock' }
    ]
  },
  {
    id: 'students',
    label: 'Student Management',
    icon: <PeopleIcon />,
    path: '/students',
    subItems: [
      { id: 'all-students', label: 'All Students', icon: <PeopleIcon />, path: '/students/all' },
      { id: 'add-student', label: 'Add Student', icon: <PeopleIcon />, path: '/students/add' },
      { id: 'student-projects', label: 'Project Tracking', icon: <Assessment />, path: '/students/projects' }
    ]
  },
  {
    id: 'orders',
    label: 'Order Management',
    icon: <OrdersIcon />,
    path: '/orders',
    badge: 5, // Pending orders count
    subItems: [
      { id: 'pending-orders', label: 'Pending Orders', icon: <OrdersIcon />, path: '/orders/pending' },
      { id: 'active-orders', label: 'Active Orders', icon: <OrdersIcon />, path: '/orders/active' },
      { id: 'create-order', label: 'Create Order', icon: <OrdersIcon />, path: '/orders/create' },
      { id: 'order-history', label: 'Order History', icon: <OrdersIcon />, path: '/orders/history' }
    ]
  },
  {
    id: 'invoicing',
    label: 'Invoicing & Billing',
    icon: <InvoiceIcon />,
    path: '/invoicing',
    subItems: [
      { id: 'generate-invoice', label: 'Generate Invoice', icon: <InvoiceIcon />, path: '/invoicing/generate' },
      { id: 'invoice-history', label: 'Invoice History', icon: <InvoiceIcon />, path: '/invoicing/history' },
      { id: 'payment-tracking', label: 'Payment Tracking', icon: <InvoiceIcon />, path: '/invoicing/payments' }
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: <ReportsIcon />,
    path: '/reports',
    subItems: [
      { id: 'inventory-reports', label: 'Inventory Reports', icon: <InventoryIcon />, path: '/reports/inventory' },
      { id: 'usage-analytics', label: 'Usage Analytics', icon: <ReportsIcon />, path: '/reports/usage' },
      { id: 'student-reports', label: 'Student Reports', icon: <PeopleIcon />, path: '/reports/students' },
      { id: 'financial-reports', label: 'Financial Reports', icon: <ReportsIcon />, path: '/reports/financial' }
    ]
  },
  {
    id: 'tools',
    label: 'Tools & Utilities',
    icon: <QRCodeIcon />,
    path: '/tools',
    subItems: [
      { id: 'barcode-scanner', label: 'Barcode Scanner', icon: <QRCodeIcon />, path: '/tools/scanner' },
      { id: 'bulk-import', label: 'Bulk Import', icon: <DatabaseIcon />, path: '/tools/import' },
      { id: 'data-export', label: 'Data Export', icon: <DatabaseIcon />, path: '/tools/export' },
      { id: 'system-backup', label: 'System Backup', icon: <DatabaseIcon />, path: '/tools/backup' }
    ]
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    subItems: [
      { id: 'general-settings', label: 'General Settings', icon: <SettingsIcon />, path: '/settings/general' },
      { id: 'user-management', label: 'User Management', icon: <PeopleIcon />, path: '/settings/users' },
      { id: 'notification-settings', label: 'Notifications', icon: <NotificationsIcon />, path: '/settings/notifications' },
      { id: 'database-settings', label: 'Database Config', icon: <DatabaseIcon />, path: '/settings/database' }
    ]
  }
];

function Sidebar({ activeModule, onModuleChange, mobileOpen, onMobileToggle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedItems, setExpandedItems] = useState(['dashboard', 'inventory']);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleExpandToggle = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderMenuItem = (item, level = 0) => (
    <ListItem key={item.id} disablePadding sx={{ pl: level * 2 }}>
      <ListItemButton
        selected={activeModule === item.id}
        onClick={() => {
          if (item.subItems) {
            handleExpandToggle(item.id);
          } else {
            onModuleChange(item.id);
            if (isMobile) onMobileToggle();
          }
        }}
        sx={{
          minHeight: 48,
          backgroundColor: activeModule === item.id ? 'action.selected' : 'transparent',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          borderRadius: 1,
          mx: 1,
          mb: 0.5
        }}
      >
        <ListItemIcon sx={{ color: activeModule === item.id ? 'primary.main' : 'inherit' }}>
          {item.badge ? (
            <Badge badgeContent={item.badge} color="error">
              {item.icon}
            </Badge>
          ) : (
            item.icon
          )}
        </ListItemIcon>
        <ListItemText 
          primary={item.label} 
          sx={{ 
            color: activeModule === item.id ? 'primary.main' : 'inherit',
            '& .MuiTypography-root': {
              fontWeight: activeModule === item.id ? 600 : 400,
              fontSize: level > 0 ? '0.875rem' : '0.9rem'
            }
          }}
        />
      </ListItemButton>
    </ListItem>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <InventoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Incubation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inventory System
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List component="nav">
          {menuItems.map((item) => (
            <Box key={item.id}>
              {renderMenuItem(item)}
              {item.subItems && expandedItems.includes(item.id) && (
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => renderMenuItem(subItem, 1))}
                </List>
              )}
            </Box>
          ))}
        </List>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>A</Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Admin User
            </Typography>
            <Typography variant="caption" color="text.secondary">
              System Administrator
            </Typography>
          </Box>
          <IconButton onClick={handleMenuClick} size="small">
            <AccountIcon />
          </IconButton>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
          <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
          <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider'
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider'
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Sidebar;
