import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Autocomplete,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const AdvancedFilters = ({ 
  type, 
  data, 
  onFilterChange, 
  categories = [], 
  courses = [], 
  lenders = [] 
}) => {
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    dateField: '',
    status: '',
    category: '',
    course: '',
    year: '',
    isActive: '',
    isReturnable: '',
    stockLevel: '',
    lender: '',
    minValue: '',
    maxValue: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Date field options for each module
  const getDateFieldOptions = () => {
    switch (type) {
      case 'products':
        return [
          { value: 'date_of_purchase', label: 'Purchase Date' },
          { value: 'created_at', label: 'Created Date' }
        ];
      case 'students':
        return [
          { value: 'created_at', label: 'Registration Date' },
          { value: 'updated_at', label: 'Last Updated' }
        ];
      case 'orders':
        return [
          { value: 'requested_date', label: 'Request Date' },
          { value: 'lending_date', label: 'Lending Date' },
          { value: 'expected_return_date', label: 'Expected Return Date' },
          { value: 'created_at', label: 'Created Date' }
        ];
      default:
        return [];
    }
  };

  // Status options for each module
  const getStatusOptions = () => {
    switch (type) {
      case 'students':
        return [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ];
      case 'orders':
        return [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'completed', label: 'Completed' },
          { value: 'returned', label: 'Returned' },
          { value: 'cancelled', label: 'Cancelled' }
        ];
      case 'products':
        return [
          { value: 'in_stock', label: 'In Stock' },
          { value: 'low_stock', label: 'Low Stock' },
          { value: 'out_of_stock', label: 'Out of Stock' }
        ];
      default:
        return [];
    }
  };

  // Apply filters to data
  const applyFilters = (currentFilters) => {
    let filteredData = [...data];

    // Text search across multiple fields
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filteredData = filteredData.filter(item => {
        const searchFields = getSearchableFields();
        return searchFields.some(field => {
          const value = getNestedValue(item, field);
          return value && value.toString().toLowerCase().includes(searchLower);
        });
      });
    }

    // Date range filtering
    if (currentFilters.dateFrom || currentFilters.dateTo) {
      const dateField = currentFilters.dateField || getDefaultDateField();
      if (dateField) {
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(getNestedValue(item, dateField));
          if (isNaN(itemDate.getTime())) return false;

          let isValid = true;
          if (currentFilters.dateFrom) {
            const fromDate = new Date(currentFilters.dateFrom);
            isValid = isValid && itemDate >= fromDate;
          }
          if (currentFilters.dateTo) {
            const toDate = new Date(currentFilters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            isValid = isValid && itemDate <= toDate;
          }
          return isValid;
        });
      }
    }

    // Status filtering
    if (currentFilters.status) {
      filteredData = filteredData.filter(item => {
        if (type === 'students') {
          const isActive = currentFilters.status === 'active';
          return item.is_active === isActive;
        } else if (type === 'orders') {
          return item.status === currentFilters.status;
        } else if (type === 'products') {
          const stock = item.quantity_available || 0;
          if (currentFilters.status === 'out_of_stock') return stock === 0;
          if (currentFilters.status === 'low_stock') return stock > 0 && stock <= 10;
          if (currentFilters.status === 'in_stock') return stock > 10;
        }
        return true;
      });
    }

    // Category filtering (products)
    if (currentFilters.category && type === 'products') {
      filteredData = filteredData.filter(item => 
        item.category_id === parseInt(currentFilters.category) ||
        item.category_name === currentFilters.category
      );
    }

    // Course filtering (students)
    if (currentFilters.course && type === 'students') {
      filteredData = filteredData.filter(item => 
        item.course === currentFilters.course
      );
    }

    // Year filtering (students)
    if (currentFilters.year && type === 'students') {
      filteredData = filteredData.filter(item => 
        item.year_of_study === parseInt(currentFilters.year)
      );
    }

    // Returnable filtering (products)
    if (currentFilters.isReturnable !== '' && type === 'products') {
      const isReturnable = currentFilters.isReturnable === 'true';
      filteredData = filteredData.filter(item => 
        item.is_returnable === isReturnable
      );
    }

    // Lender filtering (orders)
    if (currentFilters.lender && type === 'orders') {
      filteredData = filteredData.filter(item => 
        item.lender_id === parseInt(currentFilters.lender) ||
        item.lender_name === currentFilters.lender
      );
    }

    // Value range filtering
    if (currentFilters.minValue || currentFilters.maxValue) {
      filteredData = filteredData.filter(item => {
        const value = getValueForRangeFilter(item);
        if (value === null) return true;
        
        let isValid = true;
        if (currentFilters.minValue) {
          isValid = isValid && value >= parseFloat(currentFilters.minValue);
        }
        if (currentFilters.maxValue) {
          isValid = isValid && value <= parseFloat(currentFilters.maxValue);
        }
        return isValid;
      });
    }

    return filteredData;
  };

  // Helper functions
  const getSearchableFields = () => {
    switch (type) {
      case 'products':
        return ['name', 'sku', 'category_name', 'description'];
      case 'students':
        return ['name', 'email', 'student_id', 'course'];
      case 'orders':
        return ['order_number', 'student_name', 'lender_name', 'notes'];
      default:
        return [];
    }
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  };

  const getDefaultDateField = () => {
    switch (type) {
      case 'products': return 'date_of_purchase';
      case 'students': return 'created_at';
      case 'orders': return 'requested_date';
      default: return null;
    }
  };

  const getValueForRangeFilter = (item) => {
    switch (type) {
      case 'products': return item.unit_price;
      case 'orders': return item.total_value;
      default: return null;
    }
  };

  // Update filters and apply them
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    const filteredData = applyFilters(newFilters);
    onFilterChange(filteredData, newFilters);
  };

  // Handle individual filter changes
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    updateFilters(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {});
    updateFilters(clearedFilters);
  };

  // Count active filters
  useEffect(() => {
    const count = Object.values(filters).filter(value => value !== '').length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Auto-expand if filters are active
  useEffect(() => {
    if (activeFiltersCount > 1) {
      setIsExpanded(true);
    }
  }, [activeFiltersCount]);

  return (
    <Card sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Main Search Bar */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder={`Search ${type}...`}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setIsExpanded(!isExpanded)}
            endIcon={
              activeFiltersCount > 0 && (
                <Chip 
                  label={activeFiltersCount} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              )
            }
          >
            Filters
          </Button>
          {activeFiltersCount > 0 && (
            <Tooltip title="Clear all filters">
              <IconButton onClick={clearAllFilters} size="small">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Advanced Filters */}
        <Accordion expanded={isExpanded} onChange={() => setIsExpanded(!isExpanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Date Range Filters */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  <DateRangeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Date Range
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Date Field</InputLabel>
                      <Select
                        value={filters.dateField}
                        onChange={(e) => handleFilterChange('dateField', e.target.value)}
                        label="Date Field"
                      >
                        {getDateFieldOptions().map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="From Date"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="To Date"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Module-specific filters */}
              {type === 'products' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      Product Filters
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Autocomplete
                      size="small"
                      options={categories}
                      getOptionLabel={(option) => option.name || option}
                      value={categories.find(cat => cat.id === parseInt(filters.category)) || null}
                      onChange={(_, newValue) => handleFilterChange('category', newValue?.id || '')}
                      renderInput={(params) => <TextField {...params} label="Category" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Stock Level</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        label="Stock Level"
                      >
                        {getStatusOptions().map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={filters.isReturnable}
                        onChange={(e) => handleFilterChange('isReturnable', e.target.value)}
                        label="Type"
                      >
                        <MenuItem value="true">Returnable</MenuItem>
                        <MenuItem value="false">Non-Returnable</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Min Price"
                      type="number"
                      value={filters.minValue}
                      onChange={(e) => handleFilterChange('minValue', e.target.value)}
                      size="small"
                      InputProps={{ startAdornment: '₹' }}
                    />
                  </Grid>
                </>
              )}

              {type === 'students' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      Student Filters
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        label="Status"
                      >
                        {getStatusOptions().map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Autocomplete
                      size="small"
                      options={courses}
                      value={filters.course || null}
                      onChange={(_, newValue) => handleFilterChange('course', newValue || '')}
                      renderInput={(params) => <TextField {...params} label="Course" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Year of Study</InputLabel>
                      <Select
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                        label="Year of Study"
                      >
                        {[1, 2, 3, 4].map(year => (
                          <MenuItem key={year} value={year}>
                            Year {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {type === 'orders' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      Order Filters
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        label="Status"
                      >
                        {getStatusOptions().map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Autocomplete
                      size="small"
                      options={lenders}
                      getOptionLabel={(option) => `${option.name} - ${option.designation}`}
                      value={lenders.find(lender => lender.id === parseInt(filters.lender)) || null}
                      onChange={(_, newValue) => handleFilterChange('lender', newValue?.id || '')}
                      renderInput={(params) => <TextField {...params} label="Assigned Lender" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Min Value"
                      type="number"
                      value={filters.minValue}
                      onChange={(e) => handleFilterChange('minValue', e.target.value)}
                      size="small"
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Max Value"
                      type="number"
                      value={filters.maxValue}
                      onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                      size="small"
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                let label = key;
                let displayValue = value;
                
                // Format filter labels
                if (key === 'dateFrom') label = 'From';
                else if (key === 'dateTo') label = 'To';
                else if (key === 'isReturnable') {
                  label = 'Type';
                  displayValue = value === 'true' ? 'Returnable' : 'Non-Returnable';
                }
                
                return (
                  <Chip
                    key={key}
                    label={`${label}: ${displayValue}`}
                    size="small"
                    onDelete={() => handleFilterChange(key, '')}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;