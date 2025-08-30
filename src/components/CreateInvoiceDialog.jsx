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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000';

const CreateInvoiceDialog = ({ open, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [invoiceData, setInvoiceData] = useState({
    student_id: '',
    invoice_type: 'lending',
    notes: '',
    due_date: '',
    issued_by: 'System Admin'
  });
  
  const [invoiceItems, setInvoiceItems] = useState([{
    product_id: '',
    quantity: 1,
    expected_return_date: '',
    notes: ''
  }]);
  
  // Options data
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const steps = ['Select Student', 'Add Items', 'Review & Create'];

  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchProducts();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      const data = await response.json();
      if (response.ok) {
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.filter(p => p.status === 'active' && p.quantity_available > 0));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleStudentChange = (event, newValue) => {
    setSelectedStudent(newValue);
    if (newValue) {
      setInvoiceData(prev => ({
        ...prev,
        student_id: newValue.id
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceItems];
    newItems[index][field] = value;
    
    // If product is selected, get product info
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        selectedProducts[index] = product;
        setSelectedProducts([...selectedProducts]);
      }
    }
    
    setInvoiceItems(newItems);
  };

  const addItem = () => {
    setInvoiceItems([...invoiceItems, {
      product_id: '',
      quantity: 1,
      expected_return_date: '',
      notes: ''
    }]);
  };

  const removeItem = (index) => {
    if (invoiceItems.length > 1) {
      const newItems = invoiceItems.filter((_, i) => i !== index);
      const newSelectedProducts = selectedProducts.filter((_, i) => i !== index);
      setInvoiceItems(newItems);
      setSelectedProducts(newSelectedProducts);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return selectedStudent !== null;
      case 1:
        return invoiceItems.every(item => item.product_id && item.quantity > 0);
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please complete all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // First create an order
      // Prepare complete order data with items
      const orderData = {
        student_id: selectedStudent.id,
        expected_return_date: invoiceData.due_date,
        notes: invoiceData.notes,
        items: invoiceItems.map(item => ({
          product_id: item.product_id,
          quantity_requested: item.quantity,
          expected_return_date: item.expected_return_date || invoiceData.due_date,
          notes: item.notes
        }))
      };

      const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('Order creation failed:', errorText);
        throw new Error(`Failed to create order: ${orderResponse.status} ${errorText}`);
      }

      const order = await orderResponse.json();

      // Create the invoice
      const invoicePayload = {
        order_id: order.id,
        student_id: selectedStudent.id,
        invoice_type: invoiceData.invoice_type,
        status: 'issued',
        due_date: invoiceData.due_date,
        issued_by: invoiceData.issued_by,
        notes: invoiceData.notes
      };

      const invoiceResponse = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });

      if (!invoiceResponse.ok) {
        throw new Error('Failed to create invoice');
      }

      const invoice = await invoiceResponse.json();
      
      // Add invoice items
      for (let i = 0; i < invoiceItems.length; i++) {
        const item = invoiceItems[i];
        const product = selectedProducts[i];
        
        const invoiceItemData = {
          invoice_id: invoice.id,
          product_id: item.product_id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity,
          unit_value: product.unit_price || 0,
          total_value: (product.unit_price || 0) * item.quantity,
          expected_return_date: item.expected_return_date || invoiceData.due_date,
          notes: item.notes
        };

        await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceItemData)
        });
      }

      onSuccess(invoice);
      handleClose();
      
    } catch (err) {
      setError(err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setInvoiceData({
      student_id: '',
      invoice_type: 'lending',
      notes: '',
      due_date: '',
      issued_by: 'System Admin'
    });
    setInvoiceItems([{
      product_id: '',
      quantity: 1,
      expected_return_date: '',
      notes: ''
    }]);
    setSelectedStudent(null);
    setSelectedProducts([]);
    setError('');
    onClose();
  };

  const getTotalItems = () => {
    return invoiceItems.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
  };

  const getTotalValue = () => {
    return invoiceItems.reduce((sum, item, index) => {
      const product = selectedProducts[index];
      const unitPrice = product?.unit_price || 0;
      return sum + (unitPrice * parseInt(item.quantity || 0));
    }, 0);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Select Student
              </Typography>
            </Grid>
            <Grid size={12}>
              <Autocomplete
                options={students}
                getOptionLabel={(option) => `${option.name} (${option.student_id})`}
                value={selectedStudent}
                onChange={handleStudentChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Student"
                    required
                    placeholder="Search students..."
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box>
                        <Typography>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.student_id} • {option.department}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Invoice Type"
                value={invoiceData.invoice_type}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_type: e.target.value }))}
              >
                <MenuItem value="lending">Lending</MenuItem>
                <MenuItem value="return">Return</MenuItem>
                <MenuItem value="damage">Damage Assessment</MenuItem>
                <MenuItem value="replacement">Replacement</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={invoiceData.due_date}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or instructions..."
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Add Items
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  variant="outlined"
                  size="small"
                >
                  Add Item
                </Button>
              </Box>
            </Grid>
            <Grid size={12}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Return Date</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell width={60}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Autocomplete
                            options={products}
                            getOptionLabel={(option) => `${option.name} (${option.sku})`}
                            value={products.find(p => p.id === item.product_id) || null}
                            onChange={(e, newValue) => {
                              handleItemChange(index, 'product_id', newValue?.id || '');
                            }}
                            renderInput={(params) => (
                              <TextField {...params} size="small" required />
                            )}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              return (
                                <Box component="li" key={key} {...otherProps}>
                                  <Box>
                                    <Typography variant="body2">{option.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.sku} • Available: {option.quantity_available}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {selectedProducts[index] ? (
                            <Chip 
                              label={selectedProducts[index].quantity_available} 
                              size="small" 
                              color={selectedProducts[index].quantity_available > 0 ? 'success' : 'error'}
                            />
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: selectedProducts[index]?.quantity_available || 1 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={item.expected_return_date}
                            onChange={(e) => handleItemChange(index, 'expected_return_date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 150 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            placeholder="Item notes..."
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => removeItem(index)}
                            disabled={invoiceItems.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Review & Create Invoice
              </Typography>
            </Grid>
            
            {/* Student Summary */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Student Information</Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedStudent?.name}<br />
                    <strong>ID:</strong> {selectedStudent?.student_id}<br />
                    <strong>Department:</strong> {selectedStudent?.department}<br />
                    <strong>Email:</strong> {selectedStudent?.email}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Invoice Summary */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Invoice Summary</Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {invoiceData.invoice_type}<br />
                    <strong>Total Items:</strong> {getTotalItems()}<br />
                    <strong>Total Value:</strong> ${getTotalValue().toFixed(2)}<br />
                    <strong>Due Date:</strong> {invoiceData.due_date || 'Not set'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Items Summary */}
            <Grid size={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Items ({invoiceItems.length})</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Value</TableCell>
                          <TableCell>Return Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoiceItems.map((item, index) => {
                          const product = selectedProducts[index];
                          return (
                            <TableRow key={index}>
                              <TableCell>{product?.name || 'Unknown Product'}</TableCell>
                              <TableCell>{product?.sku || 'N/A'}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">${(product?.unit_price || 0).toFixed(2)}</TableCell>
                              <TableCell>{item.expected_return_date || invoiceData.due_date || 'Not set'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {invoiceData.notes && (
              <Grid size={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Notes:</strong> {invoiceData.notes}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Create New Invoice
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(currentStep)}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        {currentStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!validateStep(currentStep)}
          >
            Next
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceDialog;
