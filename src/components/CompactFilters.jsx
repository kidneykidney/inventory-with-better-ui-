import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Autocomplete,
  Chip,
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

const CompactFilters = ({ 
  config, 
  searchQuery,
  setSearchQuery,
  onFiltersChange, 
  data = [] 
}) => {
  // Early return if config is not provided
  if (!config) {
    return null;
  }

  // Standard styles for consistent TextField appearance
  const standardTextFieldStyles = {
    '& .MuiInputBase-input': { fontSize: '0.8rem' },
    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
    '& .MuiOutlinedInput-root': {
      minHeight: '32px',
      height: '32px'
    }
  };

  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: [],
    category: [],
    customFilters: {}
  });

  // Get unique values for dropdown filters
  const getUniqueValues = (field) => {
    if (!data || data.length === 0) return [];
    return [...new Set(data.map(item => item[field]).filter(Boolean))];
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // Pass both search query and filters to parent
    onFiltersChange({
      searchQuery,
      ...newFilters
    });
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      status: [],
      category: [],
      customFilters: {}
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    
    onFiltersChange({
      searchQuery: '',
      ...clearedFilters
    });
  };

  // Handle search query changes
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    onFiltersChange({
      searchQuery: value,
      ...filters
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery || 
           filters.dateFrom || 
           filters.dateTo || 
           filters.status.length > 0 || 
           filters.category.length > 0 ||
           Object.keys(filters.customFilters).some(key => filters.customFilters[key]);
  };

  return (
    <Paper sx={{ mb: 2, borderRadius: 2 }}>
      {/* Compact Search and Filter Header */}
      <Box sx={{ p: 1.5 }}>
        <Grid container spacing={1.5} alignItems="center">
          {/* Search Field - Takes up most space */}
          <Grid item xs={12} md={config?.moduleType === 'staff' || config?.moduleType === 'students' ? 10 : 5}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder={`Search ${config?.title?.toLowerCase() || 'items'}...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'action.active', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleSearchChange('')}>
                      <Clear sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                ...standardTextFieldStyles,
                '& .MuiInputBase-input': { py: 0.75 }
              }}
            />
          </Grid>

          {/* Date Range Filters - Different labels based on module type */}
          {config?.moduleType !== 'staff' && config?.moduleType !== 'students' && (
            <>
              <Grid item xs={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={config?.moduleType === 'orders' ? "Lending From" : "From"}
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.75 },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              </Grid>
              
              <Grid item xs={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={config?.moduleType === 'orders' ? "Lending To" : "To"}
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.75 },
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                  }}
                />
              </Grid>
            </>
          )}

          {/* Filter Toggle and Clear */}
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                size="small"
                variant={expanded ? "contained" : "outlined"}
                startIcon={<FilterList sx={{ fontSize: '1rem' }} />}
                endIcon={expanded ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
                onClick={() => setExpanded(!expanded)}
                sx={{ 
                  minWidth: 'auto', 
                  flex: 1,
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1
                }}
              >
                More
              </Button>
              {hasActiveFilters() && (
                <Button
                  size="small" 
                  variant="outlined"
                  color="error"
                  onClick={clearFilters} 
                  startIcon={<Clear sx={{ fontSize: '1rem' }} />}
                  sx={{ 
                    minWidth: 'auto',
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1,
                    borderColor: 'error.main',
                    '&:hover': { 
                      backgroundColor: 'error.lighter',
                      borderColor: 'error.dark'
                    }
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {searchQuery && (
              <Chip 
                size="small" 
                label={`"${searchQuery}"`} 
                onDelete={() => handleSearchChange('')}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
            {filters.dateFrom && (
              <Chip 
                size="small" 
                label={`From: ${filters.dateFrom}`} 
                onDelete={() => handleFilterChange('dateFrom', '')}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
            {filters.dateTo && (
              <Chip 
                size="small" 
                label={`To: ${filters.dateTo}`} 
                onDelete={() => handleFilterChange('dateTo', '')}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
            {filters.status.map(status => (
              <Chip 
                key={status}
                size="small" 
                label={status} 
                onDelete={() => handleFilterChange('status', filters.status.filter(s => s !== status))}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            ))}
            {filters.category.map(cat => (
              <Chip 
                key={cat}
                size="small" 
                label={cat} 
                onDelete={() => handleFilterChange('category', filters.category.filter(c => c !== cat))}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Advanced Filters - Collapsible */}
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.5, borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
          <Grid container spacing={1.5}>
            {/* Module-specific filters */}
            {config?.moduleType === 'products' && (
              <>
                {/* Row 1: Categories and Stock Status */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('category_name')}
                    value={filters.category}
                    onChange={(e, value) => handleFilterChange('category', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Categories" 
                        placeholder="Select categories"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          size="small" 
                          label={option} 
                          {...getTagProps({ index })} 
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={['Available', 'Out of Stock', 'Low Stock']}
                    value={filters.status}
                    onChange={(e, value) => handleFilterChange('status', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Stock Status" 
                        placeholder="Select status"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Row 2: Price Range */}
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    type="number"
                    label="Min Price"
                    placeholder="₹0"
                    value={filters.customFilters.priceMin || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      priceMin: e.target.value
                    })}
                    sx={standardTextFieldStyles}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    type="number"
                    label="Max Price"
                    placeholder="₹999999"
                    value={filters.customFilters.priceMax || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      priceMax: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={['Returnable', 'Non-Returnable']}
                    value={filters.customFilters.productType || []}
                    onChange={(e, value) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      productType: value
                    })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Product Type" 
                        placeholder="Select type"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Row 3: Stock Range and SKU */}
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    type="number"
                    label="Min Stock"
                    placeholder="0"
                    value={filters.customFilters.stockMin || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      stockMin: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    type="number"
                    label="Max Stock"
                    placeholder="9999"
                    value={filters.customFilters.stockMax || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      stockMax: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    label="SKU Pattern"
                    placeholder="Search by SKU..."
                    value={filters.customFilters.skuPattern || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      skuPattern: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
              </>
            )}

            {config?.moduleType === 'students' && (
              <>
                {/* Row 1: Status and Courses */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={['Active', 'Inactive']}
                    value={filters.status}
                    onChange={(e, value) => handleFilterChange('status', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Student Status" 
                        placeholder="Select status"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('course')}
                    value={filters.category}
                    onChange={(e, value) => handleFilterChange('category', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Courses" 
                        placeholder="Select courses"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          size="small" 
                          label={option} 
                          {...getTagProps({ index })} 
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))
                    }
                  />
                </Grid>

                {/* Row 2: Student ID and Year of Study */}
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    label="Student ID"
                    placeholder="Search by Student ID..."
                    value={filters.customFilters.studentId || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      studentId: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('year_of_study').map(String)}
                    value={filters.customFilters.yearOfStudy || []}
                    onChange={(e, value) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      yearOfStudy: value
                    })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Year of Study" 
                        placeholder="Select years"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Row 3: Email and Phone */}
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    label="Email Pattern"
                    placeholder="Search by email..."
                    value={filters.customFilters.emailPattern || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      emailPattern: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    label="Phone Number"
                    placeholder="Search by phone..."
                    value={filters.customFilters.phonePattern || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      phonePattern: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>

                {/* Row 4: Department */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('department').filter(Boolean)}
                    value={filters.customFilters.department || []}
                    onChange={(e, value) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      department: value
                    })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Departments" 
                        placeholder="Select departments"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Placeholder for future filters */}
                </Grid>
              </>
            )}

            {config?.moduleType === 'staff' && (
              <>
                {/* Row 1: Status and Department */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={['Active', 'Inactive']}
                    value={filters.status}
                    onChange={(e, value) => handleFilterChange('status', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Staff Status" 
                        placeholder="Select status"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('department')}
                    value={filters.category}
                    onChange={(e, value) => handleFilterChange('category', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Departments" 
                        placeholder="Select departments"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          size="small" 
                          label={option} 
                          {...getTagProps({ index })} 
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))
                    }
                  />
                </Grid>

                {/* Row 2: Designation */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('designation')}
                    value={filters.customFilters.designation || []}
                    onChange={(e, value) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      designation: value
                    })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Designations" 
                        placeholder="Select designations"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          size="small" 
                          label={option} 
                          {...getTagProps({ index })} 
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Placeholder for future filters */}
                </Grid>

                {/* Row 3: Employee ID */}
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    label="Employee ID"
                    placeholder="Search by Employee ID..."
                    value={filters.customFilters.employeeId || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      employeeId: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Placeholder for future filters */}
                </Grid>
              </>
            )}

            {config?.moduleType === 'orders' && (
              <>
                {/* Row 1: Order Status and Lenders */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={['Pending', 'Closed', 'Overdue']}
                    value={filters.status}
                    onChange={(e, value) => handleFilterChange('status', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Order Status" 
                        placeholder="Select status"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('lender_name')}
                    value={filters.category}
                    onChange={(e, value) => handleFilterChange('category', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Lenders" 
                        placeholder="Select lenders"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Row 2: Students Filter */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={getUniqueValues('student_name')}
                    value={filters.customFilters.students || []}
                    onChange={(e, value) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      students: value
                    })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Students" 
                        placeholder="Select students"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          size="small" 
                          label={option} 
                          {...getTagProps({ index })} 
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Placeholder for future filters */}
                </Grid>

                {/* Row 3: Lending Value Range */}
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    type="number"
                    label="Min Value"
                    placeholder="$0"
                    value={filters.customFilters.valueMin || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      valueMin: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    size="small"
                    type="number"
                    label="Max Value"
                    placeholder="$999999"
                    value={filters.customFilters.valueMax || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      valueMax: e.target.value
                    })}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={['Active', 'Overdue', 'Completed', 'Cancelled']}
                    value={filters.customFilters.lendingStatus || []}
                    onChange={(e, value) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      lendingStatus: value
                    })}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Lending Status" 
                        placeholder="Select lending status"
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem' },
                          '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Row 4: Expected Return Date Range */}
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    type="date"
                    label="Expected Return From"
                    value={filters.customFilters.expectedReturnFrom || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      expectedReturnFrom: e.target.value
                    })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    size="small"
                    type="date"
                    label="Expected Return To"
                    value={filters.customFilters.expectedReturnTo || ''}
                    onChange={(e) => handleFilterChange('customFilters', {
                      ...filters.customFilters,
                      expectedReturnTo: e.target.value
                    })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.8rem' },
                      '& .MuiInputLabel-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default CompactFilters;