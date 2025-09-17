import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Box,
  Autocomplete,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Divider,
  IconButton,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000';

const ManualInvoiceCreationDialog = ({ open, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data for multiple invoices
  const [invoices, setInvoices] = useState([{
    // Student information (for new student creation)
    student_name: '',
    student_id: '',
    student_email: '',
    department: '',
    year_of_study: '',
    
    // Invoice information
    invoice_type: 'lending',
    notes: '',
    due_date: '',
    issued_by: 'System Administrator',
    lender_id: '',
    
    // For existing student selection
    useExistingStudent: true,
    selectedExistingStudent: null
  }]);
  
  const [students, setStudents] = useState([]);
  const [lenders, setLenders] = useState([]);

  const steps = ['Student Information', 'Invoice Details', 'Review & Create'];

  const invoiceTypes = [
    { value: 'lending', label: 'Lending' },
    { value: 'return', label: 'Return' },
    { value: 'damage', label: 'Damage' },
    { value: 'replacement', label: 'Replacement' }
  ];

  const departments = [
    'Computer Science',
    'Engineering',
    'Biology',
    'Physics',
    'Chemistry',
    'Mathematics',
    'Business',
    'Arts',
    'Literature',
    'Other'
  ];

  const yearOfStudyOptions = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' },
    { value: 5, label: '5th Year' },
    { value: 6, label: 'Graduate' }
  ];

  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchLenders();
      resetForm();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`);
      const data = await response.json();
      if (response.ok) {
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchLenders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lenders`);
      const data = await response.json();
      if (response.ok) {
        setLenders(data.filter(lender => lender.is_active)); // Only show active lenders
      }
    } catch (err) {
      console.error('Error fetching lenders:', err);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setInvoices([{
      student_name: '',
      student_id: '',
      student_email: '',
      department: '',
      year_of_study: '',
      invoice_type: 'lending',
      notes: '',
      due_date: '',
      issued_by: 'System Administrator',
      lender_id: '',
      useExistingStudent: true,
      selectedExistingStudent: null
    }]);
    setError('');
  };

  const addMoreInvoices = () => {
    setInvoices([...invoices, {
      student_name: '',
      student_id: '',
      student_email: '',
      department: '',
      year_of_study: '',
      invoice_type: 'lending',
      notes: '',
      due_date: '',
      issued_by: 'System Administrator',
      lender_id: '',
      useExistingStudent: true,
      selectedExistingStudent: null
    }]);
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

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateCurrentStep = () => {
    // Validate all invoices for the current step
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      
      switch (currentStep) {
        case 0: // Student Information
          if (invoice.useExistingStudent) {
            if (!invoice.selectedExistingStudent) {
              setError(`Invoice ${i + 1}: Please select a student`);
              return false;
            }
          } else {
            if (!invoice.student_name.trim()) {
              setError(`Invoice ${i + 1}: Student name is required`);
              return false;
            }
            if (!invoice.student_email.trim()) {
              setError(`Invoice ${i + 1}: Student email is required`);
              return false;
            }
            if (!invoice.department.trim()) {
              setError(`Invoice ${i + 1}: Department is required`);
              return false;
            }
          }
          break;
        case 1: // Invoice Details
          if (!invoice.due_date) {
            setError(`Invoice ${i + 1}: Due date is required`);
            return false;
          }
          if (!invoice.lender_id) {
            setError(`Invoice ${i + 1}: Staff assignment is required`);
            return false;
          }
          break;
      }
    }
    setError('');
    return true;
  };

  const handleInputChange = (index, field, value) => {
    updateInvoice(index, field, value);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    setError('');

    try {
      const results = [];
      let successCount = 0;
      let failCount = 0;

      // Process each invoice
      for (const [index, invoice] of invoices.entries()) {
        try {
          // Prepare the request data based on API model
          const requestData = {
            invoice_type: invoice.invoice_type,
            notes: invoice.notes || '',
            lender_id: invoice.lender_id,
            due_date: invoice.due_date ? (() => {
              // Parse DD/MM/YYYY format and convert to YYYY-MM-DD
              const parts = invoice.due_date.split('/');
              if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              // If it's already in YYYY-MM-DD format or a valid date string
              return new Date(invoice.due_date).toISOString().split('T')[0];
            })() : null
          };

          if (invoice.useExistingStudent && invoice.selectedExistingStudent) {
            // Use existing student data
            requestData.student_name = invoice.selectedExistingStudent.name;
            requestData.student_id = invoice.selectedExistingStudent.student_id;
            requestData.student_email = invoice.selectedExistingStudent.email;
            requestData.department = invoice.selectedExistingStudent.department;
            requestData.year_of_study = invoice.selectedExistingStudent.year_of_study;
          } else {
            // Use new student data
            requestData.student_name = invoice.student_name;
            requestData.student_id = invoice.student_id || null;
            requestData.student_email = invoice.student_email;
            requestData.department = invoice.department;
            requestData.year_of_study = invoice.year_of_study ? parseInt(invoice.year_of_study) : null;
          }

          console.log(`Creating invoice ${index + 1} with data:`, requestData);

          const response = await fetch(`${API_BASE_URL}/api/invoices/create-with-student`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          });

          const responseData = await response.json();

          if (response.ok) {
            results.push({ success: true, data: responseData });
            successCount++;
          } else {
            results.push({ success: false, error: responseData.detail });
            failCount++;
          }
        } catch (error) {
          console.error(`Error creating invoice ${index + 1}:`, error);
          results.push({ success: false, error: error.message });
          failCount++;
        }
      }

      if (successCount > 0) {
        const message = successCount === invoices.length 
          ? `Successfully created ${successCount} invoice(s)!`
          : `Created ${successCount} invoice(s) successfully. ${failCount} failed.`;
        onSuccess(message);
        handleClose();
      } else {
        setError('Failed to create any invoices. Please check your data and try again.');
      }
    } catch (error) {
      console.error('Error creating invoices:', error);
      setError('An error occurred while creating invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getStudentDisplayName = (student) => {
    return `${student.name} (${student.student_id || 'No ID'}) - ${student.department || 'No Dept'}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Student Information
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Student Information
            </Typography>
            
            {/* Student Selection Rows */}

            {/* Invoice Rows */}
            {invoices.map((invoice, index) => (
              <Paper
                key={index}
                sx={{
                  p: 1,
                  mb: 1,
                  border: '1px solid #E5E7EB',
                  borderRadius: 1,
                  '&:hover': { boxShadow: 1 }
                }}
              >
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={invoice.useExistingStudent}
                          onChange={(e) => handleInputChange(index, 'useExistingStudent', e.target.checked)}
                          size="small"
                        />
                      }
                      label={invoice.useExistingStudent ? "Existing" : "New"}
                      sx={{ 
                        fontSize: '0.75rem', 
                        '& .MuiFormControlLabel-label': { fontSize: '0.75rem' },
                        '& .MuiTypography-root': { fontSize: '0.75rem' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={8}>
                    {invoice.useExistingStudent ? (
                      <Autocomplete
                        size="small"
                        fullWidth
                        options={students}
                        getOptionLabel={getStudentDisplayName}
                        value={invoice.selectedExistingStudent}
                        onChange={(event, newValue) => {
                          handleInputChange(index, 'selectedExistingStudent', newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search and select student..."
                            required
                            error={!invoice.selectedExistingStudent}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.8rem', 
                                height: '32px',
                                padding: '0 8px'
                              }
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props} sx={{ p: 1.5, minHeight: 48 }}>
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {option.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {option.student_id} • {option.email} • {option.department}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        sx={{
                          '& .MuiAutocomplete-popper': {
                            width: 'auto !important',
                            minWidth: '600px'
                          },
                          '& .MuiAutocomplete-listbox': {
                            maxHeight: 200
                          }
                        }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Enter full student name"
                          value={invoice.student_name}
                          onChange={(e) => handleInputChange(index, 'student_name', e.target.value)}
                          required
                          error={!invoice.student_name}
                          sx={{ 
                            flex: 2,
                            '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: '32px' }
                          }}
                        />
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="student@college.edu"
                          type="email"
                          value={invoice.student_email}
                          onChange={(e) => handleInputChange(index, 'student_email', e.target.value)}
                          required
                          error={!invoice.student_email}
                          sx={{ 
                            flex: 2,
                            '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: '32px' }
                          }}
                        />
                        <FormControl fullWidth size="small" sx={{ flex: 1 }}>
                          <Select
                            value={invoice.department}
                            onChange={(e) => handleInputChange(index, 'department', e.target.value)}
                            displayEmpty
                            sx={{ 
                              fontSize: '0.8rem', 
                              height: '32px',
                              '& .MuiSelect-select': { fontSize: '0.8rem' }
                            }}
                          >
                            <MenuItem value="" disabled>Dept...</MenuItem>
                            {departments.map((dept) => (
                              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={1}>
                    {invoice.useExistingStudent ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={invoice.selectedExistingStudent?.year_of_study || ''}
                        disabled
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            fontSize: '0.8rem', 
                            height: '32px' 
                          } 
                        }}
                      />
                    ) : (
                      <FormControl fullWidth size="small">
                        <Select
                          value={invoice.year_of_study}
                          onChange={(e) => handleInputChange(index, 'year_of_study', e.target.value)}
                          displayEmpty
                          sx={{ 
                            fontSize: '0.8rem', 
                            height: '32px',
                            '& .MuiSelect-select': { fontSize: '0.8rem' }
                          }}
                        >
                          <MenuItem value="">Year...</MenuItem>
                          {yearOfStudyOptions.map((year) => (
                            <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>

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
          </Box>
        );

      case 1: // Invoice Details
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              Invoice Details
            </Typography>

            {/* Invoice Rows */}
            {invoices.map((invoice, index) => (
              <Paper
                key={index}
                sx={{
                  p: 1,
                  mb: 1,
                  border: '1px solid #E5E7EB',
                  borderRadius: 1,
                  '&:hover': { boxShadow: 1 }
                }}
              >
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={2.5}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={invoice.invoice_type}
                        onChange={(e) => handleInputChange(index, 'invoice_type', e.target.value)}
                        displayEmpty
                        error={!invoice.invoice_type}
                        sx={{ 
                          fontSize: '0.8rem', 
                          height: '32px',
                          '& .MuiSelect-select': { fontSize: '0.8rem' }
                        }}
                      >
                        <MenuItem value="" disabled>Select type...</MenuItem>
                        {invoiceTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      placeholder="Select due date"
                      value={invoice.due_date}
                      onChange={(e) => handleInputChange(index, 'due_date', e.target.value)}
                      required
                      error={!invoice.due_date}
                      InputLabelProps={{ shrink: true }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.8rem', 
                          height: '32px' 
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="Amount"
                      value={invoice.amount}
                      onChange={(e) => handleInputChange(index, 'amount', e.target.value)}
                      required
                      error={!invoice.amount || invoice.amount <= 0}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.8rem', 
                          height: '32px' 
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={2}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={invoice.lender_id}
                        onChange={(e) => handleInputChange(index, 'lender_id', e.target.value)}
                        displayEmpty
                        error={!invoice.lender_id}
                        sx={{ 
                          fontSize: '0.8rem', 
                          height: '32px',
                          '& .MuiSelect-select': { fontSize: '0.8rem' }
                        }}
                      >
                        <MenuItem value="" disabled>Select staff...</MenuItem>
                        {lenders.map((lender) => (
                          <MenuItem key={lender.id} value={lender.id}>
                            {lender.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ color: '#6B7280', fontSize: '0.9rem' }} />
                      <Typography variant="body2" sx={{ 
                        color: '#374151', 
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {invoice.selectedExistingStudent ? 
                          invoice.selectedExistingStudent.name || 'Selected Student' : 
                          invoice.useExistingStudent ? 'No student selected' : 
                          invoice.student_name || 'New Student'
                        }
                      </Typography>
                    </Box>
                  </Grid>

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
          </Box>
        );

      case 2: // Review & Create
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SaveIcon color="primary" />
              Review & Create Invoices
            </Typography>
            
            <Alert 
              severity="info" 
              sx={{ mb: 3, backgroundColor: '#EBF8FF', border: '1px solid #3B82F6' }}
            >
              <Typography variant="body2">
                <strong>Ready to create {invoices.length} invoice{invoices.length > 1 ? 's' : ''}!</strong>
                <br />
                Please review all invoice details below before creating.
              </Typography>
            </Alert>

            {/* Invoices Summary */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {invoices.map((invoice, index) => {
                const studentData = invoice.useExistingStudent ? invoice.selectedExistingStudent : invoice;
                return (
                  <Card key={index} variant="outlined" sx={{ mb: 2, border: '1px solid #E5E7EB' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" color="primary">
                          Invoice #{index + 1}
                        </Typography>
                        <Chip 
                          label={invoice.invoice_type} 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#3B82F6', 
                            color: 'white',
                            fontWeight: 500
                          }} 
                        />
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Student Information
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            <strong>Name:</strong> {studentData?.name || invoice.student_name}<br />
                            <strong>Email:</strong> {studentData?.email || invoice.student_email}<br />
                            <strong>Department:</strong> {studentData?.department || invoice.department}<br />
                            <strong>Year:</strong> {studentData?.year_of_study || invoice.year_of_study || 'Not specified'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Invoice Details
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            <strong>Type:</strong> {invoice.invoice_type}<br />
                            <strong>Amount:</strong> ₹{invoice.amount}<br />
                            <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}<br />
                            <strong>Assigned Staff:</strong> {lenders.find(l => l.id === invoice.lender_id)?.name || 'Not specified'}<br />
                            {invoice.notes && (
                              <>
                                <strong>Notes:</strong> {invoice.notes}
                              </>
                            )}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {/* Summary Statistics */}
            <Paper sx={{ p: 2, mt: 2, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Total Invoices
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {invoices.length}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#059669' }}>
                    ₹{invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Invoice Types
                  </Typography>
                  <Typography variant="body2">
                    {[...new Set(invoices.map(inv => inv.invoice_type))].join(', ')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon sx={{ color: '#3B82F6' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
            Create Invoice Manually
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} sx={{ color: '#6B7280' }}>
          Cancel
        </Button>
        
        {currentStep > 0 && (
          <Button onClick={handleBack} sx={{ color: '#6B7280' }}>
            Back
          </Button>
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ backgroundColor: '#3B82F6', '&:hover': { backgroundColor: '#2563EB' } }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}
          >
            {loading ? 'Creating Invoices...' : `Create ${invoices.length} Invoice${invoices.length > 1 ? 's' : ''}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ManualInvoiceCreationDialog;
