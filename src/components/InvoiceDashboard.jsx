import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CameraAlt as CameraIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Dashboard as DashboardIcon,
  PendingActions as PendingIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'http://localhost:8000';

const InvoiceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({});
  const [stats, setStats] = useState({});
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [summaryRes, statsRes, invoicesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/invoices/analytics/summary`),
        fetch(`${API_BASE_URL}/api/invoices/analytics/stats`),
        fetch(`${API_BASE_URL}/api/invoices?limit=10`)
      ]);

      const [summaryData, statsData, invoicesData] = await Promise.all([
        summaryRes.json(),
        statsRes.json(),
        invoicesRes.json()
      ]);

      if (summaryRes.ok) setSummary(summaryData);
      if (statsRes.ok) setStats(statsData);
      if (invoicesRes.ok) {
        setRecentInvoices(invoicesData);
        // Filter overdue invoices
        const now = new Date();
        const overdue = invoicesData.filter(inv => 
          inv.status === 'issued' && 
          inv.due_date && 
          new Date(inv.due_date) < now
        );
        setOverdueInvoices(overdue);
      }

      setError('');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'issued': return 'primary';
      case 'acknowledged': return 'success';
      case 'archived': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  // Prepare chart data
  const statusChartData = Object.entries(stats.by_status || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: status === 'issued' ? '#1976d2' : 
          status === 'acknowledged' ? '#2e7d32' : 
          status === 'archived' ? '#757575' : '#ed6c02'
  }));

  const typeChartData = Object.entries(stats.by_type || {}).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));

  const monthlyData = Object.entries(stats.by_month || {}).map(([month, count]) => ({
    month: month,
    invoices: count
  }));

  const SummaryCard = ({ title, value, icon, color = 'primary', trend, subtitle }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#757575'} 10%, transparent 100%)` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="subtitle2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {typeof value === 'number' && title.includes('Value') 
                ? `$${value.toFixed(2)}` 
                : value
              }
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={`${color}.main`} sx={{ opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            <TrendingUpIcon fontSize="small" color={trend > 0 ? 'success' : 'error'} />
            <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'} sx={{ ml: 0.5 }}>
              {trend > 0 ? '+' : ''}{trend}% this month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const StatusProgressCard = ({ title, completed, total, color }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h4" color={`${color}.main`}>
              {completed}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              of {total}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            color={color}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            {percentage.toFixed(1)}% Complete
          </Typography>
        </CardContent>
      </Card>
    );
  };

  if (loading && Object.keys(summary).length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Invoice Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={fetchDashboardData}
            startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Invoices"
            value={summary.total_invoices || 0}
            icon={<ReceiptIcon sx={{ fontSize: 40 }} />}
            color="primary"
            subtitle="All time"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Active Loans"
            value={summary.issued_invoices || 0}
            icon={<PendingIcon sx={{ fontSize: 40 }} />}
            color="info"
            subtitle="Currently issued"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Acknowledged"
            value={summary.acknowledged_invoices || 0}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color="success"
            subtitle="By students"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Overdue Returns"
            value={overdueInvoices.length}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="error"
            subtitle="Require attention"
          />
        </Grid>
      </Grid>

      {/* Progress Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <StatusProgressCard
            title="Physical Invoices"
            completed={summary.physical_invoices_captured || 0}
            total={summary.total_invoices || 0}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatusProgressCard
            title="Student Acknowledgments"
            completed={summary.acknowledged_invoices || 0}
            total={summary.issued_invoices || 0}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatusProgressCard
            title="Return Rate"
            completed={(summary.issued_invoices || 0) - overdueInvoices.length}
            total={summary.issued_invoices || 0}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts Row - Using simple display instead of recharts for now */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Status Distribution
              </Typography>
              {statusChartData.length > 0 ? (
                <Box>
                  {statusChartData.map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                      <Typography>{item.name}</Typography>
                      <Chip 
                        label={item.value}
                        size="small" 
                        sx={{ backgroundColor: item.fill, color: 'white' }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography color="textSecondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Type Distribution
              </Typography>
              {typeChartData.length > 0 ? (
                <Box>
                  {typeChartData.map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                      <Typography>{item.name}</Typography>
                      <Chip 
                        label={item.value}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                  <Typography color="textSecondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row - Tables */}
      <Grid container spacing={3}>
        {/* Recent Invoices */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Invoices
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Issue Date</TableCell>
                      <TableCell>Items</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="textSecondary">No recent invoices</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentInvoices.slice(0, 5).map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>{invoice.invoice_number}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{invoice.student_name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {invoice.department}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={invoice.invoice_type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={invoice.status}
                              color={getStatusColor(invoice.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                          <TableCell>{invoice.total_items}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Invoices / Action Items */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Overdue Returns ({overdueInvoices.length})
              </Typography>
              {overdueInvoices.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography color="textSecondary">
                    No overdue returns!
                  </Typography>
                </Box>
              ) : (
                <List>
                  {overdueInvoices.slice(0, 5).map((invoice) => (
                    <ListItem key={invoice.id} divider>
                      <ListItemIcon>
                        <WarningIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={invoice.invoice_number}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {invoice.student_name}
                            </Typography>
                            <Typography variant="caption" color="error">
                              Due: {formatDate(invoice.due_date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats Footer */}
      <Box mt={4} p={2} bgcolor="grey.50" borderRadius={2}>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">
                {((summary.acknowledged_invoices || 0) / (summary.issued_invoices || 1) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption">Acknowledgment Rate</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="secondary">
                {((summary.physical_invoices_captured || 0) / (summary.total_invoices || 1) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption">Physical Capture Rate</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                {summary.pending_returns || 0}
              </Typography>
              <Typography variant="caption">Pending Returns</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="info.main">
                ${(summary.total_lending_value || 0).toFixed(2)}
              </Typography>
              <Typography variant="caption">Total Value</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default InvoiceDashboard;
