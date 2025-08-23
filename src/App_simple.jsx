import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme, Box, Toolbar } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModule, setSelectedModule] = useState('dashboard');

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleModuleChange = (module) => {
    setSelectedModule(module);
  };

  const renderMainContent = () => {
    switch (selectedModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <div>Inventory Management - Coming Soon</div>;
      case 'students':
        return <div>Student Management - Coming Soon</div>;
      case 'orders':
        return <div>Order Management - Coming Soon</div>;
      case 'invoicing':
        return <div>Invoicing & Billing - Coming Soon</div>;
      case 'reports':
        return <div>Reports & Analytics - Coming Soon</div>;
      case 'tools':
        return <div>Tools & Utilities - Coming Soon</div>;
      case 'settings':
        return <div>System Settings - Coming Soon</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header 
          onMenuClick={handleToggleSidebar} 
          title="College Incubation Inventory"
        />
        <Sidebar 
          open={sidebarOpen}
          onModuleChange={handleModuleChange}
          selectedModule={selectedModule}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: '100vh',
            width: { sm: `calc(100% - ${sidebarOpen ? 280 : 0}px)` },
            ml: { sm: sidebarOpen ? `280px` : 0 },
            transition: (theme) =>
              theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
          }}
        >
          <Toolbar />
          <Box sx={{ p: 3 }}>
            {renderMainContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
