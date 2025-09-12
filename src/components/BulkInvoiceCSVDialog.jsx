import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  TextField,
  CircularProgress,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000';

const BulkInvoiceCSVDialog = ({ open, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: template, 1: upload, 2: review, 3: results
  const [csvData, setCsvData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const fileInputRef = useRef(null);

  const steps = ['Download Template', 'Upload CSV', 'Review Data', 'Results'];

  // Required fields for invoice creation
  const requiredFields = [
    'student_name',
    'student_id', 
    'student_email',
    'department',
    'invoice_type',
    'due_date',
    'notes'
  ];

  // Sample CSV template data
  const templateData = [
    {
      student_name: 'John Doe',
      student_id: 'STUD001',
      student_email: 'john.doe@student.edu',
      department: 'Computer Science',
      invoice_type: 'lending',
      due_date: '2025-10-01',
      notes: 'Sample invoice for Arduino kit',
      year_of_study: '2'
    },
    {
      student_name: 'Jane Smith',
      student_id: 'STUD002',
      student_email: 'jane.smith@student.edu',
      department: 'Biology',
      invoice_type: 'lending',
      due_date: '2025-10-01',
      notes: 'Sample invoice for lab equipment',
      year_of_study: '3'
    }
  ];

  const downloadTemplate = () => {
    const headers = requiredFields.concat(['year_of_study']);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(field => `"${row[field] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice_bulk_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setValidationErrors(['CSV file must contain at least a header row and one data row']);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          if (Object.values(row).some(val => val.trim())) {
            data.push(row);
          }
        }

        setCsvData(data);
        validateData(data);
        setCurrentStep(2);
      } catch (error) {
        setValidationErrors(['Failed to parse CSV file. Please check the format.']);
      }
    };

    reader.readAsText(file);
  };

  const validateData = (data) => {
    const errors = [];
    
    data.forEach((row, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || !row[field].trim()) {
          errors.push(`Row ${index + 1}: Missing required field '${field}'`);
        }
      });

      // Validate email format
      if (row.student_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.student_email)) {
        errors.push(`Row ${index + 1}: Invalid email format`);
      }

      // Validate date format
      if (row.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.due_date)) {
        errors.push(`Row ${index + 1}: Invalid date format (use YYYY-MM-DD)`);
      }

      // Validate invoice type
      const validTypes = ['lending', 'return', 'damage', 'replacement'];
      if (row.invoice_type && !validTypes.includes(row.invoice_type)) {
        errors.push(`Row ${index + 1}: Invalid invoice type (use: ${validTypes.join(', ')})`);
      }
    });

    setValidationErrors(errors);
  };

  const updateRowData = (rowIndex, field, value) => {
    const updatedData = [...csvData];
    updatedData[rowIndex][field] = value;
    setCsvData(updatedData);
    validateData(updatedData);
  };

  const removeRow = (rowIndex) => {
    const updatedData = csvData.filter((_, index) => index !== rowIndex);
    setCsvData(updatedData);
    validateData(updatedData);
  };

  const addEmptyRow = () => {
    const newRow = {};
    requiredFields.forEach(field => {
      newRow[field] = '';
    });
    newRow.year_of_study = '';
    
    const updatedData = [...csvData, newRow];
    setCsvData(updatedData);
    validateData(updatedData);
  };

  const processInvoices = async () => {
    if (validationErrors.length > 0) return;

    setProcessing(true);
    setCurrentStep(3);
    const processResults = [];

    try {
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        
        try {
          const invoiceData = {
            student_name: row.student_name.trim(),
            student_id: row.student_id.trim(),
            student_email: row.student_email.trim(),
            department: row.department.trim(),
            year_of_study: parseInt(row.year_of_study) || 1,
            invoice_type: row.invoice_type.trim(),
            due_date: row.due_date.trim(),
            issued_by: 'Bulk CSV System',
            notes: row.notes.trim()
          };

          const response = await fetch(`${API_BASE_URL}/api/invoices/create-with-student`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          processResults.push({
            rowIndex: i + 1,
            student_name: row.student_name,
            success: true,
            invoice_number: result.invoice?.invoice_number,
            message: 'Invoice created successfully'
          });

        } catch (error) {
          processResults.push({
            rowIndex: i + 1,
            student_name: row.student_name,
            success: false,
            error: error.message,
            message: `Failed: ${error.message}`
          });
        }
      }

      setResults(processResults);
      
      const successCount = processResults.filter(r => r.success).length;
      if (onSuccess) {
        onSuccess({
          total: processResults.length,
          successful: successCount,
          failed: processResults.length - successCount
        });
      }

    } catch (error) {
      console.error('Bulk processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setCsvData([]);
    setValidationErrors([]);
    setResults([]);
    setProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderTemplateStep = () => (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <DownloadIcon sx={{ fontSize: 64, color: '#3B82F6', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Download CSV Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
        Download the CSV template, fill it with your invoice data, and upload it back. 
        The template includes sample data to guide you.
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Required Fields:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {requiredFields.map(field => (
            <Chip 
              key={field} 
              label={field.replace('_', ' ')} 
              size="small" 
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={downloadTemplate}
        sx={{ mr: 2 }}
      >
        Download Template
      </Button>
      
      <Button
        variant="outlined"
        onClick={() => setCurrentStep(1)}
      >
        Skip to Upload
      </Button>
    </Box>
  );

  const renderUploadStep = () => (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <UploadIcon sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Upload Filled CSV File
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the CSV file with your invoice data
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <Button
        variant="contained"
        startIcon={<UploadIcon />}
        onClick={() => fileInputRef.current?.click()}
        sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
      >
        Choose CSV File
      </Button>

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 3, textAlign: 'left' }}>
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.slice(0, 10).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
            {validationErrors.length > 10 && (
              <li>... and {validationErrors.length - 10} more errors</li>
            )}
          </ul>
        </Alert>
      )}
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Review Invoice Data ({csvData.length} invoices)
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={addEmptyRow}
          size="small"
          variant="outlined"
        >
          Add Row
        </Button>
      </Box>

      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix these issues before proceeding:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.slice(0, 5).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
            {validationErrors.length > 5 && (
              <li>... and {validationErrors.length - 5} more errors</li>
            )}
          </ul>
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell>Student Name*</TableCell>
              <TableCell>Student ID*</TableCell>
              <TableCell>Email*</TableCell>
              <TableCell>Department*</TableCell>
              <TableCell>Type*</TableCell>
              <TableCell>Due Date*</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {csvData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => removeRow(index)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={row.student_name || ''}
                    onChange={(e) => updateRowData(index, 'student_name', e.target.value)}
                    error={!row.student_name?.trim()}
                    sx={{ minWidth: 150 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={row.student_id || ''}
                    onChange={(e) => updateRowData(index, 'student_id', e.target.value)}
                    error={!row.student_id?.trim()}
                    sx={{ minWidth: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={row.student_email || ''}
                    onChange={(e) => updateRowData(index, 'student_email', e.target.value)}
                    error={!row.student_email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.student_email)}
                    sx={{ minWidth: 180 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={row.department || ''}
                    onChange={(e) => updateRowData(index, 'department', e.target.value)}
                    error={!row.department?.trim()}
                    sx={{ minWidth: 150 }}
                  />
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={row.invoice_type || 'lending'}
                      onChange={(e) => updateRowData(index, 'invoice_type', e.target.value)}
                    >
                      <MenuItem value="lending">Lending</MenuItem>
                      <MenuItem value="return">Return</MenuItem>
                      <MenuItem value="damage">Damage</MenuItem>
                      <MenuItem value="replacement">Replacement</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="date"
                    value={row.due_date || ''}
                    onChange={(e) => updateRowData(index, 'due_date', e.target.value)}
                    error={!row.due_date?.trim()}
                    sx={{ minWidth: 140 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={row.notes || ''}
                    onChange={(e) => updateRowData(index, 'notes', e.target.value)}
                    multiline
                    rows={1}
                    sx={{ minWidth: 200 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderResultsStep = () => {
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;

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
            label={`${errorCount} Failed`}
            color="error"
            variant="outlined"
          />
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{result.rowIndex}</TableCell>
                  <TableCell>{result.student_name}</TableCell>
                  <TableCell>
                    {result.success ? (
                      <Chip icon={<CheckIcon />} label="Success" color="success" size="small" />
                    ) : (
                      <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{result.invoice_number || '-'}</TableCell>
                  <TableCell>{result.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UploadIcon />
        Bulk Invoice Creation - CSV Upload
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

        {currentStep === 0 && renderTemplateStep()}
        {currentStep === 1 && renderUploadStep()}
        {currentStep === 2 && renderReviewStep()}
        {currentStep === 3 && renderResultsStep()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          {currentStep === 3 ? 'Close' : 'Cancel'}
        </Button>
        
        {currentStep === 0 && (
          <Button
            variant="contained"
            onClick={() => setCurrentStep(1)}
          >
            Next: Upload CSV
          </Button>
        )}
        
        {currentStep === 1 && (
          <Button
            onClick={() => setCurrentStep(0)}
            disabled={processing}
          >
            Back to Template
          </Button>
        )}
        
        {currentStep === 2 && (
          <>
            <Button
              onClick={() => setCurrentStep(1)}
              disabled={processing}
            >
              Back to Upload
            </Button>
            <Button
              variant="contained"
              onClick={processInvoices}
              disabled={validationErrors.length > 0 || csvData.length === 0 || processing}
              startIcon={processing ? <CircularProgress size={16} /> : <CheckIcon />}
            >
              {processing ? 'Creating...' : `Create ${csvData.length} Invoices`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkInvoiceCSVDialog;
