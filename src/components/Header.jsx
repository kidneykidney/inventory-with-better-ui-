import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';

function Header({ title = 'Inventory Management System' }) {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <InventoryIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit">Dashboard</Button>
          <Button color="inherit">Items</Button>
          <Button color="inherit">Categories</Button>
          <Button color="inherit">Suppliers</Button>
          <Button color="inherit">Reports</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
