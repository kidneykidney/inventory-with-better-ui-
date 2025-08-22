import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Divider,
  Alert,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

// Sample data for the order system
const sampleOrders = [
  {
    id: 'ORD001',
    studentName: 'Rahul Sharma',
    studentId: 'STU2024001',
    department: 'Electronics Engineering',
    semester: '6th',
    items: [
      { name: 'Arduino Uno R3', quantity: 2, unitPrice: 1500, category: 'Microcontroller' },
      { name: 'Breadboard 830 Points', quantity: 3, unitPrice: 150, category: 'Prototyping' },
      { name: 'Jumper Wires Set', quantity: 1, unitPrice: 200, category: 'Cables' },
    ],
    totalAmount: 3650,
    status: 'Pending Approval',
    orderDate: '2024-08-20',
    dueDate: '2024-08-27',
    projectTitle: 'IoT Based Home Automation',
    supervisorName: 'Dr. Priya Patel',
  },
  {
    id: 'ORD002',
    studentName: 'Anita Desai',
    studentId: 'STU2024002',
    department: 'Computer Science',
    semester: '8th',
    items: [
      { name: 'Raspberry Pi 4 Model B', quantity: 1, unitPrice: 6500, category: 'Single Board Computer' },
      { name: 'MicroSD Card 32GB', quantity: 1, unitPrice: 800, category: 'Storage' },
      { name: 'HDMI Cable', quantity: 1, unitPrice: 300, category: 'Cables' },
    ],
    totalAmount: 7600,
    status: 'Approved',
    orderDate: '2024-08-18',
    dueDate: '2024-08-25',
    projectTitle: 'AI-Based Traffic Management',
    supervisorName: 'Dr. Amit Kumar',
  },
  {
    id: 'ORD003',
    studentName: 'Vikram Singh',
    studentId: 'STU2024003',
    department: 'Mechanical Engineering',
    semester: '7th',
    items: [
      { name: '3D Printing Filament PLA', quantity: 5, unitPrice: 1200, category: '3D Printing' },
      { name: 'Servo Motor SG90', quantity: 4, unitPrice: 350, category: 'Motors' },
    ],
    totalAmount: 7400,
    status: 'In Progress',
    orderDate: '2024-08-19',
    dueDate: '2024-08-26',
    projectTitle: 'Automated Robotic Arm',
    supervisorName: 'Dr. Rajesh Gupta',
  },
];

