import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Chip
} from '@mui/material';
import {
  Receipt, Print, Download, Email, MonetizationOn, AccountBalance,
  CreditCard, Payment
} from '@mui/icons-material';

const sampleInvoices = [
  {
    id: "INV-2025-001",
    student_name: "John Doe",
    student_id: "CS2021001",
    amount: 49.95,
    status: "Paid",
    due_date: "2025-09-22",
    created_date: "2025-08-22",
    payment_method: "Cash"
  },
  {
    id: "INV-2025-002",
    student_name: "Jane Smith",
    student_id: "EE2021045",
    amount: 125.50,
    status: "Pending",
    due_date: "2025-09-20",
    created_date: "2025-08-20",
    payment_method: "Pending"
  }
];

function InvoicingBilling() {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
          💰 Invoicing & Billing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage financial transactions, billing, and invoicing
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MonetizationOn sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                ₹1,250.45
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                ₹125.50
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                156
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Payment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                92%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Invoices */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📄 Recent Invoices
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice ID</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {invoice.student_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.student_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell>{invoice.payment_method}</TableCell>
                    <TableCell align="center">
                      <Button size="small" startIcon={<Print />}>
                        Print
                      </Button>
                      <Button size="small" startIcon={<Email />}>
                        Send
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default InvoicingBilling;
