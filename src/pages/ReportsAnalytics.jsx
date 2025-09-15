import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl, InputLabel,
  Select, MenuItem, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert,
  Chip, IconButton, Tooltip, Switch, FormControlLabel, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Assessment, Inventory, Timeline, Download, Print,
  Refresh, Analytics, TableChart,
  PictureAsPdf, InsertChart, ShowChart, DonutLarge, AutoGraph,
  CloudDownload, Schedule, Notifications, Speed, DataUsage
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000/api';

// Color schemes for charts
const COLORS = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

function ReportsAnalytics() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedModules, setSelectedModules] = useState(['products', 'students', 'orders']);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Data states
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [moduleAnalytics, setModuleAnalytics] = useState({});
  const [overviewCharts, setOverviewCharts] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(fetchRealTimeMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [reportType, dateRange]);

  const fetchRealTimeMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/metrics/realtime`);
      if (response.ok) {
        const data = await response.json();
        setRealTimeMetrics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  }, []);

  const fetchModuleAnalytics = useCallback(async (module) => {
    try {
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `${API_BASE_URL}/analytics/modules/${module}?start_date=${startDate}&end_date=${endDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setModuleAnalytics(prev => ({ ...prev, [module]: data }));
      }
    } catch (error) {
      console.error(`Error fetching ${module} analytics:`, error);
    }
  }, [dateRange]);

  const fetchOverviewCharts = useCallback(async () => {
    try {
      const days = getDaysFromRange(dateRange);
      const response = await fetch(`${API_BASE_URL}/analytics/charts/overview?days=${days}`);
      
      if (response.ok) {
        const data = await response.json();
        setOverviewCharts(data);
      }
    } catch (error) {
      console.error('Error fetching overview charts:', error);
    }
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchRealTimeMetrics(),
        fetchOverviewCharts(),
        ...selectedModules.map(module => fetchModuleAnalytics(module))
      ]);
    } catch (error) {
      setError('Failed to load analytics data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format = 'excel') => {
    setLoading(true);
    try {
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString().split('T')[0];
      
      const exportRequest = {
        modules: selectedModules,
        format: format,
        filters: {
          start_date: startDate,
          end_date: endDate
        },
        include_analytics: true
      };

      const response = await fetch(`${API_BASE_URL}/analytics/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportRequest),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'zip'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExportDialogOpen(false);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setError('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleExport = async (module, format = 'csv') => {
    setLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      let endpoint = '';
      let fileName = '';
      
      // Map module to actual API endpoint
      switch (module) {
        case 'products':
          endpoint = `${API_BASE_URL}/products`;
          fileName = 'products_detailed';
          break;
        case 'students':
          endpoint = `${API_BASE_URL}/students`;
          fileName = 'students_detailed';
          break;
        case 'orders':
          endpoint = `${API_BASE_URL}/orders`;
          fileName = 'orders_detailed';
          break;
        case 'invoices':
          endpoint = `${API_BASE_URL}/invoices`;
          fileName = 'invoices_detailed';
          break;
        case 'categories':
          endpoint = `${API_BASE_URL}/categories`;
          fileName = 'categories_detailed';
          break;
        case 'users':
          endpoint = `${API_BASE_URL}/users`;
          fileName = 'users_detailed';
          break;
        default:
          throw new Error(`Unknown module: ${module}`);
      }

      console.log(`Attempting to fetch data from: ${endpoint}`);
      const response = await fetch(endpoint);
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} records for ${module}`);
      
      if (data && data.length > 0) {
          let processedData = [];
          
          // Process data based on module type
          if (module === 'products') {
            processedData = data.map(item => ({
              ID: item.id,
              Name: item.name,
              Description: item.description || '',
              Category: item.category_name || 'Uncategorized',
              SKU: item.sku,
              'Total Quantity': item.quantity_total,
              'Available Quantity': item.quantity_available,
              'Quantity Issued': item.quantity_total - item.quantity_available,
              'Returnable': item.is_returnable ? 'Yes' : 'No',
              'Unit Price': `$${item.unit_price}`,
              'Total Value': `$${(item.quantity_available * item.unit_price).toFixed(2)}`,
              Location: item.location || '',
              'Min Stock Level': item.minimum_stock_level,
              'Stock Status': item.quantity_available <= item.minimum_stock_level ? 'Low Stock' : 'In Stock',
              Status: item.status,
              'Image URL': item.image_url || '',
              Specifications: item.specifications ? JSON.stringify(item.specifications) : '',
              Tags: item.tags ? item.tags.join('; ') : '',
              'Created At': new Date(item.created_at).toLocaleString(),
              'Updated At': new Date(item.updated_at).toLocaleString()
            }));
          } else if (module === 'students') {
            processedData = data.map(item => ({
              'Database ID': item.id,
              'Student ID': item.student_id,
              'Full Name': item.name,
              Email: item.email,
              Phone: item.phone || '',
              Department: item.department,
              'Year of Study': item.year_of_study || '',
              Course: item.course || '',
              'Account Status': item.is_active ? 'Active' : 'Inactive',
              'Registered Date': new Date(item.created_at).toLocaleString(),
              'Last Updated': new Date(item.updated_at).toLocaleString()
            }));
          } else if (module === 'orders') {
            // Flatten orders with their items for detailed export
            data.forEach(order => {
              const baseOrderInfo = {
                'Order ID': order.id,
                'Order Number': order.order_number,
                'Student ID': order.student_id,
                'Student Name': order.student_name,
                'Student Email': order.student_email,
                Department: order.department,
                'Order Type': order.order_type,
                'Order Status': order.status,
                'Total Items': order.total_items,
                'Total Value': `$${order.total_value}`,
                'Order Notes': order.notes || '',
                'Requested Date': new Date(order.requested_date).toLocaleString(),
                'Approved Date': order.approved_date ? new Date(order.approved_date).toLocaleString() : '',
                'Completed Date': order.completed_date ? new Date(order.completed_date).toLocaleString() : '',
                'Expected Return': order.expected_return_date ? new Date(order.expected_return_date).toLocaleDateString() : '',
                'Actual Return': order.actual_return_date ? new Date(order.actual_return_date).toLocaleDateString() : '',
                'Approved By': order.approved_by || ''
              };
              
              if (order.items && order.items.length > 0) {
                order.items.forEach((item, index) => {
                  processedData.push({
                    ...baseOrderInfo,
                    'Item Number': index + 1,
                    'Product ID': item.product_id,
                    'Product Name': item.product_name,
                    'Quantity Requested': item.quantity_requested,
                    'Quantity Approved': item.quantity_approved,
                    'Quantity Returned': item.quantity_returned,
                    'Unit Price': `$${item.unit_price}`,
                    'Total Price': `$${item.total_price}`,
                    'Item Returnable': item.is_returnable ? 'Yes' : 'No',
                    'Item Expected Return': item.expected_return_date ? new Date(item.expected_return_date).toLocaleDateString() : '',
                    'Item Actual Return': item.actual_return_date ? new Date(item.actual_return_date).toLocaleDateString() : '',
                    'Return Condition': item.return_condition || '',
                    'Item Notes': item.notes || '',
                    'Item Status': item.status
                  });
                });
              } else {
                processedData.push({
                  ...baseOrderInfo,
                  'Item Number': 'No Items',
                  'Product ID': '',
                  'Product Name': '',
                  'Quantity Requested': '',
                  'Quantity Approved': '',
                  'Quantity Returned': '',
                  'Unit Price': '',
                  'Total Price': '',
                  'Item Returnable': '',
                  'Item Expected Return': '',
                  'Item Actual Return': '',
                  'Return Condition': '',
                  'Item Notes': '',
                  'Item Status': ''
                });
              }
            });
          } else if (module === 'invoices') {
            processedData = data.map(item => ({
              'Invoice ID': item.id,
              'Invoice Number': item.invoice_number,
              'Student ID': item.student_id,
              'Student Name': item.student_name || '',
              'Student Email': item.student_email || '',
              Department: item.department || '',
              'Invoice Date': new Date(item.invoice_date).toLocaleDateString(),
              'Due Date': item.due_date ? new Date(item.due_date).toLocaleDateString() : '',
              'Subtotal': `$${item.subtotal}`,
              'Tax Amount': `$${item.tax_amount}`,
              'Total Amount': `$${item.total_amount}`,
              Status: item.status,
              'Payment Status': item.payment_status || '',
              'Payment Date': item.payment_date ? new Date(item.payment_date).toLocaleDateString() : '',
              'Payment Method': item.payment_method || '',
              Notes: item.notes || '',
              'Created Date': new Date(item.created_at).toLocaleString(),
              'Updated Date': new Date(item.updated_at).toLocaleString()
            }));
          } else if (module === 'categories') {
            processedData = data.map(item => ({
              'Category ID': item.id,
              'Category Name': item.name,
              Description: item.description || '',
              'Created Date': new Date(item.created_at).toLocaleString(),
              'Updated Date': new Date(item.updated_at).toLocaleString()
            }));
          } else if (module === 'users') {
            processedData = data.map(item => ({
              'User ID': item.id,
              Username: item.username,
              'Full Name': item.full_name || '',
              Email: item.email || '',
              Role: item.role,
              'Account Status': item.is_active ? 'Active' : 'Inactive',
              'Email Verified': item.email_verified ? 'Yes' : 'No',
              'Last Login': item.last_login ? new Date(item.last_login).toLocaleString() : 'Never',
              'Created Date': new Date(item.created_at).toLocaleString(),
              'Updated Date': new Date(item.updated_at).toLocaleString()
            }));
          }

          // Generate CSV
          if (processedData.length > 0) {
            const headers = Object.keys(processedData[0]);
            const csvContent = [
              headers.join(','),
              ...processedData.map(row => headers.map(header => {
                const value = row[header];
                // Handle null/undefined values and escape commas
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                if (Array.isArray(value)) {
                  return `"${value.join('; ')}"`;
                }
                if (typeof value === 'object' && value !== null) {
                  return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }
                return value;
              }).join(','))
            ].join('\n');

            // Download the file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            link.download = `${fileName}_${timestamp}.csv`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Show success message
            setError(null);
            const message = module === 'orders' 
              ? `Exported ${data.length} orders (${processedData.length} total rows including items) to CSV`
              : `Exported ${processedData.length} ${module} records to CSV`;
            
            // You could replace this with a proper toast notification
            setTimeout(() => {
              alert(message);
            }, 100);
          } else {
            throw new Error(`No ${module} data to export`);
          }
        } else {
          throw new Error(`No ${module} data found`);
        }
    } catch (error) {
      console.error(`${module} export error:`, error);
      const errorMessage = error.message.includes('fetch') 
        ? `Failed to connect to ${module} API. Please check if the backend is running.`
        : `${module} export failed: ${error.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAllData = async () => {
    setLoading(true);
    try {
      const modules = ['products', 'students', 'orders', 'users', 'categories', 'invoices'];
      let successCount = 0;
      let errorMessages = [];

      // Show initial message
      setError('Starting comprehensive data export... This may take a moment.');

      for (const module of modules) {
        try {
          await handleModuleExport(module, 'csv');
          successCount++;
          // Brief pause between exports to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          console.error(`Failed to export ${module}:`, error);
          errorMessages.push(`${module}: ${error.message}`);
        }
      }

      // Final status message
      if (successCount === modules.length) {
        setError(null);
        setTimeout(() => {
          alert(`🎉 Complete! Successfully exported all ${successCount} modules to CSV files. Check your downloads folder.`);
        }, 100);
      } else if (successCount > 0) {
        const message = `Partially successful: ${successCount}/${modules.length} modules exported. Errors: ${errorMessages.join('; ')}`;
        setError(message);
        setTimeout(() => {
          alert(`⚠️ ${message}`);
        }, 100);
      } else {
        const message = `Export failed for all modules. Errors: ${errorMessages.join('; ')}`;
        setError(message);
      }
    } catch (error) {
      console.error('Comprehensive export error:', error);
      setError('Comprehensive export failed. Please try individual module exports.');
    } finally {
      setLoading(false);
    }
  };

  const testSimpleExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing simple export...');
      const response = await fetch(`${API_BASE_URL}/products`);
      console.log('Response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data.length, 'products');
      
      if (data && data.length > 0) {
        // Simple CSV generation
        const csvContent = 'Name,SKU,Quantity\n' + 
          data.map(item => `${item.name},${item.sku},${item.quantity_available}`).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'test_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert(`✅ Test export successful! ${data.length} products exported.`);
      } else {
        alert('❌ No data received from API');
      }
    } catch (error) {
      console.error('Test export error:', error);
      setError(`Test export failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case 'last7days': return new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      case 'last30days': return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
      case 'last90days': return new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
      case 'lastyear': return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
      default: return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    }
  };

  const getDaysFromRange = (range) => {
    switch (range) {
      case 'last7days': return 7;
      case 'last30days': return 30;
      case 'last90days': return 90;
      case 'lastyear': return 365;
      default: return 30;
    }
  };

  return (
    <Box sx={{ px: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50', display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>
            <Analytics sx={{ mr: 1, fontSize: 24, color: '#1976d2' }} />
            📈 Real-Time Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            Live data tracking, comprehensive reports, and intelligent insights
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Card sx={{ mb: 2, p: 1.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="overview">📊 Overview</MenuItem>
                  <MenuItem value="detailed">📋 Detailed</MenuItem>
                  <MenuItem value="trends">📈 Trends</MenuItem>
                  <MenuItem value="comparison">⚖️ Comparison</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="last7days">Last 7 Days</MenuItem>
                  <MenuItem value="last30days">Last 30 Days</MenuItem>
                  <MenuItem value="last90days">Last 90 Days</MenuItem>
                  <MenuItem value="lastyear">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRealTimeEnabled}
                    onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label="🔴 Live Updates"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                fullWidth
                onClick={fetchAllData}
                
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                startIcon={<Download />} 
                fullWidth
                onClick={() => testSimpleExport()}
                
              >
                Test Export
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                startIcon={<Download sx={{ fontSize: 24 }} />} 
                fullWidth
                onClick={() => setExportDialogOpen(true)}
                sx={{ fontSize: '1.1rem', py: 1.5 }}
              >
                Export Data
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                startIcon={<Print sx={{ fontSize: 24 }} />} 
                fullWidth
                sx={{ fontSize: '1.1rem', py: 1.5 }}
              >
                Print Report
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Individual Module Exports */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <CloudDownload sx={{ mr: 1, color: 'primary.main' }} />
            📋 Individual Module Exports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Export detailed data for each module separately with all database fields
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2, border: '1px solid #e0e0e0', '&:hover': { boxShadow: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Inventory sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Products</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete product data with categories, stock levels, pricing, and specifications
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      startIcon={<TableChart sx={{ fontSize: 24 }} />}
                      onClick={() => handleModuleExport('products', 'csv')}
                      
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                      }}
                    >
                      📊 Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2, border: '1px solid #e0e0e0', '&:hover': { boxShadow: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Students</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Student profiles with contact info, departments, order history, and statistics
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      startIcon={<TableChart sx={{ fontSize: 24 }} />}
                      onClick={() => handleModuleExport('students', 'csv')}
                      
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                      }}
                    >
                      👥 Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2, border: '1px solid #e0e0e0', '&:hover': { boxShadow: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">Orders</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete order records with borrowing dates, returns, status, and values
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      startIcon={<TableChart sx={{ fontSize: 24 }} />}
                      onClick={() => handleModuleExport('orders', 'csv')}
                      
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                      }}
                    >
                      📦 Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2, border: '1px solid #e0e0e0', '&:hover': { boxShadow: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Timeline sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">Invoices</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Invoice data with payment details, amounts, due dates, and student info
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      startIcon={<TableChart sx={{ fontSize: 24 }} />}
                      onClick={() => handleModuleExport('invoices', 'csv')}
                      
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                      }}
                    >
                      🧾 Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2, border: '1px solid #e0e0e0', '&:hover': { boxShadow: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Analytics sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Users</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  User accounts with roles, permissions, login history, and access details
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      startIcon={<TableChart sx={{ fontSize: 24 }} />}
                      onClick={() => handleModuleExport('users', 'csv')}
                      
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                      }}
                    >
                      👤 Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 2, border: '1px solid #e0e0e0', '&:hover': { boxShadow: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Analytics sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Categories</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Category data with product counts, inventory values, and statistics
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      startIcon={<TableChart sx={{ fontSize: 24 }} />}
                      onClick={() => handleModuleExport('categories', 'csv')}
                      
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                      }}
                    >
                      🏷️ Export CSV
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>

          {/* Export All Data Section */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.main', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              📦 Comprehensive Data Export
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
              Export all modules at once with complete database fields. This will generate separate CSV files for each module.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<Download sx={{ fontSize: 28 }} />}
              onClick={handleExportAllData}
              
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100', transform: 'translateY(-3px)', boxShadow: 6 },
                fontWeight: 700,
                fontSize: '1.1rem',
                px: 5,
                py: 2,
                borderRadius: 3,
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Exporting All Modules...' : '🚀 Export All Data'}
            </Button>
          </Box>
        </Card>

        {/* Real-Time Status */}
        <Card sx={{ mb: 3, p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Speed sx={{ color: 'white', fontSize: 30 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                System Status: {isRealTimeEnabled ? '🟢 LIVE' : '🔴 PAUSED'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Last updated: {lastUpdated.toLocaleTimeString()} • 
                Next update: {isRealTimeEnabled ? 'In 5 seconds' : 'Manual refresh required'}
              </Typography>
            </Grid>
            <Grid item>
              <Chip 
                label={`${selectedModules.length} modules active`} 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Grid>
          </Grid>
        </Card>

        {/* Real-Time Metrics */}
        {realTimeMetrics && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={1} sx={{ mb: 1.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white', py: 1, px: 1.5 }}>
                    <Inventory sx={{ fontSize: 24, mb: 0.2, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                      {realTimeMetrics.total_products}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.65rem' }}>
                      Total Products
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #81c784 0%, #66bb6a 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white', py: 1, px: 1.5 }}>
                    <Assessment sx={{ fontSize: 24, mb: 0.2, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                      {realTimeMetrics.total_students}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.65rem' }}>
                      Total Students
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #ffb74d 0%, #ffa726 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white', py: 1, px: 1.5 }}>
                    <TrendingUp sx={{ fontSize: 24, mb: 0.2, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                      {realTimeMetrics.active_orders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.65rem' }}>
                      Active Orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #e57373 0%, #ef5350 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white', py: 1, px: 1.5 }}>
                    <Timeline sx={{ fontSize: 24, mb: 0.2, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                      {realTimeMetrics.return_rate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.65rem' }}>
                      Return Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* Enhanced Metrics Grid */}
        {realTimeMetrics && (
          <Grid container spacing={1} sx={{ mb: 1.5 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent sx={{ py: 1, px: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <DataUsage sx={{ mr: 1, color: 'warning.main', fontSize: 18 }} />
                    <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>Revenue Insights</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main', fontSize: '1.25rem' }}>
                    ${realTimeMetrics.total_revenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Total Revenue • Avg: ${realTimeMetrics.average_order_value.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.2, fontSize: '0.65rem' }}>
                    📈 Most Popular: {realTimeMetrics.most_borrowed_category}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent sx={{ py: 1, px: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Notifications sx={{ mr: 1, color: 'error.main', fontSize: 18 }} />
                    <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>Stock Alerts</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main', fontSize: '1.25rem' }}>
                    {realTimeMetrics.low_stock_items}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Low Stock Items
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.2, fontSize: '0.65rem' }}>
                    ⚠️ Requires immediate attention
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent sx={{ py: 1, px: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Schedule sx={{ mr: 1, color: 'info.main', fontSize: 18 }} />
                    <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>Pending Returns</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main', fontSize: '1.25rem' }}>
                    {realTimeMetrics.pending_returns}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Items Out
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.2, fontSize: '0.65rem' }}>
                    📋 Awaiting return
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Charts Section */}
        {overviewCharts && (
          <Grid container spacing={0.5} sx={{ mb: 1 }}>
            {/* Daily Activity Chart */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent sx={{ py: 0.5, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                    <ShowChart sx={{ mr: 0.5, color: 'primary.main', fontSize: 16 }} />
                    <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>📊 Daily Activity Trends</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={overviewCharts.daily_activity}>
                      <defs>
                        <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="activities"
                        stroke="#1976d2"
                        fillOpacity={1}
                        fill="url(#colorActivities)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Category Distribution */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent sx={{ py: 0.5, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                    <DonutLarge sx={{ mr: 0.5, color: 'secondary.main', fontSize: 16 }} />
                    <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>🥧 Category Distribution</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={overviewCharts.category_distribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      >
                        {overviewCharts.category_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Status Distribution */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ py: 0.5, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                    <InsertChart sx={{ mr: 0.5, color: 'success.main', fontSize: 16 }} />
                    <Typography variant="h6" sx={{ fontSize: '0.8rem' }}>📈 Order Status Overview</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={overviewCharts.status_distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Module Analytics */}
        <AnimatePresence>
          {Object.entries(moduleAnalytics).map(([module, data]) => (
            <motion.div
              key={module}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    🏆 {module} Analytics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Summary: {JSON.stringify(data.summary)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudDownload sx={{ mr: 1, color: 'primary.main' }} />
              Export Analytics Data
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose your export format and modules to include:
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>Selected modules: {selectedModules.join(', ')}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Date range: {dateRange}</Typography>
            <Typography variant="body2">Include analytics summary: Yes</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="outlined" 
              onClick={() => handleExportData('csv')}
              
              startIcon={<TableChart />}
            >
              CSV Format
            </Button>
            <Button 
              variant="contained" 
              onClick={() => handleExportData('excel')}
              
              startIcon={<PictureAsPdf />}
            >
              Excel Format
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
}

export default ReportsAnalytics;
