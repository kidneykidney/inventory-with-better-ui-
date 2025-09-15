import React, { useState, useEffect } from 'react';
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
  Menu,
  Tabs,
  Tab,
  TableContainer as MuiTableContainer,
  Table as MuiTable,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TableCell as MuiTableCell,
  TableBody as MuiTableBody
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
  Cancel as CancelIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import NotificationService from '../services/notificationService';

const API_BASE_URL = 'http://localhost:8000';

// List View Component
const ListView = ({ type = 'products' }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Bulk selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Status update states
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedItemForStatus, setSelectedItemForStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Bulk items state (universal for all modules)
  const [bulkItems, setBulkItems] = useState([]);

  // Legacy bulk products state for backward compatibility
  const [bulkProducts, setBulkProducts] = useState([]);

  const initializeBulkItem = () => {
    switch (type) {
      case 'products':
        return {
          id: Date.now(),
          name: '',
          sku: '',
          unit_price: 0,
          category_id: '',
          quantity_total: 0,
          quantity_available: 0,
          description: '',
          location: '',
          is_returnable: true
        };
      case 'students':
        return {
          id: Date.now(),
          student_id: '',
          name: '',
          email: '',
          phone: '',
          department: '',
          year_of_study: '',
          course: ''
        };
      case 'orders':
        return {
          id: Date.now(),
          student_id: '',
          product_id: '',
          quantity_requested: 1,
          notes: '',
          expected_return_date: ''
        };
      default:
        return { id: Date.now() };
    }
  };

  useEffect(() => {
    // Initialize bulk items based on module type
    const initialItem = initializeBulkItem();
    setBulkItems([initialItem]);
    
    // Keep legacy products for backward compatibility
    if (type === 'products') {
      setBulkProducts([initialItem]);
    }
  }, [type]);

  // Configuration for different list types
  const config = {
    products: {
      title: 'Products Management',
      icon: <InventoryIcon />,
      endpoint: '/api/products',
      columns: [
        { key: 'name', label: 'Product Name', type: 'text' },
        { key: 'sku', label: 'SKU', type: 'text' },
        { key: 'unit_price', label: 'Price', type: 'number', prefix: '₹' },
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
      title: 'Lending Management',
      icon: <AssignmentIcon />,
      endpoint: '/api/orders',
      columns: [
        { key: 'order_number', label: 'Lending #', type: 'number', prefix: '' },
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
      setFilteredData(dataArray); // Initialize filtered data
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
      
      console.log('handleSubmit called for type:', type, 'Data:', formData);
      console.log('editingItem:', editingItem);
      
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

  // Universal bulk create function
  const handleBulkCreate = async () => {
    try {
      setSubmitting(true);
      let validItems = [];
      let moduleName = type.slice(0, -1);

      console.log('handleBulkCreate called for type:', type);
      console.log('Current bulkItems:', bulkItems);
      console.log('Current bulkProducts:', bulkProducts);

      // Validate items based on module type
      if (type === 'products') {
        validItems = bulkProducts.filter(product => 
          product.name.trim() && product.sku.trim()
        );
      } else if (type === 'students') {
        validItems = bulkItems.filter(student => 
          student.name.trim() && student.department.trim()
        );
      } else if (type === 'orders') {
        validItems = bulkItems.filter(order => 
          order.student_id && order.product_id && order.quantity_requested > 0
        );
      }

      if (validItems.length === 0) {
        const requiredFields = type === 'products' ? 'name and SKU' : 
                              type === 'students' ? 'name and department' :
                              type === 'orders' ? 'student, product and quantity' : 'required fields';
        setError(`Please add at least one valid ${moduleName} with ${requiredFields}`);
        setSubmitting(false);
        return;
      }

      const promises = validItems.map(item => {
        let itemData = { ...item };
        
        // Type-specific data processing
        if (type === 'products') {
          itemData = {
            ...item,
            category_id: item.category_id || null,
            quantity_total: Number(item.quantity_total) || 0,
            quantity_available: Number(item.quantity_available) || 0,
            unit_price: Number(item.unit_price) || 0
          };
        } else if (type === 'students') {
          itemData = {
            ...item,
            year_of_study: item.year_of_study ? Number(item.year_of_study) : null
          };
        } else if (type === 'orders') {
          // Orders require a different structure with items array
          itemData = {
            student_id: String(item.student_id),
            items: [{
              product_id: String(item.product_id),
              quantity_requested: Number(item.quantity_requested) || 1,
              notes: item.notes || null
            }],
            notes: item.notes || null,
            expected_return_date: item.expected_return_date || null
          };
        }
        
        // Remove the temporary id field
        delete itemData.id;
        
        return fetch(`${API_BASE_URL}${currentConfig.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        NotificationService.success(
          `Bulk ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}s Created`,
          `Successfully created ${successful} ${moduleName}${successful > 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
          null
        );
        handleCloseDialog();
        resetBulkForm();
        await fetchData(); // Refresh the data
      } else {
        setError(`Failed to create any ${type}`);
      }
    } catch (error) {
      setError(`Failed to create bulk ${type}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset bulk form
  const resetBulkForm = () => {
    const initialItem = initializeBulkItem();
    setBulkItems([initialItem]);
    
    if (type === 'products') {
      setBulkProducts([initialItem]);
    }
  };

  // Render bulk table headers based on module type
  const renderBulkTableHeaders = () => {
    const formFields = getFormFields();
    
    return (
      <MuiTableRow>
        {formFields.filter(field => field.type !== 'hidden').map(field => (
          <MuiTableCell 
            key={field.key}
            sx={{ 
              minWidth: field.key === 'description' || field.key === 'notes' ? 200 : 150, 
              fontWeight: 'bold', 
              color: '#374151', 
              backgroundColor: '#F9FAFB' 
            }}
          >
            {field.label.toUpperCase()}{field.required ? '*' : ''}
          </MuiTableCell>
        ))}
        <MuiTableCell sx={{ minWidth: 80, fontWeight: 'bold', color: '#374151', backgroundColor: '#F9FAFB' }}>
          ACTIONS
        </MuiTableCell>
      </MuiTableRow>
    );
  };

  // Render bulk table cells based on module type  
  const renderBulkTableCells = (item, itemIndex) => {
    const formFields = getFormFields();
    const itemsArray = type === 'products' ? bulkProducts : bulkItems;
    
    return (
      <MuiTableRow key={item.id}>
        {formFields.filter(field => field.type !== 'hidden').map(field => (
          <MuiTableCell key={field.key}>
            {field.type === 'select' ? (
              <Select
                size="small"
                fullWidth
                value={item[field.key] || ''}
                onChange={(e) => updateBulkItem(item.id, field.key, e.target.value)}
                displayEmpty
                sx={{
                  color: '#374151',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' }
                }}
              >
                <MenuItem value="">Select {field.label}</MenuItem>
                {field.options?.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            ) : field.type === 'checkbox' ? (
              <Checkbox
                size="small"
                checked={item[field.key] || false}
                onChange={(e) => updateBulkItem(item.id, field.key, e.target.checked)}
                sx={{ color: '#3B82F6' }}
              />
            ) : (
              <TextField
                size="small"
                fullWidth
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                value={item[field.key] || ''}
                onChange={(e) => updateBulkItem(item.id, field.key, field.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                error={field.required && !item[field.key]}
                multiline={field.multiline}
                rows={field.multiline ? 2 : 1}
                InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                sx={{
                  '& .MuiInputBase-input': { color: '#374151' },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: field.required && !item[field.key] ? '#f44336' : '#E5E7EB' 
                  }
                }}
              />
            )}
          </MuiTableCell>
        ))}
        <MuiTableCell>
          {itemsArray.length > 1 && (
            <IconButton
              size="small"
              color="error"
              onClick={() => removeBulkItem(item.id)}
              sx={{ '&:hover': { backgroundColor: '#FEF2F2' } }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </MuiTableCell>
      </MuiTableRow>
    );
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
      setSelectedItems(filteredData.map(item => item.id));
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
      setSelectAll(newSelection.length === filteredData.length && filteredData.length > 0);
      
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

  // Search filtering effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = data.filter(item => {
        // Search across all relevant text fields
        const searchableFields = currentConfig.columns
          .filter(col => col.type === 'text' || col.type === 'email')
          .map(col => col.key);
        
        return searchableFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(query);
        });
      });
      setFilteredData(filtered);
    }
  }, [searchQuery, data, currentConfig.columns]);

  // Search handlers
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Status update function with duplicate prevention
  const handleStatusUpdate = async (itemId, newStatus) => {
    if (type !== 'orders') return; // Only allow status updates for orders
    
    // Prevent duplicate calls
    if (updatingStatus) {
      console.log('Status update already in progress, ignoring duplicate call');
      return;
    }
    
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
    console.log('Type:', type);
    
    setEditingItem(item);
    
    if (item) {
      // Editing existing item - use single form
      setFormData(item);
    } else {
      // Creating new items - use bulk form, clear any form data
      setFormData({});
      // Ensure bulk items are initialized
      const initialItem = initializeBulkItem();
      setBulkItems([initialItem]);
      if (type === 'products') {
        setBulkProducts([initialItem]);
      }
    }
    
    setOpenDialog(true);
    setError(''); // Clear any existing errors
    
    console.log('Dialog opened for', item ? 'editing' : 'bulk creation');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({});
    setError(''); // Clear any errors when closing
  };

  // Universal bulk functions
  const addBulkItem = () => {
    const newItem = initializeBulkItem();
    setBulkItems([...bulkItems, newItem]);
    
    // Legacy support for products
    if (type === 'products') {
      setBulkProducts([...bulkProducts, newItem]);
    }
  };

  const removeBulkItem = (id) => {
    if (bulkItems.length > 1) {
      setBulkItems(bulkItems.filter(item => item.id !== id));
      
      // Legacy support for products
      if (type === 'products') {
        setBulkProducts(bulkProducts.filter(p => p.id !== id));
      }
    }
  };

  const updateBulkItem = (id, field, value) => {
    setBulkItems(bulkItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
    
    // Legacy support for products
    if (type === 'products') {
      setBulkProducts(bulkProducts.map(product =>
        product.id === id ? { ...product, [field]: value } : product
      ));
    }
  };

  // Legacy functions for backward compatibility
  const addBulkProduct = addBulkItem;
  const removeBulkProduct = removeBulkItem;
  const updateBulkProduct = updateBulkItem;

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
            color: '#374151'
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
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#3B82F6' }}>
            {column.prefix || ''}{value}
          </Typography>
        );
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'email':
        return (
          <Typography variant="body2" sx={{ color: '#3B82F6' }}>
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
        <CircularProgress sx={{ color: '#3B82F6' }} />
      </Box>
    );
  }

  return (
    <Paper sx={{ 
      overflow: 'visible',
      position: 'relative',
      m: 0.5,
      boxSizing: 'border-box',
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #E5E7EB'
    }}>
      <Box sx={{ 
        p: 1.5,
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
          alignItems: 'flex-start',
          mb: 1,
          pr: 0,
          pb: 0.5,
          pt: 0.25,
          overflow: 'visible',
          position: 'relative',
          minHeight: '32px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            flex: '1 1 auto',  // Allow shrinking
            minWidth: 0,  // Allow shrinking
            maxWidth: selectedItems.length > 0 ? 'calc(100% - 350px)' : 'calc(100% - 240px)'  // Reserve space for wider buttons
          }}>
            {currentConfig.icon}
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: '#374151',
              whiteSpace: 'nowrap',  // Prevent text wrapping
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '1.1rem'
            }}>
              {currentConfig.title}
            </Typography>
            <Badge badgeContent={data.length} color="primary" sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#3B82F6',
                color: '#374151'
              }
            }}>
              <Box />
            </Badge>
          </Box>
          
          <Box sx={{ 
            // Fixed button container to prevent overlap
            width: selectedItems.length > 0 ? '350px' : '240px',  // Increased width to accommodate wider buttons
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
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                sx={{
                  minHeight: '32px',
                  height: '32px',
                  minWidth: '120px',
                  px: 3,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  letterSpacing: '0.025em',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
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
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => {
                console.log('Manual refresh triggered for:', type);
                fetchData();
              }}
              sx={{
                minHeight: '32px',
                height: '32px',
                minWidth: '100px',
                px: 3,
                py: 0.75,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.025em',
                borderRadius: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                border: '1px solid #3B82F6',
                color: '#3B82F6',
                '&:hover': {
                  border: '1px solid #2563EB',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }
              }}
            >
              Refresh
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => {
                handleOpenDialog();
              }}
              sx={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                minHeight: '32px',
                height: '32px',
                minWidth: '120px',
                px: 3,
                py: 0.75,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.025em',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#2563EB',
                },
              }}
            >
              Add {type.slice(0, -1)}
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          p: 0.75
        }}>
          <TextField
            fullWidth
            placeholder={`Search ${currentConfig.title.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ 
                  color: '#888888', 
                  mr: 1,
                  fontSize: '1.2rem'
                }} />
              ),
              endAdornment: searchQuery && (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ 
                    color: '#888888',
                    '&:hover': {
                      color: '#3B82F6',
                      backgroundColor: 'rgba(0, 212, 170, 0.08)'
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
              sx: {
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #E5E7EB',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #3B82F6',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid #3B82F6',
                  boxShadow: '0 0 0 2px rgba(0, 212, 170, 0.2)',
                },
                '& input': {
                  color: '#374151',
                  '&::placeholder': {
                    color: '#888888',
                    opacity: 1,
                  },
                },
              }
            }}
          />
          {searchQuery && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              color: '#888888',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}>
              <Typography variant="body2" sx={{ color: '#888888' }}>
                {filteredData.length} of {data.length} results
              </Typography>
            </Box>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 1, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', py: 0.5 }}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            maxHeight: 'none',
            height: 'auto',
            overflow: 'visible'
          }}
        >
          <Table stickyHeader={false} size="small" sx={{ '& .MuiTableCell-root': { py: 0.25 } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                {/* Select All Checkbox Column */}
                <TableCell 
                  sx={{ 
                    color: '#374151', 
                    fontWeight: 700,
                    borderBottom: '1px solid #E5E7EB',
                    width: '40px',
                    textAlign: 'center',
                    py: 0.5,
                    px: 0.5
                  }}
                >
                  <Tooltip title={selectAll ? 'Deselect All' : 'Select All'}>
                    <Checkbox
                      checked={selectAll}
                      indeterminate={selectedItems.length > 0 && selectedItems.length < filteredData.length}
                      onChange={handleSelectAll}
                      disabled={filteredData.length === 0}
                      sx={{
                        color: '#3B82F6',
                        '&.Mui-checked': {
                          color: '#3B82F6',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: '#3B82F6',
                        }
                      }}
                    />
                  </Tooltip>
                </TableCell>
                {currentConfig.columns.map((column) => (
                  <TableCell 
                    key={column.key}
                    sx={{ 
                      color: '#374151', 
                      fontWeight: 700,
                      borderBottom: '1px solid #E5E7EB',
                      py: 0.5,
                      px: 1,
                      fontSize: '0.8rem'
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell 
                  sx={{ 
                    color: '#374151', 
                    fontWeight: 700,
                    borderBottom: '1px solid #E5E7EB',
                    textAlign: 'center',
                    py: 0.5,
                    px: 1,
                    fontSize: '0.8rem',
                    width: '100px'
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
              
              {filteredData && filteredData.length > 0 ? filteredData.map((item, index) => {
                console.log(`Rendering row ${index}:`, item);
                const isSelected = selectedItems.includes(item.id);
                return (
                  <TableRow
                    key={item.id || `item-${index}`}
                    sx={{
                        '&:hover': {
                          backgroundColor: '#F8FAFC'
                        },
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        borderBottom: '1px solid #E5E7EB'
                      }}
                    >
                      {/* Individual Select Checkbox */}
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid #E5E7EB',
                          textAlign: 'center',
                          width: '40px',
                          py: 0.25,
                          px: 0.5
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectItem(item.id)}
                          size="small"
                          sx={{
                            color: '#3B82F6',
                            '&.Mui-checked': {
                              color: '#3B82F6',
                            }
                          }}
                        />
                      </TableCell>
                      {currentConfig.columns.map((column) => (
                        <TableCell 
                          key={`${item.id}-${column.key}`}
                          sx={{ 
                            color: '#374151',
                            borderBottom: '1px solid #E5E7EB',
                            py: 0.5,
                            px: 1,
                            fontSize: '0.8rem'
                          }}
                        >
                          {renderCellContent(item, column)}
                        </TableCell>
                      ))}
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid #E5E7EB',
                          textAlign: 'center',
                          py: 0.25,
                          px: 0.5,
                          width: '100px'
                        }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleOpenDialog(item)}
                            size="small"
                            sx={{ color: '#3B82F6', mr: 0.5, p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Status Update Button - only for orders */}
                        {type === 'orders' && (
                          <Tooltip title="Update Status">
                            <IconButton
                              onClick={(e) => handleStatusMenuOpen(e, item)}
                              size="small"
                              sx={{ color: '#FFB74D', mr: 0.5, p: 0.5 }}
                              disabled={updatingStatus}
                            >
                              {updatingStatus && selectedItemForStatus?.id === item.id ? (
                                <CircularProgress size={16} sx={{ color: '#FFB74D' }} />
                              ) : (
                                <MoreVertIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(item.id)}
                            size="small"
                            sx={{ color: '#FF5252', p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                }) : null}
              {(!filteredData || filteredData.length === 0) && (
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
                    {searchQuery 
                      ? `No ${type} found matching "${searchQuery}". Try adjusting your search.`
                      : `No ${type} found. Click "Add ${type.slice(0, -1)}" to get started.`
                    }
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
          maxWidth={(type === 'products' || type === 'orders' || type === 'students') && !editingItem ? "xl" : "sm"}
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              ...((type === 'products' || type === 'orders' || type === 'students') && !editingItem && {
                minWidth: '1400px',
                width: '95vw',
                maxWidth: '95vw'
              })
            }
          }}
        >
          <DialogTitle sx={{ color: '#374151', fontWeight: 700 }}>
            {editingItem ? `Edit ${type.slice(0, -1)}` : `Bulk Add ${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)}s`}
          </DialogTitle>
          <DialogContent>
            {/* Edit Mode - Single Item Form */}
            {editingItem && (
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
                            color: '#374151',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: field.required && (!formData[field.key] || formData[field.key] === '') ? '#f44336' : '#E5E7EB'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#3B82F6'
                            }
                          }}
                        >
                          {field.options?.map((option) => (
                            <MenuItem 
                              key={typeof option === 'object' ? option.value : option} 
                              value={typeof option === 'object' ? option.value : option} 
                              sx={{ color: '#374151' }}
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
                        '& .MuiInputBase-input': { color: '#374151' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E5E7EB'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3B82F6'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* Bulk Items - For all modules in create mode */}
            {!editingItem && (
              <Box sx={{ mt: 2 }}>
                <MuiTableContainer component={Paper} sx={{ maxHeight: 500, border: '1px solid #E5E7EB' }}>
                  <MuiTable stickyHeader size="small">
                    <MuiTableHead>
                      {renderBulkTableHeaders()}
                    </MuiTableHead>
                    <MuiTableBody>
                      {(type === 'products' ? bulkProducts : bulkItems).map((item, index) => 
                        renderBulkTableCells(item, index)
                      )}
                    </MuiTableBody>
                  </MuiTable>
                </MuiTableContainer>

                <Box sx={{ mt: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addBulkItem}
                    variant="outlined"
                    sx={{ 
                      color: '#3B82F6', 
                      borderColor: '#3B82F6', 
                      '&:hover': { 
                        backgroundColor: '#EFF6FF',
                        borderColor: '#2563EB'
                      } 
                    }}
                  >
                    Add More {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              disabled={submitting}
              sx={{ color: '#374151', borderColor: '#E5E7EB' }}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!editingItem) {
                  // Bulk create (for new items)
                  handleBulkCreate();
                } else {
                  // Single update (for editing existing items)
                  handleSubmit();
                }
              }}
              variant="contained"
              disabled={submitting}
              type="button"
              sx={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#2563EB',
                },
                '&:disabled': {
                  backgroundColor: '#666666',
                  color: '#CCCCCC'
                }
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
              ) : (
                editingItem 
                  ? 'Update' 
                  : (() => {
                      const items = type === 'products' ? bulkProducts : bulkItems;
                      const validItems = items.filter(item => {
                        if (type === 'products') return item.name.trim() && item.sku.trim();
                        if (type === 'students') return item.name.trim() && item.department.trim();
                        if (type === 'orders') return item.student_id && item.product_id;
                        return true;
                      });
                      const moduleName = type.charAt(0).toUpperCase() + type.slice(1);
                      return `Create ${validItems.length} ${moduleName}`;
                    })()
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Update Menu - only for orders */}
        {type === 'orders' && (
          <Menu
            anchorEl={statusMenuAnchor}
            open={Boolean(statusMenuAnchor)}
            onClose={handleStatusMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                minWidth: '180px'
              }
            }}
          >
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'pending')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <ScheduleIcon sx={{ mr: 1, color: '#FFB74D' }} />
              Pending
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'approved')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <CheckIcon sx={{ mr: 1, color: '#2196F3' }} />
              Approved
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'completed')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <CheckCircleIcon sx={{ mr: 1, color: '#4CAF50' }} />
              Completed
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'overdue')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <CancelIcon sx={{ mr: 1, color: '#F44336' }} />
              Overdue
            </MenuItem>
          </Menu>
        )}
      </Box>
    </Paper>
  );
};

export default ListView;
