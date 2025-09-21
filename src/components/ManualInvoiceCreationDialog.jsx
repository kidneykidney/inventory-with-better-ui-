import React, { useState, useEffect } from 'react';
import NotificationService from '../services/notificationService';
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
  Add as AddIcon,
  Clear as ClearIcon
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
    lending_date: new Date().toISOString().split('T')[0],
    lending_time: '09:00',
    
    // Components/Products
    components: [{
      name: '',
      sku: '',
      quantity: 1,
      unit_value: 0,
      total_value: 0,
      category: '',
      description: '',
      product_id: null
    }],
    
    // For existing student selection
    useExistingStudent: true,
    selectedExistingStudent: null
  }]);
  
  const [students, setStudents] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [products, setProducts] = useState([]);

  const steps = ['Student Information', 'Invoice Details', 'Components & Products', 'Review & Create'];

  // Removed invoiceTypes array - now using fixed "lending" type

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
      fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
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
      lending_date: new Date().toISOString().split('T')[0],
      lending_time: '09:00',
      components: [{
        name: '',
        sku: '',
        quantity: 1,
        unit_value: 0,
        total_value: 0,
        category: '',
        description: '',
        product_id: null
      }],
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
      lending_date: new Date().toISOString().split('T')[0],
      lending_time: '09:00',
      components: [{
        name: '',
        sku: '',
        quantity: 1,
        unit_value: 0,
        total_value: 0,
        category: '',
        description: '',
        product_id: null
      }],
      useExistingStudent: true,
      selectedExistingStudent: null
    }]);
  };

  // Component management functions
  const updateComponentData = (invoiceIndex, componentIndex, field, value) => {
    const updated = [...invoices];
    if (!updated[invoiceIndex].components[componentIndex]) {
      updated[invoiceIndex].components[componentIndex] = {};
    }
    updated[invoiceIndex].components[componentIndex][field] = value;
    
    // Auto-calculate total value if unit_value or quantity changes
    if (field === 'unit_value' || field === 'quantity') {
      const component = updated[invoiceIndex].components[componentIndex];
      const unitValue = parseFloat(component.unit_value || 0);
      const quantity = parseInt(component.quantity || 1);
      updated[invoiceIndex].components[componentIndex].total_value = unitValue * quantity;
    }
    
    setInvoices(updated);
  };

  const addComponent = (invoiceIndex) => {
    const updated = [...invoices];
    updated[invoiceIndex].components.push({
      name: '',
      sku: '',
      quantity: 1,
      unit_value: 0,
      total_value: 0,
      category: '',
      description: '',
      product_id: null
    });
    setInvoices(updated);
  };

  const removeComponent = (invoiceIndex, componentIndex) => {
    const updated = [...invoices];
    updated[invoiceIndex].components.splice(componentIndex, 1);
    setInvoices(updated);
  };

  const selectProduct = (invoiceIndex, componentIndex, product) => {
    if (product) {
      updateComponentData(invoiceIndex, componentIndex, 'name', product.name);
      updateComponentData(invoiceIndex, componentIndex, 'sku', product.sku);
      updateComponentData(invoiceIndex, componentIndex, 'category', product.category_name || product.category);
      updateComponentData(invoiceIndex, componentIndex, 'description', product.description);
      updateComponentData(invoiceIndex, componentIndex, 'unit_value', product.unit_price || product.price || 0);
      updateComponentData(invoiceIndex, componentIndex, 'product_id', product.id);
    }
  };

  const clearProductSelection = (invoiceIndex, componentIndex) => {
    updateComponentData(invoiceIndex, componentIndex, 'product_id', null);
    // Keep the manually entered data, just remove the product_id to remove auto-fetch indicators
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
            setError(`Invoice ${i + 1}: Return date is required`);
            return false;
          }
          if (!invoice.lending_date) {
            setError(`Invoice ${i + 1}: Lending date is required`);
            return false;
          }
          if (!invoice.lending_time) {
            setError(`Invoice ${i + 1}: Lending time is required`);
            return false;
          }
          if (!invoice.lender_id) {
            setError(`Invoice ${i + 1}: Staff assignment is required`);
            return false;
          }
          break;
        case 2: // Components & Products
          if (!invoice.components || invoice.components.length === 0) {
            setError(`Invoice ${i + 1}: At least one component is required`);
            return false;
          }
          for (let j = 0; j < invoice.components.length; j++) {
            const component = invoice.components[j];
            if (!component.name.trim()) {
              setError(`Invoice ${i + 1}, Component ${j + 1}: Component name is required`);
              return false;
            }
            if (!component.quantity || component.quantity <= 0) {
              setError(`Invoice ${i + 1}, Component ${j + 1}: Valid quantity is required`);
              return false;
            }
            if (!component.unit_value || component.unit_value < 0) {
              setError(`Invoice ${i + 1}, Component ${j + 1}: Valid unit value is required`);
              return false;
            }
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
      const successfulInvoices = [];
      const failedInvoices = [];

      // Process each invoice
      for (let i = 0; i < invoices.length; i++) {
        const invoice = invoices[i];
        
        try {
          // Calculate total amount from components
          const totalAmount = invoice.components.reduce((sum, comp) => 
            sum + (comp.total_value || (comp.quantity * comp.unit_value)), 0
          );

          // Prepare the request data based on API model
          const requestData = {
            invoice_type: invoice.invoice_type,
            notes: invoice.notes || '',
            lender_id: invoice.lender_id,
            amount: totalAmount,
            lending_date: invoice.lending_date,
            lending_time: invoice.lending_time || null,
            due_date: invoice.due_date,
            components: invoice.components
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

          console.log(`Creating invoice ${i + 1} with data:`, requestData);

          const response = await fetch(`${API_BASE_URL}/api/invoices/create-with-student`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          });

          const responseData = await response.json();

          if (response.ok) {
            const createdInvoice = responseData.invoice;
            
            // Step 2: Add each component as an invoice item
            const itemErrors = [];
            
            for (const component of invoice.components) {
              try {
                const itemData = {
                  invoice_id: createdInvoice.id,
                  product_id: component.product_id || null,
                  order_item_id: null,
                  product_name: component.name,
                  product_sku: component.sku || '',
                  product_category: component.category || '',
                  product_description: component.description || '',
                  serial_number: component.serial_number || '',
                  quantity: parseInt(component.quantity) || 1,
                  unit_value: parseFloat(component.unit_value) || 0,
                  total_value: parseFloat(component.total_value) || (component.quantity * component.unit_value),
                  condition_at_lending: component.condition_at_lending || 'good',
                  lending_duration_days: 30,
                  expected_return_date: invoice.due_date,
                  notes: component.description || ''
                };

                console.log(`Adding item to invoice ${createdInvoice.id}:`, itemData);

                const itemResponse = await fetch(`${API_BASE_URL}/api/invoices/${createdInvoice.id}/items`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(itemData)
                });

                if (!itemResponse.ok) {
                  const itemError = await itemResponse.json();
                  itemErrors.push(`Item "${component.name}": ${itemError.detail || itemError.message || 'Unknown error'}`);
                }
              } catch (error) {
                itemErrors.push(`Item "${component.name}": ${error.message}`);
              }
            }

            if (itemErrors.length > 0) {
              console.warn(`Invoice ${i + 1} created but some items failed:`, itemErrors);
            }
            
            successfulInvoices.push(i + 1);
          } else {
            failedInvoices.push({ index: i + 1, error: responseData.detail || responseData.error || 'Failed to create invoice' });
          }
        } catch (error) {
          failedInvoices.push({ index: i + 1, error: error.message });
        }
      }

      // Show results
      if (successfulInvoices.length > 0) {
        NotificationService.success(
          'Invoices Created Successfully', 
          `Successfully created ${successfulInvoices.length} invoice${successfulInvoices.length > 1 ? 's' : ''}!`
        );
      }

      if (failedInvoices.length > 0) {
        const errorMessage = `Failed to create ${failedInvoices.length} invoice${failedInvoices.length > 1 ? 's' : ''}: ${failedInvoices.map(f => `Invoice ${f.index}`).join(', ')}`;
        NotificationService.error('Invoice Creation Failed', errorMessage);
        setError(errorMessage);
      }

      // If all invoices were successful, close the dialog
      if (failedInvoices.length === 0) {
        handleClose();
        if (onSuccess) onSuccess();
      }

    } catch (error) {
      console.error('Error creating invoices:', error);
      setError(error.message || 'Failed to create invoices. Please try again.');
      NotificationService.error('Invoice Creation Error', error.message || 'Failed to create invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getStudentDisplayName = (student) => {
    return `${student.name} (${student.student_id || 'No ID'})`;
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
                  <Grid item xs={1}>
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
                        '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 500 },
                        '& .MuiTypography-root': { fontSize: '0.75rem' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={11}>
                    {invoice.useExistingStudent ? (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Box sx={{ flex: 3, minWidth: '250px' }}>
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
                                placeholder="Search student..."
                                required
                                error={!invoice.selectedExistingStudent}
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { 
                                    fontSize: '0.8rem',
                                    height: '32px'
                                  }
                                }}
                              />
                            )}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              return (
                                <Box component="li" key={key} {...otherProps} sx={{ p: 1, minHeight: 40 }}>
                                  <Box sx={{ width: '100%' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                      {option.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                                      {option.student_id} • {option.email} • {option.department || 'No Dept'}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            }}
                            sx={{
                              '& .MuiAutocomplete-popper': {
                                width: 'auto !important',
                                minWidth: '700px'
                              },
                              '& .MuiAutocomplete-listbox': {
                                maxHeight: 160
                              }
                            }}
                          />
                        </Box>
                        
                        {/* Student Details Display - Right Side */}
                        {invoice.selectedExistingStudent && (
                          <Box sx={{ 
                            flex: 1,
                            p: 0.25, 
                            backgroundColor: '#F8FAFC', 
                            borderRadius: 0.5,
                            border: '1px solid #E2E8F0',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.7rem'
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.7rem' }}>
                              {invoice.selectedExistingStudent.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
                              •
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                              {invoice.selectedExistingStudent.student_id}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
                              •
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                              {invoice.selectedExistingStudent.department}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                              • Y{invoice.selectedExistingStudent.year_of_study}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
                        <TextField
                          size="small"
                          placeholder="Student name"
                          value={invoice.student_name}
                          onChange={(e) => handleInputChange(index, 'student_name', e.target.value)}
                          required
                          error={!invoice.student_name}
                          sx={{ 
                            width: '25%',
                            '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: '32px' }
                          }}
                        />
                        <TextField
                          size="small"
                          placeholder="Student ID"
                          value={invoice.student_id}
                          onChange={(e) => handleInputChange(index, 'student_id', e.target.value)}
                          sx={{ 
                            width: '15%',
                            '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: '32px' }
                          }}
                        />
                        <TextField
                          size="small"
                          placeholder="student@email.com"
                          type="email"
                          value={invoice.student_email}
                          onChange={(e) => handleInputChange(index, 'student_email', e.target.value)}
                          required
                          error={!invoice.student_email}
                          sx={{ 
                            width: '30%',
                            '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: '32px' }
                          }}
                        />
                        <Autocomplete
                          size="small"
                          fullWidth
                          freeSolo
                          options={departments}
                          value={invoice.department}
                          onChange={(event, newValue) => handleInputChange(index, 'department', newValue)}
                          onInputChange={(event, newInputValue) => handleInputChange(index, 'department', newInputValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Department"
                              required
                              error={!invoice.department}
                              sx={{ 
                                '& .MuiOutlinedInput-root': { 
                                  fontSize: '0.8rem', 
                                  height: '32px' 
                                } 
                              }}
                            />
                          )}
                          sx={{ width: '30%' }}
                        />
                        <Autocomplete
                          size="small"
                          fullWidth
                          freeSolo
                          options={yearOfStudyOptions}
                          getOptionLabel={(option) => typeof option === 'object' ? option.label : option.toString()}
                          value={yearOfStudyOptions.find(year => year.value === invoice.year_of_study) || null}
                          onChange={(event, newValue) => {
                            const value = typeof newValue === 'object' ? newValue?.value : newValue;
                            handleInputChange(index, 'year_of_study', value);
                          }}
                          onInputChange={(event, newInputValue) => {
                            const numValue = parseInt(newInputValue);
                            if (!isNaN(numValue) && numValue >= 1 && numValue <= 6) {
                              handleInputChange(index, 'year_of_study', numValue);
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Year"
                              sx={{ 
                                '& .MuiOutlinedInput-root': { 
                                  fontSize: '0.8rem', 
                                  height: '32px' 
                                } 
                              }}
                            />
                          )}
                          sx={{ width: '20%' }}
                        />
                      </Box>
                    )}
                  </Grid>

                  {/* Delete Button - Now inline at the end */}
                  <IconButton
                    size="small"
                    onClick={() => removeInvoice(index)}
                    disabled={invoices.length === 1}
                    sx={{
                      color: '#EF4444',
                      '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.04)' },
                      '&:disabled': { color: '#D1D5DB' },
                      padding: '4px',
                      ml: 0.5
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Paper>
            ))}

            {/* Add More Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <IconButton
                size="small"
                onClick={addMoreInvoices}
                sx={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': {
                    backgroundColor: '#2563EB',
                  }
                }}
              >
                <AddIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
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
                  <Grid item xs={2.4}>
                    <TextField
                      fullWidth
                      size="small"
                      value="Lending"
                      disabled
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.8rem', 
                          height: '32px',
                          backgroundColor: '#F5F5F5'
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={2.4}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      placeholder="Select return date"
                      value={invoice.due_date}
                      onChange={(e) => handleInputChange(index, 'due_date', e.target.value)}
                      required
                      error={!invoice.due_date}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        placeholder: "Select return date"
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.8rem', 
                          height: '32px' 
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={2.4}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      placeholder="Select lending date"
                      value={invoice.lending_date}
                      onChange={(e) => handleInputChange(index, 'lending_date', e.target.value)}
                      required
                      error={!invoice.lending_date}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        placeholder: "Select lending date"
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.8rem', 
                          height: '32px' 
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={2.4}>
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      placeholder="Select time"
                      value={invoice.lending_time}
                      onChange={(e) => handleInputChange(index, 'lending_time', e.target.value)}
                      required
                      error={!invoice.lending_time}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        placeholder: "Select time"
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          fontSize: '0.8rem', 
                          height: '32px' 
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={2.4}>
                    <Autocomplete
                      size="small"
                      fullWidth
                      freeSolo
                      options={lenders}
                      getOptionLabel={(option) => typeof option === 'object' ? option.name : option}
                      value={lenders.find(lender => lender.id === invoice.lender_id) || null}
                      onChange={(event, newValue) => {
                        const value = typeof newValue === 'object' ? newValue?.id : newValue;
                        handleInputChange(index, 'lender_id', value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select staff..."
                          required
                          error={!invoice.lender_id}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              fontSize: '0.8rem', 
                              height: '32px' 
                            } 
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={0.6}>
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <IconButton
                size="small"
                onClick={addMoreInvoices}
                sx={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': {
                    backgroundColor: '#2563EB',
                  }
                }}
              >
                <AddIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Box>
          </Box>
        );

      case 2: // Components & Products
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              Components & Products
            </Typography>

            {invoices.map((invoice, invoiceIndex) => (
              <Card key={invoiceIndex} sx={{ mb: 2, border: '1px solid #E5E7EB' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#1F2937', mb: 1 }}>
                    Invoice #{invoiceIndex + 1} - {invoice.selectedExistingStudent?.name || invoice.student_name || 'New Student'}
                  </Typography>

                  {invoice.components.map((component, componentIndex) => (
                    <Paper key={componentIndex} sx={{ p: 1, mb: 1, bgcolor: '#FAFAFA', border: '1px solid #E0E0E0' }}>
                      <Grid container spacing={0.5} sx={{ alignItems: 'center', minHeight: '40px' }}>
                        <Grid item xs={2.2}>
                          <Autocomplete
                            size="small"
                            options={products}
                            getOptionLabel={(option) => option.name || ''}
                            value={products.find(p => p.id === component.product_id) || null}
                            onChange={(event, newValue) => selectProduct(invoiceIndex, componentIndex, newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select Product"
                                variant="outlined"
                                size="small"
                                fullWidth
                                sx={{ 
                                  '& .MuiOutlinedInput-root': { 
                                    fontSize: '0.75rem', 
                                    height: '36px'
                                  },
                                  '& .MuiInputBase-input': {
                                    padding: '8px 12px'
                                  }
                                }}
                              />
                            )}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              return (
                                <Box component="li" key={key} {...otherProps} sx={{ p: 1, minHeight: 32 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                    {option.name} - {option.sku}
                                  </Typography>
                                </Box>
                              );
                            }}
                          />
                        </Grid>
                        <Grid item xs={1.6}>
                          <TextField
                            fullWidth
                            placeholder="Component"
                            value={component.name || ''}
                            onChange={(e) => updateComponentData(invoiceIndex, componentIndex, 'name', e.target.value)}
                            variant="outlined"
                            size="small"
                            required
                            error={!component.name}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.75rem', 
                                height: '36px',
                                '&.Mui-error': {
                                  '& fieldset': {
                                    borderColor: '#EF4444',
                                    borderWidth: '2px'
                                  }
                                }
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={0.9}>
                          <TextField
                            fullWidth
                            placeholder="SKU"
                            value={component.sku || ''}
                            onChange={(e) => updateComponentData(invoiceIndex, componentIndex, 'sku', e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.75rem', 
                                height: '36px'
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={0.9}>
                          <TextField
                            fullWidth
                            placeholder="Category"
                            value={component.category || ''}
                            onChange={(e) => updateComponentData(invoiceIndex, componentIndex, 'category', e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.75rem', 
                                height: '36px'
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={0.6}>
                          <TextField
                            fullWidth
                            placeholder="Qty"
                            type="number"
                            value={component.quantity || 1}
                            onChange={(e) => updateComponentData(invoiceIndex, componentIndex, 'quantity', parseInt(e.target.value) || 1)}
                            variant="outlined"
                            size="small"
                            required
                            error={!component.quantity || component.quantity <= 0}
                            inputProps={{ min: 1 }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.75rem', 
                                height: '36px',
                                '&.Mui-error': {
                                  '& fieldset': {
                                    borderColor: '#EF4444',
                                    borderWidth: '2px'
                                  }
                                }
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={0.9}>
                          <TextField
                            fullWidth
                            placeholder="Unit ₹"
                            type="number"
                            value={component.unit_value || 0}
                            onChange={(e) => updateComponentData(invoiceIndex, componentIndex, 'unit_value', parseFloat(e.target.value) || 0)}
                            variant="outlined"
                            size="small"
                            required
                            error={!component.unit_value || component.unit_value < 0}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.75rem', 
                                height: '36px',
                                '&.Mui-error': {
                                  '& fieldset': {
                                    borderColor: '#EF4444',
                                    borderWidth: '2px'
                                  }
                                }
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={1.0}>
                          <TextField
                            fullWidth
                            placeholder="Total ₹"
                            type="number"
                            value={component.total_value || (component.quantity * component.unit_value)}
                            onChange={(e) => updateComponentData(invoiceIndex, componentIndex, 'total_value', parseFloat(e.target.value) || 0)}
                            variant="outlined"
                            size="small"
                            disabled
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                fontSize: '0.75rem', 
                                height: '36px',
                                backgroundColor: '#F5F5F5'
                              },
                              '& .MuiInputBase-input': {
                                padding: '8px 12px'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={0.4}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '36px' }}>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => removeComponent(invoiceIndex, componentIndex)}
                              disabled={invoice.components.length === 1}
                              sx={{ 
                                p: 0.5,
                                height: '32px',
                                width: '32px'
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => addComponent(invoiceIndex)}
                      sx={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        }
                      }}
                    >
                      <AddIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      case 3: // Review & Create
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
                        <Grid item xs={12} md={8}>
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
                        
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Invoice Details
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            <strong>Type:</strong> {invoice.invoice_type}<br />
                            <strong>Lending Date:</strong> {new Date(invoice.lending_date).toLocaleDateString()}<br />
                            <strong>Lending Time:</strong> {invoice.lending_time}<br />
                            <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}<br />
                            <strong>Assigned Staff:</strong> {lenders.find(l => l.id === invoice.lender_id)?.name || 'Not specified'}<br />
                            {invoice.notes && (
                              <>
                                <strong>Notes:</strong> {invoice.notes}
                              </>
                            )}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                            Components ({invoice.components.length})
                          </Typography>
                          {invoice.components.map((component, compIndex) => (
                            <Box key={compIndex} sx={{ 
                              p: 2, 
                              mb: 1, 
                              backgroundColor: '#F8F9FA', 
                              borderRadius: 1,
                              border: '1px solid #E9ECEF'
                            }}>
                              <Grid container spacing={1}>
                                <Grid item xs={12} md={5}>
                                  <Typography variant="body2">
                                    <strong>{component.name || 'Unnamed Component'}</strong>
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    SKU: {component.sku || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                  <Typography variant="body2">
                                    <strong>Qty:</strong> {component.quantity}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                  <Typography variant="body2">
                                    <strong>Unit:</strong> ₹{component.unit_value}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                  <Typography variant="body2">
                                    <strong>Total:</strong> ₹{component.total_value || (component.quantity * component.unit_value)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                            <strong>Invoice Total: ₹{
                              invoice.components.reduce((sum, comp) => 
                                sum + (comp.total_value || (comp.quantity * comp.unit_value)), 0
                              ).toFixed(2)
                            }</strong>
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
