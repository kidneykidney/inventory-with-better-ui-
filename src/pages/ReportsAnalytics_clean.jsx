import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl, InputLabel,
  Select, MenuItem, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Chip, IconButton, Tooltip, Switch, FormControlLabel, Divider,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Assessment, Inventory, Timeline, Download, Print,
  Refresh, RealTimeChart, Analytics, Export, TableChart,
  PictureAsPdf, InsertChart, ShowChart, DonutLarge, AutoGraph,
  CloudDownload, Schedule, Notifications, Speed, DataUsage
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000/api';

// Color schemes for charts
const COLORS = ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

function ReportsAnalytics() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedModules, setSelectedModules] = useState(['products', 'students', 'orders']);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Data states
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [moduleAnalytics, setModuleAnalytics] = useState({});
  const [overviewCharts, setOverviewCharts] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(fetchRealTimeMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [reportType, dateRange]);

  const fetchRealTimeMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/metrics/realtime`);
      if (response.ok) {
        const data = await response.json();
        setRealTimeMetrics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  }, []);

  const fetchModuleAnalytics = useCallback(async (module) => {
    try {
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `${API_BASE_URL}/analytics/modules/${module}?start_date=${startDate}&end_date=${endDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setModuleAnalytics(prev => ({ ...prev, [module]: data }));
      }
    } catch (error) {
      console.error(`Error fetching ${module} analytics:`, error);
    }
  }, [dateRange]);

  const fetchOverviewCharts = useCallback(async () => {
    try {
      const days = getDaysFromRange(dateRange);
      const response = await fetch(`${API_BASE_URL}/analytics/charts/overview?days=${days}`);
      
      if (response.ok) {
        const data = await response.json();
        setOverviewCharts(data);
      }
    } catch (error) {
      console.error('Error fetching overview charts:', error);
    }
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchRealTimeMetrics(),
        fetchOverviewCharts(),
        ...selectedModules.map(module => fetchModuleAnalytics(module))
      ]);
    } catch (error) {
      setError('Failed to load analytics data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format = 'excel') => {
    setLoading(true);
    try {
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString().split('T')[0];
      
      const exportRequest = {
        modules: selectedModules,
        format: format,
        filters: {
          start_date: startDate,
          end_date: endDate
        },
        include_analytics: true
      };

      const response = await fetch(`${API_BASE_URL}/analytics/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'zip'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExportDialogOpen(false);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setError('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case 'last7days': return new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      case 'last30days': return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
      case 'last90days': return new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
      case 'lastyear': return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
      default: return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50', display: 'flex', alignItems: 'center' }}>
            <Analytics sx={{ mr: 2, fontSize: 40, color: '#1976d2' }} />
            📈 Real-Time Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live data tracking, comprehensive reports, and intelligent insights
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="overview">📊 Overview</MenuItem>
                  <MenuItem value="detailed">📋 Detailed</MenuItem>
                  <MenuItem value="trends">📈 Trends</MenuItem>
                  <MenuItem value="comparison">⚖️ Comparison</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="last7days">Last 7 Days</MenuItem>
                  <MenuItem value="last30days">Last 30 Days</MenuItem>
                  <MenuItem value="last90days">Last 90 Days</MenuItem>
                  <MenuItem value="lastyear">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRealTimeEnabled}
                    onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label="🔴 Live Updates"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                fullWidth
                onClick={fetchAllData}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                startIcon={<Download />} 
                fullWidth
                onClick={() => setExportDialogOpen(true)}
              >
                Export Data
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" startIcon={<Print />} fullWidth>
                Print Report
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Loading State */}
        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Real-Time Status */}
        <Card sx={{ mb: 3, p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Speed sx={{ color: 'white', fontSize: 30 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                System Status: {isRealTimeEnabled ? '🟢 LIVE' : '🔴 PAUSED'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Last updated: {lastUpdated.toLocaleTimeString()} • 
                Next update: {isRealTimeEnabled ? 'In 5 seconds' : 'Manual refresh required'}
              </Typography>
            </Grid>
            <Grid item>
              <Chip 
                label={`${selectedModules.length} modules active`} 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Grid>
          </Grid>
        </Card>

        {/* Real-Time Metrics */}
        {realTimeMetrics && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <Inventory sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {realTimeMetrics.total_products}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Products
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #81c784 0%, #66bb6a 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <Assessment sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {realTimeMetrics.total_students}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Students
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #ffb74d 0%, #ffa726 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <TrendingUp sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {realTimeMetrics.active_orders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #e57373 0%, #ef5350 100%)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <Timeline sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {realTimeMetrics.return_rate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Return Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* Enhanced Metrics Grid */}
        {realTimeMetrics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DataUsage sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6">Revenue Insights</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    ${realTimeMetrics.total_revenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue • Avg: ${realTimeMetrics.average_order_value.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    📈 Most Popular: {realTimeMetrics.most_borrowed_category}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Notifications sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6">Stock Alerts</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {realTimeMetrics.low_stock_items}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock Items
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    ⚠️ Requires immediate attention
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6">Pending Returns</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {realTimeMetrics.pending_returns}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items Out
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    📋 Awaiting return
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Charts Section */}
        {overviewCharts && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Daily Activity Chart */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShowChart sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">📊 Daily Activity Trends</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={overviewCharts.daily_activity}>
                      <defs>
                        <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="activities"
                        stroke="#1976d2"
                        fillOpacity={1}
                        fill="url(#colorActivities)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Category Distribution */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DonutLarge sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6">🥧 Category Distribution</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overviewCharts.category_distribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      >
                        {overviewCharts.category_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Status Distribution */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InsertChart sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">📈 Order Status Overview</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={overviewCharts.status_distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Module Analytics */}
        <AnimatePresence>
          {Object.entries(moduleAnalytics).map(([module, data]) => (
            <motion.div
              key={module}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    🏆 {module} Analytics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Summary: {JSON.stringify(data.summary)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudDownload sx={{ mr: 1, color: 'primary.main' }} />
              Export Analytics Data
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose your export format and modules to include:
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>Selected modules: {selectedModules.join(', ')}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Date range: {dateRange}</Typography>
            <Typography variant="body2">Include analytics summary: Yes</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="outlined" 
              onClick={() => handleExportData('csv')}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <TableChart />}
            >
              CSV Format
            </Button>
            <Button 
              variant="contained" 
              onClick={() => handleExportData('excel')}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <PictureAsPdf />}
            >
              Excel Format
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}

export default ReportsAnalytics;
