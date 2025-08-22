import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl, InputLabel,
  Select, MenuItem, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Assessment, Inventory, Timeline, Download, Print
} from '@mui/icons-material';

const sampleData = {
  monthlyBorrowing: [
    { month: 'Jan', items: 45 },
    { month: 'Feb', items: 52 },
    { month: 'Mar', items: 38 },
    { month: 'Apr', items: 61 },
    { month: 'May', items: 55 },
    { month: 'Jun', items: 67 },
  ],
  categoryDistribution: [
    { name: 'Microcontrollers', value: 30, color: '#1976d2' },
    { name: 'Electronics', value: 25, color: '#dc004e' },
    { name: 'Tools', value: 20, color: '#ff9800' },
    { name: 'Electrical', value: 15, color: '#4caf50' },
    { name: 'Others', value: 10, color: '#9c27b0' },
  ],
  topBorrowedItems: [
    { name: 'Arduino Uno R3', borrowed: 45, returned: 40 },
    { name: 'Breadboard', borrowed: 38, returned: 35 },
    { name: 'Multimeter', borrowed: 32, returned: 28 },
    { name: 'LED Strip', borrowed: 28, returned: 25 },
    { name: 'Resistor Kit', borrowed: 25, returned: 22 },
  ]
};

function ReportsAnalytics() {
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState('last6months');

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
          📈 Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed reports, analytics, and system insights
        </Typography>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="monthly">Monthly Analysis</MenuItem>
                <MenuItem value="inventory">Inventory Usage</MenuItem>
                <MenuItem value="student">Student Activity</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="last3months">Last 3 Months</MenuItem>
                <MenuItem value="last6months">Last 6 Months</MenuItem>
                <MenuItem value="lastyear">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="outlined" startIcon={<Download />} fullWidth>
              Export Data
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="contained" startIcon={<Print />} fullWidth>
              Print Report
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                +23%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usage Growth
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                340
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Loans
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Inventory sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                89%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Return Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                15.2
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Days/Loan
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Monthly Borrowing Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Monthly Borrowing Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sampleData.monthlyBorrowing}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="items" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🥧 Category Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sampleData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sampleData.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Borrowed Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Most Borrowed Items
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="center">Times Borrowed</TableCell>
                      <TableCell align="center">Times Returned</TableCell>
                      <TableCell align="center">Return Rate</TableCell>
                      <TableCell align="center">Currently Out</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sampleData.topBorrowedItems.map((item, index) => (
                      <TableRow key={item.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {index + 1}. {item.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{item.borrowed}</TableCell>
                        <TableCell align="center">{item.returned}</TableCell>
                        <TableCell align="center">
                          {((item.returned / item.borrowed) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">{item.borrowed - item.returned}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ReportsAnalytics;
