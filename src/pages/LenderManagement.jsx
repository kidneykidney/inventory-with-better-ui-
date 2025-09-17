import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton, Avatar, Alert, Switch, FormControlLabel, Checkbox,
  Tooltip
} from '@mui/material';
import {
  PersonOutline, Business, Phone, Email, Add, Edit, Delete, Search,
  Badge, LocationOn, Security, MonetizationOn, Refresh, AdminPanelSettings,
  DeleteSweep
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LenderManagement = () => {
  const [lenders, setLenders] = useState([]);
  const [filteredLenders, setFilteredLenders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLender, setSelectedLender] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Bulk selection state
  const [selectedLenders, setSelectedLenders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Form state for adding/editing lenders
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employee_id: '',
    office_location: '',
    authority_level: 'standard',
    can_approve_lending: true,
    can_lend_high_value: false,
    notes: ''
  });

  // Bulk staff state
  const [bulkStaff, setBulkStaff] = useState([{
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employee_id: `STF${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    authority_level: 'standard'
  }]);

  useEffect(() => {
    fetchLenders();
  }, []);

  useEffect(() => {
    filterLenders();
  }, [lenders, searchQuery]);

  // Helper function to generate staff ID
  const generateStaffId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `STF${year}${randomNum}`;
  };

  const fetchLenders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/lenders`);
      if (!response.ok) {
        throw new Error('Failed to fetch lenders');
      }
      const data = await response.json();
      setLenders(data);
      setError('');
    } catch (error) {
      console.error('Error fetching lenders:', error);
      setError('Failed to load staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterLenders = () => {
    if (!searchQuery.trim()) {
      setFilteredLenders(lenders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = lenders.filter(lender => 
      lender.name.toLowerCase().includes(query) ||
      lender.lender_id.toLowerCase().includes(query) ||
      lender.department.toLowerCase().includes(query) ||
      (lender.designation && lender.designation.toLowerCase().includes(query)) ||
      (lender.employee_id && lender.employee_id.toLowerCase().includes(query)) ||
      (lender.email && lender.email.toLowerCase().includes(query))
    );
    setFilteredLenders(filtered);
  };

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLenders([]);
      setSelectAll(false);
    } else {
      setSelectedLenders(filteredLenders.map(lender => lender.id));
      setSelectAll(true);
    }
  };

  const handleSelectLender = (lenderId) => {
    const newSelected = [...selectedLenders];
    const index = newSelected.indexOf(lenderId);
    
    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(lenderId);
    }
    
    setSelectedLenders(newSelected);
    setSelectAll(newSelected.length === filteredLenders.length);
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/lenders/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedLenders),
      });

      if (!response.ok) {
        throw new Error('Failed to delete selected lenders');
      }
      
      setSuccess(`Successfully deleted ${selectedLenders.length} staff member(s)`);
      setSelectedLenders([]);
      setSelectAll(false);
      setIsBulkDeleteDialogOpen(false);
      fetchLenders();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error deleting lenders:', error);
      setError('Failed to delete selected staff. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const openBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const addBulkStaff = () => {
    setBulkStaff([...bulkStaff, {
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      employee_id: generateStaffId(),
      authority_level: 'standard'
    }]);
  };

  const removeBulkStaff = (index) => {
    if (bulkStaff.length > 1) {
      setBulkStaff(bulkStaff.filter((_, i) => i !== index));
    }
  };

  const updateBulkStaff = (index, field, value) => {
    const updated = bulkStaff.map((staff, i) => 
      i === index ? { ...staff, [field]: value } : staff
    );
    setBulkStaff(updated);
  };

  const handleBulkAddStaff = async () => {
    try {
      setLoading(true);
      
      // Filter out empty staff entries
      const validStaff = bulkStaff.filter(staff => 
        staff.name.trim() && staff.department.trim()
      );

      if (validStaff.length === 0) {
        setError('Please fill in at least one staff member with name and department');
        setTimeout(() => setError(''), 5000);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/lenders/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validStaff),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to create staff members');
      }

      setSuccess(`Successfully created ${result.successful} staff member(s)!${result.failed > 0 ? ` ${result.failed} failed.` : ''}`);
      setIsAddDialogOpen(false);
      setBulkStaff([{
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        employee_id: generateStaffId(),
        authority_level: 'standard'
      }]);
      fetchLenders();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error creating staff bulk:', error);
      setError(error.message || 'Failed to create staff members. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLender = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lenders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create lender');
      }

      setSuccess('Staff member added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchLenders();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error adding lender:', error);
      setError(error.message || 'Failed to add staff member. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEditLender = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lenders/${selectedLender.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update lender');
      }

      setSuccess('Staff member updated successfully!');
      setIsEditDialogOpen(false);
      resetForm();
      fetchLenders();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error updating lender:', error);
      setError(error.message || 'Failed to update staff member. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteLender = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lenders/${selectedLender.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lender');
      }

      setSuccess('Staff member deactivated successfully!');
      setIsDeleteDialogOpen(false);
      fetchLenders();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error deleting lender:', error);
      setError('Failed to deactivate staff member. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      employee_id: '',
      office_location: '',
      authority_level: 'standard',
      can_approve_lending: true,
      can_lend_high_value: false,
      notes: ''
    });
    setBulkStaff([{
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      employee_id: generateStaffId(),
      authority_level: 'standard'
    }]);
  };

  const openEditDialog = (lender) => {
    setSelectedLender(lender);
    setFormData({
      name: lender.name,
      email: lender.email || '',
      phone: lender.phone || '',
      department: lender.department,
      designation: lender.designation || '',
      employee_id: lender.employee_id || '',
      office_location: lender.office_location || '',
      authority_level: lender.authority_level,
      can_approve_lending: lender.can_approve_lending,
      can_lend_high_value: lender.can_lend_high_value,
      max_lending_value: lender.max_lending_value,
      notes: lender.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (lender) => {
    setSelectedLender(lender);
    setIsDeleteDialogOpen(true);
  };

  const getAuthorityColor = (level) => {
    switch (level) {
      case 'admin': return 'error';
      case 'senior': return 'warning';
      case 'standard': return 'primary';
      default: return 'default';
    }
  };

  const getAuthorityIcon = (level) => {
    switch (level) {
      case 'admin': return <AdminPanelSettings />;
      case 'senior': return <Security />;
      case 'standard': return <PersonOutline />;
      default: return <PersonOutline />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Compact Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
          Staff Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {selectedLenders.length > 0 && (
            <Tooltip title="Delete Selected">
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteSweep />}
                onClick={openBulkDeleteDialog}
                sx={{ borderRadius: 2 }}
              >
                Delete ({selectedLenders.length})
              </Button>
            </Tooltip>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddDialogOpen(true)}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Add Staff
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Compact Search and Stats */}
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder="Search staff by name, ID, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
              }}
            />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Staff: <strong>{lenders.length}</strong> | Active: <strong>{lenders.filter(l => l.is_active).length}</strong>
              </Typography>
              <IconButton size="small" onClick={fetchLenders} title="Refresh">
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Compact Staff Table */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAll}
                      indeterminate={selectedLenders.length > 0 && selectedLenders.length < filteredLenders.length}
                      size="small"
                    />
                  </TableCell>
                  <TableCell><strong>Staff Info</strong></TableCell>
                  <TableCell><strong>Contact</strong></TableCell>
                  <TableCell><strong>Department</strong></TableCell>
                  <TableCell><strong>Authority</strong></TableCell>
                  <TableCell><strong>Limit</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Loading staff...</TableCell>
                  </TableRow>
                ) : filteredLenders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {searchQuery ? 'No staff found matching your search.' : 'No staff found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLenders.map((lender) => (
                    <TableRow key={lender.id} hover selected={selectedLenders.includes(lender.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedLenders.includes(lender.id)}
                          onChange={() => handleSelectLender(lender.id)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                            {lender.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {lender.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {lender.lender_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          {lender.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {lender.email}
                            </Typography>
                          )}
                          {lender.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {lender.phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {lender.department}
                        </Typography>
                        {lender.designation && (
                          <Typography variant="caption" color="text.secondary">
                            {lender.designation}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={lender.authority_level.toUpperCase()}
                          color={getAuthorityColor(lender.authority_level)}
                          size="small"
                          sx={{ fontSize: '0.75rem', height: 20 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {formatCurrency(lender.max_lending_value)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={lender.is_active ? 'Active' : 'Inactive'}
                          color={lender.is_active ? 'success' : 'default'}
                          size="small"
                          sx={{ fontSize: '0.75rem', height: 20 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditDialog(lender)}>
                              <Edit sx={{ fontSize: '1rem', color: 'action.active' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => openDeleteDialog(lender)}
                              sx={{ 
                                color: '#d32f2f',
                                '&:hover': { 
                                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                  color: '#b71c1c'
                                } 
                              }}
                            >
                              <Delete sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => {setIsAddDialogOpen(false); resetForm();}} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '1400px',
            width: '95vw',
            maxWidth: '95vw'
          }
        }}
      >
        <DialogTitle>
          Bulk Add Staff
        </DialogTitle>
        <DialogContent>
          {/* Staff Table Headers */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '150px 200px 200px 150px 200px 150px 150px 80px', gap: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, fontWeight: 'bold' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>STAFF ID (Auto)</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>FULL NAME*</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>EMAIL</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>PHONE NUMBER</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>DEPARTMENT*</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>DESIGNATION</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>AUTHORITY LEVEL</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ACTIONS</Typography>
            </Box>

            {/* Staff Input Rows */}
            {bulkStaff.map((staff, index) => (
              <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '150px 200px 200px 150px 200px 150px 150px 80px', gap: 2, p: 1, borderBottom: '1px solid #e0e0e0' }}>
                <TextField
                  size="small"
                  value={staff.employee_id || ''}
                  disabled
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { backgroundColor: '#f5f5f5' }
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Enter full name"
                  value={staff.name}
                  onChange={(e) => updateBulkStaff(index, 'name', e.target.value)}
                  error={!staff.name.trim()}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { backgroundColor: staff.name.trim() ? '#fff' : '#fff3cd' }
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Enter email"
                  type="email"
                  value={staff.email}
                  onChange={(e) => updateBulkStaff(index, 'email', e.target.value)}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { backgroundColor: '#fff' }
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Enter phone number"
                  value={staff.phone}
                  onChange={(e) => updateBulkStaff(index, 'phone', e.target.value)}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { backgroundColor: '#fff' }
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Enter department"
                  value={staff.department}
                  onChange={(e) => updateBulkStaff(index, 'department', e.target.value)}
                  error={!staff.department.trim()}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { backgroundColor: staff.department.trim() ? '#fff' : '#fff3cd' }
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Enter designation"
                  value={staff.designation}
                  onChange={(e) => updateBulkStaff(index, 'designation', e.target.value)}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { backgroundColor: '#fff' }
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={staff.authority_level}
                    onChange={(e) => updateBulkStaff(index, 'authority_level', e.target.value)}
                    displayEmpty
                    sx={{ 
                      '& .MuiSelect-select': { fontSize: '0.875rem' },
                      backgroundColor: '#fff'
                    }}
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="senior">Senior</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  size="small"
                  onClick={() => removeBulkStaff(index)}
                  disabled={bulkStaff.length === 1}
                  sx={{ color: 'error.main' }}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}

            {/* Add More Staff Button */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                startIcon={<Add />}
                onClick={addBulkStaff}
                variant="outlined"
                size="small"
                sx={{ 
                  color: '#3B82F6', 
                  borderColor: '#3B82F6',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.04)',
                    borderColor: '#2563EB'
                  }
                }}
              >
                Add More Staff
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setIsAddDialogOpen(false); resetForm();}}>Cancel</Button>
          <Button 
            onClick={handleBulkAddStaff} 
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#3B82F6',
              '&:hover': { backgroundColor: '#2563EB' }
            }}
          >
            {loading ? 'Creating...' : `Create ${bulkStaff.filter(s => s.name.trim() && s.department.trim()).length} Staff`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => {setIsEditDialogOpen(false); resetForm();}} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              size="small"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              size="small"
            />
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              size="small"
            />
            <TextField
              fullWidth
              label="Department *"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              size="small"
            />
            <TextField
              fullWidth
              label="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({...formData, designation: e.target.value})}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Authority Level</InputLabel>
              <Select
                value={formData.authority_level}
                onChange={(e) => setFormData({...formData, authority_level: e.target.value})}
                label="Authority Level"
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="senior">Senior</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Max Lending Value"
              type="number"
              value={formData.max_lending_value}
              onChange={(e) => setFormData({...formData, max_lending_value: parseFloat(e.target.value)})}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setIsEditDialogOpen(false); resetForm();}}>Cancel</Button>
          <Button onClick={handleEditLender} variant="contained">Update Staff</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate this staff member? This will mark them as inactive.
          </Typography>
          {selectedLender && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2"><strong>Name:</strong> {selectedLender.name}</Typography>
              <Typography variant="body2"><strong>ID:</strong> {selectedLender.lender_id}</Typography>
              <Typography variant="body2"><strong>Department:</strong> {selectedLender.department}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteLender}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onClose={() => setIsBulkDeleteDialogOpen(false)}>
        <DialogTitle>Delete Selected Staff</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedLenders.length} selected staff member(s)? This action cannot be undone.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Selected staff will be permanently removed from the system.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkDelete} variant="contained" color="error" disabled={loading}>
            {loading ? 'Deleting...' : `Delete ${selectedLenders.length} Staff`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LenderManagement;