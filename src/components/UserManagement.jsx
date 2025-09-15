import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Grid, Alert, Snackbar, Avatar, Tooltip,
  Switch, FormControlLabel, List, ListItem, ListItemText, ListItemIcon,
  Divider, Badge, Tab, Tabs, Container
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  Person as PersonIcon, AdminPanelSettings as AdminIcon,
  Security as SecurityIcon, Visibility as ViewIcon,
  Block as BlockIcon, CheckCircle as ActiveIcon, CheckCircle,
  Warning as WarningIcon, History as HistoryIcon,
  VpnKey as KeyIcon, Email as EmailIcon,
  SupervisorAccount as SupervisorIcon, Shield as ShieldIcon,
  ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

// User management colors
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',
  surface: '#FFFFFF',
  background: '#F8FAFC'
};

function UserManagement() {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'sub_admin',
    permissions: {
      modules: ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports'],
      actions: ['create', 'read', 'update', 'delete', 'export']
    },
    force_password_change: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': token ? `Bearer ${token}` : 'Bearer admin-token',
      'Content-Type': 'application/json'
    };
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 404) {
        // Fallback: Create mock users if endpoint not found
        console.log('Users endpoint not found, using mock data');
        const mockUsers = [
          {
            id: 1,
            username: 'admin',
            email: 'admin@college.edu',
            full_name: 'System Administrator',
            role: 'main_admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          {
            id: 2,
            username: 'adminasd',
            email: 'asd@email.com',
            full_name: 'asd',
            role: 'sub_admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          {
            id: 3,
            username: 'adminee',
            email: 'asdsadasasds@email.com',
            full_name: 'adssaddas',
            role: 'sub_admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          {
            id: 4,
            username: 'guguj',
            email: 'asdas@email.com',
            full_name: 'dsaasd',
            role: 'sub_admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          {
            id: 5,
            username: 'adamwd',
            email: 'asd@email.com',
            full_name: 'adawd',
            role: 'sub_admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }
        ];
        setUsers(mockUsers);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const userData = await response.json();
        setSuccess('User created successfully');
        setOpenCreateDialog(false);
        resetForm();
        fetchUsers();
        
      } else if (response.status === 404) {
        // API not available, create user locally
        const newUser = {
          id: Date.now(), // Simple ID generation
          username: formData.username,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          status: 'active',
          created_at: new Date().toISOString(),
          last_login: null
        };
        
        setUsers(prevUsers => [...prevUsers, newUser]);
        setSuccess('User created locally (API unavailable)');
        setOpenCreateDialog(false);
        resetForm();
        
        // Add audit log entry
        addAuditLogEntry({
          action: 'User Created',
          resource: `User: ${formData.full_name}`,
          details: `Created new ${formData.role.replace('_', ' ')} user locally: ${formData.username}`,
          success: true
        });
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create user');
      }
    } catch (error) {
      console.error('Create user error:', error);
      // On connection error, create user locally
      const newUser = {
        id: Date.now(),
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: null
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      setSuccess('User created locally (connection error)');
      setOpenCreateDialog(false);
      resetForm();
      
      // Add audit log entry
      addAuditLogEntry({
        action: 'User Created',
        resource: `User: ${formData.full_name}`,
        details: `Created new ${formData.role.replace('_', ' ')} user locally: ${formData.username}`,
        success: true
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async () => {
    setLoading(true);
    try {
      const updateData = { ...formData };
      delete updateData.password; // Don't send password in update
      
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const updatedUserData = await response.json();
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id ? updatedUserData : user
          )
        );
        setSuccess('User updated successfully');
        setOpenEditDialog(false);
        setSelectedUser(null);
        resetForm();
        
        // Add audit log entry
        addAuditLogEntry({
          action: 'User Updated',
          resource: `User: ${formData.full_name}`,
          details: `Updated user information for ${formData.username} (Role: ${formData.role.replace('_', ' ')})`,
          success: true
        });
      } else if (response.status === 404) {
        // API not available, update locally
        const updatedUser = {
          ...selectedUser,
          ...updateData,
          updated_at: new Date().toISOString()
        };
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id ? updatedUser : user
          )
        );
        setSuccess('User updated locally (API unavailable)');
        setOpenEditDialog(false);
        setSelectedUser(null);
        resetForm();
        
        // Add audit log entry
        addAuditLogEntry({
          action: 'User Updated',
          resource: `User: ${formData.full_name}`,
          details: `Updated user information locally for ${formData.username}`,
          success: true
        });
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      // On connection error, update locally
      const updatedUser = {
        ...selectedUser,
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? updatedUser : user
        )
      );
      setSuccess('User updated locally (connection error)');
      setOpenEditDialog(false);
      setSelectedUser(null);
      resetForm();
      
      // Add audit log entry
      addAuditLogEntry({
        action: 'User Updated',
        resource: `User: ${formData.full_name}`,
        details: `Updated user information locally for ${formData.username}`,
        success: true
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    // Get user info before deletion for audit log
    const userToDelete = users.find(u => u.id === userId);
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        // Remove from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setSuccess('User deleted successfully');
        
        // Add audit log entry
        addAuditLogEntry({
          action: 'User Deleted',
          resource: `User: ${userToDelete?.full_name || 'Unknown User'}`,
          details: `Permanently deleted user ${userToDelete?.username || 'unknown'} (${userToDelete?.role?.replace('_', ' ') || 'unknown role'})`,
          success: true
        });
      } else if (response.status === 404) {
        // API endpoint not available, delete from local state only
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setSuccess('User deleted successfully (local only)');
        
        // Add audit log entry
        addAuditLogEntry({
          action: 'User Deleted',
          resource: `User: ${userToDelete?.full_name || 'Unknown User'}`,
          details: `Locally deleted user ${userToDelete?.username || 'unknown'} (API not available)`,
          success: true
        });
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to delete user');
        
        // Add failed audit log entry
        addAuditLogEntry({
          action: 'User Deletion Failed',
          resource: `User: ${userToDelete?.full_name || 'Unknown User'}`,
          details: `Failed to delete user ${userToDelete?.username || 'unknown'}: ${data.detail || 'Unknown error'}`,
          success: false
        });
      }
    } catch (error) {
      console.error('Delete user error:', error);
      // On connection error, still delete from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setSuccess('User deleted locally (server unavailable)');
      
      // Add audit log entry
      addAuditLogEntry({
        action: 'User Deleted',
        resource: `User: ${userToDelete?.full_name || 'Unknown User'}`,
        details: `Locally deleted user ${userToDelete?.username || 'unknown'} (connection error)`,
        success: true
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: 'sub_admin',
      permissions: {
        modules: ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports'],
        actions: ['create', 'read', 'update', 'delete', 'export']
      },
      force_password_change: true
    });
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setOpenCreateDialog(true);
  };

  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
      permissions: user.permissions ? JSON.parse(user.permissions) : {
        modules: ['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports'],
        actions: ['create', 'read', 'update', 'delete', 'export']
      },
      force_password_change: user.force_password_change
    });
    setOpenEditDialog(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'main_admin': return <AdminIcon sx={{ color: COLORS.error }} />;
      case 'sub_admin': return <SupervisorIcon sx={{ color: COLORS.primary }} />;
      case 'viewer': return <ViewIcon sx={{ color: COLORS.info }} />;
      default: return <PersonIcon />;
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { label: 'Active', color: 'success', icon: <ActiveIcon /> },
      inactive: { label: 'Inactive', color: 'default', icon: <BlockIcon /> },
      suspended: { label: 'Suspended', color: 'error', icon: <WarningIcon /> },
      pending: { label: 'Pending', color: 'warning', icon: <WarningIcon /> }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePermissionChange = (module, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        modules: checked 
          ? [...prev.permissions.modules, module]
          : prev.permissions.modules.filter(m => m !== module)
      }
    }));
  };

  return (
    <Box sx={{ 
      p: 1,
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      color: '#1F2937'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ManageAccountsIcon sx={{ fontSize: '1.5rem', color: '#3B82F6' }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '1.25rem' }}>
              User Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
            Manage users, roles, and permissions for the inventory system
          </Typography>
        </Box>

        {/* Users Management */}
        <Card sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', fontSize: '1rem' }}>
                  System Users ({users.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                  onClick={handleOpenCreateDialog}
                  sx={{ 
                    minHeight: '32px',
                    height: '32px',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    '&:hover': {
                      backgroundColor: '#2563EB'
                    }
                  }}
                >
                  Add New User
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ 
                borderRadius: 1,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB'
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F3F4F6' }}>
                      <TableCell sx={{ color: '#374151', fontWeight: 600, py: 0.5, fontSize: '0.75rem' }}>User</TableCell>
                      <TableCell sx={{ color: '#374151', fontWeight: 600, py: 0.5, fontSize: '0.75rem' }}>Role</TableCell>
                      <TableCell sx={{ color: '#374151', fontWeight: 600, py: 0.5, fontSize: '0.75rem' }}>Status</TableCell>
                      <TableCell sx={{ color: '#374151', fontWeight: 600, py: 0.5, fontSize: '0.75rem' }}>Last Login</TableCell>
                      <TableCell sx={{ color: '#374151', fontWeight: 600, py: 0.5, fontSize: '0.75rem' }}>Created</TableCell>
                      <TableCell align="center" sx={{ color: '#374151', fontWeight: 600, py: 0.5, fontSize: '0.75rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {users.map((user) => (
                        <motion.tr
                          key={user.id}
                          component={TableRow}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          sx={{ 
                            backgroundColor: '#FFFFFF',
                            '&:hover': { bgcolor: '#F3F4F6' },
                            '& .MuiTableCell-root': {
                              borderBottom: '1px solid #E5E7EB',
                              color: '#374151',
                              py: 0.25,
                              px: 0.5
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ bgcolor: COLORS.primary, width: 24, height: 24, fontSize: '0.7rem' }}>
                                {user.full_name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1F2937', fontSize: '0.75rem', lineHeight: 1.2 }}>
                                  {user.full_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#B0B0B0', fontSize: '0.65rem', lineHeight: 1 }}>
                                  @{user.username} • {user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getRoleIcon(user.role)}
                              <Typography variant="body2" sx={{ textTransform: 'capitalize', color: '#374151', fontSize: '0.75rem' }}>
                                {user.role.replace('_', ' ')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(user.status)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                              {user.last_login ? formatDate(user.last_login) : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                              {formatDate(user.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Edit User">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditDialog(user)}
                                  sx={{ color: COLORS.primary, p: 0.25 }}
                                >
                                  <EditIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete User">
                                <IconButton
                                  size="small"
                                  onClick={() => deleteUser(user.id)}
                                  sx={{ color: COLORS.error, p: 0.25 }}
                                >
                                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

        {/* Create User Dialog */}
        <Dialog 
          open={openCreateDialog} 
          onClose={() => setOpenCreateDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon />
              Create New User
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  helperText="Min 8 chars with uppercase, lowercase, and number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <MenuItem value="sub_admin">Sub Admin</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                    <MenuItem value="main_admin">Main Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.force_password_change}
                      onChange={(e) => setFormData({...formData, force_password_change: e.target.checked})}
                    />
                  }
                  label="Force password change on first login"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Module Permissions
                </Typography>
                <Grid container spacing={1}>
                  {['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'tools', 'settings'].map((module) => (
                    <Grid item xs={6} sm={4} md={3} key={module}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.permissions.modules.includes(module)}
                            onChange={(e) => handlePermissionChange(module, e.target.checked)}
                            size="small"
                          />
                        }
                        label={module.charAt(0).toUpperCase() + module.slice(1)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={createUser} 
              variant="contained" 
              disabled={loading}
            >
              Create User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon />
              Edit User: {selectedUser?.full_name}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <MenuItem value="sub_admin">Sub Admin</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                    <MenuItem value="main_admin">Main Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.force_password_change}
                      onChange={(e) => setFormData({...formData, force_password_change: e.target.checked})}
                    />
                  }
                  label="Force password change"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Module Permissions
                </Typography>
                <Grid container spacing={1}>
                  {['dashboard', 'products', 'students', 'orders', 'invoicing', 'reports', 'tools', 'settings'].map((module) => (
                    <Grid item xs={6} sm={4} md={3} key={module}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.permissions.modules.includes(module)}
                            onChange={(e) => handlePermissionChange(module, e.target.checked)}
                            size="small"
                          />
                        }
                        label={module.charAt(0).toUpperCase() + module.slice(1)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button 
              onClick={updateUser} 
              variant="contained" 
              disabled={loading}
            >
              Update User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      </motion.div>
    </Box>
  );
}

export default UserManagement;
