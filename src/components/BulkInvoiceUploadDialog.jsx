import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  Divider,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  PhotoCamera as PhotoIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';
const steps = ['Upload Files', 'Review Extracted Data', 'Processing', 'Results'];

const BulkInvoiceUploadDialog = ({ open, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // 0: upload, 1: review, 2: processing, 3: results
  const [error, setError] = useState('');
  const [processStarted, setProcessStarted] = useState(false); // Prevent duplicate processing

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError(`${files.length - validFiles.length} files were filtered out due to type or size restrictions`);
    } else {
      setError('');
    }

    setSelectedFiles(validFiles.slice(0, 20)); // Limit to 20 files max
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractDataFromFiles = async () => {
    if (selectedFiles.length === 0) return;

    setProcessing(true);
    setError('');
    const extracted = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        // Disable auto-creation during extraction phase
        formData.append('auto_create_invoice', 'false');

        try {
          const response = await fetch(`${API_BASE_URL}/api/invoices/ocr-upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          extracted.push({
            file: file,
            fileName: file.name,
            success: result.success,
            data: result.extracted_data || {},
            confidence: result.confidence_score || 0,
            rawText: result.raw_text || '',
            error: result.error || null,
            processingMethod: result.processing_method || 'unknown'
          });
        } catch (err) {
          extracted.push({
            file: file,
            fileName: file.name,
            success: false,
            data: {},
            confidence: 0,
            rawText: '',
            error: err.message,
            processingMethod: 'failed'
          });
        }
      }

      setExtractedData(extracted);
      setCurrentStep(1); // Move to review step
    } catch (err) {
      setError(`Processing failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const updateExtractedData = (index, field, value) => {
    const updated = [...extractedData];
    updated[index].data[field] = value;
    setExtractedData(updated);
  };

  const retryExtraction = async (index) => {
    const file = extractedData[index].file;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/ocr-upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      const updated = [...extractedData];
      updated[index] = {
        ...updated[index],
        success: result.success,
        data: result.extracted_data || {},
        confidence: result.confidence_score || 0,
        rawText: result.raw_text || '',
        error: result.error || null,
        processingMethod: result.processing_method || 'unknown'
      };

      setExtractedData(updated);
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const removeExtractedFile = (index) => {
    const updated = [...extractedData];
    updated.splice(index, 1);
    setExtractedData(updated);
  };

  const processFiles = async () => {
    // Prevent duplicate processing
    if (processStarted || processing) {
      console.log('Processing already in progress, ignoring duplicate request');
      return;
    }

    setProcessStarted(true);
    setProcessing(true);
    setCurrentStep(2); // Move to processing step
    const results = [];

    try {
      for (const item of extractedData) {
        if (!item.success || !item.data.student_name) {
          results.push({
            filename: item.fileName,
            success: false,
            message: 'Insufficient data for invoice creation'
          });
          continue;
        }

        try {
          // Create FormData to send both invoice data and image file
          const formData = new FormData();
          
          // Add invoice data fields
          formData.append('student_name', item.data.student_name || 'Unknown Student');
          if (item.data.student_id) formData.append('student_id', item.data.student_id);
          if (item.data.student_email) formData.append('student_email', item.data.student_email);
          formData.append('department', item.data.department || 'General');
          if (item.data.year_of_study) formData.append('year_of_study', item.data.year_of_study);
          formData.append('invoice_type', item.data.invoice_type || 'lending');
          formData.append('issued_by', 'Bulk OCR System');
          formData.append('notes', `Bulk uploaded invoice. OCR confidence: ${item.confidence || 'N/A'}%`);
          
          // Add OCR-specific data
          if (item.confidence) formData.append('ocr_confidence', item.confidence);
          if (item.rawText) formData.append('ocr_text', item.rawText);
          
          // Add the original image file
          if (item.file) {
            formData.append('file', item.file, item.fileName);
          }

          const response = await fetch(`${API_BASE_URL}/api/invoices/create-with-student-and-image`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          results.push({
            filename: item.fileName,
            success: true,
            invoice_number: result.invoice.invoice_number,
            student_name: item.data.student_name,
            image_stored: result.image_stored || false,
            message: result.image_stored 
              ? 'Invoice created successfully with image stored'
              : 'Invoice created successfully (image not stored)'
          });
        } catch (err) {
          results.push({
            filename: item.fileName,
            success: false,
            message: err.message
          });
        }
      }

      setProcessedFiles(results);
      setCurrentStep(3); // Move to results step

      const successCount = results.filter(r => r.success).length;
      if (onSuccess) {
        onSuccess({
          total: results.length,
          successful: successCount,
          failed: results.length - successCount
        });
      }
    } catch (err) {
      setError(`Failed to create invoices: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setExtractedData([]);
    setProcessedFiles([]);
    setCurrentStep(0);
    setProcessing(false);
    setProcessStarted(false);
    setError('');
    onClose();
  };

  const renderUploadStep = () => (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          border: '2px dashed #4CAF50',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: 'rgba(76, 175, 80, 0.05)',
          mb: 3
        }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <UploadIcon sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
        </motion.div>
        <Typography variant="h6" gutterBottom>
          Click to Select Multiple Invoice Images
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Support: JPG, PNG, PDF • Max 20 files • Max 10MB each
        </Typography>
        <Button
          variant="contained"
          component="label"
          sx={{
            mt: 2,
            bgcolor: '#10B981',
            '&:hover': { bgcolor: '#059669' }
          }}
        >
          Choose Files
          <input
            type="file"
            hidden
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
          />
        </Button>
      </Box>

      {selectedFiles.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <Button
                    size="small"
                    onClick={() => removeFile(index)}
                    color="error"
                  >
                    Remove
                  </Button>
                }
              >
                <ListItemIcon>
                  <PhotoIcon />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Extracted Data ({extractedData.length} files)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Review and edit the extracted information before creating invoices. You can modify any field or remove files from processing.
      </Typography>

      {extractedData.map((item, index) => (
        <Accordion key={index} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 2
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              {item.success ? (
                <CheckIcon sx={{ color: '#4CAF50' }} />
              ) : (
                <ErrorIcon sx={{ color: '#F44336' }} />
              )}
              <Typography variant="subtitle1">
                {item.fileName}
              </Typography>
              {item.success && (
                <Chip 
                  label={`${Math.round(item.confidence * 100)}% confidence`}
                  size="small"
                  color={item.confidence > 0.7 ? 'success' : item.confidence > 0.4 ? 'warning' : 'error'}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Edit the extracted information or retry extraction:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={() => retryExtraction(index)}
                  color="primary"
                  title="Retry extraction"
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => removeExtractedFile(index)}
                  color="error"
                  title="Remove file"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
            {item.success ? (
              <Grid container spacing={2}>
                {/* Student Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
                    Student Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Student Name *"
                    value={item.data.student_name || ''}
                    onChange={(e) => updateExtractedData(index, 'student_name', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Student ID *"
                    value={item.data.student_id || ''}
                    onChange={(e) => updateExtractedData(index, 'student_id', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={item.data.student_email || ''}
                    onChange={(e) => updateExtractedData(index, 'student_email', e.target.value)}
                    variant="outlined"
                    size="small"
                    type="email"
                  />
                </Grid>

                {/* Lending Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 1, mt: 2 }}>
                    Lending Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Lender Name"
                    value={item.data.lender_name || ''}
                    onChange={(e) => updateExtractedData(index, 'lender_name', e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="Faculty/Staff member"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date"
                    value={item.data.lending_date || ''}
                    onChange={(e) => updateExtractedData(index, 'lending_date', e.target.value)}
                    variant="outlined"
                    size="small"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Time"
                    value={item.data.lending_time || ''}
                    onChange={(e) => updateExtractedData(index, 'lending_time', e.target.value)}
                    variant="outlined"
                    size="small"
                    type="time"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Additional Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: '#1976d2', mb: 1, mt: 2 }}>
                    Details
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Invoice Type</InputLabel>
                    <Select
                      value={item.data.invoice_type || 'lending'}
                      onChange={(e) => updateExtractedData(index, 'invoice_type', e.target.value)}
                      label="Invoice Type"
                    >
                      <MenuItem value="lending">Lending</MenuItem>
                      <MenuItem value="return">Return</MenuItem>
                      <MenuItem value="damage">Damage</MenuItem>
                      <MenuItem value="replacement">Replacement</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    value={item.data.due_date || ''}
                    onChange={(e) => updateExtractedData(index, 'due_date', e.target.value)}
                    variant="outlined"
                    size="small"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={item.data.notes || ''}
                    onChange={(e) => updateExtractedData(index, 'notes', e.target.value)}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Additional lending details, purpose, special instructions"
                  />
                </Grid>

                {/* Product Information Note */}
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary', 
                    fontStyle: 'italic',
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid rgba(25, 118, 210, 0.2)'
                  }}>
                    <strong>Product Details:</strong> Products will be linked from the existing Product Management module. 
                    Use the Products module to manage item details, specifications, pricing, and inventory levels.
                  </Typography>
                </Grid>

                {/* Raw OCR Text - Always show at the bottom */}
                {item.rawText && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: '#1976d2', mb: 1, mt: 2 }}>
                      Raw OCR Text
                    </Typography>
                    <TextField
                      fullWidth
                      label="Extracted Text from OCR"
                      value={item.rawText}
                      multiline
                      rows={3}
                      variant="outlined"
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}
                    />
                  </Grid>
                )}
              </Grid>
            ) : (
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>Error:</strong> {item.error || 'OCR processing failed'}
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => retryExtraction(index)}
                  sx={{ mt: 1 }}
                >
                  Retry Extraction
                </Button>
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  const renderProcessingStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <UploadIcon sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
      </motion.div>
      <Typography variant="h6" gutterBottom>
        Creating Invoices...
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Creating invoices with automatic student creation
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={(processedFiles.length / extractedData.length) * 100}
        sx={{ mt: 2, mb: 1 }}
      />
      <Typography variant="caption">
        {processedFiles.length} of {extractedData.length} invoices processed
      </Typography>
    </Box>
  );

  const renderResultsStep = () => {
    const successCount = processedFiles.filter(r => r.success).length;
    const failureCount = processedFiles.length - successCount;

    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            icon={<CheckIcon />}
            label={`${successCount} Successful`}
            color="success"
            variant="outlined"
          />
          <Chip 
            icon={<ErrorIcon />}
            label={`${failureCount} Failed`}
            color="error"
            variant="outlined"
          />
        </Box>

        <Typography variant="h6" gutterBottom>
          Processing Results
        </Typography>
        <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
          {processedFiles.map((result, index) => (
            <ListItem key={index} sx={{ py: 1 }}>
              <ListItemIcon>
                {result.success ? (
                  <CheckIcon sx={{ color: '#4CAF50' }} />
                ) : (
                  <ErrorIcon sx={{ color: '#F44336' }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={result.filename}
                secondary={
                  result.success ? (
                    `Invoice ${result.invoice_number} created for ${result.student_name}`
                  ) : (
                    result.message
                  )
                }
                secondaryTypographyProps={{
                  color: result.success ? 'success.main' : 'error.main',
                  variant: 'caption'
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const canProceedFromReview = extractedData.filter(item => item.success && item.data.student_name).length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#FFFFFF',
          color: '#fff',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ color: '#4CAF50', display: 'flex', alignItems: 'center', gap: 1 }}>
        <UploadIcon />
        Bulk Upload Invoice Images
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { color: '#fff' } }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderUploadStep()}
            </motion.div>
          )}
          {currentStep === 1 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderReviewStep()}
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderProcessingStep()}
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderResultsStep()}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose}
          startIcon={<CancelIcon />}
          disabled={processing}
        >
          {currentStep === 3 ? 'Close' : 'Cancel'}
        </Button>

        {currentStep === 0 && (
          <Button
            onClick={extractDataFromFiles}
            disabled={selectedFiles.length === 0 || processing}
            variant="contained"
            sx={{
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            Extract Data from {selectedFiles.length} Files
          </Button>
        )}

        {currentStep === 1 && (
          <>
            <Button
              onClick={() => setCurrentStep(0)}
              disabled={processing}
            >
              Back to Upload
            </Button>
            <Button
              onClick={processFiles}
              disabled={!canProceedFromReview || processing || processStarted}
              variant="contained"
              sx={{
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Create {extractedData.filter(item => item.success && item.data.student_name).length} Invoices
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkInvoiceUploadDialog;
