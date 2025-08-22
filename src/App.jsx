import React from 'react';
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import Header from './components/Header';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header onMenuClick={handleMenuClick} />
      <Box sx={{ p: 4, mt: 8 }}>
        <h1>🚀 Testing Header Component</h1>
        <p>If you can see this, the Header component works!</p>
      </Box>
    </ThemeProvider>
  );
}

export default App;
