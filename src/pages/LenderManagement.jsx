import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton, Avatar, Alert, Switch, FormControlLabel, Checkbox,
  Tooltip, Divider, Paper
} from '@mui/material';
import {
  PersonOutline, Business, Phone, Email, Add, Edit, Delete, Search,
  Badge, LocationOn, Security, MonetizationOn, Refresh, AdminPanelSettings,
  DeleteSweep, Person as PersonIcon
} from '@mui/icons-material';
import CompactFilters from '../components/CompactFilters';

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
  
  // Courses/Departments state
  const [courses, setCourses] = useState([]);
  
  // Designations state
  const [designations, setDesignations] = useState([]);
  const [isDesignationDialogOpen, setIsDesignationDialogOpen] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState('');
  
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
    is_active: true,
    notes: ''
  });

  // Staff configuration for CompactFilters
  const staffConfig = {
    title: 'Staff Management',
    moduleType: 'staff',
    searchFields: ['name', 'email', 'employee_id', 'department', 'designation'],
    dateField: 'created_at'
  };

  // Bulk staff state
  const [bulkStaff, setBulkStaff] = useState([{
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employee_id: '',
    authority_level: 'standard'
  }]);

  useEffect(() => {
    fetchLenders();
    fetchCourses();
    fetchDesignations();
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

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Don't show error for courses, just continue with empty list
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/designations`);
      if (!response.ok) {
        throw new Error('Failed to fetch designations');
      }
      const data = await response.json();
      setDesignations(data);
    } catch (error) {
      console.error('Error fetching designations:', error);
      // Don't show error for designations, just continue with empty list
    }
  };

  const createCourseIfNeeded = async (courseName) => {
    if (!courseName || !courseName.trim()) return false;
    
    const trimmedName = courseName.trim();
    
    // Check if course already exists
    const existingCourse = courses.find(course => 
      course.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingCourse) {
      return true; // Course already exists
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (response.ok) {
        // Refresh courses list
        await fetchCourses();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating course:', error);
      return false;
    }
  };

  const handleCreateDesignation = async () => {
    if (!newDesignationName.trim()) {
      setError('Please enter a designation name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/designations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newDesignationName.trim() }),
      });

      if (response.ok) {
        setSuccess('Designation created successfully!');
        setNewDesignationName('');
        setIsDesignationDialogOpen(false);
        await fetchDesignations();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create designation');
      }
    } catch (error) {
      setError(error.message || 'Failed to create designation');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteDesignation = async (designationName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/designations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: designationName }),
      });

      if (response.ok) {
        setSuccess('Designation deleted successfully!');
        await fetchDesignations();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete designation');
      }
    } catch (error) {
      setError(error.message || 'Failed to delete designation');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Comprehensive filter change handler for CompactFilters
  const handleFiltersChange = (allFilters) => {
    const { searchQuery, dateFrom, dateTo, status, category, customFilters } = allFilters;
    
    let filtered = [...lenders];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lender => 
        lender.name.toLowerCase().includes(query) ||
        lender.lender_id.toLowerCase().includes(query) ||
        lender.department.toLowerCase().includes(query) ||
        (lender.designation && lender.designation.toLowerCase().includes(query)) ||
        (lender.employee_id && lender.employee_id.toLowerCase().includes(query)) ||
        (lender.email && lender.email.toLowerCase().includes(query))
      );
    }
    
    // Apply date range filter (using created_at)
    if (dateFrom || dateTo) {
      filtered = filtered.filter(lender => {
        const lenderDate = lender.created_at;
        if (!lenderDate) return true;
        
        const date = new Date(lenderDate);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;
        return true;
      });
    }
    
    // Apply status filter (Active/Inactive)
    if (status && status.length > 0) {
      filtered = filtered.filter(lender => {
        const lenderStatus = lender.is_active ? 'Active' : 'Inactive';
        return status.includes(lenderStatus);
      });
    }
    
    // Apply department filter
    if (category && category.length > 0) {
      filtered = filtered.filter(lender => {
        return category.includes(lender.department);
      });
    }

    // Apply custom filters for staff
    if (customFilters) {
      // Designation filter
      if (customFilters.designation && customFilters.designation.length > 0) {
        filtered = filtered.filter(lender => {
          return customFilters.designation.includes(lender.designation);
        });
      }

      // Authority level filter
      if (customFilters.authorityLevel && customFilters.authorityLevel.length > 0) {
        filtered = filtered.filter(lender => {
          return customFilters.authorityLevel.includes(lender.authority_level);
        });
      }

      // Approval permission filter
      if (customFilters.approveLending && customFilters.approveLending.length > 0) {
        filtered = filtered.filter(lender => {
          const permission = lender.can_approve_lending ? 'Can Approve Lending' : 'Cannot Approve Lending';
          return customFilters.approveLending.includes(permission);
        });
      }

      // High value lending permission filter
      if (customFilters.highValueLending && customFilters.highValueLending.length > 0) {
        filtered = filtered.filter(lender => {
          const permission = lender.can_lend_high_value ? 'Can Lend High Value' : 'Cannot Lend High Value';
          return customFilters.highValueLending.includes(permission);
        });
      }

      // Employee ID filter
      if (customFilters.employeeId) {
        filtered = filtered.filter(lender => {
          const employeeId = lender.employee_id || '';
          return employeeId.toLowerCase().includes(customFilters.employeeId.toLowerCase());
        });
      }

      // Office location filter
      if (customFilters.officeLocation && customFilters.officeLocation.length > 0) {
        filtered = filtered.filter(lender => {
          return customFilters.officeLocation.includes(lender.office_location);
        });
      }
    }
    
    setFilteredLenders(filtered);
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
      
      setSuccess(`Successfully deactivated ${selectedLenders.length} staff member(s)`);
      setSelectedLenders([]);
      setSelectAll(false);
      setIsBulkDeleteDialogOpen(false);
      fetchLenders();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error deactivating lenders:', error);
      setError('Failed to deactivate selected staff. Please try again.');
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
      employee_id: '',
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
        staff.name.trim() && staff.department.trim() && staff.employee_id.trim() && staff.email.trim()
      );

      if (validStaff.length === 0) {
        setError('Please fill in at least one staff member with name, staff ID, email, and department');
        setTimeout(() => setError(''), 5000);
        return;
      }

      // Create new courses/departments if needed
      const uniqueDepartments = [...new Set(validStaff.map(staff => staff.department.trim()))];
      for (const dept of uniqueDepartments) {
        await createCourseIfNeeded(dept);
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
        employee_id: '',
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
      // Create course if needed before updating staff
      await createCourseIfNeeded(formData.department);

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

  const handleToggleStatus = async (lender) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lenders/${lender.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...lender,
          is_active: !lender.is_active
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update status');
      }

      setSuccess(`Staff member ${!lender.is_active ? 'activated' : 'deactivated'} successfully!`);
      fetchLenders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling status:', error);
      setError(error.message || 'Failed to update status. Please try again.');
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
      is_active: true,
      notes: ''
    });
    setBulkStaff([{
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      employee_id: '',
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
      is_active: lender.is_active,
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
    <Paper sx={{ 
      overflow: 'visible',
      position: 'relative',
      m: 0.5,
      boxSizing: 'border-box',
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #E5E7EB'
    }}>
      <Box sx={{ 
        p: 1.5,
        overflow: 'visible',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 1,
          pr: 0,
          pb: 0.5,
          pt: 0.25,
          overflow: 'visible',
          position: 'relative',
          minHeight: '32px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            flex: '1 1 auto',
            minWidth: 0,
            maxWidth: selectedLenders.length > 0 ? 'calc(100% - 350px)' : 'calc(100% - 240px)'
          }}>
            <PersonIcon sx={{ fontSize: '1.5rem', color: '#374151' }} />
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: '#374151',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Staff Management
            </Typography>
          </Box>
          
          <Box sx={{ 
            width: selectedLenders.length > 0 ? '350px' : '240px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,
            overflow: 'visible',
            position: 'relative',
            zIndex: 1000,
            flexShrink: 0,
            ml: 2
          }}>
            {/* Bulk Delete Button */}
            {selectedLenders.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DeleteSweep fontSize="small" />}
                onClick={openBulkDeleteDialog}
                sx={{
                  minHeight: '32px',
                  height: '32px',
                  minWidth: '140px',
                  px: 3,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  letterSpacing: '0.025em',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255, 82, 82, 0.3)',
                  color: '#FF5252',
                  '&:hover': {
                    border: '1px solid rgba(255, 82, 82, 0.6)',
                    backgroundColor: 'rgba(255, 82, 82, 0.08)'
                  }
                }}
              >
                Deactivate ({selectedLenders.length})
              </Button>
            )}
            
            {/* Manage Designations Button */}
            <Button
              variant="outlined"
              startIcon={<Badge fontSize="small" />}
              onClick={() => setIsDesignationDialogOpen(true)}
              sx={{
                minHeight: '32px',
                height: '32px',
                minWidth: '100px',
                px: 2,
                py: 0.75,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.025em',
                borderRadius: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(25, 118, 210, 0.3)',
                color: '#1976d2',
                '&:hover': {
                  border: '1px solid rgba(25, 118, 210, 0.6)',
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                }
              }}
            >
              Designations
            </Button>
            
            {/* Add Staff Button */}
            <Button
              variant="contained"
              startIcon={<Add fontSize="small" />}
              onClick={() => setIsAddDialogOpen(true)}
              sx={{
                minHeight: '32px',
                height: '32px',
                minWidth: '100px',
                px: 3,
                py: 0.75,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.025em',
                borderRadius: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                backgroundColor: '#1976d2',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
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

      {/* Compact Search and Filters */}
      <CompactFilters
        config={staffConfig}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFiltersChange={handleFiltersChange}
        data={lenders}
      />

      {/* Compact Staff Table */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.1 } }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ py: 0.25, px: 0.25 }}>
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAll}
                      indeterminate={selectedLenders.length > 0 && selectedLenders.length < filteredLenders.length}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.25, px: 0.5, fontSize: '0.7rem', fontWeight: 700 }}><strong>Staff Info</strong></TableCell>
                  <TableCell sx={{ py: 0.25, px: 0.5, fontSize: '0.7rem', fontWeight: 700 }}><strong>Contact</strong></TableCell>
                  <TableCell sx={{ py: 0.25, px: 0.5, fontSize: '0.7rem', fontWeight: 700 }}><strong>Department</strong></TableCell>
                  <TableCell sx={{ py: 0.25, px: 0.5, fontSize: '0.7rem', fontWeight: 700 }}><strong>Status</strong></TableCell>
                  <TableCell sx={{ py: 0.25, px: 0.25, fontSize: '0.7rem', fontWeight: 700 }}><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading staff...</TableCell>
                  </TableRow>
                ) : filteredLenders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {searchQuery ? 'No staff found matching your search.' : 'No staff found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLenders.map((lender) => (
                    <TableRow key={lender.id} hover selected={selectedLenders.includes(lender.id)}>
                      <TableCell padding="checkbox" sx={{ py: 0.1, px: 0.25 }}>
                        <Checkbox
                          checked={selectedLenders.includes(lender.id)}
                          onChange={() => handleSelectLender(lender.id)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell sx={{ py: 0.1, px: 0.5 }}>  {/* Compact padding */}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>  {/* Smaller, tighter text */}
                            {lender.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>  {/* Smaller ID text */}
                            ID: {lender.lender_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ py: 0.1, px: 0.5 }}>  {/* Compact padding */}
                        <Box>
                          {lender.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>  {/* Smaller text */}
                              {lender.email}
                            </Typography>
                          )}
                          {lender.phone && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>  {/* Smaller text */}
                              {lender.phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ py: 0.1, px: 0.5 }}>  {/* Compact padding */}
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>  {/* Smaller text */}
                          {lender.department}
                        </Typography>
                        {lender.designation && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>  {/* Smaller text */}
                            {lender.designation}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell sx={{ py: 0.1, px: 0.5 }}>
                        <Chip
                          label={lender.is_active ? 'Active' : 'Inactive'}
                          color={lender.is_active ? 'success' : 'default'}
                          size="small"
                          onClick={() => handleToggleStatus(lender)}
                          sx={{ 
                            fontSize: '0.65rem',
                            height: 18,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'scale(1.05)',
                            },
                            transition: 'all 0.2s ease'
                          }}
                        />
                      </TableCell>
                      
                      <TableCell sx={{ py: 0.1, px: 0.25 }}>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditDialog(lender)} sx={{ p: 0.25 }}>
                              <Edit sx={{ fontSize: '0.875rem', color: 'action.active' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deactivate">
                            <IconButton 
                              size="small" 
                              onClick={() => openDeleteDialog(lender)}
                              sx={{ 
                                p: 0.25,
                                color: '#d32f2f',
                                '&:hover': { 
                                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                  color: '#b71c1c'
                                } 
                              }}
                            >
                              <Delete sx={{ fontSize: '0.875rem' }} />
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
            <Box sx={{ display: 'grid', gridTemplateColumns: '150px 200px 200px 150px 200px 150px 80px', gap: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, fontWeight: 'bold' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>STAFF ID*</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>FULL NAME*</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>EMAIL*</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>PHONE NUMBER</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>DEPARTMENT*</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>DESIGNATION</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ACTIONS</Typography>
            </Box>

            {/* Staff Input Rows */}
            {bulkStaff.map((staff, index) => (
              <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '150px 200px 200px 150px 200px 150px 80px', gap: 2, p: 1, borderBottom: '1px solid #e0e0e0' }}>
                <TextField
                  size="small"
                  placeholder="Enter staff ID"
                  value={staff.employee_id || ''}
                  onChange={(e) => updateBulkStaff(index, 'employee_id', e.target.value)}
                  error={!staff.employee_id.trim()}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { 
                      backgroundColor: staff.employee_id.trim() ? '#fff' : '#fff3cd',
                      minHeight: '32px',
                      height: '32px'
                    }
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
                    '& .MuiOutlinedInput-root': { 
                      backgroundColor: staff.name.trim() ? '#fff' : '#fff3cd',
                      minHeight: '32px',
                      height: '32px'
                    }
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Enter email"
                  type="email"
                  value={staff.email}
                  onChange={(e) => updateBulkStaff(index, 'email', e.target.value)}
                  error={!staff.email.trim()}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { 
                      backgroundColor: staff.email.trim() ? '#fff' : '#fff3cd',
                      minHeight: '32px',
                      height: '32px'
                    }
                  }}
                />
                <TextField
                  size="small"
                  placeholder="Enter phone number"
                  value={staff.phone}
                  onChange={(e) => updateBulkStaff(index, 'phone', e.target.value)}
                  sx={{ 
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    '& .MuiOutlinedInput-root': { 
                      backgroundColor: '#fff',
                      minHeight: '32px',
                      height: '32px'
                    }
                  }}
                />
                <FormControl size="small" fullWidth error={!staff.department.trim()}>
                  <Select
                    value={staff.department}
                    onChange={(e) => updateBulkStaff(index, 'department', e.target.value)}
                    displayEmpty
                    sx={{ 
                      fontSize: '0.875rem',
                      backgroundColor: staff.department.trim() ? '#fff' : '#fff3cd',
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '8.5px 14px',
                        fontFamily: 'inherit',
                        fontWeight: 'normal'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.23)'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          '& .MuiMenuItem-root': {
                            fontSize: '0.875rem'
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="" disabled sx={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'text.secondary' }}>
                      Select department
                    </MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.name} sx={{ fontSize: '0.875rem' }}>
                        {course.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <Select
                    value={staff.designation}
                    onChange={(e) => updateBulkStaff(index, 'designation', e.target.value)}
                    displayEmpty
                    sx={{ 
                      fontSize: '0.875rem',
                      backgroundColor: '#fff',
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '8.5px 14px',
                        fontFamily: 'inherit',
                        fontWeight: 'normal'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.23)'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          '& .MuiMenuItem-root': {
                            fontSize: '0.875rem'
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'text.secondary' }}>
                      Select designation
                    </MenuItem>
                    {designations.map((designation) => (
                      <MenuItem key={designation.id} value={designation.name} sx={{ fontSize: '0.875rem' }}>
                        {designation.name}
                      </MenuItem>
                    ))}
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
              label={
                <>
                  Full Name
                  <span style={{ color: '#EF4444' }}> *</span>
                </>
              }
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: '32px',
                  height: '32px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: '32px',
                  height: '32px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: '32px',
                  height: '32px'
                }
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Department *</InputLabel>
              <Select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                label={
                <>
                  Department
                  <span style={{ color: '#EF4444' }}> *</span>
                </>
              }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: '32px',
                    height: '32px'
                  },
                  '& .MuiSelect-select': {
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    fontWeight: 'normal'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        fontSize: '0.875rem'
                      }
                    }
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'text.secondary' }}>
                  Select department
                </MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.name} sx={{ fontSize: '0.875rem' }}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Designation</InputLabel>
              <Select
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                label="Designation"
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    fontWeight: 'normal'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        fontSize: '0.875rem'
                      }
                    }
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'text.secondary' }}>
                  Select designation
                </MenuItem>
                {designations.map((designation) => (
                  <MenuItem key={designation.id} value={designation.name} sx={{ fontSize: '0.875rem' }}>
                    {designation.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  color="primary"
                />
              }
              label="Active Status"
              sx={{ mt: 1 }}
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
        <DialogTitle>Deactivate Selected Staff</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate {selectedLenders.length} selected staff member(s)? They will be marked as inactive but can be reactivated later.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Selected staff will be deactivated and hidden from active lists, but can be reactivated anytime.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkDelete} variant="contained" color="error" disabled={loading}>
            {loading ? 'Deactivating...' : `Deactivate ${selectedLenders.length} Staff`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Designations Management Dialog */}
      <Dialog open={isDesignationDialogOpen} onClose={() => setIsDesignationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge />
            Manage Designations
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Add New Designation */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add New Designation</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Designation Name"
                value={newDesignationName}
                onChange={(e) => setNewDesignationName(e.target.value)}
                placeholder="e.g., Senior Professor"
              />
              <Button
                variant="contained"
                onClick={handleCreateDesignation}
                disabled={!newDesignationName.trim()}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                Add
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Existing Designations */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Available Designations ({designations.length})
          </Typography>
          
          {designations.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No designations available
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {designations.map((designation) => (
                <Box
                  key={designation.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant="body2">
                    {designation.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteDesignation(designation.name)}
                    sx={{ 
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.lighter'
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDesignationDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Paper>
  );
};

export default LenderManagement;