import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import InventoryList from './components/InventoryList';
import { sampleInventoryItems } from './data/sampleData';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [inventoryItems, setInventoryItems] = useState(sampleInventoryItems);

  const handleEditItem = (item) => {
    console.log('Edit item:', item);
    // TODO: Implement edit functionality
  };

  const handleDeleteItem = (id) => {
    console.log('Delete item:', id);
    // TODO: Implement delete functionality
    setInventoryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    console.log('Add new item');
    // TODO: Implement add functionality
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Header />
        <Dashboard />
        <InventoryList 
          items={inventoryItems}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
