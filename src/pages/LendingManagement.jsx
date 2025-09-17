import React, { useState, useEffect } from 'react';
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
  Avatar,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Badge,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Assessment as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

const LendingManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [orderStep, setOrderStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample data
  const [orders, setOrders] = useState([
    {
      id: 'ORD001',
      student: 'Rahul Sharma',
      email: 'rahul@college.edu',
      department: 'Computer Science',
      year: '3rd Year',
      amount: 3650,
      status: 'pending',
      date: '2025-08-20',
      items: ['Laptop Charger', 'Mouse', 'Keyboard'],
      lender: 'Dr. Smith',
      lenderId: 1,
    },
    {
      id: 'ORD002',
      student: 'Anita Desai',
      email: 'anita@college.edu',
      department: 'Electronics',
      year: '2nd Year',
      amount: 7600,
      status: 'completed',
      date: '2025-08-19',
      items: ['Arduino Kit', 'Sensors', 'Breadboard'],
      lender: 'Prof. Johnson',
      lenderId: 2,
    },
    {
      id: 'ORD003',
      student: 'Vikram Singh',
      email: 'vikram@college.edu',
      department: 'Mechanical',
      year: '4th Year',
      amount: 7400,
      status: 'partial',
      date: '2025-08-18',
      items: ['3D Filament', 'Tools Set', 'Measuring Kit'],
      lender: 'Mr. Wilson',
      lenderId: 3,
    },
  ]);

  const [availableProducts] = useState([
    { id: 1, name: 'Laptop Charger', price: 850, category: 'Electronics', stock: 25 },
    { id: 2, name: 'Wireless Mouse', price: 450, category: 'Electronics', stock: 30 },
    { id: 3, name: 'Mechanical Keyboard', price: 2350, category: 'Electronics', stock: 15 },
    { id: 4, name: 'Arduino Uno Kit', price: 1200, category: 'Hardware', stock: 20 },
    { id: 5, name: 'Raspberry Pi 4', price: 3500, category: 'Hardware', stock: 12 },
    { id: 6, name: '3D Printer Filament', price: 800, category: 'Materials', stock: 50 },
  ]);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    department: '',
    year: '',
    semester: '',
    projectTitle: '',
    projectDescription: '',
    mentorName: '',
    expectedDelivery: '',
    lenderId: '', // New lender field
  });

  // Add lender data state
  const [lenders, setLenders] = useState([]);

  // Fetch lenders on component mount
  useEffect(() => {
    fetchLenders();
  }, []);

  const fetchLenders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/lenders');
      if (response.ok) {
        const lendersData = await response.json();
        setLenders(lendersData);
      }
    } catch (error) {
      console.error('Error fetching lenders:', error);
    }
  };

  const stats = [
    {
      title: 'Total Orders',
      value: orders.length,
      change: '+12%',
      changeType: 'positive',
      icon: CartIcon,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'In Progress',
      value: orders.filter(o => o.status === 'pending').length,
      change: '+5%',
      changeType: 'positive',
      icon: ScheduleIcon,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Total Revenue',
      value: `₹${orders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()}`,
      change: '+18%',
      changeType: 'positive',
      icon: MoneyIcon,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Pending Approval',
      value: orders.filter(o => o.status === 'partial').length,
      change: '-3%',
      changeType: 'negative',
      icon: WarningIcon,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'partial':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckIcon />;
      case 'pending':
        return <ScheduleIcon />;
      case 'partial':
        return <WarningIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e, product) => {
    e.dataTransfer.setData('application/json', JSON.stringify(product));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const productData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Check if product is already selected
      const existingProduct = selectedProducts.find(p => p.id === productData.id);
      
      if (existingProduct) {
        // If already selected, increase quantity
        setSelectedProducts(prev => 
          prev.map(p => 
            p.id === productData.id 
              ? { ...p, quantity: p.quantity + 1 }
              : p
          )
        );
      } else {
        // Add new product with quantity 1
        setSelectedProducts(prev => [...prev, { ...productData, quantity: 1 }]);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const removeSelectedProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const steps = ['Student Information', 'Select Products', 'Review & Submit'];

  return (
    <>
      <Box sx={{ width: '100%', height: '100%', backgroundColor: '#f9fafb', padding: 0, margin: 0 }}>
      {/* Header */}
      <Box sx={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
              <Typography variant="h3" className="text-3xl font-bold text-gray-900">
                Lending Management
              </Typography>
              <Typography variant="body2" className="mt-1 text-sm text-gray-500">
                Manage student lending and inventory requests
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateOrder(true)}
              className="btn-primary"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
              }}
            >
              Create New Order
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ width: '100%', padding: '8px 24px', margin: 0 }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card 
                className="card"
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <CardContent className="p-6">
                  <Box className="flex items-center justify-between">
                    <Box>
                      <Typography variant="body2" className="text-white/80 text-sm font-medium">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" className="text-white text-2xl font-bold mt-1">
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box className="bg-white/20 p-3 rounded-lg">
                      <stat.icon className="h-6 w-6 text-white" />
                    </Box>
                  </Box>
                  <Box className="mt-4">
                    <Typography variant="body2" className="text-white/90 text-sm">
                      <span className={stat.changeType === 'positive' ? 'text-green-200' : 'text-red-200'}>
                        {stat.change}
                      </span>
                      {' from last month'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Navigation Tabs */}
        <Card className="mb-6">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 500,
                  padding: { xs: '8px 12px', sm: '12px 24px' },
                  minWidth: 'auto',
                },
                '& .Mui-selected': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white !important',
                },
                '& .MuiTabs-flexContainer': {
                  width: '100%',
                },
              }}
            >
              <Tab 
                icon={<AssignmentIcon />} 
                label="All Orders" 
                iconPosition="start"
                sx={{ flex: 1 }}
              />
              <Tab 
                icon={<AddIcon />} 
                label="Create Lending" 
                iconPosition="start"
                onClick={() => setShowCreateOrder(true)}
                sx={{ flex: 1 }}
              />
              <Tab 
                icon={<PaymentIcon />} 
                label="Invoice & Billing" 
                iconPosition="start"
                sx={{ flex: 1 }}
              />
              <Tab 
                icon={<AnalyticsIcon />} 
                label="Order Analytics" 
                iconPosition="start"
                sx={{ flex: 1 }}
              />
            </Tabs>
          </Box>

          <Box className="p-6">
            {activeTab === 0 && (
              <Box className="space-y-6">
                {/* Search and Filter Bar */}
                <Box className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <TextField
                    placeholder="Search orders by student name or order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    size="medium"
                    className="flex-1 max-w-lg"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl size="medium" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Filter by Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="partial">Partial</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Orders Table */}
                <TableContainer component={Paper} className="card">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-semibold text-gray-900 uppercase tracking-wider">
                            Order Details
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-semibold text-gray-900 uppercase tracking-wider">
                            Student Info
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-semibold text-gray-900 uppercase tracking-wider">
                            Assigned Lender
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-semibold text-gray-900 uppercase tracking-wider">
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-semibold text-gray-900 uppercase tracking-wider">
                            Amount
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-semibold text-gray-900 uppercase tracking-wider">
                            Actions
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow 
                          key={order.id} 
                          hover
                          sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle1" className="font-semibold text-gray-900">
                                {order.id}
                              </Typography>
                              <Typography variant="body2" className="text-gray-500">
                                {order.date}
                              </Typography>
                              <Box className="mt-2 flex flex-wrap gap-1">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <Chip
                                    key={idx}
                                    label={item}
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#dbeafe', 
                                      color: '#1e40af',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                ))}
                                {order.items.length > 2 && (
                                  <Chip
                                    label={`+${order.items.length - 2} more`}
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#f3f4f6', 
                                      color: '#374151',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle1" className="font-semibold text-gray-900">
                                {order.student}
                              </Typography>
                              <Typography variant="body2" className="text-gray-500">
                                {order.email}
                              </Typography>
                              <Typography variant="body2" className="text-gray-500">
                                {order.department} - {order.year}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle1" className="font-semibold text-gray-900">
                                {order.lender || 'Unassigned'}
                              </Typography>
                              <Typography variant="body2" className="text-gray-500">
                                Staff Member
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(order.status)}
                              label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              color={getStatusColor(order.status)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle1" className="font-semibold text-gray-900">
                              ₹{order.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton size="small" color="primary">
                                <ViewIcon />
                              </IconButton>
                              <IconButton size="small" color="success">
                                <PrintIcon />
                              </IconButton>
                              <IconButton size="small" color="secondary">
                                <EditIcon />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {activeTab === 2 && (
              <Box className="text-center py-12">
                <PaymentIcon sx={{ fontSize: 64, color: 'gray' }} />
                <Typography variant="h5" className="mt-4 font-semibold text-gray-900">
                  Invoice & Billing Management
                </Typography>
                <Typography variant="body1" className="mt-2 text-gray-500">
                  Comprehensive billing dashboard coming soon! This will include invoice generation,
                  payment tracking, financial reports, and revenue analytics.
                </Typography>
              </Box>
            )}

            {activeTab === 3 && (
              <Box className="text-center py-12">
                <AnalyticsIcon sx={{ fontSize: 64, color: 'gray' }} />
                <Typography variant="h5" className="mt-4 font-semibold text-gray-900">
                  Order Analytics Dashboard
                </Typography>
                <Typography variant="body1" className="mt-2 text-gray-500">
                  Analytics dashboard coming soon! This will include order trends, popular items,
                  department-wise statistics, financial reports, and revenue analytics.
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Box>

      {/* Create Lending Modal */}
      <Dialog 
        open={showCreateOrder} 
        onClose={() => setShowCreateOrder(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { 
            minHeight: '80vh',
            minWidth: '1400px',
            width: '95vw',
            maxWidth: '95vw'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h5" className="font-bold">
            Create New Student Order
          </Typography>
          <IconButton 
            onClick={() => setShowCreateOrder(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Step Indicator */}
          <Box sx={{ p: 3, backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <Stepper activeStep={orderStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Box sx={{ p: 3 }}>
            {orderStep === 0 && (
              <Box className="space-y-6">
                <Typography variant="h6" className="mb-4">Student Information</Typography>
                
                {/* Personal Details Section */}
                <Card sx={{ backgroundColor: '#f9fafb', p: 3 }}>
                  <Typography variant="subtitle1" className="mb-3 flex items-center font-medium">
                    <PersonIcon sx={{ mr: 1, color: '#2563eb' }} />
                    Personal Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={studentInfo.name}
                        onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                        placeholder="Enter student's full name"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={studentInfo.email}
                        onChange={(e) => setStudentInfo({...studentInfo, email: e.target.value})}
                        placeholder="student@college.edu"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={studentInfo.phone}
                        onChange={(e) => setStudentInfo({...studentInfo, phone: e.target.value})}
                        placeholder="+91 98765 43210"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Student ID"
                        value={studentInfo.studentId}
                        onChange={(e) => setStudentInfo({...studentInfo, studentId: e.target.value})}
                        placeholder="STU2025001"
                      />
                    </Grid>
                  </Grid>
                </Card>

                {/* Academic Information Section */}
                <Card sx={{ backgroundColor: '#eff6ff', p: 3 }}>
                  <Typography variant="subtitle1" className="mb-3 flex items-center font-medium">
                    <AssignmentIcon sx={{ mr: 1, color: '#2563eb' }} />
                    Academic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Department</InputLabel>
                        <Select
                          value={studentInfo.department}
                          label="Department"
                          onChange={(e) => setStudentInfo({...studentInfo, department: e.target.value})}
                        >
                          <MenuItem value="Computer Science">Computer Science</MenuItem>
                          <MenuItem value="Electronics">Electronics</MenuItem>
                          <MenuItem value="Mechanical">Mechanical</MenuItem>
                          <MenuItem value="Civil">Civil</MenuItem>
                          <MenuItem value="Chemical">Chemical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Year</InputLabel>
                        <Select
                          value={studentInfo.year}
                          label="Year"
                          onChange={(e) => setStudentInfo({...studentInfo, year: e.target.value})}
                        >
                          <MenuItem value="1st Year">1st Year</MenuItem>
                          <MenuItem value="2nd Year">2nd Year</MenuItem>
                          <MenuItem value="3rd Year">3rd Year</MenuItem>
                          <MenuItem value="4th Year">4th Year</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Semester</InputLabel>
                        <Select
                          value={studentInfo.semester}
                          label="Semester"
                          onChange={(e) => setStudentInfo({...studentInfo, semester: e.target.value})}
                        >
                          <MenuItem value="1st Semester">1st Semester</MenuItem>
                          <MenuItem value="2nd Semester">2nd Semester</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Card>

                {/* Project Information Section */}
                <Card sx={{ backgroundColor: '#f0fdf4', p: 3 }}>
                  <Typography variant="subtitle1" className="mb-3 flex items-center font-medium">
                    <AnalyticsIcon sx={{ mr: 1, color: '#16a34a' }} />
                    Project Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Project Title"
                        value={studentInfo.projectTitle}
                        onChange={(e) => setStudentInfo({...studentInfo, projectTitle: e.target.value})}
                        placeholder="Enter project title"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mentor Name"
                        value={studentInfo.mentorName}
                        onChange={(e) => setStudentInfo({...studentInfo, mentorName: e.target.value})}
                        placeholder="Enter mentor/guide name"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Project Description"
                        multiline
                        rows={3}
                        value={studentInfo.projectDescription}
                        onChange={(e) => setStudentInfo({...studentInfo, projectDescription: e.target.value})}
                        placeholder="Brief description of the project and requirements"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Expected Delivery Date"
                        type="date"
                        value={studentInfo.expectedDelivery}
                        onChange={(e) => setStudentInfo({...studentInfo, expectedDelivery: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Assigned Lender/Staff *</InputLabel>
                        <Select
                          value={studentInfo.lenderId}
                          label="Assigned Lender/Staff *"
                          onChange={(e) => setStudentInfo({...studentInfo, lenderId: e.target.value})}
                        >
                          {lenders.map((lender) => (
                            <MenuItem key={lender.id} value={lender.id}>
                              {lender.name} - {lender.designation} ({lender.department})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Card>
              </Box>
            )}

            {orderStep === 1 && (
              <Grid container spacing={4}>
                {/* Available Products */}
                <Grid item xs={12} lg={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Available Products</Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#fafafa',
                      borderRadius: 2,
                      border: '2px solid #e5e7eb',
                      minHeight: '500px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    {availableProducts.map((product, index) => (
                      <Box
                        key={product.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, product)}
                        sx={{
                          cursor: 'grab',
                          '&:active': { cursor: 'grabbing' },
                        }}
                        onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                        onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                      >
                        <Card
                          sx={{
                            p: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)',
                              backgroundColor: '#f0f9ff',
                            },
                            '&:active': {
                              transform: 'scale(0.98)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                {product.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                                {product.category}
                              </Typography>
                              <Typography variant="h6" sx={{ color: '#2563eb', fontWeight: 700 }}>
                                ₹{product.price.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500 }}>
                                Stock: {product.stock}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                {/* Selected Products */}
                <Grid item xs={12} lg={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Selected Products</Typography>
                  <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                      minHeight: '500px',
                      p: 2,
                      border: dragOver ? '2px solid #10b981' : '2px dashed #d1d5db',
                      borderRadius: 2,
                      backgroundColor: dragOver ? '#ecfdf5' : '#f9fafb',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {selectedProducts.length === 0 ? (
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                      }}>
                        <CartIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
                        <Typography variant="body1" sx={{ color: '#6b7280', fontSize: '1.1rem' }}>
                          Drag products here to add to order
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
                          You can drag multiple items to build your order
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                        {selectedProducts.map((product) => (
                          <Card key={product.id} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                  {product.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                  {product.category}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                                    sx={{ minWidth: '32px', width: '32px', height: '32px', p: 0 }}
                                  >
                                    -
                                  </Button>
                                  <Typography variant="body1" sx={{ 
                                    minWidth: '40px', 
                                    textAlign: 'center', 
                                    fontWeight: 600,
                                    fontSize: '1.1rem'
                                  }}>
                                    {product.quantity}
                                  </Typography>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                                    sx={{ minWidth: '32px', width: '32px', height: '32px', p: 0 }}
                                  >
                                    +
                                  </Button>
                                </Box>
                                <Typography variant="h6" sx={{ 
                                  color: '#2563eb', 
                                  fontWeight: 700, 
                                  minWidth: '80px',
                                  textAlign: 'right'
                                }}>
                                  ₹{(product.price * product.quantity).toLocaleString()}
                                </Typography>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeSelectedProduct(product.id)}
                                  sx={{ 
                                    '&:hover': { 
                                      backgroundColor: '#fef2f2',
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {selectedProducts.length > 0 && (
                    <Card sx={{ 
                      mt: 2, 
                      p: 3, 
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      border: '2px solid #bfdbfe',
                      borderRadius: 2
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                          Total Amount:
                        </Typography>
                        <Typography variant="h4" sx={{ 
                          color: '#2563eb', 
                          fontWeight: 800,
                          textShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
                        }}>
                          ₹{calculateTotal().toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#1e40af', mt: 1, fontStyle: 'italic' }}>
                        {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} selected
                      </Typography>
                    </Card>
                  )}
                </Grid>
              </Grid>
            )}

            {orderStep === 2 && (
              <Box className="space-y-6">
                <Typography variant="h6">Review & Submit Order</Typography>
                
                {/* Student Summary */}
                <Card sx={{ backgroundColor: '#f9fafb', p: 3 }}>
                  <Typography variant="subtitle1" className="font-semibold mb-4">Student Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Name:</strong> {studentInfo.name}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Email:</strong> {studentInfo.email}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Department:</strong> {studentInfo.department}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Year:</strong> {studentInfo.year}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Project:</strong> {studentInfo.projectTitle}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Expected Delivery:</strong> {studentInfo.expectedDelivery}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Assigned Lender:</strong> {lenders.find(l => l.id === studentInfo.lenderId)?.name || 'Not assigned'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2"><strong>Lender Department:</strong> {lenders.find(l => l.id === studentInfo.lenderId)?.department || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Card>

                {/* Order Summary */}
                <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle1" className="font-semibold mb-4">Order Summary</Typography>
                  <Stack spacing={2}>
                    {selectedProducts.map((product) => (
                      <Box key={product.id} className="flex justify-between items-center py-2 border-b">
                        <Box>
                          <Typography variant="body1" className="font-medium">{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">×{product.quantity}</Typography>
                        </Box>
                        <Typography variant="body1" className="font-semibold">
                          ₹{(product.price * product.quantity).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                    <Divider />
                    <Box className="flex justify-between items-center pt-2">
                      <Typography variant="h6" className="font-bold">Total Amount:</Typography>
                      <Typography variant="h5" color="primary" className="font-bold">
                        ₹{calculateTotal().toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                <Card sx={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', p: 2 }}>
                  <Typography variant="body2" color="primary">
                    <strong>Note:</strong> Once submitted, this order will be processed and an invoice will be generated. 
                    The student will receive an email confirmation with order details and payment instructions.
                  </Typography>
                </Card>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, backgroundColor: '#d386b9ff', borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={() => {
              if (orderStep > 0) {
                setOrderStep(orderStep - 1);
              }
            }}
            disabled={orderStep === 0}
            variant="outlined"  
          >
            Previous
          </Button>
          
          <Button
            onClick={() => {
              if (orderStep < 2) {
                setOrderStep(orderStep + 1);
              } else {
                // Submit order
                const newOrder = {
                  id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
                  student: studentInfo.name,
                  email: studentInfo.email,
                  department: studentInfo.department,
                  year: studentInfo.year,
                  lender: lenders.find(l => l.id === studentInfo.lenderId)?.name || 'Unassigned',
                  lenderId: studentInfo.lenderId,
                  amount: calculateTotal(),
                  status: 'pending',
                  date: new Date().toISOString().split('T')[0],
                  items: selectedProducts.map(p => p.name),
                };
                setOrders([...orders, newOrder]);
                setShowCreateOrder(false);
                setOrderStep(0);
                setSelectedProducts([]);
                setStudentInfo({
                  name: '', email: '', phone: '', studentId: '', department: '', year: '',
                  semester: '', projectTitle: '', projectDescription: '', mentorName: '', expectedDelivery: '', lenderId: ''
                });
                setActiveTab(0);
              }
            }}
            disabled={
              (orderStep === 0 && (!studentInfo.name || !studentInfo.email || !studentInfo.department || !studentInfo.lenderId)) ||
              (orderStep === 1 && selectedProducts.length === 0)
            }
            variant="contained"
            sx={{
              background: orderStep === 2 ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: orderStep === 2 ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
            }}
          >
            {orderStep === 2 ? 'Submit Order' : 'Next'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LendingManagement;
