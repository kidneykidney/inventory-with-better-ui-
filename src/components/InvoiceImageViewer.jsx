import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Paper,
  Avatar,
  Stack
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  CloudUpload as UploadIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Image as ImageIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Description as DescriptionIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000';

const InvoiceImageViewer = ({ open, onClose, invoiceId, invoiceNumber }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceImages();
    }
  }, [open, invoiceId]);

  const fetchInvoiceImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/images`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images || []);
        if (data.images && data.images.length === 0) {
          setError("No images found for this invoice");
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error fetching invoice images:', err);
      setError(`Failed to load images: ${err.message}`);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'processing':
        return <PendingIcon sx={{ color: 'warning.main' }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setFullscreenOpen(true);
  };

  const handleDownloadImage = async (image) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/images/${image.id}`);
      if (!response.ok) throw new Error('Failed to download image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = image.image_filename || `invoice_${invoiceNumber}_image.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          elevation: 8,
          sx: {
            minHeight: '70vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              Invoice Images - {invoiceNumber}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : images.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ImageIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No Images Found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This invoice doesn't have any stored images yet.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {images.map((image, index) => (
                <Grid item xs={12} md={6} lg={4} key={image.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      {/* Image Preview */}
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={`${API_BASE_URL}/api/invoices/images/${image.id}`}
                          alt={image.image_filename || 'Invoice Image'}
                          onClick={() => handleImageClick(image)}
                          sx={{
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                        />
                        <Box sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 1
                        }}>
                          <Tooltip title="Download Image">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage(image);
                              }}
                              sx={{
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.8)'
                                }
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Fullscreen">
                            <IconButton
                              size="small"
                              onClick={() => handleImageClick(image)}
                              sx={{
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.8)'
                                }
                              }}
                            >
                              <FullscreenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          right: 8,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Chip
                            label={image.image_type || 'unknown'}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white'
                            }}
                          />
                          <Chip
                            icon={getStatusIcon(image.processing_status)}
                            label={image.processing_status || 'pending'}
                            size="small"
                            color={getStatusColor(image.processing_status)}
                            sx={{
                              backgroundColor: 'rgba(255,255,255,0.9)'
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Image Details */}
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {image.image_filename || 'Unnamed Image'}
                        </Typography>
                        
                        <List dense sx={{ p: 0 }}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <PersonIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Uploaded by"
                              secondary={image.uploaded_by || 'Unknown'}
                            />
                          </ListItem>
                          
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <ScheduleIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Upload Time"
                              secondary={formatDate(image.created_at)}
                            />
                          </ListItem>
                          
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <StorageIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="File Size"
                              secondary={`${formatFileSize(image.image_size)} • ${image.image_format || 'Unknown format'}`}
                            />
                          </ListItem>
                          
                          {image.upload_method && (
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <UploadIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Upload Method"
                                secondary={image.upload_method}
                              />
                            </ListItem>
                          )}
                          
                          {image.device_info && (
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <ComputerIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Device Info"
                                secondary={typeof image.device_info === 'object' 
                                  ? JSON.stringify(image.device_info)
                                  : image.device_info}
                              />
                            </ListItem>
                          )}
                          
                          {image.ocr_text && (
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <DescriptionIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="OCR Extracted Text"
                                secondary={
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      maxHeight: 60, 
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical'
                                    }}
                                  >
                                    {image.ocr_text}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          )}
                        </List>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
          {images.length > 0 && (
            <Button 
              onClick={fetchInvoiceImages}
              variant="contained"
              startIcon={<InfoIcon />}
            >
              Refresh Images
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Fullscreen Image Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          elevation: 8,
          sx: {
            backgroundColor: 'rgba(0,0,0,0.9)',
            maxHeight: '95vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {selectedImage && (
            <Box sx={{ position: 'relative', maxWidth: '100%', maxHeight: '90vh' }}>
              <img
                src={`${API_BASE_URL}/api/invoices/images/${selectedImage.id}`}
                alt={selectedImage.image_filename}
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain'
                }}
              />
              <IconButton
                onClick={() => setFullscreenOpen(false)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.9)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceImageViewer;