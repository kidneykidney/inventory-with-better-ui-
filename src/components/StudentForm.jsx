import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

const StudentForm = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    year_of_study: '',
    course: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      if (!formData.name.trim() || !formData.department.trim()) {
        setError('Name and Department are required fields');
        setSubmitting(false);
        return;
      }

      // Prepare request body
      const requestBody = {
        name: formData.name.trim(),
        department: formData.department.trim()
      };

      // Add optional fields if provided
      if (formData.student_id.trim()) {
        requestBody.student_id = formData.student_id.trim();
      }
      if (formData.email.trim()) {
        requestBody.email = formData.email.trim();
      }
      if (formData.phone.trim()) {
        requestBody.phone = formData.phone.trim();
      }
      if (formData.course.trim()) {
        requestBody.course = formData.course.trim();
      }
      if (formData.year_of_study) {
        requestBody.year_of_study = parseInt(formData.year_of_study);
      }

      console.log('Submitting student data:', requestBody);

      const response = await fetch('http://localhost:8000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create student');
      }

      const responseData = await response.json();
      console.log('Student created successfully:', responseData);

      // Reset form
      setFormData({
        student_id: '',
        name: '',
        email: '',
        phone: '',
        department: '',
        year_of_study: '',
        course: ''
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(responseData);
      }

      // Close dialog
      onClose();

    } catch (err) {
      console.error('Error creating student:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        student_id: '',
        name: '',
        email: '',
        phone: '',
        department: '',
        year_of_study: '',
        course: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <DialogTitle sx={{ color: '#1F2937', fontWeight: 700, borderBottom: '1px solid #E5E7EB' }}>
        Add New Student
      </DialogTitle>
      
      <DialogContent sx={{ backgroundColor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Student ID (optional - auto-generated if empty)"
            value={formData.student_id}
            onChange={(e) => handleChange('student_id', e.target.value)}
            fullWidth
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiInputBase-input': { color: '#1F2937' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
            }}
          />

          <TextField
            label="Full Name *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            fullWidth
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? 'This field is required' : ''}
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiInputBase-input': { color: '#1F2937' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: !formData.name.trim() ? '#EF4444' : '#D1D5DB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
            }}
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            fullWidth
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiInputBase-input': { color: '#1F2937' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
            }}
          />

          <TextField
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            fullWidth
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiInputBase-input': { color: '#1F2937' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
            }}
          />

          <TextField
            label="Department *"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            required
            fullWidth
            error={!formData.department.trim()}
            helperText={!formData.department.trim() ? 'This field is required' : ''}
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiInputBase-input': { color: '#1F2937' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: !formData.department.trim() ? '#EF4444' : '#D1D5DB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
            }}
          />

          <FormControl fullWidth>
            <InputLabel sx={{ color: '#6B7280' }}>Year of Study</InputLabel>
            <Select
              value={formData.year_of_study}
              onChange={(e) => handleChange('year_of_study', e.target.value)}
              sx={{
                color: '#1F2937',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
              }}
            >
              <MenuItem value="" sx={{ color: '#6B7280' }}>Select Year</MenuItem>
              <MenuItem value={1} sx={{ color: '#1F2937' }}>Year 1</MenuItem>
              <MenuItem value={2} sx={{ color: '#1F2937' }}>Year 2</MenuItem>
              <MenuItem value={3} sx={{ color: '#1F2937' }}>Year 3</MenuItem>
              <MenuItem value={4} sx={{ color: '#1F2937' }}>Year 4</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Course"
            value={formData.course}
            onChange={(e) => handleChange('course', e.target.value)}
            fullWidth
            sx={{
              '& .MuiInputLabel-root': { color: '#6B7280' },
              '& .MuiInputBase-input': { color: '#1F2937' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={submitting}
          sx={{ 
            color: '#6B7280', 
            borderColor: '#D1D5DB',
            '&:hover': {
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.08)'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !formData.name.trim() || !formData.department.trim()}
          sx={{
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#2563EB',
            },
            '&:disabled': {
              backgroundColor: '#9CA3AF',
              color: '#F3F4F6'
            }
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: '#0A0A0A' }} />
          ) : (
            'Create Student'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentForm;
