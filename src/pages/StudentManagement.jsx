import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton, Avatar, Alert
} from '@mui/material';
import {
  Person, School, Phone, Email, Add, Edit, Delete, Search,
  Assignment, CalendarToday, LocationOn
} from '@mui/icons-material';

const sampleStudents = [
  {
    id: 1,
    name: "John Doe",
    student_id: "CS2021001",
    department: "Computer Science",
    contact: "+1-234-567-8900",
    email: "john.doe@college.edu",
    year: "3rd Year",
    project_title: "IoT Smart Home System",
    supervisor: "Dr. Smith",
    active_loans: 3,
    total_borrowed: 8,
    status: "Active"
  },
  {
    id: 2,
    name: "Jane Smith",
    student_id: "EE2021045",
    department: "Electrical Engineering",
    contact: "+1-234-567-8901",
    email: "jane.smith@college.edu",
    year: "4th Year",
    project_title: "Solar Power Management System",
    supervisor: "Dr. Johnson",
    active_loans: 1,
    total_borrowed: 12,
    status: "Active"
  },
  {
    id: 3,
    name: "Mike Wilson",
    student_id: "ME2021078",
    department: "Mechanical Engineering",
    contact: "+1-234-567-8902",
    email: "mike.wilson@college.edu",
    year: "2nd Year",
    project_title: "Automated Assembly Line",
    supervisor: "Dr. Brown",
    active_loans: 0,
    total_borrowed: 5,
    status: "Graduated"
  }
];

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Civil Engineering"
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

function StudentManagement() {
  const [students, setStudents] = useState(sampleStudents);
  const [filteredStudents, setFilteredStudents] = useState(sampleStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    department: '',
    contact: '',
    email: '',
    year: '',
    project_title: '',
    supervisor: ''
  });

  // Filter students based on search and department
  React.useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.project_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(student => student.department === selectedDepartment);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, selectedDepartment, students]);

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        student_id: student.student_id,
        department: student.department,
        contact: student.contact,
        email: student.email,
        year: student.year,
        project_title: student.project_title,
        supervisor: student.supervisor
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        student_id: '',
        department: '',
        contact: '',
        email: '',
        year: '',
        project_title: '',
        supervisor: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveStudent = () => {
    if (editingStudent) {
      // Update existing student
      setStudents(prev =>
        prev.map(student =>
          student.id === editingStudent.id
            ? { ...student, ...formData }
            : student
        )
      );
    } else {
      // Add new student
      const newStudent = {
        id: Date.now(),
        ...formData,
        active_loans: 0,
        total_borrowed: 0,
        status: "Active"
      };
      setStudents(prev => [...prev, newStudent]);
    }
    handleCloseDialog();
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(prev => prev.filter(student => student.id !== studentId));
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'graduated': return 'default';
      case 'suspended': return 'error';
      default: return 'primary';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
          👥 Student Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage student registrations, assignments, and access permissions
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, ID, email, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Department"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="All">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<Add />}
              fullWidth
              sx={{ height: 56 }}
              onClick={() => handleOpenDialog()}
            >
              Add Student
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {students.filter(s => s.status === 'Active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {students.reduce((sum, s) => sum + s.active_loans, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Loans
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {students.reduce((sum, s) => sum + s.total_borrowed, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Borrowed Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {departments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Students Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Student Directory
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell align="center">Active Loans</TableCell>
                  <TableCell align="center">Total Borrowed</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(student.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {student.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {student.student_id} • {student.year}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            📧 {student.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.department}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {student.project_title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.supervisor}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={student.active_loans}
                        color={student.active_loans > 0 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{student.total_borrowed}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        color={getStatusColor(student.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(student)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Student Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student ID / Roll No"
                value={formData.student_id}
                onChange={(e) => handleFormChange('student_id', e.target.value)}
                InputProps={{
                  startAdornment: <Assignment sx={{ mr: 1, color: 'action.active' }} />
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  label="Department"
                  onChange={(e) => handleFormChange('department', e.target.value)}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Year</InputLabel>
                <Select
                  value={formData.year}
                  label="Year"
                  onChange={(e) => handleFormChange('year', e.target.value)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contact}
                onChange={(e) => handleFormChange('contact', e.target.value)}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Title"
                value={formData.project_title}
                onChange={(e) => handleFormChange('project_title', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Supervisor"
                value={formData.supervisor}
                onChange={(e) => handleFormChange('supervisor', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveStudent}
            disabled={!formData.name || !formData.student_id || !formData.department}
          >
            {editingStudent ? 'Update' : 'Add'} Student
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentManagement;
