import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Grid, TextField, Select, MenuItem, FormControl,
  InputLabel, IconButton, Alert, Divider, Paper, Autocomplete
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Receipt as InvoiceIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000';

function BulkManualInvoiceDialog({ open, onClose, onSuccess }) {
  const [invoices, setInvoices] = useState([
    {
      student_id: '',
      invoice_type: 'lending',
      due_date: '',
      notes: '',
      issued_by: 'System Administrator'
    }
  ]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const addMoreInvoices = () => {
    setInvoices([
      ...invoices,
      {
        student_id: '',
        invoice_type: 'lending',
        due_date: '',
        notes: '',
        issued_by: 'System Administrator'
      }
    ]);
  };

  const removeInvoice = (index) => {
    if (invoices.length > 1) {
      setInvoices(invoices.filter((_, i) => i !== index));
    }
  };

  const updateInvoice = (index, field, value) => {
    const updatedInvoices = [...invoices];
    updatedInvoices[index] = {
      ...updatedInvoices[index],
      [field]: value
    };
    setInvoices(updatedInvoices);
  };

  const validateInvoices = () => {
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      if (!invoice.student_id) {
        setError(`Invoice ${i + 1}: Please select a student`);
        return false;
      }
      if (!invoice.due_date) {
        setError(`Invoice ${i + 1}: Please enter a due date`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInvoices()) return;

    setLoading(true);
    setError('');

    try {
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const invoice of invoices) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/invoices/create-with-student`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...invoice,
              student_id: parseInt(invoice.student_id)
            })
          });

          if (response.ok) {
            const data = await response.json();
            results.push({ success: true, data });
            successCount++;
          } else {
            const errorData = await response.json();
            results.push({ success: false, error: errorData.detail });
            failCount++;
          }
        } catch (error) {
          results.push({ success: false, error: error.message });
          failCount++;
        }
      }

      if (successCount > 0) {
        onSuccess(`Successfully created ${successCount} invoice(s). ${failCount > 0 ? `${failCount} failed.` : ''}`);
        handleClose();
      } else {
        setError('Failed to create any invoices. Please check your data and try again.');
      }
    } catch (error) {
      setError('An error occurred while creating invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInvoices([
      {
        student_id: '',
        invoice_type: 'lending',
        due_date: '',
        notes: '',
        issued_by: 'System Administrator'
      }
    ]);
    setError('');
    onClose();
  };

  const getStudentDisplayName = (student) => {
    return `${student.name} (${student.email}) - ${student.department || 'N/A'}`;
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const invoiceTypes = [
    { value: 'lending', label: 'Lending' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'service', label: 'Service' },
    { value: 'rental', label: 'Rental' }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InvoiceIcon sx={{ color: '#3B82F6' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
            Bulk Add Invoices
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mb: 3, backgroundColor: '#EBF8FF', border: '1px solid #3B82F6' }}
        >
          Add multiple invoices at once. Fill in the required fields (marked with *) for each invoice. 
          Click "Add More Invoices" to add additional rows.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          {/* Header Row */}
          <Paper sx={{ p: 2, mb: 2, backgroundColor: '#F3F4F6' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  STUDENT*
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  INVOICE TYPE*
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  DUE DATE*
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  ISSUED BY
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  NOTES
                </Typography>
              </Grid>
              <Grid item xs={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                  ACTIONS
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Invoice Rows */}
          {invoices.map((invoice, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid #E5E7EB',
                borderRadius: 2,
                '&:hover': { boxShadow: 2 }
              }}
            >
              <Grid container spacing={2} alignItems="center">
                {/* Student Selection */}
                <Grid item xs={3}>
                  <Autocomplete
                    size="small"
                    options={students}
                    getOptionLabel={(option) => getStudentDisplayName(option)}
                    value={students.find(s => s.id === parseInt(invoice.student_id)) || null}
                    onChange={(event, newValue) => {
                      updateInvoice(index, 'student_id', newValue ? newValue.id.toString() : '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select student"
                        required
                        error={!invoice.student_id}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Invoice Type */}
                <Grid item xs={2}>
                  <FormControl fullWidth size="small" required>
                    <Select
                      value={invoice.invoice_type}
                      onChange={(e) => updateInvoice(index, 'invoice_type', e.target.value)}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {invoiceTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Due Date */}
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    type="date"
                    value={invoice.due_date}
                    onChange={(e) => updateInvoice(index, 'due_date', e.target.value)}
                    required
                    error={!invoice.due_date}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Grid>

                {/* Issued By */}
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    placeholder="Issued by"
                    value={invoice.issued_by}
                    onChange={(e) => updateInvoice(index, 'issued_by', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Grid>

                {/* Notes */}
                <Grid item xs={2}>
                  <TextField
                    size="small"
                    placeholder="Enter notes"
                    value={invoice.notes}
                    onChange={(e) => updateInvoice(index, 'notes', e.target.value)}
                    multiline
                    maxRows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Grid>

                {/* Actions */}
                <Grid item xs={1}>
                  <IconButton
                    size="small"
                    onClick={() => removeInvoice(index)}
                    disabled={invoices.length === 1}
                    sx={{
                      color: '#EF4444',
                      '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.04)' },
                      '&:disabled': { color: '#D1D5DB' }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>

        {/* Add More Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addMoreInvoices}
            sx={{
              borderColor: '#3B82F6',
              color: '#3B82F6',
              '&:hover': {
                borderColor: '#2563EB',
                backgroundColor: 'rgba(59, 130, 246, 0.04)'
              }
            }}
          >
            Add More Invoices
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleClose}
          sx={{ color: '#6B7280' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            backgroundColor: '#3B82F6',
            '&:hover': { backgroundColor: '#2563EB' },
            px: 3
          }}
        >
          {loading ? 'Creating...' : `Create ${invoices.length} Invoice${invoices.length > 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BulkManualInvoiceDialog;
