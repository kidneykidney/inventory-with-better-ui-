import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as GalleryIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RetakeIcon,
  Save as SaveIcon,
  CameraEnhance as CaptureIcon
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8000';

const CameraUploadDialog = ({ 
  open, 
  onClose, 
  invoiceId, 
  onUploadSuccess, 
  initialImageType = 'physical_invoice' 
}) => {
  const [currentStep, setCurrentStep] = useState('capture'); // capture, preview, upload, success
  const [imageData, setImageData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  
  // Form data
  const [uploadData, setUploadData] = useState({
    image_type: initialImageType,
    uploaded_by: 'Current User', // In real app, get from auth context
    upload_method: 'camera',
    notes: '',
    device_info: {}
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Image types with descriptions
  const imageTypes = [
    { value: 'physical_invoice', label: 'Physical Invoice', description: 'Photo of the printed/handwritten invoice' },
    { value: 'signature', label: 'Student Signature', description: 'Photo of student signature on invoice' },
    { value: 'damage_photo', label: 'Damage Photo', description: 'Photo showing equipment damage' },
    { value: 'return_photo', label: 'Return Photo', description: 'Photo of returned equipment' }
  ];

  useEffect(() => {
    if (open && currentStep === 'capture') {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, currentStep, facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError('');
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageData(e.target.result);
          setImageFile(blob);
          stopCamera();
          setCurrentStep('preview');
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG) or PDF');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageData(e.target.result);
        setImageFile(file);
        setUploadData(prev => ({ ...prev, upload_method: 'file_upload' }));
        setCurrentStep('preview');
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setImageData(null);
    setImageFile(null);
    setCurrentStep('capture');
    setError('');
  };

  const uploadImage = async () => {
    if (!imageData || !invoiceId) {
      setError('Missing required data for upload');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // Prepare device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screen: {
          width: screen.width,
          height: screen.height
        },
        timestamp: new Date().toISOString(),
        facingMode: facingMode
      };
      
      const payload = {
        invoice_id: invoiceId,
        image_type: uploadData.image_type,
        image_data: imageData,
        image_filename: imageFile ? imageFile.name : `invoice_${uploadData.image_type}_${Date.now()}.jpg`,
        uploaded_by: uploadData.uploaded_by,
        upload_method: uploadData.upload_method,
        device_info: deviceInfo,
        capture_timestamp: new Date().toISOString(),
        notes: uploadData.notes
      };
      
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess('Image uploaded successfully!');
        setCurrentStep('success');
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCurrentStep('capture');
    setImageData(null);
    setImageFile(null);
    setError('');
    setSuccess('');
    setUploading(false);
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const renderCaptureStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Capture Invoice Image
      </Typography>
      
      {/* Camera View */}
      <Box position="relative" mb={2}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '400px',
            objectFit: 'cover',
            borderRadius: '8px',
            backgroundColor: '#000'
          }}
        />
        
        {/* Camera Controls Overlay */}
        <Box
          position="absolute"
          bottom={16}
          left="50%"
          sx={{ transform: 'translateX(-50%)' }}
        >
          <IconButton
            onClick={capturePhoto}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              width: 60,
              height: 60,
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
            disabled={!cameraStream}
          >
            <CaptureIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>
        
        {/* Switch Camera Button */}
        <IconButton
          onClick={switchCamera}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white'
          }}
        >
          <CameraIcon />
        </IconButton>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Alternative File Upload */}
      <Box textAlign="center">
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Or upload from your device
        </Typography>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <Button
          variant="outlined"
          startIcon={<GalleryIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose File
        </Button>
      </Box>
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );

  const renderPreviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review and Upload
      </Typography>
      
      {/* Image Preview */}
      <Box mb={3} textAlign="center">
        <img
          src={imageData}
          alt="Captured invoice"
          style={{
            maxWidth: '100%',
            maxHeight: '400px',
            borderRadius: '8px',
            border: '2px solid #e0e0e0'
          }}
        />
      </Box>
      
      {/* Upload Form */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            select
            fullWidth
            label="Image Type"
            value={uploadData.image_type}
            onChange={(e) => setUploadData(prev => ({ ...prev, image_type: e.target.value }))}
          >
            {imageTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box>
                  <Typography variant="body2">{type.label}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {type.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={uploadData.notes}
            onChange={(e) => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes about this image..."
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<UploadIcon />}
              label={`Upload Method: ${uploadData.upload_method}`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<CameraIcon />}
              label={`Camera: ${facingMode === 'user' ? 'Front' : 'Back'}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Grid>
      </Grid>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );

  const renderSuccessStep = () => (
    <Box textAlign="center" py={4}>
      <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Upload Successful!
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Your invoice image has been uploaded and saved.
      </Typography>
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );

  const getDialogActions = () => {
    switch (currentStep) {
      case 'capture':
        return (
          <>
            <Button onClick={handleClose}>Cancel</Button>
          </>
        );
      
      case 'preview':
        return (
          <>
            <Button onClick={retakePhoto} startIcon={<RetakeIcon />}>
              Retake
            </Button>
            <Button
              onClick={uploadImage}
              variant="contained"
              startIcon={uploading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </>
        );
      
      case 'success':
        return (
          <>
            <Button onClick={handleClose} variant="contained">
              Done
            </Button>
          </>
        );
      
      default:
        return (
          <>
            <Button onClick={handleClose}>Close</Button>
          </>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Upload Invoice Image
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {currentStep === 'capture' && renderCaptureStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </DialogContent>
      
      <DialogActions>
        {getDialogActions()}
      </DialogActions>
    </Dialog>
  );
};

export default CameraUploadDialog;
