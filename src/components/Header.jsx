import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Badge } from '@mui/material';
import { Notifications, AccountCircle, Menu } from '@mui/icons-material';
import InventoryIcon from '@mui/icons-material/Inventory';

function Header({ title = 'Inventory Management System', onMenuClick }) {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1976d2' }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <Menu />
        </IconButton>
        <InventoryIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        {/* Right side actions */}
        <IconButton color="inherit">
          <Badge badgeContent={4} color="error">
            <Notifications />
          </Badge>
        </IconButton>
        <IconButton color="inherit">
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
