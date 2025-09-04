import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl, InputLabel,
  Select, MenuItem, Button, Paper, Chip, IconButton, Tooltip, Switch, 
  FormControlLabel, Divider, LinearProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, Avatar, List, ListItem, ListItemText,
  ListItemIcon, Fab, SpeedDial, SpeedDialAction, SpeedDialIcon,
  Alert, Snackbar, Badge, AppBar, Toolbar, Container
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import {
  Dashboard, TrendingUp, Assessment, Inventory, Timeline, Download, Print,
  Refresh, Analytics, TableChart, PictureAsPdf, InsertChart, ShowChart, 
  DonutLarge, AutoGraph, CloudDownload, Schedule, Notifications, Speed, 
  DataUsage, Star, Warning, CheckCircle, Error, Info, FilterList,
  ViewModule, ViewList, FullscreenExit, Fullscreen, Share, Settings,
  MonetizationOn, People, Category, ShoppingCart, Receipt, LocalShipping
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000/api';

// Modern matte green color palette
const MATTE_COLORS = {
  primary: '#2D5A27',      // Deep forest green
  secondary: '#3A6B35',    // Medium forest green  
  accent: '#4A7C59',       // Sage green
  light: '#E8F5E8',        // Very light green
  surface: '#1E2E1A',      // Dark green surface
  text: '#C8D6C8',         // Light green text
  success: '#4CAF50',      // Standard success green
  warning: '#FF8F00',      // Muted orange
  error: '#D32F2F',        // Muted red
  info: '#1976D2'          // Muted blue
};

const CHART_COLORS = ['#2D5A27', '#3A6B35', '#4A7C59', '#5D8A6B', '#70997D', '#83A88F'];

function PremiumAnalyticsDashboard() {
  // State management
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, executive
  const [dateRange, setDateRange] = useState('last30days');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [fullscreenChart, setFullscreenChart] = useState(null);
  
  // Data states
  const [premiumMetrics, setPremiumMetrics] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [performanceInsights, setPerformanceInsights] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(fetchAllData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled, dateRange, viewMode]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [viewMode, dateRange]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchPremiumMetrics(),
        fetchAdvancedAnalytics(),
        fetchPerformanceInsights(),
        fetchExecutiveSummary()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      setError('Failed to load analytics data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchPremiumMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/metrics/premium`);
      if (response.ok) {
        const data = await response.json();
        setPremiumMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching premium metrics:', error);
    }
  }, []);

  const fetchAdvancedAnalytics = useCallback(async () => {
    try {
      const days = getDaysFromRange(dateRange);
      const response = await fetch(`${API_BASE_URL}/analytics/charts/advanced?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setAdvancedAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
    }
  }, [dateRange]);

  const fetchPerformanceInsights = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/insights/performance`);
      if (response.ok) {
        const data = await response.json();
        setPerformanceInsights(data);
      }
    } catch (error) {
      console.error('Error fetching performance insights:', error);
    }
  }, []);

  const fetchExecutiveSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/reports/executive`);
      if (response.ok) {
        const data = await response.json();
        setExecutiveSummary(data);
      }
    } catch (error) {
      console.error('Error fetching executive summary:', error);
    }
  }, []);

  const handlePremiumExport = async (module) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/export/premium/${module}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, format: 'csv' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module}_premium_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccessMessage(`${module} data exported successfully!`);
      }
    } catch (error) {
      setError(`Failed to export ${module} data`);
    } finally {
      setLoading(false);
    }
  };

  const getDaysFromRange = (range) => {
    switch (range) {
      case 'last7days': return 7;
      case 'last30days': return 30;
      case 'last90days': return 90;
      case 'lastyear': return 365;
      default: return 30;
    }
  };

  const formatCurrency = (amount) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  // Loading state
  if (loading && !premiumMetrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Analytics sx={{ fontSize: 60, color: 'primary.main' }} />
        </motion.div>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Premium Header */}
        <Box sx={{ mb: 4 }}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ 
              background: `linear-gradient(135deg, ${MATTE_COLORS.surface} 0%, ${MATTE_COLORS.primary} 100%)`,
              borderRadius: 4,
              p: 5,
              color: MATTE_COLORS.text,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 20px 60px rgba(45, 90, 39, 0.2)`,
              border: `1px solid ${MATTE_COLORS.accent}40`
            }}>
              {/* Subtle Background Elements */}
              <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 200, 
                height: 200, 
                background: `rgba(74, 124, 89, 0.05)`, 
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
              }} />
              <Box sx={{ 
                position: 'absolute', 
                bottom: -30, 
                left: -30, 
                width: 150, 
                height: 150, 
                background: `rgba(58, 107, 53, 0.03)`, 
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
              }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
                <motion.div
                  animate={{ 
                    rotate: [0, 2, -2, 0],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Dashboard sx={{ fontSize: 60, mr: 3, color: MATTE_COLORS.accent }} />
                </motion.div>
                <Box>
                  <Typography variant="h2" sx={{ 
                    fontWeight: 800, 
                    mb: 1,
                    color: MATTE_COLORS.text,
                    textShadow: `0 2px 4px rgba(0,0,0,0.3)`
                  }}>
                    Analytics Command Center
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: MATTE_COLORS.accent,
                    fontWeight: 400,
                    letterSpacing: '0.5px'
                  }}>
                    Real-time insights • Intelligent analytics • Executive reporting
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `rgba(74, 124, 89, 0.15)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(74, 124, 89, 0.2)`
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: MATTE_COLORS.text }}>
                        {premiumMetrics?.total_products || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: MATTE_COLORS.accent, fontWeight: 500 }}>
                        Total Products
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <Inventory sx={{ fontSize: 16, mr: 0.5, color: MATTE_COLORS.accent }} />
                        <Typography variant="caption" sx={{ color: MATTE_COLORS.accent }}>Inventory</Typography>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `rgba(74, 124, 89, 0.15)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(74, 124, 89, 0.2)`
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: MATTE_COLORS.text }}>
                        {formatCurrency(premiumMetrics?.total_revenue || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: MATTE_COLORS.accent, fontWeight: 500 }}>
                        Total Revenue
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: MATTE_COLORS.success }} />
                        <Typography variant="caption" sx={{ color: MATTE_COLORS.success }}>+{formatPercentage(premiumMetrics?.monthly_growth || 0)}</Typography>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `rgba(74, 124, 89, 0.15)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(74, 124, 89, 0.2)`
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: MATTE_COLORS.text }}>
                        {premiumMetrics?.total_students || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: MATTE_COLORS.accent, fontWeight: 500 }}>
                        Active Students
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <People sx={{ fontSize: 16, mr: 0.5, color: MATTE_COLORS.accent }} />
                        <Typography variant="caption" sx={{ color: MATTE_COLORS.accent }}>Users</Typography>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `rgba(74, 124, 89, 0.15)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(74, 124, 89, 0.2)`
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: MATTE_COLORS.text }}>
                        {premiumMetrics?.student_satisfaction.toFixed(1) || '0.0'}/5
                      </Typography>
                      <Typography variant="body2" sx={{ color: MATTE_COLORS.accent, fontWeight: 500 }}>
                        Satisfaction
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <Star sx={{ fontSize: 16, mr: 0.5, color: MATTE_COLORS.warning }} />
                        <Typography variant="caption" sx={{ color: MATTE_COLORS.accent }}>Rating</Typography>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </Box>

        {/* Controls Bar */}
        <Card sx={{ 
          mb: 3, 
          p: 2, 
          background: `linear-gradient(135deg, rgba(74, 124, 89, 0.08) 0%, rgba(45, 90, 39, 0.04) 100%)`,
          border: `1px solid ${MATTE_COLORS.accent}30`,
          borderRadius: 3
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: MATTE_COLORS.text }}>View Mode</InputLabel>
                <Select
                  value={viewMode}
                  label="View Mode"
                  onChange={(e) => setViewMode(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${MATTE_COLORS.accent}50`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: MATTE_COLORS.accent,
                    },
                    '& .MuiSelect-select': {
                      color: MATTE_COLORS.text,
                    }
                  }}
                >
                  <MenuItem value="overview">📊 Overview</MenuItem>
                  <MenuItem value="detailed">📋 Detailed</MenuItem>
                  <MenuItem value="executive">👔 Executive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: MATTE_COLORS.text }}>Time Period</InputLabel>
                <Select
                  value={dateRange}
                  label="Time Period"
                  onChange={(e) => setDateRange(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${MATTE_COLORS.accent}50`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: MATTE_COLORS.accent,
                    },
                    '& .MuiSelect-select': {
                      color: MATTE_COLORS.text,
                    }
                  }}
                >
                  <MenuItem value="last7days">📅 Last 7 Days</MenuItem>
                  <MenuItem value="last30days">📅 Last 30 Days</MenuItem>
                  <MenuItem value="last90days">📅 Last 90 Days</MenuItem>
                  <MenuItem value="lastyear">📅 Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRealTimeEnabled}
                    onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: MATTE_COLORS.success,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: MATTE_COLORS.success,
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: isRealTimeEnabled ? MATTE_COLORS.success : 'grey.400',
                      mr: 1,
                      animation: isRealTimeEnabled ? 'pulse 2s infinite' : 'none'
                    }} />
                    <Typography sx={{ color: MATTE_COLORS.text }}>Live Updates</Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Refresh />}
                  onClick={fetchAllData}
                  disabled={loading}
                  sx={{
                    borderColor: MATTE_COLORS.accent,
                    color: MATTE_COLORS.accent,
                    '&:hover': {
                      borderColor: MATTE_COLORS.primary,
                      backgroundColor: `${MATTE_COLORS.primary}10`,
                    }
                  }}
                >
                  Refresh
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<FilterList />}
                  sx={{
                    borderColor: MATTE_COLORS.accent,
                    color: MATTE_COLORS.accent,
                    '&:hover': {
                      borderColor: MATTE_COLORS.primary,
                      backgroundColor: `${MATTE_COLORS.primary}10`,
                    }
                  }}
                >
                  Filters
                </Button>
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<Share />}
                  sx={{
                    backgroundColor: MATTE_COLORS.primary,
                    '&:hover': {
                      backgroundColor: MATTE_COLORS.secondary,
                    }
                  }}
                >
                  Share
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Enhanced Status Bar */}
        <Card sx={{ 
          mb: 3, 
          p: 3, 
          background: `linear-gradient(135deg, rgba(74, 124, 89, 0.08) 0%, rgba(45, 90, 39, 0.04) 100%)`,
          borderRadius: 3,
          border: `1px solid ${MATTE_COLORS.accent}20`,
          backdropFilter: 'blur(10px)'
        }}>
          <Grid container alignItems="center" spacing={3}>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box>
                  <Speed sx={{ color: MATTE_COLORS.success, mr: 2, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: MATTE_COLORS.success }}>
                    System Status
                  </Typography>
                  <Typography variant="body2" sx={{ color: MATTE_COLORS.accent }}>
                    All systems operational
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item>
              <Divider orientation="vertical" flexItem sx={{ height: 40, bgcolor: `${MATTE_COLORS.accent}30` }} />
            </Grid>
            
            <Grid item>
              <Box>
                <Typography variant="body2" sx={{ color: MATTE_COLORS.text }}>
                  <strong>Last Update:</strong> {lastUpdated.toLocaleTimeString()}
                </Typography>
                <Typography variant="caption" sx={{ color: MATTE_COLORS.accent }}>
                  Next refresh: {isRealTimeEnabled ? 'Manual' : 'Manual'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item>
              <Divider orientation="vertical" flexItem sx={{ height: 40, bgcolor: `${MATTE_COLORS.accent}30` }} />
            </Grid>
            
            <Grid item xs>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip 
                    label={`${premiumMetrics?.critical_alerts || 0} Critical Alerts`}
                    color={premiumMetrics?.critical_alerts > 0 ? "error" : "success"}
                    size="small"
                    icon={premiumMetrics?.critical_alerts > 0 ? <Warning /> : <CheckCircle />}
                    sx={{
                      fontWeight: 600,
                      '& .MuiChip-icon': { fontSize: 16 },
                      bgcolor: premiumMetrics?.critical_alerts > 0 ? MATTE_COLORS.error : MATTE_COLORS.success,
                      '&.MuiChip-colorSuccess': {
                        bgcolor: MATTE_COLORS.success,
                        color: 'white'
                      },
                      '&.MuiChip-colorError': {
                        bgcolor: MATTE_COLORS.error,
                        color: 'white'
                      }
                    }}
                  />
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip 
                    label={`${premiumMetrics?.low_stock_items || 0} Low Stock Items`}
                    size="small"
                    icon={<Inventory />}
                    sx={{
                      fontWeight: 600,
                      '& .MuiChip-icon': { fontSize: 16, color: 'white' },
                      bgcolor: premiumMetrics?.low_stock_items > 0 ? MATTE_COLORS.warning : MATTE_COLORS.success,
                      color: 'white'
                    }}
                  />
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip 
                    label={`${premiumMetrics?.active_orders || 0} Active Orders`}
                    size="small"
                    icon={<ShoppingCart />}
                    sx={{
                      fontWeight: 600,
                      '& .MuiChip-icon': { fontSize: 16, color: 'white' },
                      bgcolor: MATTE_COLORS.primary,
                      color: 'white'
                    }}
                  />
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip 
                    label={isRealTimeEnabled ? "🟢 LIVE" : "🔴 PAUSED"}
                    variant="outlined"
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderColor: isRealTimeEnabled ? MATTE_COLORS.success : MATTE_COLORS.error,
                      color: isRealTimeEnabled ? MATTE_COLORS.success : MATTE_COLORS.error,
                      animation: isRealTimeEnabled ? 'pulse 2s infinite' : 'none'
                    }}
                  />
                </motion.div>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Key Performance Indicators */}
        {premiumMetrics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MonetizationOn sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatCurrency(premiumMetrics.monthly_revenue)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Monthly Revenue
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption">
                            +{formatPercentage(premiumMetrics.monthly_growth)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ShoppingCart sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {premiumMetrics.active_orders}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Active Orders
                        </Typography>
                        <Typography variant="caption">
                          {premiumMetrics.completed_orders} completed
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <People sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {premiumMetrics.total_students}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Students
                        </Typography>
                        <Typography variant="caption">
                          {premiumMetrics.most_active_student}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Star sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {premiumMetrics.student_satisfaction.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Satisfaction Score
                        </Typography>
                        <Typography variant="caption">
                          Out of 5.0
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}



        {/* Quick Export Section */}
        <Card sx={{ 
          mb: 3, 
          p: 4,
          background: `linear-gradient(135deg, rgba(74, 124, 89, 0.05) 0%, rgba(45, 90, 39, 0.02) 100%)`,
          borderRadius: 3,
          border: `1px solid ${MATTE_COLORS.accent}20`,
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center',
              color: MATTE_COLORS.text
            }}>
              <CloudDownload sx={{ mr: 2, color: MATTE_COLORS.primary, fontSize: 32 }} />
              Data Export Center
            </Typography>
            <Typography variant="body1" sx={{ 
              fontSize: '1.1rem',
              color: MATTE_COLORS.accent
            }}>
              Export comprehensive data with enhanced formatting and detailed metadata
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {[
              { 
                name: 'products', 
                icon: Inventory, 
                desc: 'Complete product catalog with specifications and inventory details',
                bgGradient: `linear-gradient(135deg, ${MATTE_COLORS.primary} 0%, ${MATTE_COLORS.secondary} 100%)`
              },
              { 
                name: 'students', 
                icon: People, 
                desc: 'Student profiles with contact information and activity history',
                bgGradient: `linear-gradient(135deg, ${MATTE_COLORS.secondary} 0%, ${MATTE_COLORS.accent} 100%)`
              },
              { 
                name: 'orders', 
                icon: ShoppingCart, 
                desc: 'Complete order records with transaction details and timestamps',
                bgGradient: `linear-gradient(135deg, ${MATTE_COLORS.accent} 0%, ${MATTE_COLORS.primary} 100%)`
              },
              { 
                name: 'invoices', 
                icon: Receipt, 
                desc: 'Invoice data with payment tracking and financial summaries',
                bgGradient: `linear-gradient(135deg, ${MATTE_COLORS.primary}dd 0%, ${MATTE_COLORS.accent}dd 100%)`
              },
              { 
                name: 'categories', 
                icon: Category, 
                desc: 'Category hierarchy with statistics and performance metrics',
                bgGradient: `linear-gradient(135deg, ${MATTE_COLORS.accent}cc 0%, ${MATTE_COLORS.secondary}cc 100%)`
              }
            ].map((module) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={module.name}>
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    y: -8
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    height: '100%',
                    background: module.bgGradient,
                    border: 'none',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': { 
                      boxShadow: `0 12px 40px rgba(45, 90, 39, 0.25)`,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255,255,255,0.1)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover::before': {
                      opacity: 1,
                    }
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <motion.div
                        whileHover={{ 
                          rotate: [0, -5, 5, -5, 0],
                          scale: 1.1 
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <module.icon sx={{ 
                          fontSize: 48, 
                          color: 'white', 
                          mb: 2,
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                        }} />
                      </motion.div>
                      
                      <Typography variant="h6" sx={{ 
                        textTransform: 'capitalize', 
                        mb: 1,
                        color: 'white',
                        fontWeight: 700,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        {module.name}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        display: 'block', 
                        mb: 3,
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.4,
                        minHeight: '3em'
                      }}>
                        {module.desc}
                      </Typography>
                      
                      <Button 
                        variant="contained" 
                        size="medium" 
                        fullWidth
                        startIcon={<CloudDownload />}
                        onClick={() => handlePremiumExport(module.name)}
                        disabled={loading}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.2,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                          },
                          '&:disabled': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {loading ? 'Exporting...' : 'Export CSV'}
                      </Button>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Card>



        {/* Floating Action Button */}
        <Fab 
          color="primary" 
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={fetchAllData}
        >
          <Refresh />
        </Fab>

        {/* Snackbar Notifications */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            onClose={() => setSuccessMessage('')} 
            severity="success"
            variant="filled"
          >
            {successMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error"
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>

      {/* Loading overlay */}
      {loading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Analytics sx={{ fontSize: 60, color: 'white' }} />
          </motion.div>
        </Box>
      )}

      {/* CSS Animations */}
      <style jsx="true" global="true">{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
        }
      `}</style>
    </motion.div>
  );
}

export default PremiumAnalyticsDashboard;
