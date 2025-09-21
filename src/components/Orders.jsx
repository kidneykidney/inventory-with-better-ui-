import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Tooltip,
  Fab,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Restore as ReturnIcon,
  LocalShipping as ShippingIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000';

const Orders = () => {
  // State management
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [students, setStudents] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Form states
  const [orderForm, setOrderForm] = useState({
    student_id: '',
    lender_id: '',
    items: [],
    notes: '',
    expected_return_date: ''
  });
  
  const [returnForm, setReturnForm] = useState({
    item_id: '',
    quantity: 1,
    condition: 'good',
    notes: ''
  });
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');

  // API calls
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/orders`;
      const params = [];
      
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (studentFilter) params.push(`student_id=${studentFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-cache'
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      showSnackbar('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products?status=active`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      showSnackbar('Failed to fetch products', 'error');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/students`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      showSnackbar('Failed to fetch students', 'error');
    }
  };

  const fetchLenders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/lenders`);
      const data = await response.json();
      setLenders(data);
    } catch (error) {
      showSnackbar('Failed to fetch lenders', 'error');
    }
  };

  const createOrder = async () => {
    try {
      const orderData = {
        student_id: orderForm.student_id,
        lender_id: orderForm.lender_id,
        items: selectedItems.map(item => ({
          product_id: item.id,
          quantity_requested: item.requestedQuantity,
          expected_return_date: orderForm.expected_return_date || null,
          notes: item.notes || null
        })),
        notes: orderForm.notes,
        expected_return_date: orderForm.expected_return_date || null
      };

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        showSnackbar('Order created successfully', 'success');
        setOpenOrderDialog(false);
        resetOrderForm();
        
        // Force immediate refresh with loading state
        console.log('Forcing immediate orders refresh after creation...');
        setLoading(true);
        await fetchOrders();
        setLoading(false);
        console.log('Orders refreshed successfully after creation');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }
    } catch (error) {
      showSnackbar(`Failed to create order: ${error.message}`, 'error');
    }
  };

  const approveOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'Admin' })
      });
      
      if (response.ok) {
        showSnackbar('Order approved successfully', 'success');
        fetchOrders();
      } else {
        throw new Error('Failed to approve order');
      }
    } catch (error) {
      showSnackbar('Failed to approve order', 'error');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showSnackbar('Order deleted successfully', 'success');
        fetchOrders();
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      showSnackbar('Failed to delete order', 'error');
    }
  };

  const returnItem = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/orders/${selectedOrder.id}/items/${returnForm.item_id}/return`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: returnForm.quantity,
            condition: returnForm.condition
          })
        }
      );
      
      if (response.ok) {
        showSnackbar('Item return recorded successfully', 'success');
        setOpenReturnDialog(false);
        fetchOrders();
      } else {
        throw new Error('Failed to record item return');
      }
    } catch (error) {
      showSnackbar('Failed to record return', 'error');
    }
  };

  // Helper functions
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const resetOrderForm = () => {
    setOrderForm({
      student_id: '',
      items: [],
      notes: '',
      expected_return_date: ''
    });
    setSelectedItems([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'approved': return <ApprovedIcon />;
      case 'completed': return <CheckIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'overdue': return <ScheduleIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const handleAddProduct = (product) => {
    const exists = selectedItems.find(item => item.id === product.id);
    if (!exists) {
      setSelectedItems([...selectedItems, {
        ...product,
        requestedQuantity: 1,
        notes: ''
      }]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== productId));
  };

  const updateItemQuantity = (productId, quantity) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === productId ? { ...item, requestedQuantity: quantity } : item
    ));
  };

  const updateItemNotes = (productId, notes) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === productId ? { ...item, notes } : item
    ));
  };

  // Effects
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchStudents();
    fetchLenders();
  }, [statusFilter, studentFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredOrders = orders.filter(order => {
    if (selectedTab === 0) return true; // All orders
    if (selectedTab === 1) return order.status === 'pending';
    if (selectedTab === 2) return order.status === 'approved';
    if (selectedTab === 3) return order.status === 'completed';
    if (selectedTab === 4) return order.status === 'overdue';
    return true;
  });

  const getTabCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Lending Management
            </Typography>
            <Typography variant="subtitle1">
              Manage student orders, approvals, and returns
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Create New Order">
              <Fab 
                color="secondary" 
                sx={{ bgcolor: '#66bb6a', '&:hover': { bgcolor: '#5cb660' } }}
                onClick={() => setOpenOrderDialog(true)}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PendingIcon sx={{ fontSize: 40, color: '#ff9800', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="#ff9800">
                    {getTabCount('pending')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Lending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ApprovedIcon sx={{ fontSize: 40, color: '#2196f3', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="#2196f3">
                    {getTabCount('approved')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e8' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckIcon sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="#4caf50">
                    {getTabCount('completed')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ScheduleIcon sx={{ fontSize: 40, color: '#f44336', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="#f44336">
                    {getTabCount('overdue')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Orders</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Student</InputLabel>
              <Select
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                label="Filter by Student"
              >
                <MenuItem value="">All Students</MenuItem>
                {students.map(student => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name} - {student.student_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredOrders.length} of {orders.length} orders
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All Orders (${orders.length})`} />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Completed" />
          <Tab label="Overdue" />
        </Tabs>

        {loading && <LinearProgress />}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Lending #</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Expected Return</TableCell>
                <TableCell>Total Value</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: '#4caf50', mr: 1, width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {order.student_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.student_email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={`${order.total_items} items`} 
                        color="primary" 
                        size="small"
                        icon={<InventoryIcon />}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={order.status.toUpperCase()}
                        color={getStatusColor(order.status)}
                        icon={getStatusIcon(order.status)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: '#666' }} />
                        <Typography variant="body2">
                          {new Date(order.requested_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      {order.expected_return_date ? (
                        <Box display="flex" alignItems="center">
                          <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: '#666' }} />
                          <Typography variant="body2">
                            {new Date(order.expected_return_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        ${order.total_value.toFixed(2)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOpenViewDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {order.status === 'pending' && (
                          <Tooltip title="Approve Order">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => approveOrder(order.id)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {order.status === 'approved' && (
                          <Tooltip title="Record Return">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedOrder(order);
                                setOpenReturnDialog(true);
                              }}
                            >
                              <ReturnIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Print Order">
                          <IconButton
                            size="small"
                            color="secondary"
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Order">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteOrder(order.id)}
                            sx={{ 
                              bgcolor: '#ffebee', 
                              '&:hover': { bgcolor: '#ffcdd2' } 
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create Lending Dialog */}
      <Dialog 
        open={openOrderDialog} 
        onClose={() => setOpenOrderDialog(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '1400px',
            width: '95vw',
            maxWidth: '95vw'
          }
        }}
      >
        <DialogTitle>Create New Lending</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={orderForm.student_id}
                  onChange={(e) => setOrderForm({...orderForm, student_id: e.target.value})}
                  label="Select Student"
                >
                  {students.map(student => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name} - {student.student_id} ({student.course})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Lender/Staff</InputLabel>
                <Select
                  value={orderForm.lender_id}
                  onChange={(e) => setOrderForm({...orderForm, lender_id: e.target.value})}
                  label="Select Lender/Staff"
                >
                  {lenders.map(lender => (
                    <MenuItem key={lender.id} value={lender.id}>
                      {lender.name} - {lender.designation} ({lender.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Return Date"
                type="date"
                value={orderForm.expected_return_date}
                onChange={(e) => setOrderForm({...orderForm, expected_return_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Products:
              </Typography>
              <Grid container spacing={2}>
                {products.slice(0, 6).map(product => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        border: selectedItems.find(item => item.id === product.id) ? '2px solid #4caf50' : '1px solid #ddd'
                      }}
                      onClick={() => handleAddProduct(product)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body1" fontWeight="bold" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available: {product.quantity_available}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${product.unit_price}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {selectedItems.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Selected Items:
                </Typography>
                <List>
                  {selectedItems.map((item, index) => (
                    <ListItem key={item.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#4caf50' }}>
                          <InventoryIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={`Available: ${item.quantity_available} | Price: $${item.unit_price}`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
                        <TextField
                          label="Qty"
                          type="number"
                          value={item.requestedQuantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                          inputProps={{ min: 1, max: item.quantity_available }}
                          size="small"
                          sx={{ width: 80 }}
                        />
                        <TextField
                          label="Notes"
                          value={item.notes || ''}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          size="small"
                          sx={{ width: 150 }}
                        />
                      </Box>
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveProduct(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order Notes"
                value={orderForm.notes}
                onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>Cancel</Button>
          <Button 
            onClick={createOrder}
            variant="contained"
            disabled={!orderForm.student_id || !orderForm.lender_id || selectedItems.length === 0}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            Create Lending
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)}
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
        <DialogTitle>Lending Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Lending #{selectedOrder.order_number}
                </Typography>
                <Chip
                  label={selectedOrder.status.toUpperCase()}
                  color={getStatusColor(selectedOrder.status)}
                  icon={getStatusIcon(selectedOrder.status)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Student Information:</Typography>
                <Typography variant="body2">Name: {selectedOrder.student_name}</Typography>
                <Typography variant="body2">Email: {selectedOrder.student_email}</Typography>
                <Typography variant="body2">Course: {selectedOrder.course}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Order Information:</Typography>
                <Typography variant="body2">
                  Requested: {new Date(selectedOrder.requested_date).toLocaleDateString()}
                </Typography>
                {selectedOrder.expected_return_date && (
                  <Typography variant="body2">
                    Expected Return: {new Date(selectedOrder.expected_return_date).toLocaleDateString()}
                  </Typography>
                )}
                <Typography variant="body2">Total Items: {selectedOrder.total_items}</Typography>
                <Typography variant="body2">Total Value: ${selectedOrder.total_value.toFixed(2)}</Typography>
              </Grid>
              
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Order Items:</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>Requested</TableCell>
                          <TableCell>Approved</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.quantity_requested}</TableCell>
                            <TableCell>{item.quantity_approved || 0}</TableCell>
                            <TableCell>
                              <Chip 
                                label={item.status} 
                                color={getStatusColor(item.status)} 
                                size="small" 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              
              {selectedOrder.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Notes:</Typography>
                  <Typography variant="body2">{selectedOrder.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            Print Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Items Dialog */}
      <Dialog 
        open={openReturnDialog} 
        onClose={() => setOpenReturnDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Item Return</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Item to Return</InputLabel>
                  <Select
                    value={returnForm.item_id}
                    onChange={(e) => setReturnForm({...returnForm, item_id: e.target.value})}
                    label="Select Item to Return"
                  >
                    {selectedOrder.items?.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.product_name} (Approved: {item.quantity_approved})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity Returned"
                  type="number"
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({...returnForm, quantity: parseInt(e.target.value)})}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={returnForm.condition}
                    onChange={(e) => setReturnForm({...returnForm, condition: e.target.value})}
                    label="Condition"
                  >
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="damaged">Damaged</MenuItem>
                    <MenuItem value="lost">Lost</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Return Notes"
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({...returnForm, notes: e.target.value})}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReturnDialog(false)}>Cancel</Button>
          <Button 
            onClick={returnItem}
            variant="contained"
            disabled={!returnForm.item_id}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            Record Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;
