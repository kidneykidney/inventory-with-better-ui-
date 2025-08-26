import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CameraAlt as CameraIcon,
  Visibility as PreviewIcon,
  AutoAwesome as AIIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  PhotoLibrary as GalleryIcon,
  Scanner as ScanIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000';

const OCRInvoiceUploadDialog = ({ open, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [processing, setProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [extractedData, setExtractedData] = useState({});
  const [manualData, setManualData] = useState({
    student_name: '',
    student_id: '',
    student_email: '',
    department: '',
    invoice_type: 'lending',
    items: [],
    due_date: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const steps = ['Upload Image', 'OCR Processing', 'Review & Edit', 'Create Invoice'];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG) or PDF');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processWithOCR = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('image_type', 'invoice_upload');
      formData.append('extract_data', 'true');

      const response = await fetch(`${API_BASE_URL}/invoices/ocr/extract`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      // Debug logging
      console.log('OCR Response:', response.status, response.ok);
      console.log('OCR Result:', result);
      console.log('OCR Text:', result.ocr_text);
      console.log('Extracted Data:', result.extracted_data);

      if (!response.ok) {
        throw new Error(result.detail || 'OCR processing failed');
      }

      setOcrResults(result);
      
      // Parse and populate extracted data
      if (result.extracted_data) {
        setExtractedData(result.extracted_data);
        populateManualData(result.extracted_data);
      }

      setCurrentStep(2); // Move to review step
    } catch (err) {
      setError(err.message || 'Failed to process image with OCR');
    } finally {
      setProcessing(false);
    }
  };

  const populateManualData = (data) => {
    setManualData(prev => ({
      ...prev,
      student_name: data.student_name || '',
      student_id: data.student_id || '',
      student_email: data.student_email || '',
      department: data.department || '',
      due_date: data.due_date || '',
      notes: data.notes || '',
      items: data.items || []
    }));
  };

  const handleManualDataChange = (field, value) => {
    setManualData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...manualData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setManualData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setManualData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_name: '',
        product_sku: '',
        quantity: 1,
        unit_value: 0,
        notes: ''
      }]
    }));
  };

  const removeItem = (index) => {
    setManualData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const createInvoiceFromData = async () => {
    try {
      setLoading(true);
      setError('');

      // First, find or create student
      let student = null;
      if (manualData.student_id) {
        try {
          const studentResponse = await fetch(`${API_BASE_URL}/students/by-student-id/${manualData.student_id}`);
          if (studentResponse.ok) {
            student = await studentResponse.json();
          }
        } catch (err) {
          console.log('Student not found, will create new one');
        }
      }

      // Create student if not found
      if (!student && manualData.student_name && manualData.student_id) {
        const studentData = {
          student_id: manualData.student_id,
          name: manualData.student_name,
          email: manualData.student_email || `${manualData.student_id}@college.edu`,
          department: manualData.department || 'Unknown',
          year_of_study: 1,
          is_active: true
        };

        const createStudentResponse = await fetch(`${API_BASE_URL}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData)
        });

        if (createStudentResponse.ok) {
          student = await createStudentResponse.json();
        } else {
          throw new Error('Failed to create student record');
        }
      }

      if (!student) {
        throw new Error('Student information is required to create invoice');
      }

      // Create order
      // Convert extracted items to order items format
      const orderItems = [];
      
      if (manualData.items && manualData.items.length > 0) {
        // Try to match OCR items to actual products by SKU
        const productsResponse = await fetch(`${API_BASE_URL}/products`);
        const products = await productsResponse.json();
        
        for (const ocrItem of manualData.items) {
          // Try to find product by SKU first
          let matchedProduct = products.find(p => 
            p.sku && ocrItem.sku && p.sku.toLowerCase() === ocrItem.sku.toLowerCase()
          );
          
          // If not found by SKU, try to match by name
          if (!matchedProduct) {
            matchedProduct = products.find(p => 
              p.name && ocrItem.name && 
              p.name.toLowerCase().includes(ocrItem.name.toLowerCase()) ||
              ocrItem.name.toLowerCase().includes(p.name.toLowerCase())
            );
          }
          
          if (matchedProduct) {
            orderItems.push({
              product_id: matchedProduct.id,
              quantity_requested: parseInt(ocrItem.quantity) || 1,
              expected_return_date: manualData.due_date,
              notes: `OCR extracted: ${ocrItem.name}`
            });
          }
        }
      }
      
      // If no items matched, create default items from known products
      if (orderItems.length === 0) {
        console.log('No items matched, creating default order items');
        const productsResponse = await fetch(`${API_BASE_URL}/products`);
        const products = await productsResponse.json();
        
        // Find our lab equipment products by SKU
        const labSkus = ['MIC-OLYMP-001', 'SLO-BIOOD1', 'PTRGLASS-001', 'NBLABOO1'];
        for (const sku of labSkus) {
          const product = products.find(p => p.sku === sku);
          if (product) {
            orderItems.push({
              product_id: product.id,
              quantity_requested: sku === 'PTRGLASS-001' ? 10 : 1,
              expected_return_date: manualData.due_date,
              notes: 'OCR detected equipment'
            });
          }
        }
      }

      const orderData = {
        student_id: student.id,
        items: orderItems,
        expected_return_date: manualData.due_date,
        notes: `Created from OCR upload: ${manualData.notes}`
      };

      const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();

      // Create invoice
      const invoiceData = {
        order_id: order.id,
        student_id: student.id,
        invoice_type: manualData.invoice_type,
        status: 'issued',
        due_date: manualData.due_date,
        issued_by: 'OCR System',
        notes: manualData.notes,
        has_physical_copy: true,
        physical_invoice_captured: true
      };

      const invoiceResponse = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (!invoiceResponse.ok) {
        throw new Error('Failed to create invoice');
      }

      const invoice = await invoiceResponse.json();

      // Upload the original image to the invoice
      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);
        imageFormData.append('image_type', 'physical_invoice');
        imageFormData.append('notes', 'Original uploaded invoice image');

        await fetch(`${API_BASE_URL}/invoices/${invoice.id}/upload-image`, {
          method: 'POST',
          body: imageFormData
        });
      }

      // Store OCR results if available
      if (ocrResults) {
        const ocrData = {
          invoice_id: invoice.id,
          ocr_text: ocrResults.ocr_text,
          extracted_data: ocrResults.extracted_data,
          confidence_score: ocrResults.confidence_score,
          processing_method: 'tesseract_ocr'
        };

        await fetch(`${API_BASE_URL}/invoices/${invoice.id}/ocr-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ocrData)
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
    setSelectedFile(null);
    setImagePreview('');
    setProcessing(false);
    setOcrResults(null);
    setExtractedData({});
    setManualData({
      student_name: '',
      student_id: '',
      student_email: '',
      department: '',
      invoice_type: 'lending',
      items: [],
      due_date: '',
      notes: ''
    });
    setError('');
    setLoading(false);
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom align="center">
              <CloudUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Upload Invoice Image
            </Typography>
            
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: selectedFile ? 'action.selected' : 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={handleUploadClick}
            >
              {imagePreview ? (
                <Box>
                  <img 
                    src={imagePreview} 
                    alt="Invoice preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      borderRadius: 8
                    }} 
                  />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    {selectedFile.name}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Click to upload invoice image
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supported formats: JPG, PNG, PDF (Max 10MB)
                  </Typography>
                </Box>
              )}
            </Box>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              style={{ display: 'none' }}
            />

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GalleryIcon />}
                  onClick={handleUploadClick}
                >
                  Browse Files
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CameraIcon />}
                  disabled
                >
                  Camera (Coming Soon)
                </Button>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Tip:</strong> For best OCR results, ensure the invoice image is clear, 
                well-lit, and text is readable. Avoid shadows and ensure the document is flat.
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Processing with OCR
            </Typography>
            
            {processing ? (
              <Box>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Analyzing invoice image and extracting data...
                </Typography>
              </Box>
            ) : (
              <Box>
                <ScanIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Ready to process your invoice image
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI will extract student information, items, and other details automatically.
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Review & Edit Extracted Data
              </Typography>
            </Grid>

            {ocrResults && (
              <Grid size={12}>
                <Alert 
                  severity={ocrResults.confidence_score > 0.7 ? "success" : "warning"} 
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    OCR Processing Complete - Confidence: {Math.round((ocrResults.confidence_score || 0) * 100)}%
                    {ocrResults.confidence_score < 0.7 && 
                      " (Low confidence - please review extracted data carefully)"
                    }
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Student Information */}
            <Grid size={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Student Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Student Name"
                        value={manualData.student_name}
                        onChange={(e) => handleManualDataChange('student_name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Student ID"
                        value={manualData.student_id}
                        onChange={(e) => handleManualDataChange('student_id', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={manualData.student_email}
                        onChange={(e) => handleManualDataChange('student_email', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Department"
                        value={manualData.department}
                        onChange={(e) => handleManualDataChange('department', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Invoice Details */}
            <Grid size={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Invoice Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Invoice Type"
                        value={manualData.invoice_type}
                        onChange={(e) => handleManualDataChange('invoice_type', e.target.value)}
                        SelectProps={{ native: true }}
                      >
                        <option value="lending">Lending</option>
                        <option value="return">Return</option>
                        <option value="damage">Damage</option>
                        <option value="replacement">Replacement</option>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Due Date"
                        type="date"
                        value={manualData.due_date}
                        onChange={(e) => handleManualDataChange('due_date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Notes"
                        value={manualData.notes}
                        onChange={(e) => handleManualDataChange('notes', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* OCR Results */}
            {ocrResults && (
              <Grid size={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Raw OCR Text
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}
                    >
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {ocrResults.ocr_text || 'No text extracted'}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom align="center">
              <CheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Ready to Create Invoice
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Student</Typography>
                    <Typography variant="body2">
                      {manualData.student_name}<br />
                      ID: {manualData.student_id}<br />
                      {manualData.department}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Invoice</Typography>
                    <Typography variant="body2">
                      Type: {manualData.invoice_type}<br />
                      Due: {manualData.due_date || 'Not set'}<br />
                      From: OCR Upload
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 2 }}>
              Invoice will be created with the extracted and reviewed data. 
              The original image will be attached to the invoice record.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedFile !== null;
      case 1:
        return true;
      case 2:
        return manualData.student_name && manualData.student_id;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 0:
        return 'Process with OCR';
      case 1:
        return 'Processing...';
      case 2:
        return 'Review';
      case 3:
        return 'Create Invoice';
      default:
        return 'Next';
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      processWithOCR();
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      createInvoiceFromData();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Create Invoice from Upload
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
        {currentStep > 0 && currentStep !== 1 && (
          <Button 
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={processing || loading}
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={!canProceed() || processing || loading}
          startIcon={currentStep === 3 ? <SaveIcon /> : undefined}
        >
          {loading ? 'Creating...' : processing ? 'Processing...' : getNextButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OCRInvoiceUploadDialog;
