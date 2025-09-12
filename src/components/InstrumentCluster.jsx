import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, IconButton, Tooltip, Switch, 
  FormControlLabel, Chip
} from '@mui/material';
import {
  Inventory as ProductsIcon,
  People as StudentsIcon,
  ShoppingCart as OrdersIcon,
  Receipt as InvoicesIcon,
  SupervisorAccount as UsersIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Timeline as TrendIcon,
  Download as DownloadIcon,
  CloudDownload as CloudDownloadIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

function InstrumentCluster() {
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState({
    products: { count: 0, status: 'loading', trend: '...', activity: 'Loading...' },
    students: { count: 0, status: 'loading', trend: '...', activity: 'Loading...' },
    orders: { count: 0, status: 'loading', trend: '...', activity: 'Loading...' },
    invoices: { count: 0, status: 'loading', trend: '...', activity: 'Loading...' },
    users: { count: 0, status: 'loading', trend: '...', activity: 'Loading...' },
    system: { status: 'loading', uptime: '...', activity: 'Initializing system...' }
  });

  // Fetch real data from APIs
  const fetchModuleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real data from each module's API (no authentication needed for basic endpoints)
      const [productsRes, studentsRes, ordersRes, invoicesRes, usersRes] = await Promise.allSettled([
        fetch('http://localhost:8000/api/products'),
        fetch('http://localhost:8000/api/students'),
        fetch('http://localhost:8000/api/orders'),
        fetch('http://localhost:8000/api/invoices').catch(() => ({ status: 'rejected', reason: 'Invoice API not available' })),
        fetch('http://localhost:8000/api/users').catch(() => ({ status: 'rejected', reason: 'Users API may require auth' }))
      ]);

      const newMetrics = {
        products: { count: 0, status: 'error', trend: '0%', activity: 'No data available' },
        students: { count: 0, status: 'error', trend: '0%', activity: 'No data available' },
        orders: { count: 0, status: 'error', trend: '0%', activity: 'No data available' },
        invoices: { count: 0, status: 'error', trend: '0%', activity: 'No data available' },
        users: { count: 0, status: 'error', trend: '0%', activity: 'No data available' },
        system: { status: 'checking', uptime: 'Unknown', activity: 'Checking system status...' }
      };

      // Process Products data
      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const productsData = await productsRes.value.json();
        const productsArray = Array.isArray(productsData) ? productsData : productsData.products || [];
        newMetrics.products = {
          count: productsArray.length,
          status: 'good',
          trend: `${productsArray.length > 0 ? '+' : ''}${productsArray.length}`,
          activity: `${productsArray.length} products in inventory`
        };
      }

      // Process Students data
      if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
        const studentsData = await studentsRes.value.json();
        const studentsArray = Array.isArray(studentsData) ? studentsData : studentsData.students || [];
        newMetrics.students = {
          count: studentsArray.length,
          status: 'good',
          trend: `${studentsArray.length > 0 ? '+' : ''}${studentsArray.length}`,
          activity: `${studentsArray.length} registered students`
        };
      }

      // Process Orders data
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const ordersData = await ordersRes.value.json();
        const ordersArray = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
        const pendingOrders = ordersArray.filter(order => order.status === 'pending' || order.status === 'processing').length;
        newMetrics.orders = {
          count: ordersArray.length,
          status: pendingOrders > 5 ? 'warning' : 'good',
          trend: `${pendingOrders} pending`,
          activity: `${ordersArray.length} total orders, ${pendingOrders} pending`
        };
      }

      // Process Invoices data
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.ok) {
        const invoicesData = await invoicesRes.value.json();
        const invoicesArray = Array.isArray(invoicesData) ? invoicesData : invoicesData.invoices || [];
        const paidInvoices = invoicesArray.filter(invoice => invoice.status === 'paid').length;
        newMetrics.invoices = {
          count: invoicesArray.length,
          status: 'good',
          trend: `${paidInvoices} paid`,
          activity: `${invoicesArray.length} total invoices, ${paidInvoices} paid`
        };
      }

      // Process Users data
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const usersData = await usersRes.value.json();
        const usersArray = Array.isArray(usersData) ? usersData : usersData.users || [];
        const activeUsers = usersArray.filter(user => user.status === 'active').length;
        newMetrics.users = {
          count: usersArray.length,
          status: 'good',
          trend: `${activeUsers} active`,
          activity: `${usersArray.length} total users, ${activeUsers} active`
        };
      }

      // System status based on successful API calls
      const successfulCalls = [productsRes, studentsRes, ordersRes, invoicesRes, usersRes]
        .filter(res => res.status === 'fulfilled' && res.value.ok).length;
      
      newMetrics.system = {
        status: successfulCalls >= 3 ? 'operational' : successfulCalls >= 1 ? 'degraded' : 'error',
        uptime: `${Math.round((successfulCalls / 5) * 100)}%`,
        activity: `${successfulCalls}/5 modules responding`
      };

      setSystemMetrics(newMetrics);
      setLastUpdate(new Date());
      setError(null);
    } catch (error) {
      console.error('Failed to fetch module data:', error);
      setError('Failed to fetch system data');
      // Set error state for all modules
      setSystemMetrics({
        products: { count: 0, status: 'error', trend: 'Error', activity: 'Connection failed' },
        students: { count: 0, status: 'error', trend: 'Error', activity: 'Connection failed' },
        orders: { count: 0, status: 'error', trend: 'Error', activity: 'Connection failed' },
        invoices: { count: 0, status: 'error', trend: 'Error', activity: 'Connection failed' },
        users: { count: 0, status: 'error', trend: 'Error', activity: 'Connection failed' },
        system: { status: 'error', uptime: '0%', activity: 'System unavailable' }
      });
    } finally {
      setLoading(false);
    }
  };

  // CSV Export functionality
  const [isExporting, setIsExporting] = useState(false);

  const formatDataForCSV = (data, type) => {
    if (!data || data.length === 0) return [];
    
    switch (type) {
      case 'products':
        return data.map(item => ({
          'Product ID': item.id || '',
          'Product Name': item.name || '',
          'Description': item.description || '',
          'Category': item.category_name || 'Uncategorized',
          'SKU': item.sku || '',
          'Total Quantity': item.quantity_total || 0,
          'Available Quantity': item.quantity_available || 0,
          'Quantity Issued': (item.quantity_total || 0) - (item.quantity_available || 0),
          'Returnable': item.is_returnable ? 'Yes' : 'No',
          'Unit Price (₹)': item.unit_price ? `₹${parseFloat(item.unit_price).toFixed(2)}` : '₹0.00',
          'Total Value (₹)': item.quantity_available && item.unit_price ? 
            `₹${(item.quantity_available * parseFloat(item.unit_price)).toFixed(2)}` : '₹0.00',
          'Storage Location': item.location || '',
          'Minimum Stock Level': item.minimum_stock_level || 0,
          'Stock Status': (item.quantity_available || 0) <= (item.minimum_stock_level || 0) ? 'Low Stock' : 'In Stock',
          'Product Status': item.status || '',
          'Image URL': item.image_url || '',
          'Specifications': item.specifications ? JSON.stringify(item.specifications) : '',
          'Tags': item.tags ? item.tags.join('; ') : '',
          'Created Date': item.created_at ? new Date(item.created_at).toLocaleString() : '',
          'Last Updated': item.updated_at ? new Date(item.updated_at).toLocaleString() : ''
        }));
      
      case 'students':
        return data.map(item => ({
          'Database ID': item.id || '',
          'Student ID': item.student_id || '',
          'Full Name': item.name || '',
          'Email Address': item.email || '',
          'Phone Number': item.phone || '',
          'Department': item.department || '',
          'Year of Study': item.year_of_study || '',
          'Course': item.course || '',
          'Account Status': item.is_active ? 'Active' : 'Inactive',
          'Registration Date': item.created_at ? new Date(item.created_at).toLocaleString() : '',
          'Last Profile Update': item.updated_at ? new Date(item.updated_at).toLocaleString() : ''
        }));
      
      case 'orders':
        // Flatten orders with their items for comprehensive export
        const flattenedOrders = [];
        data.forEach(order => {
          const baseOrderInfo = {
            'Order ID': order.id || '',
            'Order Number': order.order_number || '',
            'Student ID': order.student_id || '',
            'Student Name': order.student_name || '',
            'Student Email': order.student_email || '',
            'Department': order.department || '',
            'Order Type': order.order_type || '',
            'Order Status': order.status || '',
            'Total Items Count': order.total_items || 0,
            'Total Order Value (₹)': order.total_value ? `₹${parseFloat(order.total_value).toFixed(2)}` : '₹0.00',
            'Order Notes': order.notes || '',
            'Requested Date': order.requested_date ? new Date(order.requested_date).toLocaleString() : '',
            'Approved Date': order.approved_date ? new Date(order.approved_date).toLocaleString() : '',
            'Completed Date': order.completed_date ? new Date(order.completed_date).toLocaleString() : '',
            'Expected Return Date': order.expected_return_date ? new Date(order.expected_return_date).toLocaleDateString() : '',
            'Actual Return Date': order.actual_return_date ? new Date(order.actual_return_date).toLocaleDateString() : '',
            'Approved By': order.approved_by || ''
          };
          
          if (order.items && order.items.length > 0) {
            order.items.forEach((item, index) => {
              flattenedOrders.push({
                ...baseOrderInfo,
                'Item Number': index + 1,
                'Product ID': item.product_id || '',
                'Product Name': item.product_name || '',
                'Quantity Requested': item.quantity_requested || 0,
                'Quantity Approved': item.quantity_approved || 0,
                'Quantity Returned': item.quantity_returned || 0,
                'Unit Price (₹)': item.unit_price ? `₹${parseFloat(item.unit_price).toFixed(2)}` : '₹0.00',
                'Total Item Price (₹)': item.total_price ? `₹${parseFloat(item.total_price).toFixed(2)}` : '₹0.00',
                'Item Returnable': item.is_returnable ? 'Yes' : 'No',
                'Item Expected Return': item.expected_return_date ? new Date(item.expected_return_date).toLocaleDateString() : '',
                'Item Actual Return': item.actual_return_date ? new Date(item.actual_return_date).toLocaleDateString() : '',
                'Return Condition': item.return_condition || '',
                'Item Notes': item.notes || '',
                'Item Status': item.status || ''
              });
            });
          } else {
            flattenedOrders.push({
              ...baseOrderInfo,
              'Item Number': 'No Items',
              'Product ID': '',
              'Product Name': '',
              'Quantity Requested': '',
              'Quantity Approved': '',
              'Quantity Returned': '',
              'Unit Price (₹)': '',
              'Total Item Price (₹)': '',
              'Item Returnable': '',
              'Item Expected Return': '',
              'Item Actual Return': '',
              'Return Condition': '',
              'Item Notes': '',
              'Item Status': ''
            });
          }
        });
        return flattenedOrders;
      
      case 'invoices':
        return data.map(item => ({
          'Invoice Number': item.invoice_number || '',
          'Type': item.invoice_type || 'lending',
          'Student Name': item.student_name || '',
          'Student ID': item.student_id_number || item.student_id || '',
          'Status': item.status || '',
          'Total Items': item.total_items || 0,
          'Total Value (₹)': item.total_value ? parseFloat(item.total_value).toFixed(2) : '0.00',
          'Issue Date': item.issue_date ? item.issue_date.split('T')[0] : '',
          'Physical Copy': item.has_physical_copy ? 'Yes' : 'No',
          'Student Acknowledged': item.acknowledged_by_student ? 'Yes' : 'No',
          'Created Date': item.created_at ? item.created_at.split('T')[0] : '',
          'Last Updated': item.updated_at ? item.updated_at.split('T')[0] : ''
        }));
      
      case 'users':
        return data.map(item => ({
          'User ID': item.id || '',
          'Username': item.username || '',
          'Full Name': item.full_name || '',
          'Email Address': item.email || '',
          'User Role': item.role || '',
          'Account Status': item.is_active ? 'Active' : 'Inactive',
          'Email Verified': item.email_verified ? 'Yes' : 'No',
          'Last Login': item.last_login ? new Date(item.last_login).toLocaleString() : 'Never',
          'Account Created': item.created_at ? new Date(item.created_at).toLocaleString() : '',
          'Last Updated': item.updated_at ? new Date(item.updated_at).toLocaleString() : ''
        }));

      case 'categories':
        return data.map(item => ({
          'Category ID': item.id || '',
          'Category Name': item.name || '',
          'Description': item.description || '',
          'Created Date': item.created_at ? new Date(item.created_at).toLocaleString() : '',
          'Last Updated': item.updated_at ? new Date(item.updated_at).toLocaleString() : ''
        }));
      
      default:
        // Generic formatting for unknown types
        return data.map(item => {
          const formatted = {};
          Object.keys(item).forEach(key => {
            // Convert key to readable format
            const readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            formatted[readableKey] = item[key] || '';
          });
          return formatted;
        });
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    
    // Create a nice header row with proper formatting
    const csvHeaders = headers.map(header => {
      // Ensure header is properly quoted if it contains spaces or special characters
      if (header.includes(',') || header.includes('"') || header.includes('\n')) {
        return `"${header.replace(/"/g, '""')}"`;
      }
      return header;
    }).join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        let value = row[header];
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convert to string
        value = String(value);
        
        // Handle empty strings
        if (value === '') {
          return '';
        }
        
        // Handle arrays and objects
        if (typeof row[header] === 'object' && row[header] !== null) {
          if (Array.isArray(row[header])) {
            value = row[header].join('; ');
          } else {
            value = JSON.stringify(row[header]);
          }
        }
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',')
    );
    
    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    return BOM + [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExport = async (type = 'all') => {
    setIsExporting(true);
    setError(null);
    
    try {
      if (type === 'all') {
        // Export all data in separate files
        const modules = ['products', 'students', 'orders', 'invoices', 'users'];
        let successCount = 0;
        
        for (const module of modules) {
          try {
            let endpoint = '';
            switch (module) {
              case 'products':
              case 'students':
              case 'orders':
              case 'categories':
                endpoint = `http://localhost:8000/api/${module}`;
                break;
              case 'invoices':
                endpoint = `http://localhost:8000/api/invoices`;
                break;
              case 'users':
                endpoint = `http://localhost:8000/api/users`;
                break;
              default:
                continue;
            }
            
            console.log(`Exporting ${module} from ${endpoint}`);
            const timestamp = Date.now();
            const urlWithTimestamp = `${endpoint}?_t=${timestamp}`;
            const response = await fetch(urlWithTimestamp, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const formattedData = formatDataForCSV(data, module);
              if (formattedData.length > 0) {
                const csv = convertToCSV(formattedData);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
                const recordCount = formattedData.length;
                const filename = `${module}_detailed_export_${recordCount}records_${timestamp}.csv`;
                downloadCSV(csv, filename);
                successCount++;
                console.log(`✅ Successfully exported ${module}: ${formattedData.length} records`);
              }
            } else {
              console.warn(`❌ Failed to export ${module}: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.error(`❌ Failed to export ${module}:`, error);
          }
        }
        
        if (successCount > 0) {
          alert(`✅ Export completed! ${successCount} modules exported successfully.`);
        } else {
          throw new Error('No modules were exported successfully');
        }
      } else {
        // Export specific module
        let endpoint = '';
        switch (type) {
          case 'products':
          case 'students':
          case 'orders':
          case 'categories':
            endpoint = `http://localhost:8000/api/${type}`;
            break;
          case 'invoices':
            endpoint = `http://localhost:8000/api/invoices`;
            break;
          case 'users':
            endpoint = `http://localhost:8000/api/users`;
            break;
          default:
            throw new Error(`Unknown module type: ${type}`);
        }
        
        console.log(`Exporting ${type} from ${endpoint}`);
        const timestamp = Date.now();
        const urlWithTimestamp = `${endpoint}?_t=${timestamp}`;
        const response = await fetch(urlWithTimestamp, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const formattedData = formatDataForCSV(data, type);
        
        if (formattedData.length > 0) {
          const csv = convertToCSV(formattedData);
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
          const recordCount = formattedData.length;
          const filename = `${type}_detailed_export_${recordCount}records_${timestamp}.csv`;
          downloadCSV(csv, filename);
          alert(`✅ ${type} exported successfully! ${formattedData.length} records exported.`);
        } else {
          throw new Error(`No data found for ${type}`);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError(`Failed to export data: ${error.message}`);
      alert(`❌ Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Live updates
  useEffect(() => {
    fetchModuleData(); // Initial load
    
    if (liveUpdates) {
      const interval = setInterval(fetchModuleData, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [liveUpdates]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': 
      case 'operational': return '#3B82F6';
      case 'warning': 
      case 'degraded': return '#FF8F00';
      case 'error': return '#FF6B6B';
      case 'loading': return '#888888';
      default: return '#FFFFFF';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': 
      case 'operational': return '●';
      case 'warning': 
      case 'degraded': return '⚠';
      case 'error': return '✕';
      case 'loading': return '○';
      default: return '●';
    }
  };

  const modules = [
    {
      id: 'products',
      label: 'Products Management',
      icon: <ProductsIcon />,
      data: systemMetrics.products
    },
    {
      id: 'students',
      label: 'Student Management',
      icon: <StudentsIcon />,
      data: systemMetrics.students
    },
    {
      id: 'orders',
      label: 'Order Management',
      icon: <OrdersIcon />,
      data: systemMetrics.orders
    },
    {
      id: 'invoices',
      label: 'Invoice Management',
      icon: <InvoicesIcon />,
      data: systemMetrics.invoices
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <UsersIcon />,
      data: systemMetrics.users
    },
    {
      id: 'system',
      label: 'System Status',
      icon: <SettingsIcon />,
      data: systemMetrics.system
    }
  ];

  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh', 
      backgroundColor: '#FFFFFF',
      color: '#1F2937'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <BarChartIcon sx={{ fontSize: '2rem', color: '#1F2937' }} />
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#1F2937' 
              }}>
                System Instrument Cluster
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Live monitoring of all system modules • Real-time status updates
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={liveUpdates}
                  onChange={(e) => setLiveUpdates(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#3B82F6',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#3B82F6',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
                  Live Updates
                </Typography>
              }
            />
            
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={fetchModuleData}
                sx={{ 
                  color: '#3B82F6',
                  '&:hover': { backgroundColor: 'rgba(0, 212, 170, 0.1)' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Export All Data to CSV">
              <IconButton 
                onClick={() => handleExport('all')}
                disabled={isExporting || loading}
                sx={{ 
                  color: '#3B82F6',
                  '&:hover': { backgroundColor: 'rgba(0, 212, 170, 0.1)' },
                  '&:disabled': { color: '#666666' },
                  fontSize: '2rem',
                  padding: '12px'
                }}
              >
                {isExporting ? 
                  <CloudDownloadIcon sx={{ fontSize: '2rem' }} /> : 
                  <DownloadIcon sx={{ fontSize: '2rem' }} />
                }
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Status Bar */}
        <Card sx={{
          mb: 3,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px'
        }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ color: '#3B82F6' }}>
                  System Status
                </Typography>
                <Chip 
                  label={
                    error ? 'System Error' :
                    loading ? 'Loading...' :
                    systemMetrics.system.status === 'operational' ? 'All Systems Operational' :
                    systemMetrics.system.status === 'degraded' ? 'Some Services Unavailable' :
                    'System Issues Detected'
                  }
                  sx={{ 
                    backgroundColor: error ? '#FF6B6B' : loading ? '#888888' : getStatusColor(systemMetrics.system.status),
                    color: '#1F2937',
                    fontWeight: 600
                  }} 
                />
                {error && (
                  <Typography variant="caption" sx={{ color: '#FF6B6B' }}>
                    {error}
                  </Typography>
                )}
              </Box>
              
              <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                Last Update: {lastUpdate.toLocaleTimeString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Module Instruments */}
        <Grid container spacing={3}>
          {modules.map((module, index) => (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card sx={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  height: '200px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: '#3B82F6',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Module Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: '#3B82F6' }}>
                          {module.icon}
                        </Box>
                        <Typography variant="subtitle2" sx={{ 
                          color: '#374151',
                          fontWeight: 600
                        }}>
                          {module.label}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: getStatusColor(module.data.status),
                            fontWeight: 700
                          }}
                        >
                          {getStatusIcon(module.data.status)} {module.data.status?.toUpperCase()}
                        </Typography>
                        
                        <Tooltip title={`Export ${module.label} data`}>
                          <IconButton 
                            size="medium"
                            onClick={() => handleExport(module.id)}
                            disabled={isExporting || loading}
                            sx={{ 
                              color: '#3B82F6',
                              padding: '6px',
                              '&:hover': { backgroundColor: 'rgba(0, 212, 170, 0.1)' },
                              '&:disabled': { color: '#666666' }
                            }}
                          >
                            <DownloadIcon sx={{ fontSize: '20px' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Main Metric */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="h3" sx={{ 
                        color: '#1F2937',
                        fontWeight: 700,
                        textAlign: 'center',
                        mb: 1
                      }}>
                        {module.data.count !== undefined ? module.data.count : module.data.uptime}
                      </Typography>
                      
                      {module.data.trend && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <TrendIcon sx={{ color: '#3B82F6', fontSize: '1rem' }} />
                          <Typography variant="body2" sx={{ color: '#3B82F6' }}>
                            {module.data.trend}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Activity Status */}
                    <Typography variant="caption" sx={{ 
                      color: '#6B7280',
                      textAlign: 'center',
                      mt: 1
                    }}>
                      {module.data.activity}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  );
}

export default InstrumentCluster;
