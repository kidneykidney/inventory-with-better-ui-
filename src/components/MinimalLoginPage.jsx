import React, { useState } from 'react';
import {
  Box, TextField, Typography, Alert, Container, InputAdornment, IconButton
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon, 
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { SimpleCard, SimpleButton, SimpleContainer } from './SimpleComponents';

const API_BASE_URL = 'http://localhost:8000';

const MinimalLoginPage = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field) => (event) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username/email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication data
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Call success callback
        onLoginSuccess(data.user);
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin(event);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 25%),
        radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.05) 0%, transparent 25%)
      `,
    }}>
      <Container maxWidth="sm">
        <SimpleCard sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: 2,
              backgroundColor: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}>
              <InventoryIcon sx={{ color: 'white', fontSize: '2rem' }} />
            </Box>
            
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1E293B', mb: 1 }}>
              Welcome Back
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Sign in to College Incubation Inventory System
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username or Email"
              placeholder="Enter your username or email"
              value={credentials.username}
              onChange={handleInputChange('username')}
              onKeyPress={handleKeyPress}
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#64748B' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={handleInputChange('password')}
              onKeyPress={handleKeyPress}
              disabled={loading}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#64748B' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <SimpleButton
              fullWidth
              variant="contained"
              onClick={handleLogin}
              disabled={loading}
              sx={{ py: 1.5, mb: 3 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </SimpleButton>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              Inventory Management System v1.0
            </Typography>
          </Box>
        </SimpleCard>
      </Container>
    </Box>
  );
};

export default MinimalLoginPage;
