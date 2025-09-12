import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || data || []);
      } else {
        throw new Error('Failed to load invoices');
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setError('Failed to load invoices. Please try again.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    setFilteredInvoices(filtered);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleAction = (action, invoice = null) => {
    setSelectedInvoice(invoice);
    setDialogMode(action);
    setDialogOpen(true);
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          loadInvoices();
        } else {
          throw new Error('Failed to delete invoice');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        setError('Failed to delete invoice. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <ReceiptIcon sx={{ fontSize: '2rem', color: '#3B82F6' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937' }}>
                Invoice Management
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#6B7280' }}>
                AI-Powered Invoice Processing & Analytics
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => handleAction('upload')}
              sx={{ borderColor: '#3B82F6', color: '#3B82F6' }}
            >
              Upload Invoice
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleAction('add')}
              sx={{ backgroundColor: '#3B82F6' }}
            >
              New Invoice
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                  {stats.paid}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Paid
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EF4444' }}>
                  {stats.overdue}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Overdue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                  ₹{stats.totalAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Total Amount
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Actions */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#6B7280', mr: 1 }} />
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <IconButton onClick={loadInvoices} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Invoice Table */}
      <Paper sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < filteredInvoices.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Invoice Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No invoices found matching your filters' 
                        : 'No invoices available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const isSelected = selectedInvoices.includes(invoice.id);
                  return (
                    <TableRow
                      key={invoice.id}
                      sx={{ 
                        '&:hover': { backgroundColor: '#F8FAFC' },
                        backgroundColor: isSelected ? '#EBF8FF' : 'transparent'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#374151', fontWeight: 500 }}>
                        {invoice.invoice_number || `INV-${invoice.id}`}
                      </TableCell>
                      <TableCell sx={{ color: '#374151' }}>
                        {invoice.customer_name || 'Unknown Customer'}
                      </TableCell>
                      <TableCell sx={{ color: '#374151', fontWeight: 500 }}>
                        ₹{(invoice.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280' }}>
                        {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status || 'draft'}
                          color={getStatusColor(invoice.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => handleAction('view', invoice)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleAction('edit', invoice)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(invoice.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Simple Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Invoice' :
           dialogMode === 'edit' ? 'Edit Invoice' :
           dialogMode === 'view' ? 'View Invoice' :
           'Upload Invoice'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 2 }}>
            {dialogMode === 'upload' ? 
              'Invoice upload functionality will be implemented here.' :
              `${dialogMode} invoice form will be implemented here.`}
          </Typography>
          {selectedInvoice && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#F8FAFC', borderRadius: 1 }}>
              <pre style={{ fontSize: '0.75rem' }}>
                {JSON.stringify(selectedInvoice, null, 2)}
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" sx={{ backgroundColor: '#3B82F6' }}>
              {dialogMode === 'add' ? 'Create' : dialogMode === 'edit' ? 'Save' : 'Upload'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceManagement;
