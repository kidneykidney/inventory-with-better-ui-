import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, CardMedia, Grid, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Chip, Button, IconButton, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Fab, Badge
} from '@mui/material';
import {
  Search, FilterList, Add, Inventory, ShoppingCart, DragIndicator,
  LocationOn, Category, Error as ErrorIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Sample data for demonstration
const sampleProducts = [
  {
    id: 1,
    name: "Arduino Uno R3",
    description: "Microcontroller board based on ATmega328P",
    category: "Microcontrollers",
    quantity_available: 25,
    unit_price: 15.99,
    location: "Shelf A-1",
    image_url: "/api/placeholder/200/150",
    low_stock_threshold: 10
  },
  {
    id: 2,
    name: "Breadboard (830 tie-points)",
    description: "Solderless breadboard for prototyping",
    category: "Tools",
    quantity_available: 50,
    unit_price: 5.99,
    location: "Shelf B-2",
    image_url: "/api/placeholder/200/150",
    low_stock_threshold: 15
  },
  {
    id: 3,
    name: "Resistor Kit (1/4W)",
    description: "Assorted resistor pack - 300 pieces",
    category: "Electrical",
    quantity_available: 8,
    unit_price: 12.99,
    location: "Drawer C-3",
    image_url: "/api/placeholder/200/150",
    low_stock_threshold: 10
  },
  {
    id: 4,
    name: "LED Strip (5M RGB)",
    description: "Waterproof RGB LED strip with controller",
    category: "Electronics",
    quantity_available: 0,
    unit_price: 24.99,
    location: "Shelf D-1",
    image_url: "/api/placeholder/200/150",
    low_stock_threshold: 5
  },
  {
    id: 5,
    name: "Digital Multimeter",
    description: "Professional digital multimeter with auto-ranging",
    category: "Tools",
    quantity_available: 12,
    unit_price: 89.99,
    location: "Cabinet E-1",
    image_url: "/api/placeholder/200/150",
    low_stock_threshold: 3
  },
  {
    id: 6,
    name: "Raspberry Pi 4 (4GB)",
    description: "Single board computer with 4GB RAM",
    category: "Microcontrollers",
    quantity_available: 15,
    unit_price: 75.99,
    location: "Shelf A-2",
    image_url: "/api/placeholder/200/150",
    low_stock_threshold: 5
  }
];

const categories = ["All", "Microcontrollers", "Electronics", "Electrical", "Tools"];

function InventoryManagement() {
  const [products, setProducts] = useState(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [orderCart, setOrderCart] = useState([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, products]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getStockStatus = (product) => {
    if (product.quantity_available === 0) {
      return { label: 'Out of Stock', color: 'error', severity: 'high' };
    }
    if (product.quantity_available <= product.low_stock_threshold) {
      return { label: 'Low Stock', color: 'warning', severity: 'medium' };
    }
    return { label: 'In Stock', color: 'success', severity: 'low' };
  };

  const addToCart = (product) => {
    if (product.quantity_available > 0) {
      const existingItem = orderCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.quantity_available) {
          setOrderCart(prev =>
            prev.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
        }
      } else {
        setOrderCart(prev => [...prev, { ...product, quantity: 1 }]);
      }
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderCart(prev => prev.filter(item => item.id !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (newQuantity <= product.quantity_available) {
        setOrderCart(prev =>
          prev.map(item =>
            item.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }
    }
  };

  const getTotalCartValue = () => {
    return orderCart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
          📦 Product Inventory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage electrical components and equipment for college incubation
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search products, categories, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ backgroundColor: 'white', borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                startAdornment={<FilterList sx={{ mr: 1, color: 'action.active' }} />}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<Add />}
              fullWidth
              sx={{ height: 56 }}
            >
              Add Product
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {currentProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          return (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={product.image_url}
                    alt={product.name}
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                  <Chip
                    label={stockStatus.label}
                    color={stockStatus.color}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontWeight: 500,
                    }}
                  />
                  {product.quantity_available === 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      <ErrorIcon sx={{ mr: 1 }} />
                      OUT OF STOCK
                    </Box>
                  )}
                </Box>
                
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Category sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {product.category}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {product.location}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                      ${product.unit_price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {product.quantity_available}
                    </Typography>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ShoppingCart />}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity_available === 0}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 500,
                      backgroundColor: product.quantity_available === 0 ? 'grey.300' : 'primary.main',
                    }}
                  >
                    {product.quantity_available === 0 ? 'Out of Stock' : 'Add to Order'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, value) => setCurrentPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Floating Cart Button */}
      {orderCart.length > 0 && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => setIsOrderDialogOpen(true)}
        >
          <ShoppingCart />
        </Fab>
      )}

      {/* Order Cart Dialog */}
      <Dialog
        open={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🛒 Order Cart ({orderCart.length} items)
        </DialogTitle>
        <DialogContent>
          {orderCart.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                borderBottom: '1px solid #eee',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ${item.unit_price} each
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  size="small"
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                >
                  -
                </Button>
                <Typography variant="body1" sx={{ minWidth: 20, textAlign: 'center' }}>
                  {item.quantity}
                </Typography>
                <Button
                  size="small"
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 80 }}>
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Total: ${getTotalCartValue().toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOrderDialogOpen(false)}>
            Continue Shopping
          </Button>
          <Button variant="contained" onClick={() => {
            // Navigate to order checkout
            console.log('Proceeding to checkout');
          }}>
            Proceed to Checkout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default InventoryManagement;
