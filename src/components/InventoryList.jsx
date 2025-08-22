import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Container,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

function InventoryList({ items = [], loading = false, onEdit, onDelete, onAdd }) {
  const [inventoryItems, setInventoryItems] = useState(items);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchTerm) {
      const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setInventoryItems(filteredItems);
    } else {
      setInventoryItems(items);
    }
  }, [items, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const getStockStatus = (available, minLevel) => {
    if (available === 0) {
      return { label: 'Out of Stock', color: 'error' };
    } else if (available <= minLevel) {
      return { label: 'Low Stock', color: 'warning' };
    }
    return { label: 'In Stock', color: 'success' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Inventory Products ({inventoryItems.length})
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          {onAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAdd}
            >
              Add Product
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Product</strong></TableCell>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell align="right"><strong>Available</strong></TableCell>
              <TableCell align="right"><strong>Reserved</strong></TableCell>
              <TableCell align="right"><strong>Price</strong></TableCell>
              <TableCell><strong>Brand</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventoryItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Box py={4}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No products found matching your search.' : 'No products found. Add your first inventory product!'}
                    </Typography>
                    {searchTerm && (
                      <Button 
                        variant="text" 
                        onClick={() => setSearchTerm('')}
                        sx={{ mt: 1 }}
                      >
                        Clear search
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              inventoryItems.map((item) => {
                const stockStatus = getStockStatus(item.quantity_available, item.min_stock_level);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {item.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.category_name || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {item.quantity_available}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Min: {item.min_stock_level}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {item.quantity_reserved || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell>{item.brand || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                        variant="outlined"
                      />
                      {!item.is_lendable && (
                        <Chip
                          label="Not Lendable"
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        {onEdit && (
                          <IconButton
                            size="small"
                            onClick={() => onEdit(item)}
                            color="primary"
                            title="Edit product"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        {onDelete && (
                          <IconButton
                            size="small"
                            onClick={() => onDelete(item.id)}
                            color="error"
                            title="Delete product"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default InventoryList;
