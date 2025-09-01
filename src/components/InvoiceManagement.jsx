import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Grid,
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
  Receipt as ReceiptIcon,
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
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  PhotoCamera as PhotoCameraIcon,
  SmartToy as SmartToyIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import CameraUploadDialog from './CameraUploadDialog';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import OCRInvoiceUploadDialog from './OCRInvoiceUploadDialog';
import BulkInvoiceUploadDialog from './BulkInvoiceUploadDialog';
import ErrorBoundary from './ErrorBoundary';
import NotificationService from '../services/notificationService';

const API_BASE_URL = 'http://localhost:8000';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [ocrInvoiceDialogOpen, setOcrInvoiceDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
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
      const response = await fetch(`${API_BASE_URL}/api/invoices/invoice/${invoiceToDelete.id}`, {
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
      setSelectedInvoices(invoices.map(invoice => invoice.id));
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
      setSelectAll(newSelection.length === invoices.length && invoices.length > 0);
      
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
        fetch(`${API_BASE_URL}/api/invoices/invoice/${invoiceId}`, {
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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.05, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          background: gradient 
            ? `linear-gradient(135deg, ${color === 'primary' ? '#00D4AA' : color === 'success' ? '#4CAF50' : color === 'warning' ? '#FF9800' : color === 'error' ? '#F44336' : '#2196F3'} 0%, ${color === 'primary' ? '#00B899' : color === 'success' ? '#388E3C' : color === 'warning' ? '#F57C00' : color === 'error' ? '#D32F2F' : '#1976D2'} 100%)`
            : '#1A1A1A',
          border: '1px solid #2A2A2A',
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
                color={gradient ? "rgba(255,255,255,0.9)" : "textSecondary"} 
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Typography 
                  variant="h3" 
                  component="div"
                  sx={{ 
                    color: gradient ? '#FFFFFF' : color === 'primary' ? '#00D4AA' : color === 'success' ? '#4CAF50' : color === 'warning' ? '#FF9800' : color === 'error' ? '#F44336' : '#2196F3',
                    fontWeight: 700,
                    fontSize: '2.5rem'
                  }}
                >
                  {typeof value === 'number' && title.includes('Value') 
                    ? `$${value.toFixed(2)}` 
                    : value
                  }
                </Typography>
              </motion.div>
            </Box>
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              whileHover={{ 
                scale: 1.2,
                rotate: 360,
                transition: { duration: 0.5 }
              }}
            >
              <Box 
                sx={{ 
                  color: gradient ? 'rgba(255,255,255,0.9)' : color === 'primary' ? '#00D4AA' : color === 'success' ? '#4CAF50' : color === 'warning' ? '#FF9800' : color === 'error' ? '#F44336' : '#2196F3',
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
            </motion.div>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
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
          <Grid container spacing={2}>
            {/* Student Information */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Student Information
                  </Typography>
                  <Typography><strong>Name:</strong> {selectedInvoice.student_name}</Typography>
                  <Typography><strong>Student ID:</strong> {selectedInvoice.student_id_number}</Typography>
                  <Typography><strong>Email:</strong> {selectedInvoice.student_email}</Typography>
                  <Typography><strong>Department:</strong> {selectedInvoice.department}</Typography>
                  <Typography><strong>Year:</strong> {selectedInvoice.year_of_study}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Invoice Details */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invoice Details
                  </Typography>
                  <Typography><strong>Order:</strong> {selectedInvoice.order_number}</Typography>
                  <Typography><strong>Type:</strong> {selectedInvoice.invoice_type}</Typography>
                  <Typography><strong>Items:</strong> {selectedInvoice.total_items}</Typography>
                  <Typography><strong>Issue Date:</strong> {formatDate(selectedInvoice.issue_date)}</Typography>
                  <Typography><strong>Due Date:</strong> {formatDate(selectedInvoice.due_date)}</Typography>
                  <Typography><strong>Issued By:</strong> {selectedInvoice.issued_by}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Physical Invoice Status */}
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">Physical Invoice</Typography>
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
            </Grid>

            {/* Items */}
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <Grid size={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Items</Typography>
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
                              <TableCell align="right">${item.unit_value.toFixed(2)}</TableCell>
                              <TableCell>{formatDate(item.expected_return_date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Images */}
            {selectedInvoice.images && selectedInvoice.images.length > 0 && (
              <Grid size={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Uploaded Images ({selectedInvoice.images.length})
                    </Typography>
                    <Grid container spacing={1}>
                      {selectedInvoice.images.map((image, index) => (
                        <Grid size={{ xs: 6, md: 3 }} key={index}>
                          <Card variant="outlined">
                            <CardContent sx={{ p: 1 }}>
                              <Typography variant="body2" noWrap>
                                {image.image_type.replace('_', ' ').toUpperCase()}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
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
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <ErrorBoundary>
      <Box p={3}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #00D4AA 0%, #00B899 100%)',
                  borderRadius: '50%',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0, 212, 170, 0.3)'
                }}
              >
                <ReceiptIcon sx={{ fontSize: '2rem', color: '#FFFFFF' }} />
              </Box>
            </motion.div>
            <Box>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{ 
                  background: 'linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  fontSize: '2.5rem'
                }}
              >
                Invoice Management
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#888888' }}>
                AI-Powered Invoice Processing & Analytics
              </Typography>
            </Box>
          </Box>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchInvoices();
                fetchSummary();
              }}
              sx={{
                borderColor: '#00D4AA',
                color: '#00D4AA',
                '&:hover': {
                  borderColor: '#00B899',
                  backgroundColor: 'rgba(0, 212, 170, 0.08)'
                }
              }}
            >
              Refresh Data
            </Button>
          </motion.div>
        </Box>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Total Invoices"
              value={summary.total_invoices}
              icon={<ReceiptIcon sx={{ fontSize: '2.5rem' }} />}
              color="primary"
              gradient={true}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Issued"
              value={summary.issued_invoices}
              icon={<TrendingUpIcon sx={{ fontSize: '2.5rem' }} />}
              color="info"
              gradient={false}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="Acknowledged"
              value={summary.acknowledged_invoices}
              icon={<CheckCircleIcon sx={{ fontSize: '2.5rem' }} />}
              color="success"
              gradient={true}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="AI Captured"
              value={summary.physical_invoices_captured}
              icon={<SmartToyIcon sx={{ fontSize: '2.5rem' }} />}
              color="warning"
              gradient={false}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card 
          sx={{ 
            mb: 4,
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '16px'
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #6C63FF 0%, #5A52FF 100%)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ScheduleIcon sx={{ color: '#FFFFFF', fontSize: '1.5rem' }} />
                </Box>
              </motion.div>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#FFFFFF',
                  fontWeight: 600
                }}
              >
                Smart Filters
              </Typography>
            </Box>
            <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="issued">Issued</MenuItem>
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={filters.invoice_type}
                onChange={(e) => setFilters({...filters, invoice_type: e.target.value})}
                size="small"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="lending">Lending</MenuItem>
                <MenuItem value="return">Return</MenuItem>
                <MenuItem value="damage">Damage</MenuItem>
                <MenuItem value="replacement">Replacement</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="outlined"
                onClick={() => setFilters({status: '', invoice_type: '', student_id: ''})}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      </motion.div>

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Invoices ({invoices.length})
            </Typography>
            {/* Bulk Delete Button - only show when items are selected */}
            {selectedInvoices.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                sx={{
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
          </Box>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <TableContainer 
              sx={{
                background: '#1A1A1A',
                borderRadius: '16px',
                border: '1px solid #2A2A2A',
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)'
                  }}>
                    {/* Select All Checkbox Column */}
                    <TableCell sx={{ 
                      width: '60px', 
                      textAlign: 'center',
                      borderBottom: '1px solid #2A2A2A',
                      color: '#FFFFFF',
                      fontWeight: 700
                    }}>
                      <Tooltip title={selectAll ? 'Deselect All' : 'Select All'}>
                        <Checkbox
                          checked={selectAll}
                          indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < invoices.length}
                          onChange={handleSelectAll}
                          disabled={invoices.length === 0}
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
                  <TableCell sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A'
                  }}>
                    Invoice #
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A'
                  }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A'
                  }}>
                    Student
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A'
                  }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A'
                  }}>
                    Issue Date
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A'
                  }}>
                    Items
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#FFFFFF', 
                    fontWeight: 700,
                    borderBottom: '1px solid #2A2A2A'
                  }}>
                    Physical
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      color: '#FFFFFF', 
                      fontWeight: 700,
                      borderBottom: '1px solid #2A2A2A'
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">Loading...</TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No invoices found</TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {invoices.map((invoice, index) => {
                      const isSelected = selectedInvoices.includes(invoice.id);
                      return (
                        <motion.tr
                          key={invoice.id}
                          component={TableRow}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                          whileHover={{
                            scale: 1.01,
                            boxShadow: '0 4px 20px rgba(0, 212, 170, 0.1)',
                            transition: { duration: 0.2 }
                          }}
                          sx={{
                            backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                            borderBottom: '1px solid #2A2A2A',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: isSelected 
                                ? 'rgba(0, 212, 170, 0.12)' 
                                : 'rgba(255, 255, 255, 0.02)',
                              '& .MuiTableCell-root': {
                                color: '#FFFFFF'
                              }
                            }
                          }}
                        >
                          {/* Individual Select Checkbox */}
                          <TableCell sx={{ 
                            textAlign: 'center', 
                            width: '60px',
                            borderBottom: '1px solid #2A2A2A',
                            color: '#E0E0E0'
                          }}>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleSelectInvoice(invoice.id)}
                                sx={{
                                  color: '#00D4AA',
                                  '&.Mui-checked': {
                                    color: '#00D4AA',
                                  }
                                }}
                              />
                            </motion.div>
                          </TableCell>
                          <TableCell sx={{ 
                            borderBottom: '1px solid #2A2A2A',
                            color: '#E0E0E0'
                          }}>
                            <motion.div
                              whileHover={{ x: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Box display="flex" alignItems="center">
                                <motion.div
                                  animate={{ 
                                    rotate: [0, 5, -5, 0],
                                  }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 5
                                  }}
                                >
                                  {getTypeIcon(invoice.invoice_type)}
                                </motion.div>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    ml: 1,
                                    color: '#00D4AA',
                                    fontWeight: 600
                                  }}
                                >
                                  {invoice.invoice_number}
                                </Typography>
                              </Box>
                            </motion.div>
                          </TableCell>
                      <TableCell>
                        <Chip 
                          label={invoice.invoice_type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{invoice.student_name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {invoice.department}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={invoice.status}
                          color={getStatusColor(invoice.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell>
                        <Badge badgeContent={invoice.item_count} color="primary">
                          <AssignmentIcon />
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      <TableCell align="center">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconButton
                            onClick={() => handleViewInvoice(invoice.id)}
                            title="View Invoice"
                            size="small"
                            sx={{
                              color: '#00D4AA',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 212, 170, 0.1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconButton
                            onClick={() => handleDeleteClick(invoice)}
                            title="Delete Invoice"
                            size="small"
                            sx={{
                              color: '#FF5252',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 82, 82, 0.1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                    );
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </motion.div>
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
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <SpeedDial
          ariaLabel="Create Invoice Options"
          sx={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32,
            '& .MuiFab-primary': {
              background: 'linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%)',
              width: '64px',
              height: '64px',
              boxShadow: '0 12px 48px rgba(0, 212, 170, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00B899 0%, #5A52FF 100%)',
                transform: 'scale(1.1)',
                boxShadow: '0 16px 64px rgba(0, 212, 170, 0.5)',
              }
            },
            '& .MuiSpeedDialAction-fab': {
              background: '#1A1A1A',
              border: '2px solid #2A2A2A',
              color: '#00D4AA',
              '&:hover': {
                background: 'linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%)',
                color: '#FFFFFF',
                transform: 'scale(1.15)',
                boxShadow: '0 8px 32px rgba(0, 212, 170, 0.3)',
              }
            }
          }}
          icon={
            <motion.div
              animate={{ 
                rotate: speedDialOpen ? 45 : 0,
                scale: speedDialOpen ? 1.2 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <SpeedDialIcon 
                sx={{ 
                  fontSize: '2rem',
                  color: '#FFFFFF'
                }} 
              />
            </motion.div>
          }
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          <SpeedDialAction
            icon={
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.5 }}
              >
                <AddIcon sx={{ fontSize: '1.5rem' }} />
              </motion.div>
            }
            tooltipTitle="Create Invoice Manually"
            onClick={() => {
              setCreateInvoiceDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={
              <motion.div
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
              </motion.div>
            }
            tooltipTitle="AI-Powered OCR Upload"
            onClick={() => {
              setOcrInvoiceDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={
              <motion.div
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
              </motion.div>
            }
            tooltipTitle="Bulk Upload Invoice Images"
            onClick={() => {
              setBulkUploadDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={
              <motion.div
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
              </motion.div>
            }
            tooltipTitle="Quick Camera Capture"
            onClick={() => {
              setCameraDialogOpen(true);
              setSpeedDialOpen(false);
            }}
          />
        </SpeedDial>
      </motion.div>

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
      </Box>
    </ErrorBoundary>
  );
};

export default InvoiceManagement;
