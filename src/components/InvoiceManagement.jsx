import React, { useState, useEffect } from 'react';
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
  SpeedDialIcon
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
  PendingActions as PendingIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import CameraUploadDialog from './CameraUploadDialog';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import OCRInvoiceUploadDialog from './OCRInvoiceUploadDialog';
import ErrorBoundary from './ErrorBoundary';

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
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [ocrInvoiceDialogOpen, setOcrInvoiceDialogOpen] = useState(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const SummaryCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' && title.includes('Value') 
                ? `$${value.toFixed(2)}` 
                : value
              }
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
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
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Invoice Management
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Invoices"
            value={summary.total_invoices}
            icon={<ReceiptIcon />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Issued"
            value={summary.issued_invoices}
            icon={<PendingIcon />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Acknowledged"
            value={summary.acknowledged_invoices}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Physical Captured"
            value={summary.physical_invoices_captured}
            icon={<CameraIcon />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={2}>
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

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoices ({invoices.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Physical</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Loading...</TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No invoices found</TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getTypeIcon(invoice.invoice_type)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {invoice.invoice_number}
                          </Typography>
                        </Box>
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
                        <IconButton
                          onClick={() => handleViewInvoice(invoice.id)}
                          title="View Invoice"
                          size="small"
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(invoice)}
                          title="Delete Invoice"
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
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
      <SpeedDial
        ariaLabel="Create Invoice Options"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Create Invoice Manually"
          onClick={() => {
            setCreateInvoiceDialogOpen(true);
            setSpeedDialOpen(false);
          }}
        />
        <SpeedDialAction
          icon={<AIIcon />}
          tooltipTitle="Create from Image Upload (OCR)"
          onClick={() => {
            setOcrInvoiceDialogOpen(true);
            setSpeedDialOpen(false);
          }}
        />
      </SpeedDial>

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
      </Box>
    </ErrorBoundary>
  );
};

export default InvoiceManagement;
