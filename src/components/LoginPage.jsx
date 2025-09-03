import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  Checkbox, FormControlLabel, InputAdornment, IconButton, 
  Container, Paper, Divider, Fade, LinearProgress, Chip,
  Avatar, Link, Tooltip
} from '@mui/material';
import {
  Visibility, VisibilityOff, Login as LoginIcon, 
  Security as SecurityIcon, School as SchoolIcon,
  AdminPanelSettings as AdminIcon, Lock as LockIcon,
  Email as EmailIcon, Person as PersonIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

// Professional login color scheme
const LOGIN_COLORS = {
  primary: '#1976D2',      // Professional blue
  secondary: '#0D47A1',    // Dark blue
  accent: '#42A5F5',       // Light blue
  success: '#4CAF50',      // Green
  warning: '#FF9800',      // Orange
  error: '#F44336',        // Red
  background: '#F5F7FA',   // Light background
  surface: '#FFFFFF',      // White surface
  text: '#263238',         // Dark text
  textSecondary: '#546E7A' // Secondary text
};

function LoginPage({ onLoginSuccess }) {
  // State management
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSystemInitialized, setIsSystemInitialized] = useState(true);
  const [initializingSystem, setInitializingSystem] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }
    }
  };

  // Check if system is initialized
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.status === 401) {
        // No valid token, system might need initialization
        setIsSystemInitialized(true); // Assume it's initialized for now
      }
    } catch (error) {
      console.log('System status check:', error);
    }
  };

  const initializeSystem = async () => {
    setInitializingSystem(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/init-system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`System initialized! Default credentials:
Username: ${data.admin_username}
Password: ${data.default_password}
Please change the password after first login.`);
        setIsSystemInitialized(true);
        setFormData({
          username: data.admin_username,
          password: data.default_password,
          rememberMe: false
        });
      } else {
        setError(data.detail || 'System initialization failed');
      }
    } catch (error) {
      setError('Failed to initialize system. Please check your connection.');
    } finally {
      setInitializingSystem(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting login to:', `${API_BASE_URL}/api/auth/login`);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          remember_me: formData.rememberMe
        })
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        // Store tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        setSuccess('Login successful! Redirecting...');
        
        // Call success callback
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (error) {
      setError('Connection failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${LOGIN_COLORS.primary} 0%, ${LOGIN_COLORS.secondary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(66, 165, 245, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(25, 118, 210, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(13, 71, 161, 0.2) 0%, transparent 50%)
        `,
        animation: 'float 20s infinite ease-in-out'
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants}>
            <Card sx={{
              borderRadius: 4,
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <CardContent sx={{ p: 6 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Avatar sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      background: `linear-gradient(135deg, ${LOGIN_COLORS.primary} 0%, ${LOGIN_COLORS.accent} 100%)`,
                      boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)'
                    }}>
                      <SchoolIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                  </motion.div>
                  
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    color: LOGIN_COLORS.text,
                    mb: 1
                  }}>
                    College Inventory System
                  </Typography>
                  
                  <Typography variant="body1" sx={{ 
                    color: LOGIN_COLORS.textSecondary,
                    mb: 2
                  }}>
                    Secure Administrative Access
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                    <Chip 
                      icon={<SecurityIcon />} 
                      label="Secure Login" 
                      size="small"
                      sx={{ 
                        bgcolor: `${LOGIN_COLORS.success}20`,
                        color: LOGIN_COLORS.success,
                        '& .MuiChip-icon': { color: LOGIN_COLORS.success }
                      }}
                    />
                    <Chip 
                      icon={<AdminIcon />} 
                      label="Admin Portal" 
                      size="small"
                      sx={{ 
                        bgcolor: `${LOGIN_COLORS.primary}20`,
                        color: LOGIN_COLORS.primary,
                        '& .MuiChip-icon': { color: LOGIN_COLORS.primary }
                      }}
                    />
                  </Box>
                </Box>

                {/* System Initialization Section */}
                {!isSystemInitialized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5 }}
                  >
                    <Paper sx={{ 
                      p: 3, 
                      mb: 3, 
                      bgcolor: `${LOGIN_COLORS.warning}10`,
                      border: `1px solid ${LOGIN_COLORS.warning}30`
                    }}>
                      <Typography variant="h6" sx={{ mb: 2, color: LOGIN_COLORS.warning }}>
                        🚀 System Setup Required
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, color: LOGIN_COLORS.text }}>
                        This appears to be the first time accessing the system. 
                        Please initialize it to create the main administrator account.
                      </Typography>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={initializeSystem}
                        disabled={initializingSystem}
                        startIcon={<AdminIcon />}
                        sx={{
                          bgcolor: LOGIN_COLORS.warning,
                          '&:hover': { bgcolor: '#E65100' }
                        }}
                      >
                        {initializingSystem ? 'Initializing System...' : 'Initialize System'}
                      </Button>
                    </Paper>
                  </motion.div>
                )}

                {/* Loading Progress */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Alert */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        <pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {error}
                        </pre>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Alert */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                        <pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {success}
                        </pre>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Form */}
                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    name="username"
                    label="Username or Email"
                    value={formData.username}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: LOGIN_COLORS.textSecondary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: LOGIN_COLORS.accent,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: LOGIN_COLORS.primary,
                        }
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: LOGIN_COLORS.textSecondary }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: LOGIN_COLORS.accent,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: LOGIN_COLORS.primary,
                        }
                      }
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        disabled={loading}
                        sx={{
                          color: LOGIN_COLORS.textSecondary,
                          '&.Mui-checked': {
                            color: LOGIN_COLORS.primary,
                          }
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: LOGIN_COLORS.textSecondary }}>
                        Keep me signed in
                      </Typography>
                    }
                    sx={{ mt: 2, mb: 2 }}
                  />

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading || !formData.username || !formData.password}
                      startIcon={<LoginIcon />}
                      sx={{
                        mt: 2,
                        mb: 3,
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${LOGIN_COLORS.primary} 0%, ${LOGIN_COLORS.secondary} 100%)`,
                        boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${LOGIN_COLORS.secondary} 0%, ${LOGIN_COLORS.primary} 100%)`,
                          boxShadow: '0 12px 40px rgba(25, 118, 210, 0.4)',
                        },
                        '&:disabled': {
                          background: LOGIN_COLORS.textSecondary,
                          color: 'white'
                        }
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </motion.div>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Security Information */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ 
                    color: LOGIN_COLORS.textSecondary,
                    display: 'block',
                    mb: 1
                  }}>
                    🔒 Secure authentication with session management
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: LOGIN_COLORS.textSecondary,
                    display: 'block'
                  }}>
                    Protected by enterprise-grade security protocols
                  </Typography>
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: LOGIN_COLORS.textSecondary }}>
                    College Incubation Inventory System v2.0.0
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>

      {/* CSS Animations */}
      <style jsx="true" global="true">{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
      `}</style>
    </Box>
  );
}

export default LoginPage;
