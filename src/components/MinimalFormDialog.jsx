import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { SimpleButton, SimpleLoading } from './SimpleComponents';

const API_BASE_URL = 'http://localhost:8000';

const MinimalFormDialog = ({ 
  open, 
  onClose, 
  mode, // 'add', 'edit', 'view'
  type, // 'products', 'students', 'orders'
  data = null,
  onSuccess 
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (mode === 'add') {
        setFormData(getEmptyFormData());
      } else if (data) {
        setFormData({ ...data });
      }
    }
  }, [open, mode, data, type]);

  const getEmptyFormData = () => {
    switch (type) {
      case 'products':
        return {
          name: '',
          category: '',
          description: '',
          quantity: '',
          price: '',
          status: 'active'
        };
      case 'students':
        return {
          name: '',
          student_id: '',
          email: '',
          phone: '',
          department: '',
          year: '',
          status: 'active'
        };
      case 'orders':
        return {
          student_id: '',
          student_name: '',
          total_amount: '',
          status: 'pending',
          notes: ''
        };
      default:
        return {};
    }
  };

  const getFieldConfig = () => {
    switch (type) {
      case 'products':
        return [
          { 
            key: 'name', 
            label: 'Product Name', 
            type: 'text', 
            required: true,
            icon: <InventoryIcon />,
            fullWidth: true
          },
          { 
            key: 'category', 
            label: 'Category', 
            type: 'select',
            options: ['Electronics', 'Books', 'Stationery', 'Clothing', 'Food', 'Other'],
            required: true,
            icon: <CategoryIcon />
          },
          { 
            key: 'description', 
            label: 'Description', 
            type: 'text',
            multiline: true,
            rows: 3,
            icon: <DescriptionIcon />,
            fullWidth: true
          },
          { 
            key: 'quantity', 
            label: 'Quantity', 
            type: 'number',
            required: true,
            icon: <InventoryIcon />
          },
          { 
            key: 'price', 
            label: 'Price (₹)', 
            type: 'number',
            required: true,
            icon: <MoneyIcon />
          },
          { 
            key: 'status', 
            label: 'Status', 
            type: 'select',
            options: ['active', 'inactive', 'low_stock', 'out_of_stock'],
            required: true
          }
        ];
      case 'students':
        return [
          { 
            key: 'name', 
            label: 'Student Name', 
            type: 'text', 
            required: true,
            icon: <PersonIcon />,
            fullWidth: true
          },
          { 
            key: 'student_id', 
            label: 'Student ID', 
            type: 'text',
            required: true,
            icon: <SchoolIcon />
          },
          { 
            key: 'email', 
            label: 'Email', 
            type: 'email',
            required: true,
            icon: <EmailIcon />
          },
          { 
            key: 'phone', 
            label: 'Phone', 
            type: 'tel',
            icon: <PhoneIcon />
          },
          { 
            key: 'department', 
            label: 'Department', 
            type: 'select',
            options: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Other'],
            required: true,
            icon: <SchoolIcon />
          },
          { 
            key: 'year', 
            label: 'Year', 
            type: 'select',
            options: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
            required: true
          }
        ];
      case 'orders':
        return [
          { 
            key: 'student_name', 
            label: 'Student Name', 
            type: 'text', 
            required: true,
            icon: <PersonIcon />,
            fullWidth: true
          },
          { 
            key: 'student_id', 
            label: 'Student ID', 
            type: 'text',
            required: true,
            icon: <SchoolIcon />
          },
          { 
            key: 'total_amount', 
            label: 'Total Amount (₹)', 
            type: 'number',
            required: true,
            icon: <MoneyIcon />
          },
          { 
            key: 'status', 
            label: 'Status', 
            type: 'select',
            options: ['pending', 'processing', 'completed', 'cancelled'],
            required: true
          },
          { 
            key: 'notes', 
            label: 'Notes', 
            type: 'text',
            multiline: true,
            rows: 3,
            icon: <DescriptionIcon />,
            fullWidth: true
          }
        ];
      default:
        return [];
    }
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateForm = () => {
    const fields = getFieldConfig();
    const requiredFields = fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (!formData[field.key] || formData[field.key].toString().trim() === '') {
        return `${field.label} is required`;
      }
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    // Number validation
    if (formData.quantity && isNaN(formData.quantity)) {
      return 'Quantity must be a number';
    }
    
    if (formData.price && isNaN(formData.price)) {
      return 'Price must be a number';
    }
    
    if (formData.total_amount && isNaN(formData.total_amount)) {
      return 'Total amount must be a number';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint;
      let method;
      let body = { ...formData };

      // Convert string numbers to actual numbers
      if (body.quantity) body.quantity = parseInt(body.quantity);
      if (body.price) body.price = parseFloat(body.price);
      if (body.total_amount) body.total_amount = parseFloat(body.total_amount);

      if (mode === 'add') {
        endpoint = `/api/${type}`;
        method = 'POST';
      } else if (mode === 'edit') {
        endpoint = `/api/${type}/${data.id}`;
        method = 'PUT';
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        if (window.addNotification) {
          window.addNotification(
            'success',
            'Success',
            `${type.slice(0, -1)} ${mode === 'add' ? 'added' : 'updated'} successfully`
          );
        }
        onSuccess && onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${mode} ${type.slice(0, -1)}`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing ${type}:`, error);
      setError(error.message || `Failed to ${mode} ${type.slice(0, -1)}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.key] || '';
    const isDisabled = mode === 'view' || loading;

    if (field.type === 'select') {
      return (
        <FormControl fullWidth={field.fullWidth} disabled={isDisabled}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value}
            label={field.label}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
          >
            {field.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        fullWidth={field.fullWidth}
        label={field.label}
        type={field.type}
        value={value}
        onChange={(e) => handleInputChange(field.key, e.target.value)}
        disabled={isDisabled}
        required={field.required}
        multiline={field.multiline}
        rows={field.rows}
        InputProps={field.icon ? {
          startAdornment: (
            <InputAdornment position="start">
              {field.icon}
            </InputAdornment>
          ),
        } : undefined}
      />
    );
  };

  const getTitle = () => {
    const entityName = type.slice(0, -1).replace(/^\w/, c => c.toUpperCase());
    switch (mode) {
      case 'add': return `Add New ${entityName}`;
      case 'edit': return `Edit ${entityName}`;
      case 'view': return `View ${entityName}`;
      default: return entityName;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minWidth: '1200px',
          width: '90vw',
          maxWidth: '90vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {getTitle()}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {getFieldConfig().map((field) => (
              <Grid 
                item 
                xs={12} 
                sm={field.fullWidth ? 12 : 6} 
                key={field.key}
              >
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <SimpleButton 
          variant="outlined" 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </SimpleButton>
        
        {mode !== 'view' && (
          <SimpleButton 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <SimpleLoading size={20} sx={{ mr: 1 }} />
            ) : null}
            {mode === 'add' ? 'Add' : 'Save'} {type.slice(0, -1)}
          </SimpleButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MinimalFormDialog;
