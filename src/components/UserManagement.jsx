import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Grid, Alert, Snackbar, Avatar, Tooltip,
  Switch, FormControlLabel, List, ListItem, ListItemText, ListItemIcon,
  Divider, Badge, LinearProgress, Tab, Tabs, Container
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  Person as PersonIcon, AdminPanelSettings as AdminIcon,
  Security as SecurityIcon, Visibility as ViewIcon,
  Block as BlockIcon, CheckCircle as ActiveIcon,
  Warning as WarningIcon, History as HistoryIcon,
  VpnKey as KeyIcon, Email as EmailIcon,
  SupervisorAccount as SupervisorIcon, Shield as ShieldIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000/api';

// User management colors
const COLORS = {
  primary: '#1976D2',
  secondary: '#388E3C',
  error: '#D32F2F',
  warning: '#F57C00',
  info: '#1976D2',
  success: '#388E3C',
  surface: '#FFFFFF',
  background: '#F5F7FA'
};

function UserManagement() {
  // State management
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  
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
    if (selectedTab === 0) {
      fetchUsers();
    } else if (selectedTab === 1) {
      fetchAuditLogs();
    }
  }, [selectedTab]);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/audit-logs?limit=50`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSuccess('User created successfully');
        setOpenCreateDialog(false);
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create user');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async () => {
    setLoading(true);
    try {
      const updateData = { ...formData };
      delete updateData.password; // Don't send password in update
      
      const response = await fetch(`${API_BASE_URL}/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        setSuccess('User updated successfully');
        setOpenEditDialog(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update user');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to delete user');
      }
    } catch (error) {
      setError('Connection error');
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            👥 User Management
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Manage users, roles, and permissions for the inventory system
          </Typography>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label="Users" 
              icon={<PersonIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Audit Logs" 
              icon={<HistoryIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Card>

        {/* Loading */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Users Tab */}
        {selectedTab === 0 && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  System Users ({users.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDialog}
                  sx={{ borderRadius: 2 }}
                >
                  Add New User
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
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
                          sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: COLORS.primary }}>
                                {user.full_name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {user.full_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  @{user.username} • {user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getRoleIcon(user.role)}
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {user.role.replace('_', ' ')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(user.status)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.last_login ? formatDate(user.last_login) : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(user.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Edit User">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditDialog(user)}
                                  sx={{ color: COLORS.primary }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete User">
                                <IconButton
                                  size="small"
                                  onClick={() => deleteUser(user.id)}
                                  sx={{ color: COLORS.error }}
                                >
                                  <DeleteIcon />
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
        )}

        {/* Audit Logs Tab */}
        {selectedTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Security Audit Logs
              </Typography>

              <List>
                <AnimatePresence>
                  {auditLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ListItem sx={{ 
                        border: 1, 
                        borderColor: 'grey.200', 
                        borderRadius: 2, 
                        mb: 1,
                        bgcolor: log.success ? 'success.light' : 'error.light',
                        '&:hover': { bgcolor: log.success ? 'success.main' : 'error.main' }
                      }}>
                        <ListItemIcon>
                          {log.success ? 
                            <CheckCircle sx={{ color: 'success.dark' }} /> : 
                            <WarningIcon sx={{ color: 'error.dark' }} />
                          }
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {log.action} {log.resource && `• ${log.resource}`}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {log.details}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {formatDate(log.timestamp)} • IP: {log.ip_address}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </List>
            </CardContent>
          </Card>
        )}

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
    </Container>
  );
}

export default UserManagement;
