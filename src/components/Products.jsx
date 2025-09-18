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
  Fab,
  Snackbar,
  Badge,
  Stack,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  ShoppingCart as CartIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000';

const Products = () => {
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
  const [openCategoryManagementDialog, setOpenCategoryManagementDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  
  // Order management
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Tab management
  const [dialogTab, setDialogTab] = useState(0);
  
  // Bulk products state
  const [bulkProducts, setBulkProducts] = useState([
    {
      id: 1,
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
    }
  ]);
  
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

  // API calls
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
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      showSnackbar('Failed to fetch categories', 'error');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/students`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      showSnackbar('Failed to fetch students', 'error');
    }
  };

  const createProduct = async () => {
    try {
      // Handle empty category_id by setting it to null instead of empty string
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
        console.error('Error creating product:', errorData);
        throw new Error(errorData.detail || 'Failed to create product');
      }
    } catch (error) {
      console.error('Create product error:', error);
      showSnackbar(`Failed to create product: ${error.message}`, 'error');
    }
  };

  const createBulkProducts = async () => {
    try {
      setLoading(true);
      const validProducts = bulkProducts.filter(product => 
        product.name.trim() && product.sku.trim()
      );

      if (validProducts.length === 0) {
        showSnackbar('Please add at least one valid product with name and SKU', 'warning');
        return;
      }

      const promises = validProducts.map(product => {
        const productData = {
          ...product,
          category_id: product.category_id || null,
          quantity_total: Number(product.quantity_total) || 0,
          quantity_available: Number(product.quantity_available) || 0,
          unit_price: Number(product.unit_price) || 0,
          minimum_stock_level: Number(product.minimum_stock_level) || 0,
          specifications: product.specifications || {},
          tags: product.tags || []
        };
        
        return fetch(`${API_BASE}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        showSnackbar(`Successfully created ${successful} product${successful > 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`, 'success');
        setOpenProductDialog(false);
        resetBulkForm();
        fetchProducts();
      } else {
        showSnackbar('Failed to create any products', 'error');
      }
    } catch (error) {
      console.error('Bulk create error:', error);
      showSnackbar('Failed to create bulk products', 'error');
    } finally {
      setLoading(false);
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
      const response = await fetch(`${API_BASE}/categories`, {
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

  const editCategory = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });
      
      if (response.ok) {
        showSnackbar('Category updated successfully', 'success');
        setOpenCategoryDialog(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '' });
        fetchCategories();
      } else {
        throw new Error('Failed to update category');
      }
    } catch (error) {
      showSnackbar('Failed to update category', 'error');
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showSnackbar('Category deleted successfully', 'success');
        setDeletingCategory(null);
        fetchCategories();
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      showSnackbar('Failed to delete category', 'error');
    }
  };

  const openEditCategoryDialog = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || '' });
    setOpenCategoryDialog(true);
  };

  const closeCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
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

  const resetBulkForm = () => {
    setBulkProducts([
      {
        id: 1,
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
      }
    ]);
  };

  const addBulkProduct = () => {
    const newId = Math.max(...bulkProducts.map(p => p.id)) + 1;
    setBulkProducts([...bulkProducts, {
      id: newId,
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
    }]);
  };

  const removeBulkProduct = (id) => {
    if (bulkProducts.length > 1) {
      setBulkProducts(bulkProducts.filter(p => p.id !== id));
    }
  };

  const updateBulkProduct = (id, field, value) => {
    setBulkProducts(bulkProducts.map(product =>
      product.id === id ? { ...product, [field]: value } : product
    ));
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
    setDialogTab(0); // Always open edit in single product tab
    setOpenProductDialog(true);
  };

  const handleOpenProductDialog = () => {
    setDialogTab(0); // Default to single product tab
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
    if (product.quantity_available === 0) return { color: 'error', text: 'Out of Stock' };
    if (product.quantity_available <= product.minimum_stock_level) return { color: 'warning', text: 'Low Stock' };
    return { color: 'success', text: 'In Stock' };
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

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Products Management
            </Typography>
            <Typography variant="subtitle1">
              Manage your inventory, track stock levels, and create lending records
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenProductDialog}
              sx={{ mr: 1, bgcolor: '#66bb6a', '&:hover': { bgcolor: '#5cb660' } }}
            >
              Add Product
            </Button>
            <Button
              variant="contained"
              startIcon={<CategoryIcon />}
              onClick={() => setOpenCategoryDialog(true)}
              sx={{ mr: 1, bgcolor: '#81c784', '&:hover': { bgcolor: '#7cc47f' } }}
            >
              Add Category
            </Button>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => setOpenCategoryManagementDialog(true)}
              sx={{ mr: 1, bgcolor: '#a5d6a7', '&:hover': { bgcolor: '#9ccc65' } }}
            >
              Manage Categories
            </Button>
            <Button
              variant="contained"
              startIcon={<CartIcon />}
              onClick={() => setOpenOrderDialog(true)}
              sx={{ bgcolor: '#9ccc65', '&:hover': { bgcolor: '#8bc34a' } }}
            >
              Create Lending
              {selectedProducts.length > 0 && (
                <Chip 
                  size="small" 
                  label={selectedProducts.length} 
                  sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#4caf50', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="deleted">Deleted</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredProducts.length} products found
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:hover': { 
                    transform: 'translateY(-2px)', 
                    boxShadow: 6,
                    transition: 'all 0.3s ease-in-out'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" component="h3" noWrap>
                      {product.name}
                    </Typography>
                    <Chip
                      label={stockStatus.text}
                      color={stockStatus.color}
                      size="small"
                      icon={stockStatus.color === 'error' ? <WarningIcon /> : <CheckCircleIcon />}
                    />
                  </Box>
                  
                  {product.image_url && (
                    <Avatar
                      variant="rounded"
                      src={product.image_url}
                      sx={{ width: '100%', height: 120, mb: 1 }}
                    />
                  )}
                  
                  <Typography variant="body2" color="text.secondary" mb={1} noWrap>
                    {product.description}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {product.sku}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${product.unit_price}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      Available: {product.quantity_available}/{product.quantity_total}
                    </Typography>
                    <Chip
                      label={product.is_returnable ? 'Returnable' : 'Non-returnable'}
                      size="small"
                      color={product.is_returnable ? 'primary' : 'default'}
                      icon={product.is_returnable ? <ShippingIcon /> : <AssignmentIcon />}
                    />
                  </Box>
                  
                  {product.category_name && (
                    <Chip
                      label={product.category_name}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                  
                  {product.location && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      📍 {product.location}
                    </Typography>
                  )}
                </CardContent>
                
                <Box sx={{ p: 1, pt: 0 }}>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Add to Order">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.quantity_available === 0}
                        sx={{ bgcolor: '#e8f5e8', '&:hover': { bgcolor: '#c8e6c9' } }}
                      >
                        <CartIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Product">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleEditProduct(product)}
                        sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="success"
                        sx={{ bgcolor: '#f1f8e9', '&:hover': { bgcolor: '#dcedc8' } }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Product">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteProduct(product.id)}
                        sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Product Dialog */}
      <Dialog 
        open={openProductDialog} 
        onClose={() => setOpenProductDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
            {!editingProduct && (
              <Tabs value={dialogTab} onChange={(e, newValue) => setDialogTab(newValue)}>
                <Tab label="📦 Add Product" />
                <Tab label="📋 Bulk Add Products" />
              </Tabs>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Single Product Tab */}
          {(dialogTab === 0 || editingProduct) && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name *"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                  error={!productForm.name.trim()}
                  helperText={!productForm.name.trim() ? "This field is required" : ""}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SKU *"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                  required
                  error={!productForm.sku.trim()}
                  helperText={!productForm.sku.trim() ? "This field is required" : ""}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price *"
                  type="number"
                  step="0.01"
                  value={productForm.unit_price}
                  onChange={(e) => setProductForm({...productForm, unit_price: parseFloat(e.target.value) || 0})}
                  error={productForm.unit_price < 0}
                  helperText={productForm.unit_price < 0 ? "This field is required" : ""}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                    label="Category *"
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Stock *"
                  type="number"
                  value={productForm.quantity_total}
                  onChange={(e) => setProductForm({...productForm, quantity_total: parseInt(e.target.value) || 0})}
                  required
                  error={productForm.quantity_total < 0}
                  helperText={productForm.quantity_total < 0 ? "This field is required" : ""}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Available Quantity"
                  type="number"
                  value={productForm.quantity_available}
                  onChange={(e) => setProductForm({...productForm, quantity_available: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={productForm.location}
                  onChange={(e) => setProductForm({...productForm, location: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Stock Level"
                  type="number"
                  value={productForm.minimum_stock_level}
                  onChange={(e) => setProductForm({...productForm, minimum_stock_level: parseInt(e.target.value) || 0})}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={productForm.is_returnable}
                      onChange={(e) => setProductForm({...productForm, is_returnable: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Is Returnable"
                />
              </Grid>
            </Grid>
          )}

          {/* Bulk Products Tab */}
          {dialogTab === 1 && !editingProduct && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                💡 Add multiple products at once. Fill in the required fields (marked with *) for each product. Click "➕ Add More Products" to add additional rows.
              </Alert>
              
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>PRODUCT NAME*</TableCell>
                      <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>SKU*</TableCell>
                      <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>PRICE*</TableCell>
                      <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>CATEGORY*</TableCell>
                      <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>TOTAL STOCK*</TableCell>
                      <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>AVAILABLE</TableCell>
                      <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>DESCRIPTION</TableCell>
                      <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>LOCATION</TableCell>
                      <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>RETURNABLE</TableCell>
                      <TableCell sx={{ minWidth: 50, fontWeight: 'bold' }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bulkProducts.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Enter product name"
                            value={product.name}
                            onChange={(e) => updateBulkProduct(product.id, 'name', e.target.value)}
                            error={!product.name.trim()}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Enter SKU"
                            value={product.sku}
                            onChange={(e) => updateBulkProduct(product.id, 'sku', e.target.value)}
                            error={!product.sku.trim()}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={product.unit_price}
                            onChange={(e) => updateBulkProduct(product.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            fullWidth
                            value={product.category_id}
                            onChange={(e) => updateBulkProduct(product.id, 'category_id', e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">Select Category</MenuItem>
                            {categories.map(category => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            placeholder="0"
                            value={product.quantity_total}
                            onChange={(e) => updateBulkProduct(product.id, 'quantity_total', parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            placeholder="0"
                            value={product.quantity_available}
                            onChange={(e) => updateBulkProduct(product.id, 'quantity_available', parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Description"
                            value={product.description}
                            onChange={(e) => updateBulkProduct(product.id, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Location"
                            value={product.location}
                            onChange={(e) => updateBulkProduct(product.id, 'location', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            size="small"
                            checked={product.is_returnable}
                            onChange={(e) => updateBulkProduct(product.id, 'is_returnable', e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          {bulkProducts.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeBulkProduct(product.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addBulkProduct}
                  variant="outlined"
                  sx={{ color: '#4caf50', borderColor: '#4caf50', '&:hover': { bgcolor: '#e8f5e8' } }}
                >
                  ➕ Add More Products
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenProductDialog(false)}>Cancel</Button>
          <Button 
            onClick={
              editingProduct 
                ? updateProduct 
                : dialogTab === 0 
                  ? createProduct 
                  : createBulkProducts
            }
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            {loading ? 'Creating...' : (
              editingProduct 
                ? 'Update' 
                : dialogTab === 0 
                  ? 'Create' 
                  : `🚀 Create ${bulkProducts.filter(p => p.name.trim() && p.sku.trim()).length} Products`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={closeCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
            sx={{ mt: 1, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCategoryDialog}>Cancel</Button>
          <Button 
            onClick={editingCategory ? editCategory : createCategory}
            variant="contained"
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog 
        open={openCategoryManagementDialog} 
        onClose={() => setOpenCategoryManagementDialog(false)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CategoryIcon color="primary" />
            Category Management
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {categories.length === 0 ? (
              <Box textAlign="center" py={4}>
                <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No categories found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Add Category" to create your first category
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Category Name</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CategoryIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight={500}>
                              {category.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {category.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Edit Category">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setOpenCategoryManagementDialog(false);
                                  openEditCategoryDialog(category);
                                }}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Category">
                              <IconButton 
                                size="small" 
                                onClick={() => setDeletingCategory(category)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<CategoryIcon />}
            onClick={() => {
              setOpenCategoryManagementDialog(false);
              setOpenCategoryDialog(true);
            }}
            variant="outlined"
          >
            Add New Category
          </Button>
          <Button onClick={() => setOpenCategoryManagementDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog 
        open={!!deletingCategory} 
        onClose={() => setDeletingCategory(null)}
        maxWidth="xs"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1} color="error.main">
            <DeleteIcon />
            Delete Category
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category <strong>"{deletingCategory?.name}"</strong>? 
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
            ⚠️ This action cannot be undone. Products in this category will become uncategorized.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingCategory(null)}>
            Cancel
          </Button>
          <Button 
            onClick={() => deleteCategory(deletingCategory.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Dialog */}
      <Dialog 
        open={openOrderDialog} 
        onClose={() => setOpenOrderDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Select Student"
                >
                  {students.map(student => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name} - {student.student_id} ({student.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {selectedProducts.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Selected Products:</Typography>
                {selectedProducts.map((product, index) => (
                  <Paper key={product.id} sx={{ p: 2, mb: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <Typography variant="body1">{product.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available: {product.quantity_available}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          label="Quantity"
                          type="number"
                          value={product.requestedQuantity}
                          onChange={(e) => {
                            const newProducts = [...selectedProducts];
                            newProducts[index].requestedQuantity = parseInt(e.target.value);
                            setSelectedProducts(newProducts);
                          }}
                          inputProps={{ min: 1, max: product.quantity_available }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Notes"
                          value={product.notes || ''}
                          onChange={(e) => {
                            const newProducts = [...selectedProducts];
                            newProducts[index].notes = e.target.value;
                            setSelectedProducts(newProducts);
                          }}
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Return Date"
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order Notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
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
            disabled={!selectedStudent || selectedProducts.length === 0}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            Create Lending
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

export default Products;
