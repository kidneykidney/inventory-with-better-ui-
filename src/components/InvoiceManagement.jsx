import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  MenuItem,
  Badge,
  Tooltip,
  Alert,
  Snackbar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Checkbox,
  CircularProgress,
  List,
  ListItem
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CameraAlt as CameraIcon,
  Assignment as AssignmentIcon,
  CloudUpload as UploadIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  PendingActions as PendingIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  PhotoCamera as PhotoCameraIcon,
  SmartToy as SmartToyIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Receipt as ReceiptIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import CameraUploadDialog from './CameraUploadDialog';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import ManualInvoiceCreationDialog from './ManualInvoiceCreationDialog';
import OCRInvoiceUploadDialog from './OCRInvoiceUploadDialog';
import BulkInvoiceUploadDialog from './BulkInvoiceUploadDialog';
import BulkInvoiceCSVDialog from './BulkInvoiceCSVDialog';
import BulkManualInvoiceDialog from './BulkManualInvoiceDialog';
import ErrorBoundary from './ErrorBoundary';
import NotificationService from '../services/notificationService';

const API_BASE_URL = 'http://localhost:8000';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    invoice_type: '',
    student_id: ''
  });
  
  // Bulk selection states
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [manualInvoiceDialogOpen, setManualInvoiceDialogOpen] = useState(false);
  const [bulkManualDialogOpen, setBulkManualDialogOpen] = useState(false);
  const [ocrInvoiceDialogOpen, setOcrInvoiceDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [bulkCSVDialogOpen, setBulkCSVDialogOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  
  // Summary stats
  const [summary, setSummary] = useState({
    total_invoices: 0,
    issued_invoices: 0,
    acknowledged_invoices: 0,
    pending_returns: 0,
    overdue_returns: 0,
    physical_invoices_captured: 0,
    total_lending_value: 0
  });

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
  }, [filters]);

  // Search filtering effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = invoices.filter(invoice => {
        return (
          (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(query)) ||
          (invoice.student_name && invoice.student_name.toLowerCase().includes(query)) ||
          (invoice.status && invoice.status.toLowerCase().includes(query)) ||
          (invoice.invoice_type && invoice.invoice_type.toLowerCase().includes(query)) ||
          (invoice.notes && invoice.notes.toLowerCase().includes(query))
        );
      });
      setFilteredInvoices(filtered);
    }
  }, [searchQuery, invoices]);

  // Search handlers
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`${API_BASE_URL}/api/invoices?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvoices(data);
        setFilteredInvoices(data);
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (err) {
      setError('Network error while fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/analytics/summary`);
      const data = await response.json();
      
      if (response.ok) {
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'issued': return 'primary';
      case 'acknowledged': return 'success';
      case 'archived': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'lending': return <AssignmentIcon />;
      case 'return': return <CheckCircleIcon />;
      case 'damage': return <WarningIcon />;
      case 'replacement': return <ReceiptIcon />;
      default: return <ReceiptIcon />;
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedInvoice(data);
        setViewDialogOpen(true);
      } else {
        setError('Failed to fetch invoice details');
      }
    } catch (err) {
      setError('Network error while fetching invoice details');
    }
  };

  const handleCameraUploadSuccess = (result) => {
    setSuccess('Invoice image uploaded successfully!');
    setCameraDialogOpen(false);
    // Refresh the selected invoice to show new image
    if (selectedInvoice) {
      handleViewInvoice(selectedInvoice.id);
    }
    fetchInvoices(); // Refresh list
  };

  const handleCreateInvoiceSuccess = (invoice) => {
    setSuccess(`Invoice ${invoice.invoice_number} created successfully!`);
    setCreateInvoiceDialogOpen(false);
    fetchInvoices();
    fetchSummary();
  };

  const handleOCRInvoiceSuccess = (invoice) => {
    setSuccess(`Invoice ${invoice.invoice_number} created from upload successfully!`);
    setOcrInvoiceDialogOpen(false);
    fetchInvoices();
    fetchSummary();
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSuccess(`Invoice ${invoiceToDelete.invoice_number} deleted successfully!`);
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
        fetchInvoices();
        fetchSummary();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete invoice');
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Network error while deleting invoice');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  // Bulk selection handlers
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => {
      const newSelection = prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId];
      
      // Update select all checkbox based on selection
      setSelectAll(newSelection.length === filteredInvoices.length && filteredInvoices.length > 0);
      
      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) {
      setError('Please select invoices to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedInvoices.length} selected invoices? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setBulkDeleting(true);
    setError('');

    try {
      // Delete invoices in parallel for better performance
      const deletePromises = selectedInvoices.map(invoiceId =>
        fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if all deletions were successful
      const failedDeletions = responses.filter(response => !response.ok);
      
      if (failedDeletions.length > 0) {
        throw new Error(`Failed to delete ${failedDeletions.length} invoices`);
      }

      // Clear selections and refresh data
      setSelectedInvoices([]);
      setSelectAll(false);
      setSuccess(`Successfully deleted ${selectedInvoices.length} invoices!`);
      fetchInvoices();
      fetchSummary();
      
    } catch (err) {
      setError(`Bulk delete failed: ${err.message}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clear selections when invoices change
  useEffect(() => {
    setSelectedInvoices([]);
    setSelectAll(false);
  }, [invoices.length]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const SummaryCard = ({ title, value, icon, color = 'primary', gradient = false }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: gradient 
          ? `linear-gradient(135deg, ${color === 'primary' ? '#3B82F6' : color === 'success' ? '#4CAF50' : color === 'warning' ? '#FF9800' : color === 'error' ? '#F44336' : '#2196F3'} 0%, ${color === 'primary' ? '#2563EB' : color === 'success' ? '#388E3C' : color === 'warning' ? '#F57C00' : color === 'error' ? '#D32F2F' : '#1976D2'} 100%)`
          : '#FFFFFF',
        
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: gradient 
            ? 'transparent'
            : `linear-gradient(135deg, ${color === 'primary' ? 'rgba(0, 212, 170, 0.1)' : color === 'success' ? 'rgba(76, 175, 80, 0.1)' : color === 'warning' ? 'rgba(255, 152, 0, 0.1)' : color === 'error' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)'} 0%, transparent 100%)`,
          opacity: 0.8,
          pointerEvents: 'none'
        }
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography 
              color={gradient ? "rgba(255,255,255,0.9)" : "#6B7280"} 
              gutterBottom
              sx={{ 
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="div"
              sx={{ 
                color: gradient ? '#FFFFFF' : color === 'primary' ? '#3B82F6' : color === 'success' ? '#4CAF50' : color === 'warning' ? '#FF9800' : color === 'error' ? '#F44336' : '#2196F3',
                fontWeight: 700,
                fontSize: '2.5rem'
              }}
            >
              {typeof value === 'number' && title.includes('Value') 
                ? `₹${value.toFixed(2)}` 
                : value
              }
            </Typography>
          </Box>
          <Box 
            sx={{ 
              color: gradient ? 'rgba(255,255,255,0.9)' : color === 'primary' ? '#3B82F6' : color === 'success' ? '#4CAF50' : color === 'warning' ? '#FF9800' : color === 'error' ? '#F44336' : '#2196F3',
              fontSize: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: gradient 
                ? 'rgba(255,255,255,0.1)'
                : color === 'primary' ? 'rgba(0, 212, 170, 0.1)' : color === 'success' ? 'rgba(76, 175, 80, 0.1)' : color === 'warning' ? 'rgba(255, 152, 0, 0.1)' : color === 'error' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const InvoiceDetailsDialog = () => (
    <Dialog 
      open={viewDialogOpen} 
      onClose={() => setViewDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Invoice {selectedInvoice?.invoice_number}
          </Typography>
          <Chip 
            label={selectedInvoice?.status || 'Unknown'}
            color={getStatusColor(selectedInvoice?.status)}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {selectedInvoice && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Student Information */}
            <Card sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                  Student Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="body2"><strong>Name:</strong> {selectedInvoice.student_name}</Typography>
                  <Typography variant="body2"><strong>Student ID:</strong> {selectedInvoice.student_id_number}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {selectedInvoice.student_email}</Typography>
                  <Typography variant="body2"><strong>Department:</strong> {selectedInvoice.department}</Typography>
                  <Typography variant="body2"><strong>Year:</strong> {selectedInvoice.year_of_study}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                  Invoice Details
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="body2"><strong>Order:</strong> {selectedInvoice.order_number}</Typography>
                  <Typography variant="body2"><strong>Type:</strong> {selectedInvoice.invoice_type}</Typography>
                  <Typography variant="body2"><strong>Items:</strong> {selectedInvoice.total_items}</Typography>
                  <Typography variant="body2"><strong>Issue Date:</strong> {formatDate(selectedInvoice.issue_date)}</Typography>
                  <Typography variant="body2"><strong>Due Date:</strong> {formatDate(selectedInvoice.due_date)}</Typography>
                  <Typography variant="body2"><strong>Issued By:</strong> {selectedInvoice.issued_by}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Physical Invoice Status */}
            <Card>
              <CardContent sx={{ py: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Physical Invoice</Typography>
                    <Box>
                      <Chip 
                        label={selectedInvoice.has_physical_copy ? 'Has Physical Copy' : 'Digital Only'}
                        color={selectedInvoice.has_physical_copy ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={selectedInvoice.physical_invoice_captured ? 'Captured' : 'Not Captured'}
                        color={selectedInvoice.physical_invoice_captured ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  {selectedInvoice.physical_invoice_notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Notes:</strong> {selectedInvoice.physical_invoice_notes}
                    </Typography>
                  )}
                  {!selectedInvoice.physical_invoice_captured && (
                    <Button
                      startIcon={<CameraIcon />}
                      variant="outlined"
                      onClick={() => {
                        setCameraDialogOpen(true);
                        setViewDialogOpen(false);
                      }}
                      sx={{ mt: 2 }}
                    >
                      Capture Physical Invoice
                    </Button>
                  )}
                </CardContent>
              </Card>

            {/* Items */}
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <Card>
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>Items</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Unit Value</TableCell>
                            <TableCell>Expected Return</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedInvoice.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.product_sku}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">₹{item.unit_value.toFixed(2)}</TableCell>
                              <TableCell>{formatDate(item.expected_return_date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

            {/* Images */}
            {selectedInvoice.images && selectedInvoice.images.length > 0 && (
              <Card>
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                    Uploaded Images ({selectedInvoice.images.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedInvoice.images.map((image, index) => (
                      <Card variant="outlined" key={index} sx={{ minWidth: '140px' }}>
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="body2" noWrap>
                            {image.image_type.replace('_', ' ').toUpperCase()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {formatDateTime(image.created_at)}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => window.open(`${API_BASE_URL}/api/invoices/images/${image.id}`, '_blank')}
                          >
                            View
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <ErrorBoundary>
      <Box sx={{ p: 0.5, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 
          }}>
            <ReceiptIcon sx={{ fontSize: '1.2rem', color: '#000000' }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#374151',
                fontSize: '1.1rem'
              }}
            >
              Invoice Management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Bulk Delete Button - only show when items are selected */}
            {selectedInvoices.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                sx={{
                  minHeight: '32px',
                  height: '32px',
                  minWidth: '140px',
                  px: 3,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  letterSpacing: '0.025em',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  color: '#FF5252',
                  borderColor: 'rgba(255, 82, 82, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255, 82, 82, 0.6)',
                    backgroundColor: 'rgba(255, 82, 82, 0.08)'
                  },
                  '&:disabled': {
                    borderColor: 'rgba(255, 82, 82, 0.2)',
                    color: 'rgba(255, 82, 82, 0.5)'
                  }
                }}
              >
                {bulkDeleting ? (
                  <CircularProgress size={16} sx={{ color: '#FF5252' }} />
                ) : (
                  `Delete Selected (${selectedInvoices.length})`
                )}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => {
                fetchInvoices();
                fetchSummary();
              }}
              sx={{
                minHeight: '32px',
                height: '32px',
                minWidth: '130px',
                px: 3,
                py: 0.75,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.025em',
                borderRadius: '8px',
                borderColor: '#3B82F6',
                color: '#3B82F6',
                '&:hover': {
                  borderColor: '#2563EB',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }
              }}
            >
              Refresh Data
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Card 
        sx={{ 
          mb: 0.5,
          background: '#FFFFFF',
          
          borderRadius: '6px'
        }}
      >
          <CardContent sx={{ py: 0.5, px: 1, '&:last-child': { pb: 0.5 } }}>
            {/* Search Bar */}
            <Box sx={{ mb: 0.5 }}>
              <TextField
                fullWidth
                placeholder="Search invoices by number, student, status, or type..."
                value={searchQuery}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ 
                      color: '#6B7280', 
                      mr: 1,
                      fontSize: '16px'
                    }} />
                  ),
                  endAdornment: searchQuery && (
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      sx={{ 
                        color: '#6B7280',
                        p: 0.5,
                        '&:hover': {
                          color: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.08)'
                        }
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ),
                  sx: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '6px',
                    height: '32px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid #3B82F6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid #3B82F6',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                    },
                    '& input': {
                      color: '#1F2937',
                      fontSize: '13px',
                      padding: '4px 0',
                      '&::placeholder': {
                        color: '#9CA3AF',
                        opacity: 1,
                      },
                    },
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>

      {/* Invoices Table */}
      <Card sx={{ borderRadius: '6px' }}>
        <CardContent sx={{ py: 0.1, px: 0.25, '&:last-child': { pb: 0.1 } }}>
          <Box display="flex" justifyContent="flex-start" alignItems="center" mb={0.1}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              Invoices ({invoices.length})
            </Typography>
          </Box>
          <TableContainer 
            sx={{
              background: '#FFFFFF',
              borderRadius: '6px',
              
              overflow: 'hidden'
            }}
          >
              <Table size="small" sx={{
                '& .MuiTableCell-root': {
                  py: 0.25,
                  px: 0.5,
                  fontSize: '0.75rem',
                  border: 'none',
                  borderBottom: '1px solid #F3F4F6'
                },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  py: 0.5,
                  borderBottom: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB'
                },
                '& .MuiTableRow-root:hover': {
                  backgroundColor: '#F8FAFC'
                }
              }}>
                <TableHead>
                  <TableRow sx={{ 
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)'
                  }}>
                    {/* Select All Checkbox Column */}
                    <TableCell sx={{ 
                      width: '50px', 
                      textAlign: 'center',
                      color: '#1F2937',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}>
                      <Tooltip title={selectAll ? 'Deselect All' : 'Select All'}>
                        <Checkbox
                          checked={selectAll}
                          indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < filteredInvoices.length}
                          onChange={handleSelectAll}
                          disabled={filteredInvoices.length === 0}
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
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Invoice #
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Student
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Issue Date
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Items
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Physical
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      color: '#1F2937', 
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ 
                      color: '#6B7280',
                      fontStyle: 'italic',
                      py: 4
                    }}>
                      {searchQuery 
                        ? `No invoices found matching "${searchQuery}". Try adjusting your search.`
                        : 'No invoices found'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice, index) => {
                      const isSelected = selectedInvoices.includes(invoice.id);
                      return (
                        <TableRow
                          key={invoice.id}
                          sx={{
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: isSelected 
                                ? 'rgba(59, 130, 246, 0.12)' 
                                : 'rgba(59, 130, 246, 0.04)',
                              '& .MuiTableCell-root': {
                                color: '#1F2937'
                              }
                            }
                          }}
                        >
                          {/* Individual Select Checkbox */}
                          <TableCell sx={{ 
                            textAlign: 'center', 
                            width: '60px',
                            color: '#1F2937'
                          }}>
                            <Box>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleSelectInvoice(invoice.id)}
                                sx={{
                                  color: '#3B82F6',
                                  '&.Mui-checked': {
                                    color: '#3B82F6',
                                  }
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            
                            color: '#1F2937'
                          }}>
                            <Box>
                              <Box display="flex" alignItems="center">
                                <Box>
                                  {getTypeIcon(invoice.invoice_type)}
                                </Box>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    ml: 1,
                                    color: '#3B82F6',
                                    fontWeight: 600
                                  }}
                                >
                                  {invoice.invoice_number}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                      <TableCell sx={{ 
                        
                        color: '#1F2937'
                      }}>
                        <Chip 
                          label={invoice.invoice_type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        
                        color: '#1F2937'
                      }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#1F2937' }}>{invoice.student_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {invoice.department}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        
                        color: '#1F2937'
                      }}>
                        <Chip 
                          label={invoice.status}
                          color={getStatusColor(invoice.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        
                        color: '#1F2937'
                      }}>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell sx={{ 
                        
                        color: '#1F2937'
                      }}>
                        <Badge badgeContent={invoice.item_count} color="primary">
                          <AssignmentIcon />
                        </Badge>
                      </TableCell>
                      <TableCell sx={{ 
                        
                        color: '#1F2937'
                      }}>
                        <Box display="flex" alignItems="center">
                          {invoice.physical_invoice_captured ? (
                            <Tooltip title="Physical invoice captured">
                              <CheckCircleIcon color="success" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Physical invoice not captured">
                              <CameraIcon color="disabled" fontSize="small" />
                            </Tooltip>
                          )}
                          {invoice.image_count > 0 && (
                            <Badge badgeContent={invoice.image_count} color="secondary" sx={{ ml: 1 }}>
                              <UploadIcon fontSize="small" />
                            </Badge>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ 
                        
                        color: '#1F2937'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <IconButton
                            onClick={() => handleDeleteClick(invoice)}
                            title="Delete Invoice"
                            size="small"
                            sx={{
                              color: '#FF5252',
                              p: 0.25,
                              '&:hover': {
                                backgroundColor: 'rgba(255, 82, 82, 0.1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleViewInvoice(invoice.id)}
                            title="View Invoice"
                            size="small"
                            sx={{
                              color: '#3B82F6',
                              p: 0.25,
                              '&:hover': {
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <InvoiceDetailsDialog />

      {/* Camera Upload Dialog */}
      <CameraUploadDialog
        open={cameraDialogOpen}
        onClose={() => setCameraDialogOpen(false)}
        invoiceId={selectedInvoice?.id}
        onUploadSuccess={handleCameraUploadSuccess}
      />

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createInvoiceDialogOpen}
        onClose={() => setCreateInvoiceDialogOpen(false)}
        onSuccess={handleCreateInvoiceSuccess}
      />

      {/* OCR Invoice Upload Dialog */}
      <OCRInvoiceUploadDialog
        open={ocrInvoiceDialogOpen}
        onClose={() => setOcrInvoiceDialogOpen(false)}
        onSuccess={handleOCRInvoiceSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <WarningIcon color="error" sx={{ mr: 1 }} />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          {invoiceToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete this invoice?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Invoice:</strong> {invoiceToDelete.invoice_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Student:</strong> {invoiceToDelete.student_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {invoiceToDelete.invoice_type}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {invoiceToDelete.status}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action cannot be undone. All associated data including images and transaction history will be permanently deleted.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Buttons for Creating Invoices */}
      <Box
        
        
        
      >
        <SpeedDial
          ariaLabel="Create Invoice Options"
          sx={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32,
            '& .MuiFab-primary': {
              background: 'linear-gradient(135deg, #3B82F6 0%, #6C63FF 100%)',
              width: '64px',
              height: '64px',
              boxShadow: '0 12px 48px rgba(0, 212, 170, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563EB 0%, #5A52FF 100%)',
                transform: 'scale(1.1)',
                boxShadow: '0 16px 64px rgba(0, 212, 170, 0.5)',
              }
            },
            '& .MuiSpeedDialAction-fab': {
              background: '#FFFFFF',
              
              color: '#3B82F6',
              '&:hover': {
                background: 'linear-gradient(135deg, #3B82F6 0%, #6C63FF 100%)',
                color: '#FFFFFF',
                transform: 'scale(1.15)',
                boxShadow: '0 8px 32px rgba(0, 212, 170, 0.3)',
              }
            }
          }}
          icon={
            <Box
              animate={{ 
                rotate: speedDialOpen ? 45 : 0,
                scale: speedDialOpen ? 1.2 : 1
              }}
              
            >
              <SpeedDialIcon 
                sx={{ 
                  fontSize: '2rem',
                  color: '#FFFFFF'
                }} 
              />
            </Box>
          }
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          <SpeedDialAction
            icon={
              <Box
                
                
              >
                <AddIcon sx={{ fontSize: '1.5rem' }} />
              </Box>
            }
            tooltipTitle="Create Invoice Manually"
            onClick={() => {
              setManualInvoiceDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={
              <Box
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                whileHover={{ 
                  rotate: 360, 
                  scale: 1.3,
                  transition: { duration: 0.5 }
                }}
              >
                <SmartToyIcon sx={{ fontSize: '1.5rem' }} />
              </Box>
            }
            tooltipTitle="AI-Powered OCR Upload"
            onClick={() => {
              setOcrInvoiceDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={
              <Box
                animate={{ 
                  y: [0, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                whileHover={{ 
                  scale: 1.3,
                  transition: { duration: 0.3 }
                }}
              >
                <CloudUploadIcon sx={{ fontSize: '1.5rem' }} />
              </Box>
            }
            tooltipTitle="Bulk Upload Invoice Images"
            onClick={() => {
              setBulkUploadDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={
              <Box
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                whileHover={{ 
                  rotate: 15, 
                  scale: 1.3,
                  transition: { duration: 0.3 }
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: '1.5rem' }} />
              </Box>
            }
            tooltipTitle="Quick Camera Capture"
            onClick={() => {
              setCameraDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={
              <Box
                animate={{ 
                  x: [0, 3, -3, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                whileHover={{ 
                  scale: 1.3,
                  rotate: 5,
                  transition: { duration: 0.3 }
                }}
              >
                <TableChartIcon sx={{ fontSize: '1.5rem' }} />
              </Box>
            }
            tooltipTitle="Bulk CSV Upload"
            onClick={() => {
              setBulkCSVDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
        </SpeedDial>
      </Box>

      {/* Snackbar for messages */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createInvoiceDialogOpen}
        onClose={() => setCreateInvoiceDialogOpen(false)}
        onSuccess={(result) => {
          setSuccess(`Invoice created successfully! Invoice number: ${result.invoice_number}`);
          setCreateInvoiceDialogOpen(false);
          fetchInvoices();
          fetchSummary();
        }}
      />

      {/* OCR Invoice Upload Dialog */}
      <OCRInvoiceUploadDialog
        open={ocrInvoiceDialogOpen}
        onClose={() => setOcrInvoiceDialogOpen(false)}
        onSuccess={(result) => {
          setSuccess(`OCR invoice uploaded successfully! Invoice number: ${result.invoice_number}`);
          setOcrInvoiceDialogOpen(false);
          fetchInvoices();
          fetchSummary();
        }}
      />

      {/* Camera Upload Dialog */}
      <CameraUploadDialog
        open={cameraDialogOpen}
        onClose={() => setCameraDialogOpen(false)}
        onSuccess={(result) => {
          setSuccess(`Camera capture successful! Invoice processed.`);
          setCameraDialogOpen(false);
          fetchInvoices();
          fetchSummary();
        }}
      />

      {/* Bulk Upload Dialog */}
      <BulkInvoiceUploadDialog
        open={bulkUploadDialogOpen}
        onClose={() => setBulkUploadDialogOpen(false)}
        onSuccess={(result) => {
          setSuccess(`Bulk upload completed! ${result.successful} invoices created successfully, ${result.failed} failed.`);
          setBulkUploadDialogOpen(false);
          fetchInvoices();
          fetchSummary();
        }}
      />

      {/* Bulk CSV Upload Dialog */}
      <BulkInvoiceCSVDialog
        open={bulkCSVDialogOpen}
        onClose={() => setBulkCSVDialogOpen(false)}
        onSuccess={(result) => {
          setSuccess(`Bulk CSV upload completed! ${result.successful} invoices created successfully, ${result.failed} failed.`);
          setBulkCSVDialogOpen(false);
          fetchInvoices();
          fetchSummary();
        }}
      />

      {/* Manual Invoice Creation Dialog */}
      <ManualInvoiceCreationDialog
        open={manualInvoiceDialogOpen}
        onClose={() => setManualInvoiceDialogOpen(false)}
        onSuccess={(message) => {
          setSuccess(message);
          setManualInvoiceDialogOpen(false);
          fetchInvoices();
          fetchSummary();
        }}
      />

      {/* Bulk Manual Invoice Dialog */}
      <BulkManualInvoiceDialog
        open={bulkManualDialogOpen}
        onClose={() => setBulkManualDialogOpen(false)}
        onSuccess={(message) => {
          setSuccess(message);
          setBulkManualDialogOpen(false);
          fetchInvoices();
          fetchSummary();
        }}
      />
      </Box>
    </ErrorBoundary>
  );
};

export default InvoiceManagement;
