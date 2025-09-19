import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Button,
  Checkbox,
  Menu,
  Tabs,
  Tab,
  Autocomplete,
  TableContainer as MuiTableContainer,
  Table as MuiTable,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TableCell as MuiTableCell,
  TableBody as MuiTableBody
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import NotificationService from '../services/notificationService';
import CompactFilters from './CompactFilters';

const API_BASE_URL = 'http://localhost:8000';

// List View Component
const ListView = ({ type = 'products' }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Added success state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Bulk selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Status update states
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedItemForStatus, setSelectedItemForStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Bulk items state (universal for all modules)
  const [bulkItems, setBulkItems] = useState([]);

  // Legacy bulk products state for backward compatibility
  const [bulkProducts, setBulkProducts] = useState([]);

  // Category management state (for products module)
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openCategoryManagementDialog, setOpenCategoryManagementDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Course management state (for students module)
  const [openCourseManagementDialog, setOpenCourseManagementDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [addingCourse, setAddingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const initializeBulkItem = () => {
    switch (type) {
      case 'products':
        return {
          id: Date.now(),
          name: '',
          sku: '',
          unit_price: 0,
          category_id: '',
          quantity_total: 0,
          quantity_available: 0,
          description: '',
          location: '',
          is_returnable: true
        };
      case 'students':
        return {
          id: Date.now(),
          student_id: '',
          name: '',
          email: '',
          phone: '',
          year_of_study: '',
          course: ''
        };
      case 'orders':
        return {
          id: Date.now(),
          student_id: '',
          product_id: '',
          lender_id: '',
          quantity_requested: 1,
          notes: '',
          lending_date: '',
          expected_return_date: ''
        };
      default:
        return { id: Date.now() };
    }
  };

  useEffect(() => {
    // Initialize bulk items based on module type
    const initialItem = initializeBulkItem();
    setBulkItems([initialItem]);
    
    // Keep legacy products for backward compatibility
    if (type === 'products') {
      setBulkProducts([initialItem]);
    }
  }, [type]);

  // Configuration for different list types
  const config = {
    products: {
      title: 'Products Management',
      moduleType: 'products',
      icon: <InventoryIcon />,
      endpoint: '/api/products',
      columns: [
        { key: 'name', label: 'Product Name', type: 'text' },
        { key: 'sku', label: 'SKU', type: 'text' },
        { key: 'unit_price', label: 'Price', type: 'number', prefix: '₹' },
        { key: 'category_name', label: 'Category', type: 'text' },
        { key: 'quantity_available', label: 'Stock Level', type: 'stock_level' },
        { key: 'is_returnable', label: 'Type', type: 'boolean' },
        { key: 'date_of_purchase', label: 'Purchase Date', type: 'date' }
      ]
    },
    students: {
      title: 'Student Management',
      moduleType: 'students',
      icon: <SchoolIcon />,
      endpoint: '/api/students',
      columns: [
        { key: 'name', label: 'Full Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'course', label: 'Course', type: 'text' },
        { key: 'year_of_study', label: 'Year', type: 'number' },
        { key: 'is_active', label: 'Status', type: 'status' }
      ]
    },
    orders: {
      title: 'Lending Management',
      moduleType: 'orders',
      icon: <AssignmentIcon />,
      endpoint: '/api/orders',
      columns: [
        { key: 'order_number', label: 'Lending #', type: 'number', prefix: '' },
        { key: 'student_name', label: 'Student', type: 'text' },
        { key: 'lender_name', label: 'Assigned Lender', type: 'text' },
        { key: 'total_items', label: 'Items', type: 'number' },
        { key: 'total_value', label: 'Value', type: 'number', prefix: '$' },
        { key: 'requested_date', label: 'Date', type: 'date' },
        { key: 'status', label: 'Status', type: 'status' }
      ]
    }
  };

  // Get form fields dynamically
  const getFormFields = () => {
    switch (type) {
      case 'products':
        return [
          { key: 'name', label: 'Product Name', type: 'text', required: true },
          { key: 'sku', label: 'SKU', type: 'text', required: true },
          { key: 'unit_price', label: 'Price', type: 'number', required: true },
          { key: 'category_id', label: 'Category', type: 'select', required: true, 
            options: categories?.map(cat => ({ value: cat.id, label: cat.name })) || [] },
          { key: 'quantity_available', label: 'Stock', type: 'number', required: true },
          { key: 'is_returnable', label: 'Type', type: 'select', required: true,
            options: [
              { value: true, label: 'Returnable' },
              { value: false, label: 'Non-Returnable' }
            ]
          },
          { key: 'date_of_purchase', label: 'Purchase Date', type: 'date', required: true },
          { key: 'description', label: 'Description', type: 'text', multiline: true }
        ];
      case 'students':
        return [
          { key: 'student_id', label: 'Student ID', type: 'text', required: true },
          { key: 'name', label: 'Full Name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true }, // Made required
          { key: 'phone', label: 'Phone Number', type: 'text', required: false }, // Optional
          { key: 'year_of_study', label: 'Year of Study', type: 'select', 
            options: [1, 2, 3, 4].map(year => ({ value: year, label: `Year ${year}` })), required: true }, // Made required
          { key: 'course', label: 'Course', type: 'searchable_select', required: true,
            options: courses?.map(course => ({ value: course, label: course })) || [],
            allowAdd: true }
        ];
      case 'orders':
        return [
          { key: 'student_id', label: 'Student', type: 'select', required: true,
            options: students?.map(student => ({ value: student.id, label: `${student.name} (${student.student_id})` })) || [] },
          { key: 'product_id', label: 'Product', type: 'select', required: true,
            options: products?.map(product => {
              const stockQty = product.quantity_available || 0;
              const stockStatus = stockQty === 0 ? ' (OUT OF STOCK)' : 
                                 stockQty <= (product.minimum_stock_level || 0) ? ` (LOW STOCK: ${stockQty})` : 
                                 ` (Stock: ${stockQty})`;
              return { 
                value: product.id, 
                label: `${product.name} - $${product.unit_price}${stockStatus}`,
                disabled: stockQty === 0 // Disable out of stock items
              };
            }) || [] },
          { key: 'lender_id', label: 'Lender/Staff', type: 'select', required: true,
            options: (() => {
              console.log('Rendering lender options, lenders array:', lenders);
              console.log('Lenders array length:', lenders?.length || 0);
              const options = lenders?.map(lender => ({ 
                value: lender.id, 
                label: `${lender.name} - ${lender.designation} (${lender.department})` 
              })) || [];
              console.log('Generated lender options:', options);
              return options;
            })() },
          { key: 'quantity_requested', label: 'Quantity', type: 'number', required: true },
          { key: 'notes', label: 'Notes', type: 'text', multiline: true },
          { key: 'lending_date', label: 'Lending Date', type: 'date' },
          { key: 'expected_return_date', label: 'Expected Return Date', type: 'date' }
        ];
      default:
        return [];
    }
  };

  const currentConfig = config[type];

  if (!currentConfig) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Configuration not found for type: {type}
        </Typography>
      </Box>
    );
  }

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);  // Clear any existing errors
      console.log(`Fetching data for ${type} from ${API_BASE_URL}${currentConfig.endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${currentConfig.endpoint}?_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Fetched ${type} data:`, result);
      
      const dataArray = Array.isArray(result) ? result : [];
      setData(dataArray);
      setFilteredData(dataArray); // Initialize filtered data
      console.log(`Updated ${type} state with ${dataArray.length} items`);
      
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for products
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch students for orders
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`);
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  // Fetch products for orders
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Fetch lenders for orders
  const fetchLenders = async () => {
    try {
      console.log('Fetching lenders from:', `${API_BASE_URL}/api/lenders`);
      const response = await fetch(`${API_BASE_URL}/api/lenders`);
      console.log('Lenders response status:', response.status);
      
      if (response.ok) {
        const lendersData = await response.json();
        console.log('Lenders data received:', lendersData);
        console.log('Number of lenders:', lendersData.length);
        setLenders(lendersData);
      } else {
        console.error('Failed to fetch lenders - response not ok:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to fetch lenders - error:', err);
    }
  };

  // Initialize courses with some default options
  const initializeCourses = () => {
    const defaultCourses = [
      'Computer Science',
      'Information Technology',
      'Software Engineering',
      'Data Science',
      'Cybersecurity',
      'Web Development',
      'Mobile App Development',
      'Artificial Intelligence',
      'Machine Learning',
      'Database Management'
    ];
    setCourses(defaultCourses);
  };

  // Category Management Functions
  const createCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });
      
      if (response.ok) {
        console.log('Category created successfully');
        setOpenCategoryDialog(false);
        setCategoryForm({ name: '', description: '' });
        fetchCategories(); // Refresh categories list
      } else {
        console.error('Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const updateCategory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });
      
      if (response.ok) {
        console.log('Category updated successfully');
        setOpenCategoryDialog(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '' });
        fetchCategories(); // Refresh categories list
      } else {
        console.error('Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('Category deleted successfully');
        setDeletingCategory(null);
        fetchCategories(); // Refresh categories list
      } else {
        console.error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const openEditCategoryDialog = (category) => {
    setEditingCategory(category);
    setCategoryForm({ 
      name: category.name, 
      description: category.description || '' 
    });
    setOpenCategoryDialog(true);
  };

  const closeCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  // Course management functions (for students module)
  const addCourse = async () => {
    if (!newCourseName.trim()) {
      setError('Please enter a course name');
      return;
    }

    if (courses.includes(newCourseName.trim())) {
      setError('This course already exists');
      return;
    }

    setAddingCourse(true);
    setError('');
    
    try {
      // Add course to backend database
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCourseName.trim()
        })
      });

      if (response.ok) {
        // Add to local state
        setCourses(prev => [...prev, newCourseName.trim()]);
        setNewCourseName('');
        console.log('Course added successfully:', newCourseName.trim());
      } else {
        // If API fails, still add locally (fallback)
        setCourses(prev => [...prev, newCourseName.trim()]);
        setNewCourseName('');
        console.warn('Course added locally, API call failed');
      }
    } catch (error) {
      // If network error, still add locally (fallback)
      setCourses(prev => [...prev, newCourseName.trim()]);
      setNewCourseName('');
      console.error('Course added locally due to network error:', error);
    } finally {
      setAddingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the course "${courseToDelete}"?`)) {
      return;
    }

    setDeletingCourseId(courseToDelete);
    
    try {
      // Delete from backend database
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: courseToDelete
        })
      });

      if (response.ok) {
        // Remove from local state
        setCourses(prev => prev.filter(course => course !== courseToDelete));
        console.log('Course deleted successfully:', courseToDelete);
      } else {
        // If API fails, still remove locally (fallback)
        setCourses(prev => prev.filter(course => course !== courseToDelete));
        console.warn('Course deleted locally, API call failed');
      }
    } catch (error) {
      // If network error, still remove locally (fallback)
      setCourses(prev => prev.filter(course => course !== courseToDelete));
      console.error('Course deleted locally due to network error:', error);
    } finally {
      setDeletingCourseId(null);
    }
  };

  // Fetch courses from backend
  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      if (response.ok) {
        const data = await response.json();
        // Handle both array of strings and array of objects
        const courseNames = Array.isArray(data) ? 
          data.map(course => typeof course === 'string' ? course : course.name) : 
          [];
        setCourses(courseNames);
      } else {
        // Fallback to default courses if API fails
        initializeCourses();
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      // Fallback to default courses
      initializeCourses();
    } finally {
      setLoadingCourses(false);
    }
  };

  const createCourse = async () => {
    try {
      if (!courseForm.trim()) {
        alert('Course name is required');
        return;
      }

      // For now, just add to local state - you can implement API call later
      const newCourse = courseForm.trim();
      if (!courses.includes(newCourse)) {
        setCourses(prev => [...prev, newCourse]);
        setCourseForm('');
        alert('Course added successfully');
      } else {
        alert('Course already exists');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    }
  };

  const deleteCourse = async (courseToDelete) => {
    try {
      setCourses(prev => prev.filter(course => course !== courseToDelete));
      alert('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const closeCourseManagementDialog = () => {
    setOpenCourseManagementDialog(false);
    setEditingCourse(null);
    setCourseForm('');
  };

  // Add immediate test data for lenders
  useEffect(() => {
    // Add test lenders if none are loaded
    if (lenders.length === 0 && type === 'orders') {
      console.log('Adding test lenders for debugging');
      setLenders([
        { id: '1', name: 'Dr. John Smith', designation: 'Professor', department: 'Computer Science' },
        { id: '2', name: 'Sarah Wilson', designation: 'Lab Coordinator', department: 'Electrical Engineering' }
      ]);
    }
  }, [type, lenders]);

  useEffect(() => {
    console.log('ListView useEffect triggered for type:', type);
    console.log('Current config:', config[type]);
    console.log('Will fetch from:', `${API_BASE_URL}${config[type]?.endpoint}`);
    
    fetchData();
    if (type === 'products') {
      fetchCategories();
    }
    if (type === 'orders') {
      fetchStudents();
      fetchProducts();
      fetchLenders();
    }
    if (type === 'students') {
      fetchCourses();
    }
  }, [type]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      console.log('handleSubmit called for type:', type, 'Data:', formData);
      console.log('editingItem:', editingItem);
      
      // Validate required fields
      const fields = getFormFields();
      const requiredFields = fields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !formData[field.key] || formData[field.key] === '');
      
      if (missingFields.length > 0) {
        const missingFieldNames = missingFields.map(field => field.label).join(', ');
        setError(`Please fill in all required fields: ${missingFieldNames}`);
        setSubmitting(false);
        return;
      }
      
      let requestBody;
      
      // Special handling for orders
      if (type === 'orders' && !editingItem) {
        // Transform form data to order API format
        requestBody = {
          student_id: formData.student_id,
          lender_id: formData.lender_id,
          items: [{
            product_id: formData.product_id,
            quantity_requested: parseInt(formData.quantity_requested || 1),
            expected_return_date: formData.expected_return_date || null,
            notes: formData.notes || null
          }],
          notes: formData.notes || null,
          expected_return_date: formData.expected_return_date || null
        };
      } else {
        requestBody = formData;
      }
      
      console.log('Request body for', type, ':', requestBody);
      console.log('Form data original:', formData);
      
      // Special validation for students
      if (type === 'students') {
        console.log('Student creation - checking required fields:');
        console.log('Name:', requestBody.name);
        console.log('Student ID:', requestBody.student_id);
        console.log('Email:', requestBody.email);
        console.log('Course:', requestBody.course);
      }
      
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${API_BASE_URL}${currentConfig.endpoint}/${editingItem.id}`
        : `${API_BASE_URL}${currentConfig.endpoint}`;

      console.log('Making request to:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Response status:', response.status, 'Error data:', errorData);
        
        // For students, be more specific about what's happening
        if (type === 'students') {
          console.log('Student creation failed with status:', response.status);
          console.log('Error details:', errorData);
          
          // Check if it's a duplicate student ID issue
          if (response.status === 409 || 
              (response.status === 500 && 
               (errorData.detail?.includes('already exists') || 
                errorData.detail?.includes('duplicate key') ||
                errorData.detail?.includes('UNIQUE constraint')))) {
            
            setError(`Student creation failed: ${errorData.detail || 'Student ID already exists. Please use a different Student ID.'}`);
            setSubmitting(false);
            return;
          }
        }
        
        throw new Error(errorData.detail || `Failed to ${editingItem ? 'update' : 'create'} ${type}`);
      }

      // If we get here, the creation was actually successful
      console.log('Successfully created/updated item, refreshing data...');
      const responseData = await response.json();
      console.log('Created item response:', responseData);
      
      // Send notification based on the type and action
      const itemName = responseData.name || responseData.student_id || responseData.order_number || 'Item';
      if (editingItem) {
        NotificationService.success(
          `${type.slice(0, -1)} Updated`,
          `${itemName} has been successfully updated`,
          null
        );
      } else {
        // Send specific notifications based on type
        switch (type) {
          case 'students':
            NotificationService.studentCreated(itemName);
            break;
          case 'products':
            NotificationService.productCreated(itemName);
            break;
          case 'orders':
            NotificationService.orderCreated(itemName);
            break;
          default:
            NotificationService.success(
              `${type.slice(0, -1)} Created`,
              `${itemName} has been successfully created`,
              null
            );
        }
      }
      
      // Close dialog immediately using direct state setters
      setOpenDialog(false);
      setEditingItem(null);
      setFormData({});
      setError('');
      
      // Force immediate refresh with loading state
      console.log('Forcing immediate data refresh after item creation/update...');
      setLoading(true);
      
      // Add a small delay to ensure backend has processed the creation
      setTimeout(async () => {
        await fetchData();
        setLoading(false);
        console.log('Data refreshed successfully after item creation/update');
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Universal bulk create function
  const handleBulkCreate = async () => {
    try {
      setSubmitting(true);
      let validItems = [];
      let moduleName = type.slice(0, -1);

      console.log('handleBulkCreate called for type:', type);
      console.log('Current bulkItems:', bulkItems);
      console.log('Current bulkProducts:', bulkProducts);

      // Validate items based on module type
      if (type === 'products') {
        validItems = bulkProducts.filter(product => 
          product.name.trim() && product.sku.trim()
        );
      } else if (type === 'students') {
        validItems = bulkItems.filter(student => 
          student.name && student.name.trim() && student.student_id && student.student_id.trim() && student.email && student.email.trim()
        );
      } else if (type === 'orders') {
        console.log('Validating orders, bulkItems:', bulkItems);
        
        // First validate basic fields
        const basicValidItems = bulkItems.filter(order => {
          console.log('Checking order:', order);
          console.log('student_id:', order.student_id, 'type:', typeof order.student_id);
          console.log('product_id:', order.product_id, 'type:', typeof order.product_id);
          console.log('lender_id:', order.lender_id, 'type:', typeof order.lender_id);
          console.log('quantity_requested:', order.quantity_requested, 'type:', typeof order.quantity_requested);
          
          const hasStudentId = order.student_id && String(order.student_id).trim() !== '';
          const hasProductId = order.product_id && String(order.product_id).trim() !== '';
          const hasLenderId = order.lender_id && String(order.lender_id).trim() !== '';
          const hasQuantity = order.quantity_requested && Number(order.quantity_requested) > 0;
          
          console.log('Validation checks:', {
            hasStudentId,
            hasProductId,
            hasLenderId,
            hasQuantity
          });
          
          const isValid = hasStudentId && hasProductId && hasLenderId && hasQuantity;
          console.log('Order validation result:', isValid);
          return isValid;
        });
        
        // Then validate stock availability
        const stockWarnings = [];
        const stockErrors = [];
        
        for (const order of basicValidItems) {
          const product = products.find(p => p.id === order.product_id);
          if (product) {
            const requestedQty = Number(order.quantity_requested);
            const availableQty = product.quantity_available || 0;
            
            if (availableQty === 0) {
              stockErrors.push(`${product.name} is out of stock`);
            } else if (availableQty < requestedQty) {
              stockErrors.push(`${product.name}: Only ${availableQty} available, but ${requestedQty} requested`);
            } else if (availableQty - requestedQty <= (product.minimum_stock_level || 0)) {
              stockWarnings.push(`${product.name} will be low stock after lending`);
            }
          }
        }
        
        // Show stock errors (blocking)
        if (stockErrors.length > 0) {
          setError(`Stock unavailable:\n${stockErrors.join('\n')}`);
          setSubmitting(false);
          return;
        }
        
        // Show stock warnings (non-blocking, but ask for confirmation)
        if (stockWarnings.length > 0) {
          const confirmed = window.confirm(
            `Stock warnings:\n${stockWarnings.join('\n')}\n\nDo you want to continue with lending?`
          );
          if (!confirmed) {
            setSubmitting(false);
            return;
          }
        }
        
        validItems = basicValidItems;
        console.log('Valid orders:', validItems.length, 'out of', bulkItems.length);
      }

      if (validItems.length === 0) {
        const requiredFields = type === 'products' ? 'name and SKU' : 
                              type === 'students' ? 'name and email' :
                              type === 'orders' ? 'student, product, lender and quantity' : 'required fields';
        const errorMessage = `Please add at least one valid ${moduleName} with ${requiredFields}`;
        console.log('Validation failed:', errorMessage);
        console.log('Current bulkItems for orders:', bulkItems);
        setError(errorMessage);
        setSubmitting(false);
        return;
      }

      const promises = validItems.map(item => {
        let itemData = { ...item };
        
        // Type-specific data processing
        if (type === 'products') {
          itemData = {
            ...item,
            category_id: item.category_id || null,
            quantity_total: Number(item.quantity_total) || 0,
            quantity_available: Number(item.quantity_available) || 0,
            unit_price: Number(item.unit_price) || 0
          };
        } else if (type === 'students') {
          itemData = {
            ...item,
            year_of_study: item.year_of_study ? Number(item.year_of_study) : null
          };
        } else if (type === 'orders') {
          // Orders require a different structure with items array
          itemData = {
            student_id: String(item.student_id),
            lender_id: String(item.lender_id),
            items: [{
              product_id: String(item.product_id),
              quantity_requested: Number(item.quantity_requested) || 1,
              notes: item.notes || null
            }],
            notes: item.notes || null,
            lending_date: item.lending_date || null,
            expected_return_date: item.expected_return_date || null
          };
        }
        
        // Remove the temporary id field
        delete itemData.id;
        
        return fetch(`${API_BASE_URL}${currentConfig.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
      });

      const results = await Promise.allSettled(promises);
      console.log('Promise results:', results);
      
      const successful = results.filter(result => {
        if (result.status === 'fulfilled' && result.value.ok) {
          return true;
        }
        if (result.status === 'rejected') {
          console.log('Promise rejected:', result.reason);
        } else if (result.status === 'fulfilled' && !result.value.ok) {
          console.log('Request failed:', result.value.status, result.value.statusText);
        }
        return false;
      }).length;
      
      const failed = results.length - successful;
      console.log(`Bulk creation results: ${successful} successful, ${failed} failed`);

      if (successful > 0) {
        console.log(`${successful} items created successfully`);
        
        // Show notification FIRST
        NotificationService.success(
          `Bulk ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}s Created`,
          `Successfully created ${successful} ${moduleName}${successful > 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
          null
        );
        
        // Close dialog and reset form immediately
        console.log('Closing dialog and resetting form...');
        setOpenDialog(false);
        setEditingItem(null);
        setFormData({});
        setError('');
        resetBulkForm();
        
        // Force immediate refresh with loading state
        console.log('Forcing immediate data refresh after bulk creation...');
        setLoading(true);
        
        // Add a small delay to ensure backend has processed the creation
        setTimeout(async () => {
          await fetchData(); // Refresh the data
          setLoading(false);
          console.log('Data refreshed successfully after bulk creation');
        }, 100);
      } else if (failed > 0) {
        console.log(`All ${failed} items failed to create`);
        setError(`Failed to create any ${type}. Please check the data and try again.`);
        // Don't close dialog on total failure so user can fix and retry
      }
    } catch (error) {
      console.error('Bulk creation error:', error);
      setError(`Failed to create bulk ${type}: ${error.message}`);
      // Don't close dialog on error so user can retry
    } finally {
      setSubmitting(false);
      console.log('Bulk creation process completed, submitting set to false');
    }
  };

  // Reset bulk form
  const resetBulkForm = () => {
    const initialItem = initializeBulkItem();
    setBulkItems([initialItem]);
    
    if (type === 'products') {
      setBulkProducts([initialItem]);
    }
  };

  // Render bulk table headers based on module type
  const renderBulkTableHeaders = () => {
    const formFields = getFormFields();
    
    return (
      <MuiTableRow>
        {formFields.filter(field => field.type !== 'hidden').map(field => (
          <MuiTableCell 
            key={field.key}
            sx={{ 
              minWidth: field.key === 'description' ? 150 :
                       field.key === 'name' ? 120 :
                       field.key === 'category_id' ? 110 :
                       field.key === 'is_returnable' ? 100 :
                       field.key === 'date_of_purchase' ? 120 :
                       field.key === 'sku' ? 80 :
                       field.key === 'unit_price' ? 70 :
                       field.key === 'quantity_available' ? 70 : 80,
              fontWeight: 600, 
              color: '#374151', 
              backgroundColor: '#F9FAFB',
              fontSize: '0.7rem',
              py: 0.5,
              px: 1,
              whiteSpace: 'nowrap'
            }}
          >
            {field.label.toUpperCase()}{field.required ? <span style={{ color: '#EF4444' }}>*</span> : ''}
          </MuiTableCell>
        ))}
        <MuiTableCell sx={{ minWidth: 60, fontWeight: 600, color: '#374151', backgroundColor: '#F9FAFB', fontSize: '0.7rem', py: 0.5, px: 1 }}>
          ACTIONS
        </MuiTableCell>
      </MuiTableRow>
    );
  };

  // Render bulk table cells based on module type  
  const renderBulkTableCells = (item, itemIndex) => {
    const formFields = getFormFields();
    const itemsArray = type === 'products' ? bulkProducts : bulkItems;
    
    return (
      <MuiTableRow key={item.id}>
        {formFields.filter(field => field.type !== 'hidden').map(field => (
          <MuiTableCell key={field.key} sx={{ py: 0.25, px: 0.75, verticalAlign: 'top' }}>
            {field.type === 'select' ? (
              // Use Autocomplete for better search functionality, especially for orders
              <Autocomplete
                size="small"
                fullWidth
                value={(() => {
                  // Find the selected option to show label but keep ID in state
                  const selectedOption = field.options?.find(opt => opt.value === item[field.key]);
                  return selectedOption || null;
                })()}
                options={field.options || []}
                getOptionLabel={(option) => option ? option.label : ''}
                getOptionDisabled={(option) => option.disabled || false}
                isOptionEqualToValue={(option, value) => option.value === value?.value}
                onChange={(event, selectedOption) => {
                  // Store the value (ID) not the label
                  updateBulkItem(item.id, field.key, selectedOption ? selectedOption.value : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Search ${field.label.toLowerCase()}...`}
                    error={field.required && !item[field.key]}
                    sx={{
                      '& .MuiInputBase-input': { 
                        color: '#374151',
                        fontSize: '0.8rem',
                        py: 0.25,
                        px: 0.6
                      },
                      '& .MuiOutlinedInput-root': {
                        minHeight: '32px',
                        height: '32px'
                      },
                      '& .MuiOutlinedInput-notchedOutline': { 
                        borderColor: field.required && !item[field.key] ? '#f44336' : '#E5E7EB' 
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li 
                    {...props} 
                    style={{
                      ...props.style,
                      color: option.disabled ? '#9CA3AF' : '#374151',
                      backgroundColor: option.disabled ? '#F3F4F6' : 'transparent'
                    }}
                  >
                    {option.label}
                  </li>
                )}
                filterOptions={(options, { inputValue }) => {
                  // Custom filter that searches across all words
                  if (!inputValue) return options;
                  const searchTerms = inputValue.toLowerCase().split(' ').filter(term => term.length > 0);
                  return options.filter(option => {
                    const optionText = option.label.toLowerCase();
                    return searchTerms.every(term => optionText.includes(term));
                  });
                }}
                noOptionsText="No matches found"
                sx={{
                  '& .MuiAutocomplete-input': {
                    fontSize: '0.8rem'
                  },
                  '& .MuiAutocomplete-option': {
                    fontSize: '0.8rem'
                  }
                }}
              />
            ) : field.type === 'searchable_select' ? (
              <Autocomplete
                size="small"
                fullWidth
                freeSolo={field.allowAdd}
                value={item[field.key] || ''}
                options={field.options?.map(option => option.label) || []}
                onChange={(event, value) => {
                  updateBulkItem(item.id, field.key, value || '');
                  if (field.allowAdd && value && !field.options?.find(opt => opt.label === value)) {
                    // Add new course to the list
                    setCourses(prev => [...prev, value]);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Select or type ${field.label.toLowerCase()}`}
                    error={field.required && !item[field.key]}
                    sx={{
                      '& .MuiInputBase-input': { 
                        color: '#374151',
                        fontSize: '0.8rem',
                        py: 0.25,
                        px: 0.6
                      },
                      '& .MuiOutlinedInput-root': {
                        minHeight: '32px',
                        height: '32px'
                      },
                      '& .MuiOutlinedInput-notchedOutline': { 
                        borderColor: field.required && !item[field.key] ? '#f44336' : '#E5E7EB' 
                      }
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-input': {
                    fontSize: '0.8rem'
                  }
                }}
              />
            ) : field.type === 'checkbox' ? (
              <Checkbox
                size="small"
                checked={item[field.key] || false}
                onChange={(e) => updateBulkItem(item.id, field.key, e.target.checked)}
                sx={{ color: '#3B82F6' }}
              />
            ) : (
              <TextField
                size="small"
                fullWidth
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                value={item[field.key] || ''}
                onChange={(e) => updateBulkItem(item.id, field.key, field.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                error={field.required && !item[field.key]}
                multiline={field.multiline}
                rows={field.multiline ? 1 : 1}
                InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                sx={{
                  '& .MuiInputBase-input': { 
                    color: '#374151',
                    fontSize: '0.8rem',
                    py: 0.25,
                    px: 0.6
                  },
                  '& .MuiOutlinedInput-root': {
                    minHeight: '32px',
                    height: '32px'
                  },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: field.required && !item[field.key] ? '#f44336' : '#E5E7EB' 
                  }
                }}
              />
            )}
          </MuiTableCell>
        ))}
        <MuiTableCell>
          <IconButton
            size="small"
            color="error"
            onClick={() => removeBulkItem(item.id)}
            disabled={itemsArray.length <= 1}
            sx={{ 
              opacity: itemsArray.length <= 1 ? 0.3 : 1,
              '&:hover': { backgroundColor: itemsArray.length > 1 ? '#FEF2F2' : 'transparent' },
              '&.Mui-disabled': {
                opacity: 0.3
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </MuiTableCell>
      </MuiTableRow>
    );
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const itemToDelete = data.find(item => item.id === id);
      const itemName = itemToDelete?.name || itemToDelete?.student_id || itemToDelete?.order_number || 'Item';
      
      const response = await fetch(`${API_BASE_URL}${currentConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      // Send success notification
      NotificationService.success(
        `${type.slice(0, -1)} Deleted`,
        `${itemName} has been successfully deleted`,
        null
      );

      await fetchData();
      // Clear selections after successful delete
      setSelectedItems([]);
      setSelectAll(false);
    } catch (err) {
      setError(err.message);
      NotificationService.error(
        'Delete Failed',
        `Failed to delete ${type.slice(0, -1)}: ${err.message}`,
        null
      );
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedItems(filteredData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Update select all checkbox based on selection
      setSelectAll(newSelection.length === filteredData.length && filteredData.length > 0);
      
      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      setError('Please select items to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedItems.length} selected ${type}? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setBulkDeleting(true);
    setError(null);

    try {
      // Delete items in parallel for better performance
      const deletePromises = selectedItems.map(itemId =>
        fetch(`${API_BASE_URL}${currentConfig.endpoint}/${itemId}`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if all deletions were successful
      const failedDeletions = responses.filter(response => !response.ok);
      
      if (failedDeletions.length > 0) {
        throw new Error(`Failed to delete ${failedDeletions.length} items`);
      }

      // Clear selections and refresh data
      setSelectedItems([]);
      setSelectAll(false);
      await fetchData();
      
      // Show success notification
      NotificationService.bulkDeleteCompleted(type, selectedItems.length);
      
    } catch (err) {
      setError(`Bulk delete failed: ${err.message}`);
      NotificationService.bulkDeleteFailed(type, selectedItems.length);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clear selections when data changes (e.g., when switching between modules)
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [type, data.length]);

  // Compact filter change handler
  const handleFiltersChange = (allFilters) => {
    const { searchQuery, dateFrom, dateTo, status, category, customFilters } = allFilters;
    
    let filtered = [...data];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const searchableFields = currentConfig.searchFields || Object.keys(item);
        return searchableFields.some(field => {
          const value = item[field];
          if (value == null) return false;
          return value.toString().toLowerCase().includes(searchQuery.toLowerCase());
        });
      });
    }
    
    // Apply date range filter
    if (dateFrom || dateTo) {
      const dateField = currentConfig.dateField || 'date_of_purchase';
      filtered = filtered.filter(item => {
        const itemDate = item[dateField];
        if (!itemDate) return true;
        
        const date = new Date(itemDate);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;
        return true;
      });
    }
    
    // Apply status filter
    if (status && status.length > 0) {
      filtered = filtered.filter(item => {
        const statusField = currentConfig.statusField || 'status';
        const itemStatus = item[statusField];
        
        if (currentConfig.moduleType === 'students') {
          return status.includes(item.is_active ? 'Active' : 'Inactive');
        } else if (currentConfig.moduleType === 'staff') {
          return status.includes(item.is_active ? 'Active' : 'Inactive');
        } else if (currentConfig.moduleType === 'products') {
          const stockLevel = item.quantity_available || 0;
          let stockStatus;
          if (stockLevel === 0) stockStatus = 'Out of Stock';
          else if (stockLevel < 10) stockStatus = 'Low Stock';
          else stockStatus = 'Available';
          return status.includes(stockStatus);
        }
        
        return status.includes(itemStatus);
      });
    }
    
    // Apply category filter
    if (category && category.length > 0) {
      filtered = filtered.filter(item => {
        const categoryField = currentConfig.categoryField || 'category_name';
        
        if (currentConfig.moduleType === 'students') {
          return category.includes(item.course);
        } else if (currentConfig.moduleType === 'staff') {
          return category.includes(item.department);
        } else if (currentConfig.moduleType === 'orders') {
          return category.includes(item.lender_name);
        }
        
        return category.includes(item[categoryField]);
      });
    }

    // Apply custom filters for products
    if (currentConfig.moduleType === 'products' && customFilters) {
      // Price range filter
      if (customFilters.priceMin || customFilters.priceMax) {
        filtered = filtered.filter(item => {
          const price = parseFloat(item.unit_price) || 0;
          const minPrice = customFilters.priceMin ? parseFloat(customFilters.priceMin) : 0;
          const maxPrice = customFilters.priceMax ? parseFloat(customFilters.priceMax) : Infinity;
          return price >= minPrice && price <= maxPrice;
        });
      }

      // Stock range filter
      if (customFilters.stockMin || customFilters.stockMax) {
        filtered = filtered.filter(item => {
          const stock = parseInt(item.quantity_available) || 0;
          const minStock = customFilters.stockMin ? parseInt(customFilters.stockMin) : 0;
          const maxStock = customFilters.stockMax ? parseInt(customFilters.stockMax) : Infinity;
          return stock >= minStock && stock <= maxStock;
        });
      }

      // Product type filter (Returnable/Non-Returnable)
      if (customFilters.productType && customFilters.productType.length > 0) {
        filtered = filtered.filter(item => {
          const isReturnable = item.is_returnable;
          const productType = isReturnable ? 'Returnable' : 'Non-Returnable';
          return customFilters.productType.includes(productType);
        });
      }

      // SKU pattern filter
      if (customFilters.skuPattern) {
        filtered = filtered.filter(item => {
          const sku = item.sku || '';
          return sku.toLowerCase().includes(customFilters.skuPattern.toLowerCase());
        });
      }

      // Purchase date range filter
      if (customFilters.purchaseDateFrom || customFilters.purchaseDateTo) {
        filtered = filtered.filter(item => {
          const itemDate = item.date_of_purchase;
          if (!itemDate) return true;
          
          const date = new Date(itemDate);
          const fromDate = customFilters.purchaseDateFrom ? new Date(customFilters.purchaseDateFrom) : null;
          const toDate = customFilters.purchaseDateTo ? new Date(customFilters.purchaseDateTo) : null;
          
          if (fromDate && date < fromDate) return false;
          if (toDate && date > toDate) return false;
          return true;
        });
      }
    }

    // Apply custom filters for students
    if (currentConfig.moduleType === 'students' && customFilters) {
      // Student ID filter
      if (customFilters.studentId) {
        filtered = filtered.filter(item => {
          const studentId = item.student_id || '';
          return studentId.toLowerCase().includes(customFilters.studentId.toLowerCase());
        });
      }

      // Year of study filter
      if (customFilters.yearOfStudy && customFilters.yearOfStudy.length > 0) {
        filtered = filtered.filter(item => {
          const year = String(item.year_of_study);
          return customFilters.yearOfStudy.includes(year);
        });
      }

      // Email pattern filter
      if (customFilters.emailPattern) {
        filtered = filtered.filter(item => {
          const email = item.email || '';
          return email.toLowerCase().includes(customFilters.emailPattern.toLowerCase());
        });
      }

      // Phone pattern filter
      if (customFilters.phonePattern) {
        filtered = filtered.filter(item => {
          const phone = item.phone || '';
          return phone.includes(customFilters.phonePattern);
        });
      }

      // Department filter
      if (customFilters.department && customFilters.department.length > 0) {
        filtered = filtered.filter(item => {
          return customFilters.department.includes(item.department);
        });
      }
    }
    
    setFilteredData(filtered);
  };

  // Legacy search handlers (kept for compatibility)
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Status update function with duplicate prevention
  const handleStatusUpdate = async (itemId, newStatus) => {
    if (type !== 'orders') return; // Only allow status updates for orders
    
    // Prevent duplicate calls
    if (updatingStatus) {
      console.log('Status update already in progress, ignoring duplicate call');
      return;
    }
    
    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${itemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh data to show the updated status
      await fetchData();
      
      // Close the menu
      setStatusMenuAnchor(null);
      setSelectedItemForStatus(null);
      
      console.log(`Status updated to ${newStatus} for order ${itemId}`);
      
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle status menu open
  const handleStatusMenuOpen = (event, item) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setSelectedItemForStatus(item);
  };

  // Handle status menu close
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setSelectedItemForStatus(null);
  };

  // Handle student status toggle
  const handleStudentStatusToggle = async (student) => {
    if (type !== 'students') return; // Only allow for students
    
    const newStatus = !student.is_active;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...student,
          is_active: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update student status: ${response.statusText}`);
      }

      const updatedStudent = await response.json();
      
      // Update the local data
      setData(prevData => 
        prevData.map(item => 
          item.id === student.id ? updatedStudent : item
        )
      );

      setError(null); // Clear any error
      setSuccess(`Student status updated to ${newStatus ? 'Active' : 'Inactive'}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error updating student status:', err);
      setSuccess(null); // Clear any success message
      setError(`Failed to update student status: ${err.message}`);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (item = null) => {
    console.log('=== HANDLE OPEN DIALOG ===');
    console.log('Item passed:', item);
    console.log('Type:', type);
    
    setEditingItem(item);
    
    if (item) {
      // Editing existing item - use single form
      setFormData(item);
    } else {
      // Creating new items - use bulk form, clear any form data
      setFormData({});
      // Ensure bulk items are initialized
      const initialItem = initializeBulkItem();
      setBulkItems([initialItem]);
      if (type === 'products') {
        setBulkProducts([initialItem]);
      }
    }
    
    setOpenDialog(true);
    setError(''); // Clear any existing errors
    
    console.log('Dialog opened for', item ? 'editing' : 'bulk creation');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({});
    setError(''); // Clear any errors when closing
  };

  // Universal bulk functions
  const addBulkItem = () => {
    const newItem = initializeBulkItem();
    setBulkItems([...bulkItems, newItem]);
    
    // Legacy support for products
    if (type === 'products') {
      setBulkProducts([...bulkProducts, newItem]);
    }
  };

  const removeBulkItem = (id) => {
    if (bulkItems.length > 1) {
      setBulkItems(bulkItems.filter(item => item.id !== id));
      
      // Legacy support for products
      if (type === 'products') {
        setBulkProducts(bulkProducts.filter(p => p.id !== id));
      }
    }
  };

  const updateBulkItem = (id, field, value) => {
    setBulkItems(bulkItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
    
    // Legacy support for products
    if (type === 'products') {
      setBulkProducts(bulkProducts.map(product =>
        product.id === id ? { ...product, [field]: value } : product
      ));
    }
  };

  // Legacy functions for backward compatibility
  const addBulkProduct = addBulkItem;
  const removeBulkProduct = removeBulkItem;
  const updateBulkProduct = updateBulkItem;

  // Status chip component
  const StatusChip = ({ status, onClick, clickable = false }) => {
    const getStatusColor = () => {
      if (!status) return 'default';
      const statusLower = status.toLowerCase();
      
      // Order statuses
      if (statusLower === 'pending') return 'warning';
      if (statusLower === 'approved') return 'info';
      if (statusLower === 'completed') return 'success';
      if (statusLower === 'overdue') return 'error';
      
      // General statuses
      if (statusLower.includes('active') || statusLower.includes('in stock')) return 'success';
      if (statusLower.includes('low') || statusLower.includes('pending')) return 'warning';
      if (statusLower.includes('out') || statusLower.includes('inactive')) return 'error';
      return 'default';
    };

    const getStatusIcon = () => {
      if (!status) return null;
      const statusLower = status.toLowerCase();
      
      if (statusLower === 'pending') return <ScheduleIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      if (statusLower === 'approved') return <CheckIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      if (statusLower === 'completed') return <CheckCircleIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      if (statusLower === 'overdue') return <CancelIcon sx={{ fontSize: '16px', mr: 0.5 }} />;
      
      return null;
    };

    return (
      <Chip
        icon={getStatusIcon()}
        label={status || 'Unknown'}
        color={getStatusColor()}
        size="small"
        onClick={clickable ? onClick : undefined}
        sx={{
          fontWeight: 600,
          cursor: clickable ? 'pointer' : 'default',
          '&:hover': clickable ? {
            opacity: 0.8
          } : {},
          '& .MuiChip-label': {
            color: '#374151'
          }
        }}
      />
    );
  };

  const StockLevelChip = ({ quantity }) => {
    const getStockLevel = (qty) => {
      const numQty = parseInt(qty) || 0;
      if (numQty <= 5) return { level: 'Low Stock', color: 'error', icon: <WarningIcon sx={{ fontSize: '16px', mr: 0.5 }} /> };
      if (numQty <= 20) return { level: 'Medium Stock', color: 'warning', icon: <InventoryIcon sx={{ fontSize: '16px', mr: 0.5 }} /> };
      return { level: 'High Stock', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '16px', mr: 0.5 }} /> };
    };

    const stockInfo = getStockLevel(quantity);

    return (
      <Chip
        icon={stockInfo.icon}
        label={stockInfo.level}
        color={stockInfo.color}
        size="small"
        sx={{
          fontWeight: 600,
          '& .MuiChip-label': {
            color: '#374151'
          }
        }}
      />
    );
  };

  // Render cell content
  const renderCellContent = (item, column) => {
    let value = item[column.key];
    
    // Handle special cases
    if (column.key === 'is_active' && typeof value === 'boolean') {
      value = value ? 'Active' : 'Inactive';
    }
    
    switch (column.type) {
      case 'status':
        // Make status clickable for students to toggle active/inactive
        if (column.key === 'is_active' && type === 'students') {
          return (
            <StatusChip 
              status={value} 
              clickable={true}
              onClick={() => handleStudentStatusToggle(item)}
            />
          );
        }
        return <StatusChip status={value} />;
      case 'stock_level':
        return <StockLevelChip quantity={value} />;
      case 'boolean':
        return (
          <Chip
            label={value ? 'Returnable' : 'Non-Returnable'}
            color={value ? 'success' : 'default'}
            size="small"
            sx={{
              fontWeight: 600,
              '& .MuiChip-label': {
                color: '#374151',
                fontSize: '0.75rem'
              }
            }}
          />
        );
      case 'number':
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#3B82F6' }}>
            {column.prefix || ''}{value}
          </Typography>
        );
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'email':
        return (
          <Typography variant="body2" sx={{ color: '#3B82F6' }}>
            {value}
          </Typography>
        );
      default:
        return value || '-';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress sx={{ color: '#3B82F6' }} />
      </Box>
    );
  }

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
        // Ensure the card has proper overflow handling
        overflow: 'visible',
        position: 'relative',
        // Ensure proper width calculation
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
            flex: '1 1 auto',  // Allow shrinking
            minWidth: 0,  // Allow shrinking
            maxWidth: selectedItems.length > 0 ? 'calc(100% - 350px)' : 'calc(100% - 240px)'  // Reserve space for wider buttons
          }}>
            {currentConfig.icon}
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: '#374151',
              whiteSpace: 'nowrap',  // Prevent text wrapping
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '1.1rem'
            }}>
              {currentConfig.title}
            </Typography>
            <Badge badgeContent={data.length} color="primary" sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#3B82F6',
                color: '#374151'
              }
            }}>
              <Box />
            </Badge>
          </Box>
          
          <Box sx={{ 
            // Fixed button container to prevent overlap
            width: selectedItems.length > 0 ? '350px' : '240px',  // Increased width to accommodate wider buttons
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,  // Add gap between buttons
            overflow: 'visible',
            position: 'relative',
            zIndex: 1000,  // Higher z-index
            flexShrink: 0,  // Prevent shrinking
            ml: 2  // Small left margin
          }}>
            {/* Bulk Delete Button - only show when items are selected */}
            {selectedItems.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                sx={{
                  minHeight: '32px',
                  height: '32px',
                  minWidth: '120px',
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
                  },
                  '&:disabled': {
                    border: '1px solid rgba(255, 82, 82, 0.2)',
                    color: 'rgba(255, 82, 82, 0.5)'
                  }
                }}
              >
                {bulkDeleting ? (
                  <CircularProgress size={16} sx={{ color: '#FF5252' }} />
                ) : (
                  `Delete (${selectedItems.length})`
                )}
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => {
                console.log('Manual refresh triggered for:', type);
                fetchData();
              }}
              sx={{
                minHeight: '32px',
                height: '32px',
                minWidth: '100px',
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.025em',
                borderRadius: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                border: '1px solid #3B82F6',
                color: '#3B82F6',
                '&:hover': {
                  border: '1px solid #2563EB',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }
              }}
            >
              Refresh
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => {
                handleOpenDialog();
              }}
              sx={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                minHeight: '32px',
                height: '32px',
                minWidth: '120px',
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.025em',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#2563EB',
                },
              }}
            >
              Add {type.slice(0, -1)}
            </Button>
            
            {/* Category Management Buttons - Only for products */}
            {type === 'products' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon fontSize="small" />}
                  onClick={() => setOpenCategoryManagementDialog(true)}
                  sx={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    minHeight: '32px',
                    height: '32px',
                    minWidth: '160px',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    letterSpacing: '0.025em',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: '#2563EB',
                    },
                  }}
                >
                  Manage Categories
                </Button>
              </>
            )}

            {/* Course Management Button - Only for students */}
            {type === 'students' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon fontSize="small" />}
                  onClick={() => {
                    console.log('Manage Courses button clicked!');
                    setOpenCourseManagementDialog(true);
                  }}
                  sx={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    minHeight: '32px',
                    height: '32px',
                    minWidth: '160px',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    letterSpacing: '0.025em',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: '#2563EB',
                    },
                  }}
                >
                  Manage Courses
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 1, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', py: 0.5 }}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 1, backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', py: 0.5 }}>
            {success}
          </Alert>
        )}

        {/* Compact Search and Filters */}
        <CompactFilters
          config={currentConfig}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onFiltersChange={handleFiltersChange}
          data={filteredData}
        />

        {/* Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            maxHeight: 'none',
            height: 'auto',
            overflow: 'visible'
          }}
        >
          <Table stickyHeader={false} size="small" sx={{ '& .MuiTableCell-root': { py: 0.1 } }}>  {/* Reduced global padding */}
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                {/* Select All Checkbox Column */}
                <TableCell 
                  sx={{ 
                    color: '#374151', 
                    fontWeight: 700,
                    borderBottom: '1px solid #E5E7EB',
                    width: '30px',      // Narrower checkbox column
                    textAlign: 'center',
                    py: 0.25,           // Reduced padding
                    px: 0.25            // Reduced padding
                  }}
                >
                  <Tooltip title={selectAll ? 'Deselect All' : 'Select All'}>
                    <Checkbox
                      checked={selectAll}
                      indeterminate={selectedItems.length > 0 && selectedItems.length < filteredData.length}
                      onChange={handleSelectAll}
                      disabled={filteredData.length === 0}
                      sx={{
                        color: '#3B82F6',
                        '&.Mui-checked': {
                          color: '#3B82F6',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: '#3B82F6',
                        }
                      }}
                    />
                  </Tooltip>
                </TableCell>
                {currentConfig.columns.map((column) => (
                  <TableCell 
                    key={column.key}
                    sx={{ 
                      color: '#374151', 
                      fontWeight: 700,
                      borderBottom: '1px solid #E5E7EB',
                      py: 0.25,  // Reduced padding
                      px: 0.5,   // Reduced padding
                      fontSize: '0.7rem'  // Smaller font size
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell 
                  sx={{ 
                    color: '#374151', 
                    fontWeight: 700,
                    borderBottom: '1px solid #E5E7EB',
                    textAlign: 'center',
                    py: 0.25,  // Reduced padding
                    px: 0.5,   // Reduced padding
                    fontSize: '0.7rem',  // Smaller font size
                    width: '80px'  // Narrower actions column
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Debug info */}
              {console.log('Rendering table with data:', data)}
              {console.log('Data length:', data.length)}
              
              {filteredData && filteredData.length > 0 ? filteredData.map((item, index) => {
                console.log(`Rendering row ${index}:`, item);
                const isSelected = selectedItems.includes(item.id);
                return (
                  <TableRow
                    key={item.id || `item-${index}`}
                    sx={{
                        '&:hover': {
                          backgroundColor: '#F8FAFC'
                        },
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        borderBottom: '1px solid #E5E7EB'
                      }}
                    >
                      {/* Individual Select Checkbox */}
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid #E5E7EB',
                          textAlign: 'center',
                          width: '30px',  // Narrower checkbox column
                          py: 0.1,        // Reduced padding
                          px: 0.25        // Reduced padding
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectItem(item.id)}
                          size="small"
                          sx={{
                            color: '#3B82F6',
                            '&.Mui-checked': {
                              color: '#3B82F6',
                            }
                          }}
                        />
                      </TableCell>
                      {currentConfig.columns.map((column) => (
                        <TableCell 
                          key={`${item.id}-${column.key}`}
                          sx={{ 
                            color: '#374151',
                            borderBottom: '1px solid #E5E7EB',
                            py: 0.1,  // Reduced padding
                            px: 0.5,  // Reduced padding
                            fontSize: '0.75rem',  // Smaller font size
                            lineHeight: 1.2  // Tighter line height
                          }}
                        >
                          {renderCellContent(item, column)}
                        </TableCell>
                      ))}
                      <TableCell 
                        sx={{ 
                          borderBottom: '1px solid #E5E7EB',
                          textAlign: 'center',
                          py: 0.1,   // Reduced padding
                          px: 0.25,  // Reduced padding
                          width: '80px'  // Narrower width
                        }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleOpenDialog(item)}
                            size="small"
                            sx={{ color: '#3B82F6', mr: 0.25, p: 0.25 }}  // Reduced padding and margin
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Status Update Button - only for orders */}
                        {type === 'orders' && (
                          <Tooltip title="Update Status">
                            <IconButton
                              onClick={(e) => handleStatusMenuOpen(e, item)}
                              size="small"
                              sx={{ color: '#FFB74D', mr: 0.25, p: 0.25 }}  // Reduced padding and margin
                              disabled={updatingStatus}
                            >
                              {updatingStatus && selectedItemForStatus?.id === item.id ? (
                                <CircularProgress size={14} sx={{ color: '#FFB74D' }} />  // Smaller loading icon
                              ) : (
                                <MoreVertIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(item.id)}
                            size="small"
                            sx={{ color: '#FF5252', p: 0.25 }}  // Reduced padding
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                }) : null}
              {(!filteredData || filteredData.length === 0) && (
                <TableRow>
                  <TableCell 
                    colSpan={currentConfig.columns.length + 2} // +2 for checkbox and actions columns
                    sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: '#888888',
                      borderBottom: 'none'
                    }}
                  >
                    {searchQuery 
                      ? `No ${type} found matching "${searchQuery}". Try adjusting your search.`
                      : `No ${type} found. Click "Add ${type.slice(0, -1)}" to get started.`
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth={(type === 'products' || type === 'orders' || type === 'students') && !editingItem ? "xl" : "sm"}
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              ...((type === 'products' || type === 'orders' || type === 'students') && !editingItem && {
                minWidth: '1300px',
                width: '90vw',
                maxWidth: '90vw',
                maxHeight: '90vh',
                height: 'auto'
              })
            }
          }}
        >
          <DialogTitle sx={{ color: '#374151', fontWeight: 700, fontSize: '1.1rem', py: 1.5 }}>
            {editingItem ? `Edit ${type.slice(0, -1)}` : `Bulk Add ${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)}s`}
          </DialogTitle>
          <DialogContent sx={{ overflow: 'visible', py: 1 }}>
            {/* Edit Mode - Single Item Form */}
            {editingItem && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {getFormFields().map((field) => {
                  if (field.type === 'select') {
                    return (
                      <FormControl key={field.key} fullWidth required={field.required}
                        error={field.required && (!formData[field.key] || formData[field.key] === '')}
                      >
                        <InputLabel sx={{ color: '#888888' }}>
                          {field.label}{field.required ? <span style={{ color: '#EF4444' }}> *</span> : ''}
                        </InputLabel>
                        <Select
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            console.log(`Select field ${field.key} changed to:`, e.target.value);
                            setFormData({...formData, [field.key]: e.target.value});
                            console.log('Updated formData:', {...formData, [field.key]: e.target.value});
                          }}
                          sx={{
                            color: '#374151',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: field.required && (!formData[field.key] || formData[field.key] === '') ? '#f44336' : '#E5E7EB'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#3B82F6'
                            }
                          }}
                        >
                          {field.options?.map((option) => (
                            <MenuItem 
                              key={typeof option === 'object' ? option.value : option} 
                              value={typeof option === 'object' ? option.value : option} 
                              sx={{ color: '#374151' }}
                            >
                              {typeof option === 'object' ? option.label : option}
                            </MenuItem>
                          ))}
                        </Select>
                        {field.required && (!formData[field.key] || formData[field.key] === '') && (
                          <span style={{ color: '#f44336', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                            This field is required
                          </span>
                        )}
                      </FormControl>
                    );
                  }

                  if (field.type === 'searchable_select') {
                    return (
                      <Autocomplete
                        key={field.key}
                        fullWidth
                        freeSolo={field.allowAdd}
                        value={formData[field.key] || ''}
                        options={field.options?.map(option => option.label) || []}
                        onChange={(event, value) => {
                          console.log(`Searchable select field ${field.key} changed to:`, value);
                          setFormData({...formData, [field.key]: value || ''});
                          console.log('Updated formData:', {...formData, [field.key]: value || ''});
                          if (field.allowAdd && value && !field.options?.find(opt => opt.label === value)) {
                            // Add new course to the list
                            setCourses(prev => [...prev, value]);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={field.required ? (
                              <span>
                                {field.label}
                                <span style={{ color: '#EF4444' }}> *</span>
                              </span>
                            ) : field.label}
                            required={field.required}
                            error={field.required && (!formData[field.key] || formData[field.key] === '')}
                            helperText={field.required && (!formData[field.key] || formData[field.key] === '') ? 'This field is required' : 'Type to search or add new'}
                            sx={{
                              '& .MuiInputLabel-root': { color: '#888888' },
                              '& .MuiInputBase-input': { color: '#374151' },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: field.required && (!formData[field.key] || formData[field.key] === '') ? '#f44336' : '#E5E7EB'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3B82F6'
                              }
                            }}
                          />
                        )}
                      />
                    );
                  }

                  return (
                    <TextField
                      key={field.key}
                      label={field.required ? (
                        <span>
                          {field.label}
                          <span style={{ color: '#EF4444' }}> *</span>
                        </span>
                      ) : field.label}
                      type={field.type === 'date' ? 'date' : field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => {
                        console.log(`Field ${field.key} changed to:`, e.target.value);
                        setFormData({...formData, [field.key]: e.target.value});
                        console.log('Updated formData:', {...formData, [field.key]: e.target.value});
                      }}
                      required={field.required}
                      multiline={field.multiline}
                      rows={field.multiline ? 3 : 1}
                      fullWidth
                      error={field.required && (!formData[field.key] || formData[field.key] === '')}
                      helperText={field.required && (!formData[field.key] || formData[field.key] === '') ? 'This field is required' : ''}
                      InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                      sx={{
                        '& .MuiInputLabel-root': { color: '#888888' },
                        '& .MuiInputBase-input': { color: '#374151' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E5E7EB'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3B82F6'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* Bulk Items - For all modules in create mode */}
            {!editingItem && (
              <Box sx={{ mt: 1.5 }}>
                <MuiTableContainer 
                  component={Paper} 
                  sx={{ 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    overflow: 'visible'
                  }}
                >
                  <MuiTable stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
                    <MuiTableHead>
                      {renderBulkTableHeaders()}
                    </MuiTableHead>
                    <MuiTableBody>
                      {(type === 'products' ? bulkProducts : bulkItems).map((item, index) => 
                        renderBulkTableCells(item, index)
                      )}
                    </MuiTableBody>
                  </MuiTable>
                </MuiTableContainer>

                <Box sx={{ mt: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addBulkItem}
                    variant="outlined"
                    sx={{ 
                      color: '#3B82F6', 
                      borderColor: '#3B82F6', 
                      '&:hover': { 
                        backgroundColor: '#EFF6FF',
                        borderColor: '#2563EB'
                      } 
                    }}
                  >
                    Add More {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              disabled={submitting}
              sx={{ color: '#374151', borderColor: '#E5E7EB' }}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!editingItem) {
                  // Bulk create (for new items)
                  handleBulkCreate();
                } else {
                  // Single update (for editing existing items)
                  handleSubmit();
                }
              }}
              variant="contained"
              disabled={submitting}
              type="button"
              sx={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#2563EB',
                },
                '&:disabled': {
                  backgroundColor: '#666666',
                  color: '#CCCCCC'
                }
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
              ) : (
                editingItem 
                  ? 'Update' 
                  : (() => {
                      const items = type === 'products' ? bulkProducts : bulkItems;
                      const validItems = items.filter(item => {
                        if (type === 'products') return item.name && item.name.trim() && item.sku && item.sku.trim();
                        if (type === 'students') return item.name && item.name.trim() && item.student_id && item.student_id.trim() && item.email && item.email.trim();
                        if (type === 'orders') return item.student_id && item.product_id && item.lender_id;
                        return true;
                      });
                      const moduleName = type.charAt(0).toUpperCase() + type.slice(1);
                      return `Create ${validItems.length} ${moduleName}`;
                    })()
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Update Menu - only for orders */}
        {type === 'orders' && (
          <Menu
            anchorEl={statusMenuAnchor}
            open={Boolean(statusMenuAnchor)}
            onClose={handleStatusMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                minWidth: '180px'
              }
            }}
          >
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'pending')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <ScheduleIcon sx={{ mr: 1, color: '#FFB74D' }} />
              Pending
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'approved')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <CheckIcon sx={{ mr: 1, color: '#2196F3' }} />
              Approved
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'completed')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <CheckCircleIcon sx={{ mr: 1, color: '#4CAF50' }} />
              Completed
            </MenuItem>
            <MenuItem 
              onClick={() => handleStatusUpdate(selectedItemForStatus?.id, 'overdue')}
              disabled={updatingStatus}
              sx={{ 
                color: '#374151',
                '&:hover': { backgroundColor: '#E5E7EB' }
              }}
            >
              <CancelIcon sx={{ mr: 1, color: '#F44336' }} />
              Overdue
            </MenuItem>
          </Menu>
        )}

        {/* Category Management Dialogs - Only for products */}
        {type === 'products' && (
          <>
            {/* Add/Edit Category Dialog */}
            <Dialog 
              open={openCategoryDialog} 
              onClose={closeCategoryDialog} 
              maxWidth="sm" 
              fullWidth
            >
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  sx={{ mt: 1, mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  multiline
                  rows={3}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={closeCategoryDialog}>Cancel</Button>
                <Button 
                  onClick={editingCategory ? updateCategory : createCategory}
                  variant="contained"
                  sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                >
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Manage Categories Dialog */}
            <Dialog 
              open={openCategoryManagementDialog} 
              onClose={() => setOpenCategoryManagementDialog(false)}
              maxWidth="md" 
              fullWidth
            >
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                  <CategoryIcon color="primary" />
                  Category Management
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 1 }}>
                  {categories.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No categories found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Add New Category" to create your first category
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Category Name</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categories.map((category) => (
                            <TableRow key={category.id} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CategoryIcon fontSize="small" color="primary" />
                                  <Typography variant="body2" fontWeight={500}>
                                    {category.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {category.description || 'No description'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" gap={1} justifyContent="center">
                                  <Tooltip title="Edit Category">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => {
                                        setOpenCategoryManagementDialog(false);
                                        openEditCategoryDialog(category);
                                      }}
                                      color="primary"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Category">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => setDeletingCategory(category)}
                                      color="error"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button 
                  startIcon={<CategoryIcon />}
                  onClick={() => {
                    setOpenCategoryManagementDialog(false);
                    setOpenCategoryDialog(true);
                  }}
                  variant="outlined"
                >
                  Add New Category
                </Button>
                <Button onClick={() => setOpenCategoryManagementDialog(false)}>
                  Close
                </Button>
              </DialogActions>
            </Dialog>

            {/* Delete Category Confirmation Dialog */}
            <Dialog 
              open={!!deletingCategory} 
              onClose={() => setDeletingCategory(null)}
              maxWidth="xs"
            >
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={1} color="error.main">
                  <DeleteIcon />
                  Delete Category
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography>
                  Are you sure you want to delete the category <strong>"{deletingCategory?.name}"</strong>? 
                </Typography>
                <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                  âš ï¸ This action cannot be undone. Products in this category will become uncategorized.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeletingCategory(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => deleteCategory(deletingCategory.id)}
                  color="error"
                  variant="contained"
                >
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}

        {/* Course Management Dialog - Available for all types */}
        <Dialog 
          open={openCourseManagementDialog} 
          onClose={() => setOpenCourseManagementDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            fontWeight: 600
          }}>
            <SettingsIcon />
            Manage Courses
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            {/* Add Course Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                Add New Course
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  fullWidth
                  label="Course Name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Enter course name"
                  size="small"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f8fafc',
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={addCourse}
                  disabled={!newCourseName.trim() || addingCourse}
                  sx={{
                    minWidth: '100px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
                      color: 'white'
                    },
                    '&:disabled': {
                      color: 'rgba(255, 255, 255, 0.6)'
                    }
                  }}
                >
                  {addingCourse ? <CircularProgress size={20} color="inherit" /> : 'Add Course'}
                </Button>
              </Box>
            </Box>
            
            {/* Courses List Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                Available Courses ({courses?.length || 0})
              </Typography>
              {loadingCourses ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={32} />
                </Box>
              ) : !courses || courses.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
                  <SchoolIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    No courses available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your first course using the form above
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ border: '1px solid #e5e7eb' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Course Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {courses.map((course, index) => (
                        <TableRow 
                          key={course || `course-${index}`} 
                          hover
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: '#f8fafc' 
                            } 
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <SchoolIcon fontSize="small" sx={{ color: '#1976d2' }} />
                              <Typography variant="body2" fontWeight={500} color="#374151">
                                {course}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Delete Course">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteCourse(course)}
                                sx={{ 
                                  color: '#dc2626',
                                  '&:hover': { 
                                    backgroundColor: '#fef2f2' 
                                  }
                                }}
                                disabled={deletingCourseId === course}
                              >
                                {deletingCourseId === course ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setOpenCourseManagementDialog(false)}
              variant="outlined"
              sx={{
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Paper>
  );
};

export default ListView;
