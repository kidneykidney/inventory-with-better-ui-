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
  ListItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Slider,
  Divider,
  Collapse,
  Autocomplete
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
  SmartToy as SmartToyIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Receipt as ReceiptIcon,
  TableChart as TableChartIcon,
  Create as CreateIcon,
  AutoFixHigh as MagicIcon,
  DocumentScanner as ScannerIcon,
  NoteAdd as NoteAddIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  LocalFireDepartment as FireIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import CameraUploadDialog from './CameraUploadDialog';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import ManualInvoiceCreationDialog from './ManualInvoiceCreationDialog';
import OCRInvoiceUploadDialog from './OCRInvoiceUploadDialog';
import BulkInvoiceUploadDialog from './BulkInvoiceUploadDialog';
import BulkInvoiceCSVDialog from './BulkInvoiceCSVDialog';
import BulkManualInvoiceDialog from './BulkManualInvoiceDialog';
import InvoiceImageViewer from './InvoiceImageViewer';
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
    student_id: '',
    staff_name: '',
    department: '',
    dateFrom: '',
    dateTo: '',
    amountMin: 0,
    amountMax: 10000,
    component: '',
    invoiceNumber: ''
  });
  
  // Enhanced filter state
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [components, setComponents] = useState([]);
  
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
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedInvoiceForImages, setSelectedInvoiceForImages] = useState(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [selectedInvoiceForItems, setSelectedInvoiceForItems] = useState(null);
  
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
    fetchFilterData();
  }, []);

  // Enhanced filtering effect
  useEffect(() => {
    applyFilters();
  }, [searchQuery, invoices, filters]);

  // Fetch additional data for filters
  const fetchFilterData = async () => {
    try {
      console.log('Fetching filter data...');
      
      // Fetch students for filter dropdown
      const studentsResponse = await fetch(`${API_BASE_URL}/api/students`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        console.log('Students loaded:', studentsData.length);
        setStudents(studentsData);
      }
      
      // Fetch staff/lenders for departments dropdown
      const lendersResponse = await fetch(`${API_BASE_URL}/api/lenders`);
      if (lendersResponse.ok) {
        const lendersData = await lendersResponse.json();
        console.log('Lenders loaded:', lendersData.length);
        
        // Extract unique departments from staff/lenders
        const uniqueDepartments = [...new Set(lendersData.map(lender => lender.department).filter(Boolean))];
        console.log('Staff departments loaded:', uniqueDepartments);
        setDepartments(uniqueDepartments);
      }
      
      // Fetch components for filter dropdown
      const componentsResponse = await fetch(`${API_BASE_URL}/api/products`);
      if (componentsResponse.ok) {
        const componentsData = await componentsResponse.json();
        console.log('Components loaded:', componentsData.length);
        console.log('Sample component data:', componentsData[0]);
        if (componentsData.length > 0) {
          console.log('Component fields:', Object.keys(componentsData[0]));
        }
        setComponents(componentsData);
      } else {
        console.error('Failed to fetch components:', componentsResponse.status);
      }
    } catch (err) {
      console.error('Failed to fetch filter data:', err);
    }
  };

  // Enhanced filtering function
  const applyFilters = () => {
    let filtered = [...invoices];
    
    console.log('Applying filters:', filters);
    console.log('Total invoices before filtering:', invoices.length);

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => {
        return (
          (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(query)) ||
          (invoice.student_name && invoice.student_name.toLowerCase().includes(query)) ||
          (invoice.status && invoice.status.toLowerCase().includes(query)) ||
          (invoice.invoice_type && invoice.invoice_type.toLowerCase().includes(query)) ||
          (invoice.notes && invoice.notes.toLowerCase().includes(query)) ||
          (invoice.lender_name && invoice.lender_name.toLowerCase().includes(query)) ||
          (invoice.issued_by_lender && invoice.issued_by_lender.toLowerCase().includes(query)) ||
          (invoice.department && invoice.department.toLowerCase().includes(query))
        );
      });
      console.log('After search filter:', filtered.length);
    }

    // Apply status filter
    if (filters.status) {
      console.log('Applying status filter:', filters.status);
      filtered = filtered.filter(invoice => {
        console.log('Invoice status:', invoice.status, 'Filter:', filters.status);
        return invoice.status === filters.status;
      });
      console.log('After status filter:', filtered.length);
    }

    // Apply invoice type filter
    if (filters.invoice_type) {
      console.log('Applying invoice type filter:', filters.invoice_type);
      filtered = filtered.filter(invoice => invoice.invoice_type === filters.invoice_type);
      console.log('After invoice type filter:', filtered.length);
    }

    // Apply student filter
    if (filters.student_id) {
      console.log('Applying student filter:', filters.student_id);
      filtered = filtered.filter(invoice => {
        const studentMatch = invoice.student_id === parseInt(filters.student_id) || 
                           invoice.student_id === filters.student_id;
        console.log('Student ID match:', invoice.student_id, 'vs', filters.student_id, '=', studentMatch);
        return studentMatch;
      });
      console.log('After student filter:', filtered.length);
    }

    // Apply staff/lender filter
    if (filters.staff_name) {
      console.log('Applying staff filter:', filters.staff_name);
      filtered = filtered.filter(invoice => 
        (invoice.issued_by_lender && invoice.issued_by_lender.includes(filters.staff_name)) ||
        (invoice.lender_name && invoice.lender_name.includes(filters.staff_name))
      );
      console.log('After staff filter:', filtered.length);
    }

    // Apply department filter
    if (filters.department) {
      console.log('Applying department filter:', filters.department);
      filtered = filtered.filter(invoice => invoice.department === filters.department);
      console.log('After department filter:', filtered.length);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      console.log('Applying date from filter:', filters.dateFrom);
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        const fromDate = new Date(filters.dateFrom);
        return invoiceDate >= fromDate;
      });
      console.log('After date from filter:', filtered.length);
    }
    if (filters.dateTo) {
      console.log('Applying date to filter:', filters.dateTo);
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        const toDate = new Date(filters.dateTo);
        return invoiceDate <= toDate;
      });
      console.log('After date to filter:', filtered.length);
    }

    // Apply amount range filter
    if (filters.amountMin > 0 || (filters.amountMax && filters.amountMax < 10000)) {
      console.log('Applying amount filter:', filters.amountMin, 'to', filters.amountMax);
      filtered = filtered.filter(invoice => {
        const amount = parseFloat(invoice.total_amount || 0);
        const minAmount = parseFloat(filters.amountMin) || 0;
        const maxAmount = parseFloat(filters.amountMax) || 10000;
        const inRange = amount >= minAmount && amount <= maxAmount;
        console.log('Amount check:', amount, 'in range', minAmount, '-', maxAmount, '=', inRange);
        return inRange;
      });
      console.log('After amount filter:', filtered.length);
    }

    // Apply component filter
    if (filters.component) {
      console.log('Applying component filter:', filters.component);
      filtered = filtered.filter(invoice => {
        // Check if invoice has components and search within them
        if (invoice.components && Array.isArray(invoice.components)) {
          return invoice.components.some(component => 
            (component.name && component.name === filters.component) ||
            (component.sku && component.sku === filters.component) ||
            (component.product_name && component.product_name === filters.component)
          );
        }
        return false;
      });
      console.log('After component filter:', filtered.length);
    }

    // Apply department filter
    if (filters.department) {
      console.log('Applying department filter:', filters.department);
      filtered = filtered.filter(invoice => 
        invoice.department && invoice.department === filters.department
      );
      console.log('After department filter:', filtered.length);
    }

    // Apply invoice number filter
    if (filters.invoiceNumber) {
      console.log('Applying invoice number filter:', filters.invoiceNumber);
      filtered = filtered.filter(invoice => 
        invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(filters.invoiceNumber.toLowerCase())
      );
      console.log('After invoice number filter:', filtered.length);
    }

    console.log('Final filtered count:', filtered.length);
    setFilteredInvoices(filtered);
  };

  // Search handlers
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Filter handlers
  const handleFilterChange = (filterName) => (event) => {
    let value = event.target.value;
    
    // Handle numeric fields
    if (filterName === 'amountMin' || filterName === 'amountMax') {
      value = value === '' ? (filterName === 'amountMin' ? 0 : 10000) : parseFloat(value);
    }
    
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleAmountRangeChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      amountMin: newValue[0],
      amountMax: newValue[1]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: '',
      invoice_type: '',
      student_id: '',
      staff_name: '',
      department: '',
      dateFrom: '',
      dateTo: '',
      amountMin: 0,
      amountMax: 10000,
      component: '',
      invoiceNumber: ''
    });
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !(key === 'amountMin' && value === 0) && !(key === 'amountMax' && value === 10000)) {
        count++;
      }
    });
    return count;
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
        
        // Debug: Log invoice data to see available fields
        console.log('Sample invoice data:', data[0]);
        console.log('All invoice fields:', data.length > 0 ? Object.keys(data[0]) : 'No invoices');
        
        // Extract unique staff members from loaded invoices - use lender_name instead of ID
        const staffFields = data.map(inv => {
          return inv.lender_name || inv.issued_by_lender_name || inv.issued_by;
        }).filter(Boolean);
        
        console.log('Raw staff fields:', staffFields);
        const uniqueStaff = [...new Set(staffFields)];
        console.log('Staff members loaded from invoices:', uniqueStaff);
        setStaffMembers(uniqueStaff);
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

  const handleViewItems = async (invoiceId) => {
    try {
      // First get the invoice details
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Invoice data:', data); // Debug log
        
        // If invoice has items, use them directly
        if (data.items && data.items.length > 0) {
          setSelectedInvoiceForItems(data);
          setItemsDialogOpen(true);
          return;
        }
        
        // If no items but has order_id, try to get items from the order
        if (data.order_id) {
          console.log('No direct items, checking order:', data.order_id);
          try {
            const orderResponse = await fetch(`${API_BASE_URL}/api/orders/${data.order_id}`);
            const orderData = await orderResponse.json();
            
            if (orderResponse.ok && orderData.items && orderData.items.length > 0) {
              // Convert order items to invoice item format
              const convertedItems = orderData.items.map(orderItem => ({
                id: orderItem.id,
                product_id: orderItem.product_id,
                product_name: orderItem.product_name,
                product_sku: orderItem.product_sku || orderItem.sku,
                product_category: orderItem.product_category || orderItem.category,
                product_description: orderItem.product_description || orderItem.description,
                quantity: orderItem.quantity,
                unit_value: orderItem.unit_price || orderItem.price || 0,
                total_value: orderItem.total_price || (orderItem.quantity * (orderItem.unit_price || orderItem.price || 0)),
                expected_return_date: orderItem.expected_return_date || data.expected_return_date,
                actual_return_date: null,
                condition_at_lending: 'good',
                notes: orderItem.notes,
                // Add source indicator
                _source: 'order'
              }));
              
              // Add converted items to invoice data
              const enhancedData = {
                ...data,
                items: convertedItems,
                _itemsSource: 'order'
              };
              
              setSelectedInvoiceForItems(enhancedData);
              setItemsDialogOpen(true);
              return;
            }
          } catch (orderError) {
            console.error('Error fetching order items:', orderError);
          }
        }
        
        // Try to fetch items using the dedicated items endpoint
        try {
          const itemsResponse = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/items`);
          if (itemsResponse.ok) {
            const itemsData = await itemsResponse.json();
            if (itemsData && itemsData.length > 0) {
              const enhancedData = {
                ...data,
                items: itemsData,
                _itemsSource: 'items_endpoint'
              };
              setSelectedInvoiceForItems(enhancedData);
              setItemsDialogOpen(true);
              return;
            }
          }
        } catch (itemsError) {
          console.error('Error fetching items from items endpoint:', itemsError);
        }
        
        // If still no items found, show empty dialog with creation info
        const enhancedData = {
          ...data,
          items: [],
          _itemsSource: 'none',
          _creationMethod: data.notes?.includes('manual') ? 'manual' : 
                           data.notes?.includes('OCR') ? 'ocr' : 
                           data.order_id ? 'order' : 'unknown'
        };
        setSelectedInvoiceForItems(enhancedData);
        setItemsDialogOpen(true);
        
      } else {
        setError('Failed to fetch invoice items');
      }
    } catch (err) {
      console.error('Error in handleViewItems:', err);
      setError('Network error while fetching invoice items');
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

  const handleViewInvoiceImages = (invoice) => {
    setSelectedInvoiceForImages(invoice);
    setImageViewerOpen(true);
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
                  👤 Borrower Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                  <Typography variant="body2"><strong>📝 Full Name:</strong> {selectedInvoice.student_name}</Typography>
                  <Typography variant="body2"><strong>🆔 Student ID:</strong> {selectedInvoice.student_id_number}</Typography>
                  <Typography variant="body2"><strong>📧 Email:</strong> {selectedInvoice.student_email}</Typography>
                  <Typography variant="body2"><strong>🏢 Department:</strong> {selectedInvoice.department}</Typography>
                  <Typography variant="body2"><strong>📚 Year of Study:</strong> {selectedInvoice.year_of_study}</Typography>
                  <Typography variant="body2"><strong>📞 Contact:</strong> 
                    <Chip 
                      label={selectedInvoice.acknowledged_by_student ? 'Verified' : 'Pending Verification'} 
                      size="small" 
                      color={selectedInvoice.acknowledged_by_student ? 'success' : 'warning'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
                
                {/* Staff/Lender Information */}
                {(selectedInvoice.lender_name || selectedInvoice.issued_by_lender) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                      👥 Staff/Lender Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                      <Typography variant="body2"><strong>👤 Staff Name:</strong> {selectedInvoice.lender_name || selectedInvoice.issued_by_lender || 'Not Assigned'}</Typography>
                      {selectedInvoice.lender_email && (
                        <Typography variant="body2"><strong>📧 Staff Email:</strong> {selectedInvoice.lender_email}</Typography>
                      )}
                      {selectedInvoice.lender_department && (
                        <Typography variant="body2"><strong>🏢 Staff Department:</strong> {selectedInvoice.lender_department}</Typography>
                      )}
                      {selectedInvoice.lender_designation && (
                        <Typography variant="body2"><strong>💼 Designation:</strong> {selectedInvoice.lender_designation}</Typography>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Borrower Responsibilities */}
                <Box sx={{ mt: 2, p: 2, bgcolor: '#FFF7ED', borderRadius: 1, borderLeft: '4px solid #F59E0B' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>⚠️ Borrower Responsibilities:</Typography>
                  <Typography variant="body2">
                    The borrower ({selectedInvoice.student_name}) acknowledges receiving the above components and agrees to:
                    return them by the specified date, maintain them in good condition, and accept liability for any damage or loss.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                  📋 Lending Agreement Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                  <Typography variant="body2"><strong>📄 Order Reference:</strong> {selectedInvoice.order_number || 'Manual Invoice'}</Typography>
                  <Typography variant="body2"><strong>📦 Lending Type:</strong> {selectedInvoice.invoice_type}</Typography>
                  <Typography variant="body2"><strong>📊 Total Items:</strong> {selectedInvoice.total_items}</Typography>
                  <Typography variant="body2"><strong>💰 Total Value:</strong> ₹{selectedInvoice.total_value?.toFixed(2) || '0.00'}</Typography>
                  <Typography variant="body2"><strong>📅 Issued On:</strong> {formatDate(selectedInvoice.issue_date)}</Typography>
                  <Typography variant="body2"><strong>⏰ Return By:</strong> {formatDate(selectedInvoice.due_date)}</Typography>
                  <Typography variant="body2"><strong>👤 Issued By (Lender):</strong> {selectedInvoice.issued_by || 'System'}</Typography>
                  <Typography variant="body2"><strong>📍 Status:</strong> 
                    <Chip 
                      label={selectedInvoice.status} 
                      size="small" 
                      color={
                        selectedInvoice.status === 'issued' ? 'success' : 
                        selectedInvoice.status === 'acknowledged' ? 'primary' : 'default'
                      }
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
                
                {/* Lending Duration & Terms */}
                <Box sx={{ mt: 2, p: 2, bgcolor: '#F8F9FA', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>📋 Lending Terms:</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
                    <Typography variant="body2">• Items must be returned in original condition</Typography>
                    <Typography variant="body2">• Borrower is responsible for any damage or loss</Typography>
                    <Typography variant="body2">• Late returns may incur additional fees</Typography>
                    <Typography variant="body2">• Contact lender for any issues or extensions</Typography>
                  </Box>
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
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                    📦 Components Being Lent
                  </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#F8F9FA' }}>
                            <TableCell><strong>🔧 Component Name</strong></TableCell>
                            <TableCell><strong>🏷️ SKU/ID</strong></TableCell>
                            <TableCell align="right"><strong>📊 Qty</strong></TableCell>
                            <TableCell align="right"><strong>💰 Value Each</strong></TableCell>
                            <TableCell align="right"><strong>💰 Total Value</strong></TableCell>
                            <TableCell><strong>📅 Return Date</strong></TableCell>
                            <TableCell><strong>⏱️ Lending Period</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedInvoice.items.map((item, index) => {
                            const totalItemValue = (item.quantity * item.unit_value).toFixed(2);
                            const lendingDays = item.lending_duration_days || 
                              (item.expected_return_date && selectedInvoice.issue_date ? 
                                Math.ceil((new Date(item.expected_return_date) - new Date(selectedInvoice.issue_date)) / (1000 * 60 * 60 * 24)) : 
                                null);
                            
                            return (
                              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#FAFAFA' } }}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.product_name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {item.product_sku}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip label={item.quantity} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell align="right">₹{item.unit_value.toFixed(2)}</TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{totalItemValue}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {formatDate(item.expected_return_date)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={lendingDays ? `${lendingDays} days` : 'TBD'} 
                                    size="small" 
                                    color={lendingDays > 30 ? 'warning' : 'primary'}
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Summary Row */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#EBF8FF', borderRadius: 1, borderLeft: '4px solid #3B82F6' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        📋 Summary: {selectedInvoice.total_items} component(s) worth ₹{selectedInvoice.total_value?.toFixed(2) || '0.00'} 
                        lent to {selectedInvoice.student_name} on {formatDate(selectedInvoice.issue_date)}
                      </Typography>
                    </Box>
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

      {/* Enhanced Filters - Exactly like Products Management */}
      <Paper sx={{ mb: 2, borderRadius: 2 }}>
        {/* Compact Search and Filter Header */}
        <Box sx={{ p: 1.5 }}>
          <Grid container spacing={1.5} alignItems="center">
            {/* Search Field - Takes up most space (same as products) */}
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Search invoices by number, student, status..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'action.active', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch}>
                        <CloseIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.75 },
                  '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                  '& .MuiOutlinedInput-root': {
                    minHeight: '32px',
                    height: '32px'
                  }
                }}
              />
            </Grid>
            
            {/* Filter Toggle and Clear */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant={filterExpanded ? "contained" : "outlined"}
                  startIcon={<FilterIcon sx={{ fontSize: '1rem' }} />}
                  endIcon={filterExpanded ? '▲' : '▼'}
                  onClick={() => setFilterExpanded(!filterExpanded)}
                  sx={{ 
                    minWidth: 'auto', 
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1
                  }}
                >
                  More
                </Button>
                {getActiveFilterCount() > 0 && (
                  <Button
                    size="small" 
                    variant="outlined"
                    color="error"
                    onClick={clearAllFilters} 
                    startIcon={<CloseIcon sx={{ fontSize: '1rem' }} />}
                    sx={{ 
                      minWidth: 'auto',
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1,
                      borderColor: 'error.main',
                      '&:hover': { 
                        backgroundColor: 'error.lighter',
                        borderColor: 'error.dark'
                      }
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {getActiveFilterCount() > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {searchQuery && (
                <Chip 
                  size="small" 
                  label={`"${searchQuery}"`} 
                  onDelete={handleClearSearch}
                  sx={{ fontSize: '0.7rem', height: 22 }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Advanced Filters - Collapsible (exactly like products) */}
        <Collapse in={filterExpanded}>
          <Box sx={{ px: 1.5, pb: 1.5, borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
            <Grid container spacing={1.5}>
              {/* Row 1: Amount Range (like Min/Max Price in products) */}
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  type="number"
                  label="Min Amount"
                  placeholder="₹0"
                  value={filters.amountMin || ''}
                  onChange={handleFilterChange('amountMin')}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  type="number"
                  label="Max Amount"
                  placeholder="₹999999"
                  value={filters.amountMax === 10000 ? '' : filters.amountMax}
                  onChange={handleFilterChange('amountMax')}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  size="small"
                  freeSolo
                  options={students.map(student => ({
                    id: student.id,
                    name: student.name,
                    label: student.name
                  }))}
                  value={students.find(student => student.id === filters.student_id) || null}
                  onInputChange={(event, newInputValue) => {
                    // If typing, try to find matching student
                    const matchingStudent = students.find(student => 
                      student.name.toLowerCase().includes(newInputValue.toLowerCase())
                    );
                    setFilters(prev => ({ ...prev, student_id: matchingStudent?.id || '' }));
                  }}
                  onChange={(event, newValue) => {
                    setFilters(prev => ({ ...prev, student_id: newValue?.id || '' }));
                  }}
                  getOptionLabel={(option) => option.label || option.name || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Student"
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.8rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                />
              </Grid>

              {/* Row 3: Department, Staff, and Component Search */}
              <Grid item xs={12} md={3}>
                <Autocomplete
                  size="small"
                  freeSolo
                  options={departments}
                  value={filters.department || ''}
                  onInputChange={(event, newInputValue) => {
                    setFilters(prev => ({ ...prev, department: newInputValue || '' }));
                  }}
                  onChange={(event, newValue) => {
                    setFilters(prev => ({ ...prev, department: newValue || '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Department"
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.8rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  size="small"
                  freeSolo
                  options={staffMembers}
                  value={filters.staff_name || ''}
                  onInputChange={(event, newInputValue) => {
                    setFilters(prev => ({ ...prev, staff_name: newInputValue || '' }));
                  }}
                  onChange={(event, newValue) => {
                    setFilters(prev => ({ ...prev, staff_name: newValue || '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Staff Member"
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.8rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  size="small"
                  freeSolo
                  options={components.map(component => {
                    const componentName = component.name || component.description || `Component ${component.id}`;
                    return `${componentName}${component.sku ? ` (${component.sku})` : ''}`;
                  })}
                  value={filters.component || ''}
                  onInputChange={(event, newInputValue) => {
                    // Extract just the component name part before the SKU
                    const componentName = newInputValue ? newInputValue.split(' (')[0] : '';
                    setFilters(prev => ({ ...prev, component: componentName }));
                  }}
                  onChange={(event, newValue) => {
                    // Extract just the component name part before the SKU
                    const componentName = newValue ? newValue.split(' (')[0] : '';
                    setFilters(prev => ({ ...prev, component: componentName }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Component"
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.8rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Row 4: Date Range and Invoice Number Pattern */}
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  type="date"
                  label="From Date"
                  value={filters.dateFrom || ''}
                  onChange={handleFilterChange('dateFrom')}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  size="small"
                  type="date"
                  label="To Date"
                  value={filters.dateTo || ''}
                  onChange={handleFilterChange('dateTo')}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  label="Invoice Number Pattern"
                  placeholder="Search by invoice number..."
                  value={filters.invoiceNumber || ''}
                  onChange={handleFilterChange('invoiceNumber')}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.8rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ReceiptIcon sx={{ color: 'action.active', fontSize: '1rem' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

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
                    Student
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Total Value
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Items Count
                  </TableCell>
                  <TableCell sx={{ 
                    color: '#1F2937', 
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    Expected Return
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
                    Staff/Lender
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
                        <Box>
                          <Typography variant="body2" sx={{ color: '#1F2937', fontWeight: 600 }}>
                            ${(() => {
                              // Try to get total from invoice level first
                              const invoiceTotal = parseFloat(invoice.total_amount || invoice.total_value || 0);
                              if (invoiceTotal > 0) return invoiceTotal.toFixed(2);
                              
                              // If no invoice total, calculate from items if available
                              if (invoice.items && invoice.items.length > 0) {
                                const itemsTotal = invoice.items.reduce((sum, item) => {
                                  return sum + (parseFloat(item.total_value) || (parseFloat(item.unit_value || 0) * parseInt(item.quantity || 1)));
                                }, 0);
                                return itemsTotal.toFixed(2);
                              }
                              
                              // Default to 0.00
                              return '0.00';
                            })()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            Total Value
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#1F2937'
                      }}>
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <Chip 
                            label={invoice.items_count || invoice.item_count || '0'}
                            size="small"
                            variant="outlined"
                            sx={{
                              backgroundColor: invoice.items_count > 0 ? '#EEF2FF' : '#F3F4F6',
                              borderColor: invoice.items_count > 0 ? '#3B82F6' : '#D1D5DB',
                              color: invoice.items_count > 0 ? '#3B82F6' : '#6B7280'
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#1F2937'
                      }}>
                        <Box>
                          <Typography variant="body2" sx={{ 
                            color: (invoice.expected_return_date || invoice.due_date) ? '#1F2937' : '#9CA3AF',
                            fontWeight: (invoice.expected_return_date || invoice.due_date) ? 500 : 400
                          }}>
                            {(invoice.expected_return_date || invoice.due_date) ? formatDate(invoice.expected_return_date || invoice.due_date) : 'Not Set'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        
                        color: '#1F2937'
                      }}>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell sx={{ 
                        color: '#1F2937'
                      }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#1F2937', fontWeight: 500 }}>
                            {invoice.lender_name || 'No Staff Assigned'}
                          </Typography>
                          {invoice.lender_department && (
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              {invoice.lender_department}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ 
                        color: '#1F2937'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          minHeight: '24px'
                        }}>
                          {invoice.image_count > 0 ? (
                            <Tooltip title="View invoice images">
                              <IconButton
                                size="small"
                                onClick={() => handleViewInvoiceImages(invoice)}
                                sx={{ 
                                  p: 0.5,
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <CameraIcon fontSize="small" color="primary" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="No images available">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CameraIcon color="disabled" fontSize="small" />
                              </Box>
                            </Tooltip>
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
              <AddIcon 
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
                <CreateIcon sx={{ fontSize: '1.5rem' }} />
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
                <NoteAddIcon sx={{ fontSize: '1.5rem' }} />
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

      {/* Invoice Image Viewer Dialog */}
      <InvoiceImageViewer
        open={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false);
          setSelectedInvoiceForImages(null);
        }}
        invoiceId={selectedInvoiceForImages?.id}
        invoiceNumber={selectedInvoiceForImages?.invoice_number}
      />

      {/* Invoice Items Dialog */}
      <Dialog
        open={itemsDialogOpen}
        onClose={() => setItemsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              📋 Invoice Items - {selectedInvoiceForItems?.invoice_number}
            </Typography>
            <IconButton onClick={() => setItemsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoiceForItems?.items && selectedInvoiceForItems.items.length > 0 ? (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Total Items: {selectedInvoiceForItems.total_items || selectedInvoiceForItems.items.length} | 
                Total Value: ₹{(selectedInvoiceForItems.total_value || 
                  selectedInvoiceForItems.items.reduce((sum, item) => sum + (item.total_value || (item.unit_value * item.quantity) || 0), 0) || 0).toFixed(2)}
                {selectedInvoiceForItems._itemsSource && selectedInvoiceForItems._itemsSource !== 'invoice' && (
                  <Chip 
                    label={`Items from ${selectedInvoiceForItems._itemsSource}`} 
                    size="small" 
                    color="info" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>📅 Lending Date:</strong> {selectedInvoiceForItems.issue_date ? 
                    new Date(selectedInvoiceForItems.issue_date).toLocaleDateString() : 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>🔄 Expected Return:</strong> {selectedInvoiceForItems.expected_return_date ? 
                    new Date(selectedInvoiceForItems.expected_return_date).toLocaleDateString() : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>⏰ Due Date:</strong> {selectedInvoiceForItems.due_date ? 
                    new Date(selectedInvoiceForItems.due_date).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell align="center"><strong>Quantity</strong></TableCell>
                      <TableCell align="right"><strong>Unit Price</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                      <TableCell align="center"><strong>Expected Return</strong></TableCell>
                      <TableCell align="center"><strong>Days</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoiceForItems.items.map((item, index) => {
                      // Use item-specific return date if available, otherwise use invoice return date
                      const returnDate = item.expected_return_date || selectedInvoiceForItems.expected_return_date;
                      const daysFromIssue = returnDate && selectedInvoiceForItems.issue_date ? 
                        Math.ceil((new Date(returnDate) - new Date(selectedInvoiceForItems.issue_date)) / (1000 * 60 * 60 * 24)) : 
                        'N/A';
                      
                      // Determine status based on return dates and current date
                      const isOverdue = returnDate && new Date(returnDate) < new Date();
                      const isReturned = item.actual_return_date;
                      const status = isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active';
                      
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.product_name || 'N/A'}
                              {item._source && (
                                <Chip 
                                  label={item._source} 
                                  size="small" 
                                  variant="outlined" 
                                  color="secondary"
                                  sx={{ ml: 1, fontSize: '0.7rem', height: 18 }}
                                />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              SKU: {item.product_sku || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.product_category || 'Uncategorized'} 
                              size="small" 
                              variant="outlined"
                              color={item.product_category ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {item.quantity || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              ₹{(item.unit_value || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ₹{(item.total_value || (item.unit_value * item.quantity) || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color={
                              isOverdue && !isReturned ? 'error' : 'textPrimary'
                            }>
                              {returnDate 
                                ? new Date(returnDate).toLocaleDateString()
                                : 'Not Set'
                              }
                            </Typography>
                            {item.actual_return_date && (
                              <Typography variant="caption" color="success.main" display="block">
                                Returned: {new Date(item.actual_return_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={daysFromIssue} 
                              size="small"
                              color={
                                daysFromIssue === 'N/A' ? 'default' :
                                daysFromIssue > 30 ? 'error' :
                                daysFromIssue > 14 ? 'warning' : 'success'
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={status}
                              size="small"
                              color={
                                status === 'Returned' ? 'success' :
                                status === 'Overdue' ? 'error' : 'primary'
                              }
                              variant={status === 'Active' ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="grey.600" gutterBottom>
                No items found for this invoice
              </Typography>
              {selectedInvoiceForItems?._creationMethod && (
                <Typography variant="body2" color="grey.500" sx={{ mb: 2 }}>
                  Creation method: {selectedInvoiceForItems._creationMethod}
                  {selectedInvoiceForItems._itemsSource && ` | Data source: ${selectedInvoiceForItems._itemsSource}`}
                </Typography>
              )}
              <Typography variant="body2" color="grey.500" align="center">
                This could happen if:<br/>
                • Invoice was created manually without adding items<br/>
                • Items were added through OCR but not processed<br/>
                • Invoice is pending item assignment<br/>
                • Items were deleted or moved
              </Typography>
              {selectedInvoiceForItems?.order_id && (
                <Typography variant="body2" color="primary.main" sx={{ mt: 2 }}>
                  💡 This invoice is linked to order {selectedInvoiceForItems.order_number || selectedInvoiceForItems.order_id}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemsDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </ErrorBoundary>
  );
};

export default InvoiceManagement;
