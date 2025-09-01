import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Button,
  Checkbox,
  Menu
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { AnimatedButton, AnimatedCard } from './AnimatedComponents';
import StudentForm from './StudentForm';
import NotificationService from '../services/notificationService';

const API_BASE_URL = 'http://localhost:8000';

// List View Component
const ListView = ({ type = 'products' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [showStudentForm, setShowStudentForm] = useState(false);
  
  // Bulk selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Status update states
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedItemForStatus, setSelectedItemForStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Configuration for different list types
  const config = {
    products: {
      title: 'Products Management',
      icon: <InventoryIcon />,
      endpoint: '/api/products',
      columns: [
        { key: 'name', label: 'Product Name', type: 'text' },
        { key: 'sku', label: 'SKU', type: 'text' },
        { key: 'unit_price', label: 'Price', type: 'number', prefix: '$' },
        { key: 'category_name', label: 'Category', type: 'text' },
        { key: 'quantity_available', label: 'Stock', type: 'number' },
        { key: 'status', label: 'Status', type: 'status' }
      ]
    },
    students: {
      title: 'Student Management',
      icon: <SchoolIcon />,
      endpoint: '/api/students',
      columns: [
        { key: 'name', label: 'Full Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
        { key: 'year_of_study', label: 'Year', type: 'number' },
        { key: 'is_active', label: 'Status', type: 'status' }
      ]
    },
    orders: {
      title: 'Orders Management',
      icon: <AssignmentIcon />,
      endpoint: '/api/orders',
      columns: [
        { key: 'order_number', label: 'Order #', type: 'number', prefix: '' },
        { key: 'student_name', label: 'Student', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
        { key: 'total_items', label: 'Items', type: 'number' },
        { key: 'total_value', label: 'Value', type: 'number', prefix: '$' },
        { key: 'requested_date', label: 'Date', type: 'date' },
        { key: 'status', label: 'Status', type: 'status' }
      ]
    }
  };

  // Get form fields dynamically
  const getFormFields = () => {
    switch (type) {
      case 'products':
        return [
          { key: 'name', label: 'Product Name', type: 'text', required: true },
          { key: 'sku', label: 'SKU', type: 'text', required: true },
          { key: 'unit_price', label: 'Price', type: 'number', required: true },
          { key: 'category_id', label: 'Category', type: 'select', required: true, 
            options: categories?.map(cat => ({ value: cat.id, label: cat.name })) || [] },
          { key: 'quantity_total', label: 'Total Stock', type: 'number', required: true },
          { key: 'quantity_available', label: 'Available Stock', type: 'number', required: true },
          { key: 'description', label: 'Description', type: 'text', multiline: true }
        ];
      case 'students':
        return [
          { key: 'student_id', label: 'Student ID', type: 'text', required: false }, // Made optional
          { key: 'name', label: 'Full Name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: false }, // Made optional
          { key: 'phone', label: 'Phone Number', type: 'text' },
          { key: 'department', label: 'Department', type: 'text', required: true },
          { key: 'year_of_study', label: 'Year of Study', type: 'select', 
            options: [1, 2, 3, 4].map(year => ({ value: year, label: `Year ${year}` })), required: false }, // Made optional
          { key: 'course', label: 'Course', type: 'text' }
        ];
      case 'orders':
        return [
          { key: 'student_id', label: 'Student', type: 'select', required: true,
            options: students?.map(student => ({ value: student.id, label: `${student.name} (${student.student_id})` })) || [] },
          { key: 'product_id', label: 'Product', type: 'select', required: true,
            options: products?.map(product => ({ value: product.id, label: `${product.name} - $${product.unit_price}` })) || [] },
          { key: 'quantity_requested', label: 'Quantity', type: 'number', required: true },
          { key: 'notes', label: 'Notes', type: 'text', multiline: true },
          { key: 'expected_return_date', label: 'Expected Return Date', type: 'date' }
        ];
      default:
        return [];
    }
  };

  const currentConfig = config[type];

  if (!currentConfig) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Configuration not found for type: {type}
        </Typography>
      </Box>
    );
  }

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);  // Clear any existing errors
      console.log(`Fetching data for ${type} from ${API_BASE_URL}${currentConfig.endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${currentConfig.endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache busting to ensure fresh data
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Fetched ${type} data:`, result);
      
      const dataArray = Array.isArray(result) ? result : [];
      setData(dataArray);
      console.log(`Updated ${type} state with ${dataArray.length} items`);
      
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for products
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch students for orders
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`);
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  // Fetch products for orders
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    console.log('ListView useEffect triggered for type:', type);
    console.log('Current config:', config[type]);
    console.log('Will fetch from:', `${API_BASE_URL}${config[type]?.endpoint}`);
    
    fetchData();
    if (type === 'products') {
      fetchCategories();
    }
    if (type === 'orders') {
      fetchStudents();
      fetchProducts();
    }
  }, [type]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      console.log('Submitting form data for type:', type, 'Data:', formData);
      
      // Validate required fields
      const fields = getFormFields();
      const requiredFields = fields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !formData[field.key] || formData[field.key] === '');
      
      if (missingFields.length > 0) {
        const missingFieldNames = missingFields.map(field => field.label).join(', ');
        setError(`Please fill in all required fields: ${missingFieldNames}`);
        setSubmitting(false);
        return;
      }
      
      let requestBody;
      
      // Special handling for orders
      if (type === 'orders' && !editingItem) {
        // Transform form data to order API format
        requestBody = {
          student_id: formData.student_id,
          items: [{
            product_id: formData.product_id,
            quantity_requested: parseInt(formData.quantity_requested || 1),
            expected_return_date: formData.expected_return_date || null,
            notes: formData.notes || null
          }],
          notes: formData.notes || null,
          expected_return_date: formData.expected_return_date || null
        };
      } else {
        requestBody = formData;
      }
      
      console.log('Request body for', type, ':', requestBody);
      console.log('Form data original:', formData);
      
      // Special validation for students
      if (type === 'students') {
        console.log('Student creation - checking required fields:');
        console.log('Name:', requestBody.name);
        console.log('Department:', requestBody.department);
        console.log('Student ID:', requestBody.student_id);
        
        // If no student_id provided, we should let the backend generate one
        if (!requestBody.student_id || requestBody.student_id.trim() === '') {
          console.log('No student ID provided, backend will auto-generate');
          // Remove empty student_id so backend generates one
          delete requestBody.student_id;
        }
      }
      
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${API_BASE_URL}${currentConfig.endpoint}/${editingItem.id}`
        : `${API_BASE_URL}${currentConfig.endpoint}`;

      console.log('Making request to:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Response status:', response.status, 'Error data:', errorData);
        
        // For students, be more specific about what's happening
        if (type === 'students') {
          console.log('Student creation failed with status:', response.status);
          console.log('Error details:', errorData);
          
          // Check if it's a duplicate student ID issue
          if (response.status === 409 || 
              (response.status === 500 && 
               (errorData.detail?.includes('already exists') || 
                errorData.detail?.includes('duplicate key') ||
                errorData.detail?.includes('UNIQUE constraint')))) {
            
            setError(`Student creation failed: ${errorData.detail || 'Student ID already exists. Please use a different Student ID.'}`);
            setSubmitting(false);
            return;
          }
        }
        
        throw new Error(errorData.detail || `Failed to ${editingItem ? 'update' : 'create'} ${type}`);
      }

      // If we get here, the creation was actually successful
      console.log('Successfully created/updated item, refreshing data...');
      const responseData = await response.json();
      console.log('Created item response:', responseData);
      
      // Send notification based on the type and action
      const itemName = responseData.name || responseData.student_id || responseData.order_number || 'Item';
      if (editingItem) {
        NotificationService.success(
          `${type.slice(0, -1)} Updated`,
          `${itemName} has been successfully updated`,
          null
        );
      } else {
        // Send specific notifications based on type
        switch (type) {
          case 'students':
            NotificationService.studentCreated(itemName);
            break;
          case 'products':
            NotificationService.productCreated(itemName);
            break;
          case 'orders':
            NotificationService.orderCreated(itemName);
            break;
          default:
            NotificationService.success(
              `${type.slice(0, -1)} Created`,
              `${itemName} has been successfully created`,
              null
            );
        }
      }
      
      handleCloseDialog();
      setError(null);
      
      // Refresh data immediately to show the new item
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const itemToDelete = data.find(item => item.id === id);
      const itemName = itemToDelete?.name || itemToDelete?.student_id || itemToDelete?.order_number || 'Item';
      
      const response = await fetch(`${API_BASE_URL}${currentConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      // Send success notification
      NotificationService.success(
        `${type.slice(0, -1)} Deleted`,
        `${itemName} has been successfully deleted`,
        null
      );

      await fetchData();
      // Clear selections after successful delete
      setSelectedItems([]);
      setSelectAll(false);
    } catch (err) {
      setError(err.message);
      NotificationService.error(
        'Delete Failed',
        `Failed to delete ${type.slice(0, -1)}: ${err.message}`,
        null
      );
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedItems(data.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Update select all checkbox based on selection
      setSelectAll(newSelection.length === data.length && data.length > 0);
      
      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      setError('Please select items to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedItems.length} selected ${type}? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setBulkDeleting(true);
    setError(null);

    try {
      // Delete items in parallel for better performance
      const deletePromises = selectedItems.map(itemId =>
        fetch(`${API_BASE_URL}${currentConfig.endpoint}/${itemId}`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if all deletions were successful
      const failedDeletions = responses.filter(response => !response.ok);
      
      if (failedDeletions.length > 0) {
        throw new Error(`Failed to delete ${failedDeletions.length} items`);
      }

      // Clear selections and refresh data
      setSelectedItems([]);
      setSelectAll(false);
      await fetchData();
      
      // Show success notification
      NotificationService.bulkDeleteCompleted(type, selectedItems.length);
      
    } catch (err) {
      setError(`Bulk delete failed: ${err.message}`);
      NotificationService.bulkDeleteFailed(type, selectedItems.length);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clear selections when data changes (e.g., when switching between modules)
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [type, data.length]);

  // Status update function
  const handleStatusUpdate = async (itemId, newStatus) => {
    if (type !== 'orders') return; // Only allow status updates for orders
    
    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${itemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh data to show the updated status
      await fetchData();
      
      // Close the menu
      setStatusMenuAnchor(null);
      setSelectedItemForStatus(null);
      
      console.log(`Status updated to ${newStatus} for order ${itemId}`);
      
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle status menu open
  const handleStatusMenuOpen = (event, item) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setSelectedItemForStatus(item);
  };

  // Handle status menu close
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setSelectedItemForStatus(null);
  };

  // Dialog handlers
  const handleOpenDialog = (item = null) => {
    console.log('=== HANDLE OPEN DIALOG ===');
    console.log('Item passed:', item);
    console.log('Current openDialog state:', openDialog);
    
    setEditingItem(item);
    setFormData(item || {});
    setOpenDialog(true);
    
    console.log('Set openDialog to true');
    console.log('Set formData to:', item || {});
    console.log('Set editingItem to:', item);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({});
  };

  // Status chip component
  const StatusChip = ({ status }) => {
    const getStatusColor = () => {
      if (!status) return 'default';
      const statusLower = status.toLowerCase();
      
      // Order statuses
      if (statusLower === 'pending') return 'warning';
      if (statusLower === 'approved') return 'info';
      if (statusLower === 'completed') return 'success';
      if (statusLower === 'overdue') return 'error';
      
      // General statuses
      if (statusLower.includes('active') || statusLower.includes('in stock')) return 'success';
      if (statusLower.includes('low') || statusLower.includes('pending')) return 'warning';
      if (statusLower.includes('out') || statusLower.includes('inactive')) return 'error';
      return 'default';
    };

    const getStatusIcon = () => {
      if (!status) return null;
      const statusLower = status.toLowerCase();
      
      if (statusLower === 'pending') return <ScheduleIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      if (statusLower === 'approved') return <CheckIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      if (statusLower === 'completed') return <CheckCircleIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      if (statusLower === 'overdue') return <CancelIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      
      return null;
    };

    return (
      <Chip
        icon={getStatusIcon()}
        label={status || 'Unknown'}
        color={getStatusColor()}
        size="small"
        sx={{
          fontWeight: 600,
          '& .MuiChip-label': {
            color: '#FFFFFF'
          }
        }}
      />
    );
  };

  // Render cell content
  const renderCellContent = (item, column) => {
    let value = item[column.key];
    
    // Handle special cases
    if (column.key === 'is_active' && typeof value === 'boolean') {
      value = value ? 'Active' : 'Inactive';
    }
    
    switch (column.type) {
      case 'status':
        return <StatusChip status={value} />;
      case 'number':
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#00D4AA' }}>
            {column.prefix || ''}{value}
          </Typography>
        );
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'email':
        return (
          <Typography variant="body2" sx={{ color: '#00D4AA' }}>
            {value}
          </Typography>
        );
      default:
        return value || '-';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress sx={{ color: '#00D4AA' }} />
      </Box>
    );
  }

  return (
    <AnimatedCard sx={{ 
      overflow: 'visible',
      position: 'relative',
      // Ensure proper spacing around the card
      m: 2,
      // Prevent any layout issues
      boxSizing: 'border-box'
    }}>
      <Box sx={{ 
        p: 3,
        // Ensure the card has proper overflow handling
        overflow: 'visible',
        position: 'relative',
        // Ensure proper width calculation
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',  // Changed to flex-start to prevent overlap
          mb: 4,  // Increased margin bottom
          // Enhanced padding and spacing for better button accessibility
          pr: 0,  // Remove right padding to prevent overflow
          pb: 2,
          pt: 1,
          overflow: 'visible',
          position: 'relative',
          minHeight: '70px', // Increased height
          width: '100%',  // Ensure full width
          boxSizing: 'border-box'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            flex: '1 1 auto',  // Allow shrinking
            minWidth: 0,  // Allow shrinking
            maxWidth: selectedItems.length > 0 ? 'calc(100% - 320px)' : 'calc(100% - 240px)'  // Reserve more space when bulk delete is visible
          }}>
            {currentConfig.icon}
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#FFFFFF',
              whiteSpace: 'nowrap',  // Prevent text wrapping
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentConfig.title}
            </Typography>
            <Badge badgeContent={data.length} color="primary" sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#00D4AA',
                color: '#0A0A0A'
              }
            }}>
              <Box />
            </Badge>
          </Box>
          
          <Box sx={{ 
            // Fixed button container to prevent overlap
            width: selectedItems.length > 0 ? '320px' : '240px',  // Increased width when bulk delete is visible
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,  // Add gap between buttons
            overflow: 'visible',
            position: 'relative',
            zIndex: 1000,  // Higher z-index
            flexShrink: 0,  // Prevent shrinking
            ml: 2  // Small left margin
          }}>
            {/* Bulk Delete Button - only show when items are selected */}
            {selectedItems.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                sx={{
                  minHeight: '44px',
                  px: 2,
                  py: 1.25,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  border: '1px solid rgba(255, 82, 82, 0.3)',
                  color: '#FF5252',
                  '&:hover': {
                    border: '1px solid rgba(255, 82, 82, 0.6)',
                    backgroundColor: 'rgba(255, 82, 82, 0.08)'
                  },
                  '&:disabled': {
                    border: '1px solid rgba(255, 82, 82, 0.2)',
                    color: 'rgba(255, 82, 82, 0.5)'
                  }
                }}
              >
                {bulkDeleting ? (
                  <CircularProgress size={16} sx={{ color: '#FF5252' }} />
                ) : (
                  `Delete (${selectedItems.length})`
                )}
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                console.log('Manual refresh triggered for:', type);
                fetchData();
              }}
              sx={{
                minHeight: '44px',
                px: 2,
                py: 1.25,
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                border: '1px solid rgba(0, 212, 170, 0.3)',
                color: '#00D4AA',
                '&:hover': {
                  border: '1px solid rgba(0, 212, 170, 0.6)',
                  backgroundColor: 'rgba(0, 212, 170, 0.08)'
                }
              }}
            >
              Refresh
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                if (type === 'students') {
                  setShowStudentForm(true);
                } else {
                  handleOpenDialog();
                }
              }}
              sx={{
                backgroundColor: '#00D4AA',
                color: '#0A0A0A',
                minHeight: '44px',
                px: 2.5,
                py: 1.25,
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '10px',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#00B899',
                },
              }}
            >
              Add {type.slice(0, -1)}
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: '#2A1A1A', color: '#FF5252' }}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            backgroundColor: '#1A1A1A',
            borderRadius: '12px',
            border: '1px solid #2A2A2A',
            // Remove any height restrictions that might limit display
            maxHeight: 'none',
            height: 'auto',
            overflow: 'visible'
          }}
        >
          <Table stickyHeader={false}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#252525' }}>
                {/* Select All Checkbox Column */}
                <TableCell 
                  sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A',
                    width: '60px',
                    textAlign: 'center'
                  }}
                >
                  <Tooltip title={selectAll ? 'Deselect All' : 'Select All'}>
                    <Checkbox
                      checked={selectAll}
                      indeterminate={selectedItems.length > 0 && selectedItems.length < data.length}
                      onChange={handleSelectAll}
                      disabled={data.length === 0}
                      sx={{
                        color: '#00D4AA',
                        '&.Mui-checked': {
                          color: '#00D4AA',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: '#00D4AA',
                        }
                      }}
                    />
                  </Tooltip>
                </TableCell>
                {currentConfig.columns.map((column) => (
                  <TableCell 
                    key={column.key}
                    sx={{ 
                      color: '#FFFFFF', 
                      fontWeight: 700,
                      borderBottom: '1px solid #2A2A2A'
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell 
                  sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A',
                    textAlign: 'center'
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Debug info */}
              {console.log('Rendering table with data:', data)}
              {console.log('Data length:', data.length)}
              
              <AnimatePresence>
                {data && data.length > 0 ? data.map((item, index) => {
                  console.log(`Rendering row ${index}:`, item);
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <motion.tr
                      key={item.id || `item-${index}`}
                      component={TableRow}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02 }} // Reduced delay for faster rendering
                      sx={{
                        '&:hover': {
                          backgroundColor: '#252525'
                        },
                        backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                        borderBottom: '1px solid #2A2A2A'
                      }}
                    >
                      {/* Individual Select Checkbox */}
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid #2A2A2A',
                          textAlign: 'center',
                          width: '60px'
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectItem(item.id)}
                          sx={{
                            color: '#00D4AA',
                            '&.Mui-checked': {
                              color: '#00D4AA',
                            }
                          }}
                        />
                      </TableCell>
                      {currentConfig.columns.map((column) => (
                        <TableCell 
                          key={`${item.id}-${column.key}`}
                          sx={{ 
                            color: '#E0E0E0',
                            borderBottom: '1px solid #2A2A2A'
                          }}
                        >
                          {renderCellContent(item, column)}
                        </TableCell>
                      ))}
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid #2A2A2A',
                          textAlign: 'center'
                        }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleOpenDialog(item)}
                            sx={{ color: '#00D4AA', mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Status Update Button - only for orders */}
                        {type === 'orders' && (
                          <Tooltip title="Update Status">
                            <IconButton
                              onClick={(e) => handleStatusMenuOpen(e, item)}
                              sx={{ color: '#FFB74D', mr: 1 }}
                              disabled={updatingStatus}
                            >
                              {updatingStatus && selectedItemForStatus?.id === item.id ? (
                                <CircularProgress size={20} sx={{ color: '#FFB74D' }} />
                              ) : (
                                <MoreVertIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(item.id)}
                            sx={{ color: '#FF5252' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </motion.tr>
                  );
                }) : null}
              </AnimatePresence>
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell 
                    colSpan={currentConfig.columns.length + 2} // +2 for checkbox and actions columns
                    sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: '#888888',
                      borderBottom: 'none'
                    }}
                  >
                    No {type} found. Click "Add {type.slice(0, -1)}" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: '12px'
            }
          }}
        >
          <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
            {editingItem ? `Edit ${type.slice(0, -1)}` : `Add New ${type.slice(0, -1)}`}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {getFormFields().map((field) => {
                if (field.type === 'select') {
                  return (
                    <FormControl key={field.key} fullWidth required={field.required}
                      error={field.required && (!formData[field.key] || formData[field.key] === '')}
                    >
                      <InputLabel sx={{ color: '#888888' }}>
                        {field.label}{field.required ? ' *' : ''}
                      </InputLabel>
                      <Select
                        value={formData[field.key] || ''}
                        onChange={(e) => {
                          console.log(`Select field ${field.key} changed to:`, e.target.value);
                          setFormData({...formData, [field.key]: e.target.value});
                          console.log('Updated formData:', {...formData, [field.key]: e.target.value});
                        }}
                        sx={{
                          color: '#FFFFFF',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: field.required && (!formData[field.key] || formData[field.key] === '') ? '#f44336' : '#2A2A2A'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#00D4AA'
                          }
                        }}
                      >
                        {field.options?.map((option) => (
                          <MenuItem 
                            key={typeof option === 'object' ? option.value : option} 
                            value={typeof option === 'object' ? option.value : option} 
                            sx={{ color: '#FFFFFF' }}
                          >
                            {typeof option === 'object' ? option.label : option}
                          </MenuItem>
                        ))}
                      </Select>
                      {field.required && (!formData[field.key] || formData[field.key] === '') && (
                        <span style={{ color: '#f44336', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                          This field is required
                        </span>
                      )}
                    </FormControl>
                  );
                }

                return (
                  <TextField
                    key={field.key}
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    type={field.type === 'date' ? 'date' : field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => {
                      console.log(`Field ${field.key} changed to:`, e.target.value);
                      setFormData({...formData, [field.key]: e.target.value});
                      console.log('Updated formData:', {...formData, [field.key]: e.target.value});
                    }}
                    required={field.required}
                    multiline={field.multiline}
                    rows={field.multiline ? 3 : 1}
                    fullWidth
                    error={field.required && (!formData[field.key] || formData[field.key] === '')}
                    helperText={field.required && (!formData[field.key] || formData[field.key] === '') ? 'This field is required' : ''}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#888888' },
                      '& .MuiInputBase-input': { color: '#FFFFFF' },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2A2A2A'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00D4AA'
                      }
                    }}
                  />
                );
              })}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              disabled={submitting}
              sx={{ color: '#FFFFFF', borderColor: '#2A2A2A' }}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('=== REGULAR BUTTON CLICKED ===');
                console.log('Event:', e);
                console.log('Button disabled?', submitting);
                console.log('Current formData:', formData);
                console.log('Form fields:', getFormFields());
                console.log('Required fields:', getFormFields().filter(field => field.required));
                console.log('Calling handleSubmit...');
                try {
                  handleSubmit();
                  console.log('handleSubmit called successfully');
                } catch (error) {
                  console.error('Error calling handleSubmit:', error);
                }
              }}
              variant="contained"
              disabled={submitting}
              type="button"
              sx={{
                backgroundColor: '#00D4AA',
                color: '#0A0A0A',
                '&:hover': {
                  backgroundColor: '#00B899',
                },
                '&:disabled': {
                  backgroundColor: '#666666',
                  color: '#CCCCCC'
                }
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: '#0A0A0A' }} />
              ) : (
                editingItem ? 'Update' : 'Create'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Student Form - Dedicated form for students */}
        {type === 'students' && (
          <StudentForm
            open={showStudentForm}
            onClose={() => setShowStudentForm(false)}
            onSuccess={(newStudent) => {
              fetchData(); // Refresh the student list
            }}
          />
        )}

        {/* Status Update Menu - only for orders */}
        {type === 'orders' && (
          <Menu
            anchorEl={statusMenuAnchor}
            open={Boolean(statusMenuAnchor)}
            onClose={handleStatusMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                minWidth: '180px'
              }
            }}
          >
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'pending')}
              sx={{ 
                color: '#FFFFFF',
                '&:hover': { backgroundColor: '#2A2A2A' }
              }}
            >
              <ScheduleIcon sx={{ mr: 1, color: '#FFB74D' }} />
              Pending
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'approved')}
              sx={{ 
                color: '#FFFFFF',
                '&:hover': { backgroundColor: '#2A2A2A' }
              }}
            >
              <CheckIcon sx={{ mr: 1, color: '#2196F3' }} />
              Approved
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'completed')}
              sx={{ 
                color: '#FFFFFF',
                '&:hover': { backgroundColor: '#2A2A2A' }
              }}
            >
              <CheckCircleIcon sx={{ mr: 1, color: '#4CAF50' }} />
              Completed
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'overdue')}
              sx={{ 
                color: '#FFFFFF',
                '&:hover': { backgroundColor: '#2A2A2A' }
              }}
            >
              <CancelIcon sx={{ mr: 1, color: '#F44336' }} />
              Overdue
            </MenuItem>
          </Menu>
        )}
      </Box>
    </AnimatedCard>
  );
};

export default ListView;
