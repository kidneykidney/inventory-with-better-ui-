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
  Stack
} from '@mui/material';
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

  // API calls
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/products?status=${statusFilter}`;
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
      
      const response = await fetch(`${API_BASE}/products`, {
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

  const updateProduct = async () => {
    try {
      const response = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
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
      const response = await fetch(`${API_BASE}/products/${productId}`, {
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

      const response = await fetch(`${API_BASE}/orders`, {
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
              Manage your inventory, track stock levels, and create orders
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Add New Product">
              <Fab 
                color="secondary" 
                sx={{ mr: 1, bgcolor: '#66bb6a', '&:hover': { bgcolor: '#5cb660' } }}
                onClick={() => setOpenProductDialog(true)}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
            <Tooltip title="Add Category">
              <Fab 
                color="secondary" 
                sx={{ mr: 1, bgcolor: '#81c784', '&:hover': { bgcolor: '#7cc47f' } }}
                onClick={() => setOpenCategoryDialog(true)}
              >
                <CategoryIcon />
              </Fab>
            </Tooltip>
            <Tooltip title="Create Order">
              <Badge badgeContent={selectedProducts.length} color="error">
                <Fab 
                  color="secondary" 
                  sx={{ bgcolor: '#9ccc65', '&:hover': { bgcolor: '#8bc34a' } }}
                  onClick={() => setOpenOrderDialog(true)}
                >
                  <CartIcon />
                </Fab>
              </Badge>
            </Tooltip>
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SKU"
                value={productForm.sku}
                onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                  label="Category"
                >
                  <MenuItem value="">No Category</MenuItem>
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
                label="Location"
                value={productForm.location}
                onChange={(e) => setProductForm({...productForm, location: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Quantity"
                type="number"
                value={productForm.quantity_total}
                onChange={(e) => setProductForm({...productForm, quantity_total: parseInt(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Available Quantity"
                type="number"
                value={productForm.quantity_available}
                onChange={(e) => setProductForm({...productForm, quantity_available: parseInt(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                step="0.01"
                value={productForm.unit_price}
                onChange={(e) => setProductForm({...productForm, unit_price: parseFloat(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Stock Level"
                type="number"
                value={productForm.minimum_stock_level}
                onChange={(e) => setProductForm({...productForm, minimum_stock_level: parseInt(e.target.value)})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={productForm.image_url}
                onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>Cancel</Button>
          <Button 
            onClick={editingProduct ? updateProduct : createProduct}
            variant="contained"
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)}>
        <DialogTitle>Add New Category</DialogTitle>
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
          <Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
          <Button 
            onClick={createCategory}
            variant="contained"
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            Create Category
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
            Create Order
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