const inventoryItems = [
  { name: 'Arduino Uno R3', category: 'Microcontroller', price: 1500, stock: 25 },
  { name: 'Raspberry Pi 4 Model B', category: 'Single Board Computer', price: 6500, stock: 10 },
  { name: 'Breadboard 830 Points', category: 'Prototyping', price: 150, stock: 50 },
  { name: 'Jumper Wires Set', category: 'Cables', price: 200, stock: 30 },
  { name: 'Servo Motor SG90', category: 'Motors', price: 350, stock: 20 },
  { name: '3D Printing Filament PLA', category: '3D Printing', price: 1200, stock: 15 },
  { name: 'MicroSD Card 32GB', category: 'Storage', price: 800, stock: 40 },
  { name: 'HDMI Cable', category: 'Cables', price: 300, stock: 35 },
  { name: 'LED Strip RGB', category: 'Lighting', price: 800, stock: 12 },
  { name: 'Ultrasonic Sensor HC-SR04', category: 'Sensors', price: 250, stock: 25 },
];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function OrderManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState(sampleOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openOrderDetailsDialog, setOpenOrderDetailsDialog] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    studentName: '',
    studentId: '',
    department: '',
    semester: '',
    projectTitle: '',
    supervisorName: '',
  });
  const [selectedItems, setSelectedItems] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Approval': return 'warning';
      case 'Approved': return 'success';
      case 'In Progress': return 'info';
      case 'Completed': return 'primary';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleAddItemToOrder = (item) => {
    const existingItem = selectedItems.find(selected => selected.name === item.name);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(selected => 
          selected.name === item.name 
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveItemFromOrder = (itemName) => {
    setSelectedItems(prev => prev.filter(item => item.name !== itemName));
  };

  const calculateOrderTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = () => {
    const newOrder = {
      id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
      ...newOrderData,
      items: selectedItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        category: item.category,
      })),
      totalAmount: calculateOrderTotal(),
      status: 'Pending Approval',
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    
    setOrders(prev => [...prev, newOrder]);
    setNewOrderData({
      studentName: '',
      studentId: '',
      department: '',
      semester: '',
      projectTitle: '',
      supervisorName: '',
    });
    setSelectedItems([]);
    alert('Order created successfully!');
  };

  const generateInvoice = (order) => {
    alert(`Generating invoice for Order ${order.id}...`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CartIcon />
        Order Management System
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {orders.length}
                  </Typography>
                </Box>
                <CartIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Approval
                  </Typography>
                  <Typography variant="h4">
                    {orders.filter(o => o.status === 'Pending Approval').length}
                  </Typography>
                </Box>
                <Badge badgeContent={orders.filter(o => o.status === 'Pending Approval').length} color="warning">
                  <PersonIcon color="warning" sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    In Progress
                  </Typography>
                  <Typography variant="h4">
                    {orders.filter(o => o.status === 'In Progress').length}
                  </Typography>
                </Box>
                <ReceiptIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h4">
                    ₹{orders.reduce((total, order) => total + order.totalAmount, 0).toLocaleString()}
                  </Typography>
                </Box>
                <ReceiptIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="order management tabs">
            <Tab label="All Orders" />
            <Tab label="Create New Order" />
            <Tab label="Order Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Orders List */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Order History</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTabValue(1)}
            >
              Create New Order
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {order.studentName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {order.studentId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{order.department}</TableCell>
                    <TableCell>{order.projectTitle}</TableCell>
                    <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{order.orderDate}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedOrder(order);
                          setOpenOrderDetailsDialog(true);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => generateInvoice(order)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Create New Order Form */}
          <Typography variant="h6" gutterBottom>Create New Student Order</Typography>
          
          <Grid container spacing={3}>
            {/* Student Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Student Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student Name"
                value={newOrderData.studentName}
                onChange={(e) => setNewOrderData(prev => ({ ...prev, studentName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student ID"
                value={newOrderData.studentId}
                onChange={(e) => setNewOrderData(prev => ({ ...prev, studentId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newOrderData.department}
                  onChange={(e) => setNewOrderData(prev => ({ ...prev, department: e.target.value }))}
                >
                  <MenuItem value="Electronics Engineering">Electronics Engineering</MenuItem>
                  <MenuItem value="Computer Science">Computer Science</MenuItem>
                  <MenuItem value="Mechanical Engineering">Mechanical Engineering</MenuItem>
                  <MenuItem value="Civil Engineering">Civil Engineering</MenuItem>
                  <MenuItem value="Electrical Engineering">Electrical Engineering</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={newOrderData.semester}
                  onChange={(e) => setNewOrderData(prev => ({ ...prev, semester: e.target.value }))}
                >
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <MenuItem key={sem} value={`${sem}th`}>{sem}th Semester</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project Title"
                value={newOrderData.projectTitle}
                onChange={(e) => setNewOrderData(prev => ({ ...prev, projectTitle: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supervisor Name"
                value={newOrderData.supervisorName}
                onChange={(e) => setNewOrderData(prev => ({ ...prev, supervisorName: e.target.value }))}
              />
            </Grid>

            {/* Item Selection */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Select Items</Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>₹{item.price}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddItemToOrder(item)}
                            disabled={item.stock === 0}
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Selected Items</Typography>
                  {selectedItems.length === 0 ? (
                    <Typography color="textSecondary">No items selected</Typography>
                  ) : (
                    <>
                      {selectedItems.map((item) => (
                        <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box>
                            <Typography variant="body2">{item.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              Qty: {item.quantity} × ₹{item.price}
                            </Typography>
                          </Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveItemFromOrder(item.name)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6">
                        Total: ₹{calculateOrderTotal().toLocaleString()}
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={handleCreateOrder}
                        disabled={selectedItems.length === 0 || !newOrderData.studentName}
                      >
                        Create Order
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Analytics */}
          <Typography variant="h6" gutterBottom>Order Analytics</Typography>
          <Alert severity="info">
            Analytics dashboard coming soon! This will include order trends, popular items, 
            department-wise statistics, and financial reports.
          </Alert>
        </TabPanel>
      </Card>

      {/* Order Details Dialog */}
      <Dialog
        open={openOrderDetailsDialog}
        onClose={() => setOpenOrderDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details - {selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Student Information</Typography>
                <Typography>Name: {selectedOrder.studentName}</Typography>
                <Typography>ID: {selectedOrder.studentId}</Typography>
                <Typography>Department: {selectedOrder.department}</Typography>
                <Typography>Semester: {selectedOrder.semester}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Project Information</Typography>
                <Typography>Title: {selectedOrder.projectTitle}</Typography>
                <Typography>Supervisor: {selectedOrder.supervisorName}</Typography>
                <Typography>Order Date: {selectedOrder.orderDate}</Typography>
                <Typography>Due Date: {selectedOrder.dueDate}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Ordered Items</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unitPrice}</TableCell>
                          <TableCell>₹{item.quantity * item.unitPrice}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Total Amount: ₹{selectedOrder.totalAmount.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDetailsDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            onClick={() => generateInvoice(selectedOrder)}
          >
            Generate Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OrderManagement;
