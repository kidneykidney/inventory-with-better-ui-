import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton, Avatar, Alert, Autocomplete
} from '@mui/material';
import {
  Person, School, Phone, Email, Add, Edit, Delete, Search,
  Assignment, CalendarToday, LocationOn, Refresh, RemoveCircle
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

// Course list with add/delete functionality
const defaultCourses = [
  "Computer Science Engineering",
  "Electronics and Communication Engineering", 
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Information Technology",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biotechnology",
  "MBA",
  "MCA",
  "M.Tech"
];

function StudentManagement() {
  const [students, setStudents] = useState(sampleStudents);
  const [filteredStudents, setFilteredStudents] = useState(sampleStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isCourseManagementOpen, setIsCourseManagementOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [courses, setCourses] = useState(defaultCourses);
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
  
  // Bulk add students state
  const [bulkStudents, setBulkStudents] = useState([{
    student_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    course: ''
  }]);

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

  // Bulk Add Functions
  const handleOpenBulkAdd = () => {
    setIsBulkAddOpen(true);
    setBulkStudents([{
      student_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      year: '',
      course: ''
    }]);
  };

  const handleCloseBulkAdd = () => {
    setIsBulkAddOpen(false);
    setBulkStudents([{
      student_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      year: '',
      course: ''
    }]);
  };

  const addMoreStudents = () => {
    setBulkStudents(prev => [...prev, {
      student_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      year: '',
      course: ''
    }]);
  };

  const removeBulkStudent = (index) => {
    if (bulkStudents.length > 1) {
      setBulkStudents(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleBulkStudentChange = (index, field, value) => {
    setBulkStudents(prev => 
      prev.map((student, i) => 
        i === index ? { ...student, [field]: value } : student
      )
    );
  };

  const handleBulkSave = () => {
    // Validate required fields
    const invalidStudents = bulkStudents.filter(student => 
      !student.name.trim() || !student.email.trim() || !student.department.trim()
    );

    if (invalidStudents.length > 0) {
      alert('Please fill in all required fields (Name, Email, Department) for all students');
      return;
    }

    // Create new students
    const newStudents = bulkStudents.map((student, index) => ({
      id: Date.now() + index,
      name: student.name.trim(),
      student_id: student.student_id.trim() || `AUTO${Date.now()}${index}`,
      email: student.email.trim(),
      contact: student.phone.trim(),
      department: student.department,
      year: student.year,
      project_title: student.course,
      supervisor: "TBD",
      active_loans: 0,
      total_borrowed: 0,
      status: "Active"
    }));

    setStudents(prev => [...prev, ...newStudents]);
    handleCloseBulkAdd();
  };

  const addNewCourse = (newCourse) => {
    if (newCourse && !courses.includes(newCourse)) {
      setCourses(prev => [...prev, newCourse]);
    }
  };

  const removeCourse = (courseToRemove) => {
    setCourses(prev => prev.filter(course => course !== courseToRemove));
  };

  // Course Management Functions
  const handleOpenCourseManagement = () => {
    setIsCourseManagementOpen(true);
  };

  const handleCloseCourseManagement = () => {
    setIsCourseManagementOpen(false);
    setNewCourseName('');
  };

  const handleAddCourse = () => {
    if (newCourseName.trim() && !courses.includes(newCourseName.trim())) {
      setCourses(prev => [...prev, newCourseName.trim()]);
      setNewCourseName('');
    }
  };

  return (
    <Box>
      {/* Header - Updated with consistent button styling */}
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
          <Grid item xs={12} md={5}>
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
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              fullWidth
              sx={{ 
                minHeight: '48px',
                height: '48px',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '12px',
                borderColor: '#3B82F6',
                color: '#3B82F6',
                '&:hover': {
                  borderColor: '#2563EB',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }
              }}
              onClick={() => {
                // Refresh functionality - reset filters or reload data
                setSearchTerm('');
                setSelectedDepartment('All');
              }}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              fullWidth
              sx={{ 
                minHeight: '48px',
                height: '48px',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '12px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#2563EB'
                }
              }}
              onClick={handleOpenBulkAdd}
            >
              Add student
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<School />}
              fullWidth
              sx={{ 
                minHeight: '48px',
                height: '48px',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '12px',
                borderColor: '#10B981',
                color: '#10B981',
                '&:hover': {
                  borderColor: '#059669',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)'
                }
              }}
              onClick={handleOpenCourseManagement}
            >
              Manage Courses
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
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '1200px',
            width: '90vw',
            maxWidth: '90vw'
          }
        }}
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

      {/* Bulk Add Students Dialog */}
      <Dialog
        open={isBulkAddOpen}
        onClose={handleCloseBulkAdd}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: '95vw',
            maxWidth: '1400px',
            height: '90vh',
            maxHeight: '800px'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Bulk Add Students
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, px: 1 }}>
            <Box sx={{ width: '120px', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              STUDENT ID
            </Box>
            <Box sx={{ width: '200px', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              FULL NAME*
            </Box>
            <Box sx={{ width: '200px', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              EMAIL*
            </Box>
            <Box sx={{ width: '150px', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              PHONE NUMBER
            </Box>
            <Box sx={{ width: '180px', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              DEPARTMENT*
            </Box>
            <Box sx={{ width: '150px', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              YEAR OF STUDY
            </Box>
            <Box sx={{ width: '60px', fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
              ACTIONS
            </Box>
          </Box>

          {/* Student Rows */}
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {bulkStudents.map((student, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                {/* Student ID */}
                <TextField
                  size="small"
                  placeholder="Enter student id"
                  value={student.student_id}
                  onChange={(e) => handleBulkStudentChange(index, 'student_id', e.target.value)}
                  sx={{ width: '120px' }}
                />
                
                {/* Full Name - Required */}
                <TextField
                  size="small"
                  placeholder="Enter full name"
                  value={student.name}
                  onChange={(e) => handleBulkStudentChange(index, 'name', e.target.value)}
                  required
                  error={!student.name.trim()}
                  sx={{ 
                    width: '200px',
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: '#ef4444'
                        }
                      }
                    }
                  }}
                />
                
                {/* Email - Required */}
                <TextField
                  size="small"
                  placeholder="Enter email"
                  value={student.email}
                  onChange={(e) => handleBulkStudentChange(index, 'email', e.target.value)}
                  required
                  error={!student.email.trim()}
                  sx={{ 
                    width: '200px',
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: '#ef4444'
                        }
                      }
                    }
                  }}
                />
                
                {/* Phone - Optional */}
                <TextField
                  size="small"
                  placeholder="Enter phone number"
                  value={student.phone}
                  onChange={(e) => handleBulkStudentChange(index, 'phone', e.target.value)}
                  sx={{ width: '150px' }}
                />
                
                {/* Department - Required */}
                <FormControl size="small" sx={{ width: '180px' }} required error={!student.department}>
                  <Select
                    value={student.department}
                    onChange={(e) => handleBulkStudentChange(index, 'department', e.target.value)}
                    displayEmpty
                    sx={{
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: '#ef4444'
                        }
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Enter department</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Year of Study */}
                <FormControl size="small" sx={{ width: '150px' }}>
                  <Select
                    value={student.year}
                    onChange={(e) => handleBulkStudentChange(index, 'year', e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select Year of St...</em>
                    </MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Delete Button */}
                <IconButton
                  onClick={() => removeBulkStudent(index)}
                  disabled={bulkStudents.length === 1}
                  sx={{
                    width: '40px',
                    height: '40px',
                    opacity: bulkStudents.length === 1 ? 0.3 : 1,
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: '#fee2e2'
                    }
                  }}
                >
                  <RemoveCircle />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Add More Students Button */}
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addMoreStudents}
            sx={{ 
              mt: 2,
              borderColor: '#3B82F6',
              color: '#3B82F6',
              '&:hover': {
                backgroundColor: '#eff6ff',
                borderColor: '#2563EB'
              }
            }}
          >
            Add More Students
          </Button>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, gap: 2 }}>
          <Button onClick={handleCloseBulkAdd} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkSave}
            sx={{
              backgroundColor: '#3B82F6',
              color: 'white',
              '&:hover': {
                backgroundColor: '#2563EB'
              }
            }}
          >
            Create {bulkStudents.length} Students
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Management Dialog */}
      <Dialog
        open={isCourseManagementOpen}
        onClose={handleCloseCourseManagement}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minWidth: '600px',
            maxHeight: '700px'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" />
            Manage Courses
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Add New Course */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
            <TextField
              label="Course Name"
              placeholder="Enter new course name"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              fullWidth
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCourse();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddCourse}
              disabled={!newCourseName.trim() || courses.includes(newCourseName.trim())}
              sx={{
                height: '56px',
                backgroundColor: '#10B981',
                '&:hover': {
                  backgroundColor: '#059669'
                }
              }}
            >
              Add Course
            </Button>
          </Box>

          {/* Course List */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
            Available Courses ({courses.length})
          </Typography>
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {courses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <School sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography>No courses available</Typography>
              </Box>
            ) : (
              courses.map((course, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    mb: 1,
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: '#f9fafb'
                    }
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {course}
                  </Typography>
                  <IconButton
                    onClick={() => removeCourse(course)}
                    sx={{
                      color: '#ef4444',
                      '&:hover': {
                        backgroundColor: '#fee2e2'
                      }
                    }}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseCourseManagement} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StudentManagement;
