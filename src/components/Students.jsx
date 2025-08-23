import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  Snackbar,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Class as ClassIcon
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [studentForm, setStudentForm] = useState({
    student_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    year_of_study: 1,
    course: ''
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/students`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      showSnackbar('Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async () => {
    try {
      const response = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm)
      });
      
      if (response.ok) {
        showSnackbar('Student created successfully', 'success');
        setOpenDialog(false);
        resetForm();
        fetchStudents();
      } else {
        throw new Error('Failed to create student');
      }
    } catch (error) {
      showSnackbar('Failed to create student', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setStudentForm({
      student_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      year_of_study: 1,
      course: ''
    });
    setEditingStudent(null);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      department: student.department,
      year_of_study: student.year_of_study || 1,
      course: student.course || ''
    });
    setOpenDialog(true);
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/students/${studentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showSnackbar('Student deleted successfully', 'success');
        fetchStudents();
      } else {
        throw new Error('Failed to delete student');
      }
    } catch (error) {
      showSnackbar('Failed to delete student', 'error');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const departments = [
    'Computer Science',
    'Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
    'Business Administration',
    'Design',
    'Other'
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Student Management
            </Typography>
            <Typography variant="subtitle1">
              Manage student information and enrollment details
            </Typography>
          </Box>
          <Tooltip title="Add New Student">
            <Fab 
              color="secondary" 
              sx={{ bgcolor: '#66bb6a', '&:hover': { bgcolor: '#5cb660' } }}
              onClick={() => setOpenDialog(true)}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      </Paper>

      {/* Students Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Students List</Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {students.length} students
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {student.name}
                          </Typography>
                          {student.course && (
                            <Typography variant="body2" color="text.secondary">
                              {student.course}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={student.student_id} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center">
                          <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: '#666' }} />
                          <Typography variant="body2">{student.email}</Typography>
                        </Box>
                        {student.phone && (
                          <Box display="flex" alignItems="center">
                            <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: '#666' }} />
                            <Typography variant="body2">{student.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={student.department} 
                        color="secondary" 
                        variant="outlined"
                        icon={<SchoolIcon />}
                      />
                    </TableCell>
                    
                    <TableCell>
                      {student.year_of_study && (
                        <Chip 
                          label={`Year ${student.year_of_study}`} 
                          color="info" 
                          size="small"
                          icon={<ClassIcon />}
                        />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={student.is_active ? 'Active' : 'Inactive'} 
                        color={student.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Tooltip title="Edit Student">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditStudent(student)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Student">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteStudent(student.id)}
                          sx={{ 
                            ml: 1,
                            bgcolor: '#ffebee', 
                            '&:hover': { bgcolor: '#ffcdd2' } 
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={students.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Student Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student ID"
                value={studentForm.student_id}
                onChange={(e) => setStudentForm({...studentForm, student_id: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={studentForm.name}
                onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={studentForm.email}
                onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={studentForm.phone}
                onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Department"
                value={studentForm.department}
                onChange={(e) => setStudentForm({...studentForm, department: e.target.value})}
                SelectProps={{ native: true }}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year of Study"
                type="number"
                value={studentForm.year_of_study}
                onChange={(e) => setStudentForm({...studentForm, year_of_study: parseInt(e.target.value)})}
                inputProps={{ min: 1, max: 5 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Course/Program"
                value={studentForm.course}
                onChange={(e) => setStudentForm({...studentForm, course: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={createStudent}
            variant="contained"
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#2e7d32' } }}
          >
            {editingStudent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Students;
