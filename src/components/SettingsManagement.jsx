import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Storage as DatabaseIcon,
  QrCodeScanner as ScannerIcon,
  CloudUpload as UploadIcon,
  Security as ShieldIcon,
  Apps as AppIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  Speed as SpeedIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CloudUpload as ImportIcon,
  RestartAlt as ResetIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Science as TestIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

const SettingsManagement = () => {
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testing, setTesting] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [validationDialog, setValidationDialog] = useState({ open: false, data: null });
  const [resetDialog, setResetDialog] = useState({ open: false, category: null });
  const [importDialog, setImportDialog] = useState({ open: false });
  const [importData, setImportData] = useState('');

  // Categories configuration
  const categories = [
    { id: 'database', name: 'Database', icon: <DatabaseIcon />, color: '#2196F3' },
    { id: 'ocr', name: 'OCR', icon: <ScannerIcon />, color: '#4CAF50' },
    { id: 'file_upload', name: 'File Upload', icon: <UploadIcon />, color: '#FF9800' },
    { id: 'security', name: 'Security', icon: <ShieldIcon />, color: '#F44336' },
    { id: 'application', name: 'Application', icon: <AppIcon />, color: '#9C27B0' },
    { id: 'notifications', name: 'Notifications', icon: <NotificationsIcon />, color: '#00BCD4' },
    { id: 'business', name: 'Business', icon: <BusinessIcon />, color: '#8BC34A' },
    { id: 'performance', name: 'Performance', icon: <SpeedIcon />, color: '#607D8B' },
  ];

  // Load settings on component mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/settings/`);
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      showNotification('Failed to load settings', 'error');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (category, categorySettings) => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/settings/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category,
          settings: categorySettings
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSettings(prev => ({
          ...prev,
          [category]: categorySettings
        }));
        showNotification(`${categories.find(c => c.id === category)?.name || category} settings saved successfully`, 'success');
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (error) {
      showNotification('Failed to save settings', 'error');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const validateSettings = async () => {
    try {
      setValidating(true);
      const response = await fetch(`${API_BASE_URL}/api/settings/validate`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setValidationDialog({ open: true, data: result.data });
      } else {
        throw new Error('Validation failed');
      }
    } catch (error) {
      showNotification('Failed to validate settings', 'error');
    } finally {
      setValidating(false);
    }
  };

  const testConfiguration = async (type) => {
    try {
      setTesting(prev => ({ ...prev, [type]: true }));
      const response = await fetch(`${API_BASE_URL}/api/settings/test/${type}`);
      const result = await response.json();
      
      if (result.success) {
        showNotification(`${type.toUpperCase()} test passed`, 'success');
      } else {
        showNotification(`${type.toUpperCase()} test failed: ${result.message}`, 'error');
      }
    } catch (error) {
      showNotification(`${type.toUpperCase()} test failed`, 'error');
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  const resetCategory = async (category) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/reset/${category}`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setSettings(prev => ({
          ...prev,
          [category]: result.data
        }));
        showNotification(`${categories.find(c => c.id === category)?.name} reset to defaults`, 'success');
      } else {
        throw new Error('Reset failed');
      }
    } catch (error) {
      showNotification('Failed to reset settings', 'error');
    }
    setResetDialog({ open: false, category: null });
  };

  const exportSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/export`);
      const result = await response.json();
      
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showNotification('Settings exported successfully', 'success');
      }
    } catch (error) {
      showNotification('Failed to export settings', 'error');
    }
  };

  const importSettings = async () => {
    try {
      const parsedData = JSON.parse(importData);
      const response = await fetch(`${API_BASE_URL}/api/settings/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: parsedData,
          overwrite_existing: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadAllSettings();
        showNotification('Settings imported successfully', 'success');
        setImportDialog({ open: false });
        setImportData('');
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      showNotification('Failed to import settings', 'error');
    }
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const renderSettingField = (category, key, value, type = 'string') => {
    const fullKey = `${category}.${key}`;
    
    switch (type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => updateSetting(category, key, e.target.checked)}
                color="primary"
              />
            }
            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          />
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={value || ''}
            onChange={(e) => updateSetting(category, key, parseFloat(e.target.value) || 0)}
            variant="outlined"
            size="small"
          />
        );
      
      case 'select':
        const options = getSelectOptions(category, key);
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</InputLabel>
            <Select
              value={value || ''}
              label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              onChange={(e) => updateSetting(category, key, e.target.value)}
            >
              {options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'array':
        return (
          <TextField
            fullWidth
            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => updateSetting(category, key, e.target.value.split(',').map(s => s.trim()))}
            variant="outlined"
            size="small"
            helperText="Comma-separated values"
          />
        );
      
      case 'password':
        return (
          <TextField
            fullWidth
            type="password"
            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={value || ''}
            onChange={(e) => updateSetting(category, key, e.target.value)}
            variant="outlined"
            size="small"
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={value || ''}
            onChange={(e) => updateSetting(category, key, e.target.value)}
            variant="outlined"
            size="small"
            multiline={key.includes('path') || key.includes('directory')}
          />
        );
    }
  };

  const getSelectOptions = (category, key) => {
    // Define select options for specific fields
    const options = {
      'notifications.log_level': [
        { value: 'DEBUG', label: 'Debug' },
        { value: 'INFO', label: 'Info' },
        { value: 'WARNING', label: 'Warning' },
        { value: 'ERROR', label: 'Error' },
        { value: 'CRITICAL', label: 'Critical' }
      ],
      'application.timezone': [
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'Eastern Time' },
        { value: 'America/Chicago', label: 'Central Time' },
        { value: 'America/Denver', label: 'Mountain Time' },
        { value: 'America/Los_Angeles', label: 'Pacific Time' }
      ],
      'business.default_invoice_type': [
        { value: 'lending', label: 'Lending' },
        { value: 'return', label: 'Return' },
        { value: 'damage', label: 'Damage' },
        { value: 'replacement', label: 'Replacement' }
      ]
    };
    
    return options[`${category}.${key}`] || [];
  };

  const getFieldType = (category, key, value) => {
    // Determine field type based on key name and value
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    if (key.includes('password') || key.includes('secret')) return 'password';
    if (['log_level', 'timezone', 'default_invoice_type'].includes(key)) return 'select';
    return 'string';
  };

  const renderCategorySettings = (categoryId) => {
    const categorySettings = settings[categoryId] || {};
    const categoryInfo = categories.find(c => c.id === categoryId);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ color: categoryInfo?.color, mr: 2 }}>
                {categoryInfo?.icon}
              </Box>
              <Typography variant="h5" component="h2" sx={{ flex: 1 }}>
                {categoryInfo?.name || categoryId} Settings
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(categoryId === 'database' || categoryId === 'ocr') && (
                  <Tooltip title={`Test ${categoryInfo?.name} Configuration`}>
                    <IconButton
                      onClick={() => testConfiguration(categoryId)}
                      disabled={testing[categoryId]}
                      color="primary"
                    >
                      {testing[categoryId] ? <LinearProgress size={20} /> : <TestIcon />}
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Reset to Defaults">
                  <IconButton
                    onClick={() => setResetDialog({ open: true, category: categoryId })}
                    color="warning"
                  >
                    <ResetIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => saveSettings(categoryId, categorySettings)}
                  disabled={saving}
                  sx={{ backgroundColor: categoryInfo?.color }}
                >
                  Save
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {Object.entries(categorySettings).map(([key, value]) => (
                <Grid item xs={12} md={6} key={key}>
                  {renderSettingField(categoryId, key, value, getFieldType(categoryId, key, value))}
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1F2937' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 2, color: '#4CAF50' }} />
          System Settings
        </Typography>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={validateSettings}
            disabled={validating}
            color="success"
          >
            {validating ? 'Validating...' : 'Validate Settings'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAllSettings}
            disabled={loading}
            sx={{
              minHeight: '48px',
              height: '48px',
              px: 3,
              py: 1.5,
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '12px',
            }}
          >
            Reload Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportSettings}
          >
            Export Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setImportDialog({ open: true })}
          >
            Import Settings
          </Button>
        </Box>
      </Box>

      {/* Settings Tabs */}
      <Paper sx={{ backgroundColor: '#FFFFFF' }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { color: '#fff' },
            '& .Mui-selected': { color: '#4CAF50' },
          }}
        >
          {categories.map((category, index) => (
            <Tab
              key={category.id}
              icon={category.icon}
              label={category.name}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Settings Content */}
      <Box sx={{ mt: 3 }}>
        <AnimatePresence mode="wait">
          {categories.map((category, index) => (
            currentTab === index && (
              <motion.div key={category.id}>
                {renderCategorySettings(category.id)}
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </Box>

      {/* Validation Dialog */}
      <Dialog
        open={validationDialog.open}
        onClose={() => setValidationDialog({ open: false, data: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Settings Validation Results</DialogTitle>
        <DialogContent>
          {validationDialog.data && (
            <Box>
              {validationDialog.data.is_valid ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  All settings are valid!
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Some settings have validation errors
                </Alert>
              )}

              {Object.entries(validationDialog.data.errors || {}).map(([category, errors]) => (
                <Accordion key={category} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                      <Typography>{category} ({errors.length} errors)</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}

              {Object.entries(validationDialog.data.warnings || {}).map(([category, warnings]) => (
                <Accordion key={category} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography>{category} ({warnings.length} warnings)</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {warnings.map((warning, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={warning} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidationDialog({ open: false, data: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialog.open}
        onClose={() => setResetDialog({ open: false, category: null })}
      >
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset {categories.find(c => c.id === resetDialog.category)?.name} 
            settings to their default values? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog({ open: false, category: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => resetCategory(resetDialog.category)}
            color="warning"
            variant="contained"
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialog.open}
        onClose={() => setImportDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Settings</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Paste your exported settings JSON here:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste JSON settings here..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={importSettings}
            variant="contained"
            disabled={!importData.trim()}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsManagement;
