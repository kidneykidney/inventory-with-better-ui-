import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  Snackbar,
  Stack,
  InputAdornment
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  ShoppingCart as CartIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Import animated components
import { 
  AnimatedCard, 
  AnimatedFab, 
  AnimatedContainer, 
  AnimatedChip,
  AnimatedBadge,
  GlowEffect 
} from './AnimatedComponents';
import { darkMatteTheme } from '../theme/darkTheme';

const API_BASE = 'http://localhost:8000';

const EnhancedProducts = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  
  // Dialog states
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Order management
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    sku: '',
    quantity_total: 0,
    quantity_available: 0,
    is_returnable: true,
    unit_price: 0,
    location: '',
    minimum_stock_level: 0,
    image_url: '',
    specifications: {},
    tags: []
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
  };

  // API calls - same as before but with loading states
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/products?status=${statusFilter}`;
      if (selectedCategory) url += `&category_id=${selectedCategory}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      showSnackbar('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      showSnackbar('Failed to fetch categories', 'error');
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

  // Rest of the API functions remain the same...
  const createProduct = async () => {
    try {
      const productData = {
        ...productForm,
        category_id: productForm.category_id || null
      };
      
      const response = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        showSnackbar('Product created successfully', 'success');
        setOpenProductDialog(false);
        resetProductForm();
        fetchProducts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create product');
      }
    } catch (error) {
      showSnackbar(`Failed to create product: ${error.message}`, 'error');
    }
  };

  const updateProduct = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      
      if (response.ok) {
        showSnackbar('Product updated successfully', 'success');
        setOpenProductDialog(false);
        resetProductForm();
        fetchProducts();
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      showSnackbar('Failed to update product', 'error');
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showSnackbar('Product deleted successfully', 'success');
        fetchProducts();
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      showSnackbar('Failed to delete product', 'error');
    }
  };

  const createCategory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });
      
      if (response.ok) {
        showSnackbar('Category created successfully', 'success');
        setOpenCategoryDialog(false);
        setCategoryForm({ name: '', description: '' });
        fetchCategories();
      } else {
        throw new Error('Failed to create category');
      }
    } catch (error) {
      showSnackbar('Failed to create category', 'error');
    }
  };

  const createOrder = async () => {
    try {
      const orderItems = selectedProducts.map(product => ({
        product_id: product.id,
        quantity_requested: product.requestedQuantity,
        expected_return_date: expectedReturnDate || null,
        notes: product.notes || null
      }));

      const orderData = {
        student_id: selectedStudent,
        items: orderItems,
        notes: orderNotes,
        expected_return_date: expectedReturnDate || null
      };

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        showSnackbar('Order created successfully', 'success');
        setOpenOrderDialog(false);
        setSelectedProducts([]);
        setSelectedStudent('');
        setOrderNotes('');
        setExpectedReturnDate('');
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      showSnackbar('Failed to create order', 'error');
    }
  };

  // Helper functions
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      category_id: '',
      sku: '',
      quantity_total: 0,
      quantity_available: 0,
      is_returnable: true,
      unit_price: 0,
      location: '',
      minimum_stock_level: 0,
      image_url: '',
      specifications: {},
      tags: []
    });
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      sku: product.sku,
      quantity_total: product.quantity_total,
      quantity_available: product.quantity_available,
      is_returnable: product.is_returnable,
      unit_price: product.unit_price,
      location: product.location || '',
      minimum_stock_level: product.minimum_stock_level,
      image_url: product.image_url || '',
      specifications: product.specifications || {},
      tags: product.tags || []
    });
    setOpenProductDialog(true);
  };

  const handleAddToCart = (product) => {
    const exists = selectedProducts.find(p => p.id === product.id);
    if (!exists) {
      setSelectedProducts([...selectedProducts, { ...product, requestedQuantity: 1, notes: '' }]);
      showSnackbar(`${product.name} added to cart`, 'success');
    } else {
      showSnackbar('Product already in cart', 'warning');
    }
  };

  const getStockStatus = (product) => {
    if (product.quantity_available === 0) return { color: 'error', text: 'Out of Stock', icon: <WarningIcon /> };
    if (product.quantity_available <= product.minimum_stock_level) return { color: 'warning', text: 'Low Stock', icon: <TrendingDownIcon /> };
    return { color: 'success', text: 'In Stock', icon: <CheckCircleIcon /> };
  };

  const getProductStats = () => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.quantity_available > 0).length;
    const lowStock = products.filter(p => p.quantity_available <= p.minimum_stock_level && p.quantity_available > 0).length;
    const outOfStock = products.filter(p => p.quantity_available === 0).length;
    
    return { totalProducts, inStock, lowStock, outOfStock };
  };

  // Effects
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStudents();
  }, [selectedCategory, searchTerm, statusFilter]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getProductStats();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Box sx={{ 
        p: 3, 
        background: darkMatteTheme.palette.background.gradient,
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Animated Header */}
        <motion.div variants={headerVariants}>
          <GlowEffect color="0, 212, 170" intensity={0.3}>
            <Paper 
              sx={{ 
                p: 4, 
                mb: 3, 
                background: 'linear-gradient(135deg, #151515 0%, #1E1E1E 100%)',
                border: '1px solid #2A2A2A',
                borderRadius: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background gradient effect */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
                }}
              />
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${darkMatteTheme.palette.primary.main} 0%, ${darkMatteTheme.palette.secondary.main} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Products Management
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
                    Manage your inventory with professional precision and real-time insights
                  </Typography>
                  
                  {/* Stats Row */}
                  <Stack direction="row" spacing={3}>
                    <motion.div variants={statsVariants}>
                      <Chip
                        icon={<InventoryIcon />}
                        label={`${stats.totalProducts} Total`}
                        color="primary"
                        variant="outlined"
                      />
                    </motion.div>
                    <motion.div variants={statsVariants}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`${stats.inStock} In Stock`}
                        color="success"
                        variant="outlined"
                      />
                    </motion.div>
                    <motion.div variants={statsVariants}>
                      <Chip
                        icon={<TrendingDownIcon />}
                        label={`${stats.lowStock} Low Stock`}
                        color="warning"
                        variant="outlined"
                      />
                    </motion.div>
                    <motion.div variants={statsVariants}>
                      <Chip
                        icon={<WarningIcon />}
                        label={`${stats.outOfStock} Out of Stock`}
                        color="error"
                        variant="outlined"
                      />
                    </motion.div>
                  </Stack>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Tooltip title="Add New Product" arrow>
                    <div>
                      <AnimatedFab onClick={() => setOpenProductDialog(true)}>
                        <AddIcon />
                      </AnimatedFab>
                    </div>
                  </Tooltip>
                  
                  <Tooltip title="Add Category" arrow>
                    <div>
                      <AnimatedFab onClick={() => setOpenCategoryDialog(true)}>
                        <CategoryIcon />
                      </AnimatedFab>
                    </div>
                  </Tooltip>
                  
                  <Tooltip title="Create Lending" arrow>
                    <AnimatedBadge count={selectedProducts.length}>
                      <AnimatedFab onClick={() => setOpenOrderDialog(true)}>
                        <CartIcon />
                      </AnimatedFab>
                    </AnimatedBadge>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          </GlowEffect>
        </motion.div>

        {/* Enhanced Filters */}
        <AnimatedCard sx={{ p: 3, mb: 3 }} delay={0.2}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setSearchTerm('')}
                        sx={{ color: 'text.secondary' }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category Filter</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category Filter"
                  startAdornment={<FilterIcon sx={{ color: 'text.secondary', mr: 1 }} />}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="active">Active Products</MenuItem>
                  <MenuItem value="inactive">Inactive Products</MenuItem>
                  <MenuItem value="deleted">Deleted Products</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {filteredProducts.length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Products Found
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </AnimatedCard>

        {/* Products Grid with Enhanced Cards */}
        <AnimatedContainer stagger>
          <Grid container spacing={3}>
            {filteredProducts.map((product, index) => {
              const stockStatus = getStockStatus(product);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <Card 
                      className="card-dark"
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Typography 
                            variant="h6" 
                            component="h3" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              mr: 1
                            }}
                          >
                            {product.name}
                          </Typography>
                          <AnimatedChip
                            color={stockStatus.color}
                            sx={{
                              fontSize: '0.7rem',
                              height: '24px',
                              '& .MuiChip-icon': {
                                fontSize: '14px'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {stockStatus.icon}
                              {stockStatus.text}
                            </Box>
                          </AnimatedChip>
                        </Box>
                        
                        {product.image_url && (
                          <Box sx={{ mb: 2, textAlign: 'center' }}>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Avatar
                                variant="rounded"
                                src={product.image_url}
                                sx={{ 
                                  width: '100%', 
                                  height: 120, 
                                  borderRadius: '12px',
                                  border: '2px solid',
                                  borderColor: 'divider'
                                }}
                              />
                            </motion.div>
                          </Box>
                        )}
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary', 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {product.description || 'No description available'}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                SKU
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {product.sku}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Price
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                                ${product.unit_price}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Availability
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {product.quantity_available}/{product.quantity_total}
                            </Typography>
                            <Box 
                              sx={{ 
                                flex: 1, 
                                height: 4, 
                                bgcolor: 'surface.secondary', 
                                borderRadius: 2,
                                overflow: 'hidden'
                              }}
                            >
                              <motion.div
                                style={{
                                  height: '100%',
                                  background: stockStatus.color === 'error' ? 
                                    darkMatteTheme.palette.error.main :
                                    stockStatus.color === 'warning' ?
                                    darkMatteTheme.palette.warning.main :
                                    darkMatteTheme.palette.success.main,
                                  borderRadius: '2px'
                                }}
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: `${Math.min((product.quantity_available / product.quantity_total) * 100, 100)}%` 
                                }}
                                transition={{ duration: 1, delay: index * 0.05 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        
                        {product.category_name && (
                          <Box sx={{ mb: 2 }}>
                            <AnimatedChip>
                              <CategoryIcon sx={{ fontSize: '14px', mr: 0.5 }} />
                              {product.category_name}
                            </AnimatedChip>
                          </Box>
                        )}
                        
                        {product.location && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            📍 {product.location}
                          </Typography>
                        )}
                        
                        <Chip
                          label={product.is_returnable ? 'Returnable' : 'Non-returnable'}
                          size="small"
                          color={product.is_returnable ? 'success' : 'default'}
                          icon={product.is_returnable ? <ShippingIcon /> : <AssignmentIcon />}
                          sx={{ mb: 2 }}
                        />
                      </CardContent>
                      
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1} justifyContent="space-between">
                          <Tooltip title="Add to Order" arrow>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleAddToCart(product)}
                                disabled={product.quantity_available === 0}
                                sx={{ 
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                  '&:hover': { 
                                    bgcolor: 'primary.dark',
                                    transform: 'translateY(-2px)',
                                  },
                                  '&:disabled': {
                                    bgcolor: 'action.disabledBackground',
                                    color: 'action.disabled'
                                  }
                                }}
                              >
                                <CartIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title="Edit Product" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEditProduct(product)}
                              sx={{ 
                                bgcolor: 'info.main',
                                color: 'white',
                                '&:hover': { 
                                  bgcolor: 'info.dark',
                                  transform: 'translateY(-2px)',
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="View Details" arrow>
                            <IconButton
                              size="small"
                              sx={{ 
                                bgcolor: 'success.main',
                                color: 'white',
                                '&:hover': { 
                                  bgcolor: 'success.dark',
                                  transform: 'translateY(-2px)',
                                }
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Product" arrow>
                            <IconButton
                              size="small"
                              onClick={() => deleteProduct(product.id)}
                              sx={{ 
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': { 
                                  bgcolor: 'error.dark',
                                  transform: 'translateY(-2px)',
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </AnimatedContainer>

        {/* Rest of the dialogs remain similar but with enhanced styling */}
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({...snackbar, open: false})}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({...snackbar, open: false})} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default EnhancedProducts;
