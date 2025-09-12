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
  IconButton,
  Alert,
  Tooltip,
  InputAdornment,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { 
  SimpleContainer, 
  SimpleSection, 
  SimpleButton, 
  SimpleBadge, 
  SimpleCard,
  SimpleLoading 
} from './SimpleComponents';
import MinimalFormDialog from './MinimalFormDialog';

const API_BASE_URL = 'http://localhost:8000';

const MinimalListView = ({ type }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint;
      switch (type) {
        case 'products':
          endpoint = '/api/products';
          break;
        case 'students':
          endpoint = '/api/students';
          break;
        case 'orders':
          endpoint = '/api/orders';
          break;
        default:
          endpoint = '/api/products';
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${type}`);
      }
      
      const result = await response.json();
      setData(result.data || result);
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      setError(`Failed to load ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getColumns = () => {
    switch (type) {
      case 'products':
        return [
          { key: 'name', label: 'Product Name', sortable: true },
          { key: 'category', label: 'Category', sortable: true },
          { key: 'quantity', label: 'Quantity', sortable: true },
          { key: 'price', label: 'Price', sortable: true },
          { key: 'status', label: 'Status', sortable: false },
          { key: 'actions', label: 'Actions', sortable: false }
        ];
      case 'students':
        return [
          { key: 'name', label: 'Student Name', sortable: true },
          { key: 'student_id', label: 'Student ID', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          { key: 'department', label: 'Department', sortable: true },
          { key: 'year', label: 'Year', sortable: true },
          { key: 'actions', label: 'Actions', sortable: false }
        ];
      case 'orders':
        return [
          { key: 'order_id', label: 'Order ID', sortable: true },
          { key: 'student_name', label: 'Student', sortable: true },
          { key: 'total_amount', label: 'Total Amount', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'created_at', label: 'Date', sortable: true },
          { key: 'actions', label: 'Actions', sortable: false }
        ];
      default:
        return [];
    }
  };

  const renderCellContent = (item, column) => {
    const value = item[column.key];
    
    switch (column.key) {
      case 'status':
        const getStatusColor = (status) => {
          switch (status?.toLowerCase()) {
            case 'active':
            case 'in_stock':
            case 'completed':
              return 'success';
            case 'pending':
            case 'low_stock':
              return 'warning';
            case 'inactive':
            case 'out_of_stock':
            case 'cancelled':
              return 'error';
            default:
              return 'info';
          }
        };
        return (
          <SimpleBadge color={getStatusColor(value)} size="small">
            {value?.replace('_', ' ') || 'Unknown'}
          </SimpleBadge>
        );
      
      case 'price':
      case 'total_amount':
        return value ? `₹${parseFloat(value).toLocaleString()}` : '₹0';
      
      case 'created_at':
        return value ? new Date(value).toLocaleDateString() : '-';
      
      case 'actions':
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View">
              <IconButton 
                size="small"
                onClick={() => handleAction('view', item)}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton 
                size="small"
                onClick={() => handleAction('edit', item)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton 
                size="small"
                onClick={() => handleAction('delete', item)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      
      default:
        return value || '-';
    }
  };

  const handleAction = (action, item) => {
    setSelectedItem(item);
    
    switch (action) {
      case 'add':
        setSelectedItem(null);
        setDialogMode('add');
        setDialogOpen(true);
        break;
      case 'edit':
        setDialogMode('edit');
        setDialogOpen(true);
        break;
      case 'view':
        setDialogMode('view');
        setDialogOpen(true);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
          handleDelete(item);
        }
        break;
    }
  };

  const handleDelete = async (item) => {
    try {
      let endpoint;
      let id;
      
      switch (type) {
        case 'products':
          endpoint = `/api/products/${item.id}`;
          break;
        case 'students':
          endpoint = `/api/students/${item.id}`;
          break;
        case 'orders':
          endpoint = `/api/orders/${item.id}`;
          break;
        default:
          return;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData(); // Reload data
        if (window.addNotification) {
          window.addNotification('success', 'Deleted', `${type.slice(0, -1)} deleted successfully`);
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (window.addNotification) {
        window.addNotification('error', 'Error', `Failed to delete ${type.slice(0, -1)}`);
      }
    }
  };

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    
    const searchFields = getColumns()
      .filter(col => col.key !== 'actions')
      .map(col => item[col.key]?.toString().toLowerCase() || '')
      .join(' ');
    
    return searchFields.includes(searchTerm.toLowerCase());
  });

  const getTitle = () => {
    switch (type) {
      case 'products': return 'Products Management';
      case 'students': return 'Students Management';
      case 'orders': return 'Lending Management';
      default: return 'Management';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'products': return 'Manage your inventory products and stock levels';
      case 'students': return 'Manage student profiles and information';
      case 'orders': return 'View and manage all orders';
      default: return 'Manage your data';
    }
  };

  if (loading) {
    return (
      <SimpleContainer>
        <SimpleLoading message={`Loading ${type}...`} size={50} sx={{ py: 8 }} />
      </SimpleContainer>
    );
  }

  return (
    <SimpleContainer>
      <SimpleSection
        title={getTitle()}
        description={getDescription()}
        headerAction={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <SimpleButton
              variant="outlined"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshIcon sx={{ mr: 1 }} />
              Refresh
            </SimpleButton>
            <SimpleButton
              onClick={() => handleAction('add', null)}
            >
              <AddIcon sx={{ mr: 1 }} />
              Add {type.slice(0, -1)}
            </SimpleButton>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <SimpleCard sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder={`Search ${type}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 'fit-content' }}>
            {filteredData.length} of {data.length} items
          </Typography>
        </Box>
      </SimpleCard>

      {/* Data Table */}
      <SimpleCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                {getColumns().map((column) => (
                  <TableCell key={column.key} sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={getColumns().length} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {searchTerm ? `No ${type} found matching "${searchTerm}"` : `No ${type} available`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow 
                    key={item.id || index}
                    sx={{ 
                      '&:hover': { backgroundColor: '#F8FAFC' },
                      '&:last-child td': { border: 0 }
                    }}
                  >
                    {getColumns().map((column) => (
                      <TableCell key={column.key} sx={{ fontSize: '0.875rem' }}>
                        {renderCellContent(item, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </SimpleCard>

      {/* Form Dialog */}
      <MinimalFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={dialogMode}
        type={type}
        data={selectedItem}
        onSuccess={() => {
          loadData(); // Reload data after successful operation
        }}
      />
    </SimpleContainer>
  );
};

export default MinimalListView;
