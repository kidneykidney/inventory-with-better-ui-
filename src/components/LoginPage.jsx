import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  Checkbox, FormControlLabel, InputAdornment, IconButton, 
  Container, Paper, Divider, Fade, LinearProgress, Chip,
  Avatar, Link, Tooltip
} from '@mui/material';
import {
  Visibility, VisibilityOff, Login as LoginIcon, 
  Security as SecurityIcon, Inventory as InventoryIcon,
  AdminPanelSettings as AdminIcon, Lock as LockIcon,
  Email as EmailIcon, Person as PersonIcon, Inventory2 as Inventory2Icon,
  LocalShipping as ShippingIcon, Storage as StorageIcon,
  Assessment as AnalyticsIcon, QrCode as QrCodeIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

// Dark theme colors matching your inventory system
const LOGIN_COLORS = {
  primary: '#00D4AA',        // Your teal accent color (keeping as is - it's already green)
  secondary: '#00B894',      // Darker green instead of purple
  accent: '#00F5FF',         // Bright cyan
  success: '#4CAF50',        // Green
  warning: '#FF9800',        // Orange
  error: '#FF6B6B',          // Soft red
  background: '#0A0A0A',     // Dark background
  surface: '#1A1A1A',        // Dark surface
  surfaceElevated: '#2A2A2A', // Elevated surface
  text: '#FFFFFF',           // White text
  textSecondary: '#B0B0B0',  // Secondary text
  border: '#333333',         // Border color
  glow: 'rgba(0, 212, 170, 0.3)' // Glow effect
};

// Canvas Particle System Component
const CanvasParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const particles = [];
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1000,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          vz: Math.random() * 0.8 + 0.3,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          color: Math.random() > 0.7 ? '#00D4AA' : Math.random() > 0.5 ? '#00B894' : '#26D0CE',
          type: Math.floor(Math.random() * 3) // 0: box, 1: circle, 2: triangle (inventory items)
        });
      }
      particlesRef.current = particles;
    };

    initParticles();

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z -= particle.vz;

        // Mouse interaction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          particle.x += dx * 0.005;
          particle.y += dy * 0.005;
        }

        // Reset particle if it goes off screen
        if (particle.z <= 0 || particle.x < -50 || particle.x > canvas.width + 50 || 
            particle.y < -50 || particle.y > canvas.height + 50) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.z = 1000;
        }

        // Calculate size based on z-depth
        const scale = (1000 - particle.z) / 1000;
        const size = particle.size * scale;
        const opacity = particle.opacity * scale;

        if (scale > 0.1) {
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = particle.color;
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 1;

          // Draw different shapes for inventory items
          if (particle.type === 0) {
            // Box (package/inventory item)
            ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size);
            ctx.strokeRect(particle.x - size/2, particle.y - size/2, size, size);
          } else if (particle.type === 1) {
            // Circle (item/product)
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            // Triangle (shipping/logistics)
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y - size/2);
            ctx.lineTo(particle.x - size/2, particle.y + size/2);
            ctx.lineTo(particle.x + size/2, particle.y + size/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }

        // Connect nearby particles
        particlesRef.current.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const opacity = (100 - distance) / 100 * 0.3;
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = '#00D4AA';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Mouse tracking
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

// Floating Inventory Icons Component
const FloatingInventoryIcons = () => {
  const icons = [
    { Icon: InventoryIcon, delay: 0 },
    { Icon: Inventory2Icon, delay: 1 },
    { Icon: ShippingIcon, delay: 2 },
    { Icon: StorageIcon, delay: 3 },
    { Icon: AnalyticsIcon, delay: 4 },
    { Icon: QrCodeIcon, delay: 5 }
  ];

  return (
    <Box sx={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', zIndex: 2 }}>
      {icons.map(({ Icon, delay }, index) => (
        <motion.div
          key={index}
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
            scale: 0
          }}
          animate={{
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth
            ],
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight
            ],
            opacity: [0, 0.3, 0],
            scale: [0, 1, 0],
            rotate: [0, 360, 720]
          }}
          transition={{
            duration: 30 + Math.random() * 15,
            repeat: Infinity,
            delay: delay * 3,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            color: Math.random() > 0.5 ? LOGIN_COLORS.primary : LOGIN_COLORS.secondary,
            fontSize: '24px',
            pointerEvents: 'none'
          }}
        >
          <Icon sx={{ fontSize: 'inherit' }} />
        </motion.div>
      ))}
    </Box>
  );
};

function LoginPage({ onLoginSuccess }) {
  // State management
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSystemInitialized, setIsSystemInitialized] = useState(true);
  const [initializingSystem, setInitializingSystem] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Global style injection to override autofill
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #1A1A1A inset !important;
        -webkit-text-fill-color: #FFFFFF !important;
        background-color: #1A1A1A !important;
        background-image: none !important;
        background: #1A1A1A !important;
        color: #FFFFFF !important;
        border-radius: 12px !important;
        transition: background-color 5000s ease-in-out 0s !important;
      }
      input:-webkit-autofill::first-line {
        color: #FFFFFF !important;
        font-weight: 400 !important;
      }
      .MuiOutlinedInput-root {
        background-color: transparent !important;
        background: transparent !important;
      }
      .MuiOutlinedInput-input {
        background-color: transparent !important;
        background: transparent !important;
        color: #FFFFFF !important;
      }
      .MuiTextField-root input {
        color: #FFFFFF !important;
      }
      /* Additional override for stubborn autofill */
      input[data-autocompleted] {
        background-color: #1A1A1A !important;
        color: #FFFFFF !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, rotateY: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateY: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.4, 0, 0.2, 1],
        delay: 0.3
      }
    }
  };

  const logoVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.5
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.3 }
    }
  };

  // Check if system is initialized
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.status === 401) {
        // No valid token, system might need initialization
        setIsSystemInitialized(true); // Assume it's initialized for now
      }
    } catch (error) {
      console.log('System status check:', error);
    }
  };

  const initializeSystem = async () => {
    setInitializingSystem(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/init-system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`System initialized! Default credentials:
Username: ${data.admin_username}
Password: ${data.default_password}
Please change the password after first login.`);
        setIsSystemInitialized(true);
        setFormData({
          username: data.admin_username,
          password: data.default_password,
          rememberMe: false
        });
      } else {
        setError(data.detail || 'System initialization failed');
      }
    } catch (error) {
      setError('Failed to initialize system. Please check your connection.');
    } finally {
      setInitializingSystem(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting login to:', `${API_BASE_URL}/api/auth/login`);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          remember_me: formData.rememberMe
        })
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        // Store tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        setSuccess('Login successful! Redirecting...');
        
        // Call success callback
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1000);
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (error) {
      setError('Connection failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      height: '100vh', // Fix height to viewport
      background: `linear-gradient(135deg, ${LOGIN_COLORS.background} 0%, #1A1A2E 50%, ${LOGIN_COLORS.surface} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden', // Hide scrollbar completely
      padding: { xs: 1, sm: 2 } // Add responsive padding
    }}>
      {/* Canvas Particle System */}
      <CanvasParticles />
      
      {/* Floating Inventory Icons */}
      <FloatingInventoryIcons />

      {/* Animated Background Grid */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 212, 170, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 170, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
          transition: 'transform 0.5s ease',
          opacity: 0.3,
          zIndex: 1
        }}
      />

      {/* Smaller glowing orbs */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '200px', // Reduced from 300px
          height: '200px', // Reduced from 300px
          background: `radial-gradient(circle, ${LOGIN_COLORS.primary}40 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 1
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '150px', // Reduced from 250px
          height: '150px', // Reduced from 250px
          background: `radial-gradient(circle, ${LOGIN_COLORS.secondary}40 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 1
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
          x: [0, -40, 0],
          y: [0, 20, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />

      <Container maxWidth="sm" sx={{ 
        position: 'relative', 
        zIndex: 10,
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ width: '100%' }}
        >
          <motion.div variants={cardVariants}>
            <Card sx={{
              borderRadius: 4,
              background: `linear-gradient(145deg, ${LOGIN_COLORS.surface}95 0%, ${LOGIN_COLORS.surfaceElevated}95 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${LOGIN_COLORS.border}`,
              boxShadow: `
                0 25px 50px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Card Glow Effect */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${LOGIN_COLORS.primary}, ${LOGIN_COLORS.secondary}, ${LOGIN_COLORS.accent})`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease-in-out infinite'
                }}
              />

              <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 }, position: 'relative' }}> {/* Responsive padding */}
                {/* Header - Compact */}
                <motion.div variants={itemVariants}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}> {/* Reduced margin */}
                    <motion.div
                      variants={logoVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                    >
                      <Avatar sx={{
                        width: 60, // Reduced from 80
                        height: 60, // Reduced from 80
                        mx: 'auto',
                        mb: 1.5, // Reduced margin
                        background: `linear-gradient(135deg, ${LOGIN_COLORS.primary} 0%, ${LOGIN_COLORS.secondary} 100%)`,
                        boxShadow: `0 8px 32px ${LOGIN_COLORS.glow}`,
                        border: `2px solid ${LOGIN_COLORS.border}`,
                        position: 'relative',
                        overflow: 'visible'
                      }}>
                        <InventoryIcon sx={{ fontSize: 30, color: '#FFFFFF' }} /> {/* Reduced icon size */}
                        
                        {/* Rotating ring around avatar */}
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: -4,
                            left: -4,
                            right: -4,
                            bottom: -4,
                            border: `2px solid ${LOGIN_COLORS.primary}`,
                            borderRadius: '50%',
                            borderStyle: 'dashed'
                          }}
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      </Avatar>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <Typography variant="h5" sx={{ // Reduced from h4
                        fontWeight: 700, 
                        background: `linear-gradient(135deg, ${LOGIN_COLORS.primary} 0%, ${LOGIN_COLORS.secondary} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        mb: 0.5, // Reduced margin
                        textShadow: `0 0 20px ${LOGIN_COLORS.glow}`
                      }}>
                        College Inventory System
                      </Typography>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <Typography variant="body2" sx={{ // Reduced from body1
                        color: LOGIN_COLORS.textSecondary,
                        mb: 1.5, // Reduced margin
                        fontSize: '0.95rem' // Reduced font size
                      }}>
                        Advanced Inventory Management Portal
                      </Typography>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}> {/* Reduced margin */}
                        <Chip 
                          icon={<SecurityIcon />} 
                          label="Secure Access" 
                          size="small"
                          sx={{ 
                            background: `linear-gradient(135deg, ${LOGIN_COLORS.primary}20 0%, ${LOGIN_COLORS.primary}10 100%)`,
                            color: LOGIN_COLORS.primary,
                            border: `1px solid ${LOGIN_COLORS.primary}30`,
                            '& .MuiChip-icon': { color: LOGIN_COLORS.primary }
                          }}
                        />
                        <Chip 
                          icon={<AdminIcon />} 
                          label="Staff Portal" 
                          size="small"
                          sx={{ 
                            background: `linear-gradient(135deg, ${LOGIN_COLORS.secondary}20 0%, ${LOGIN_COLORS.secondary}10 100%)`,
                            color: LOGIN_COLORS.secondary,
                            border: `1px solid ${LOGIN_COLORS.secondary}30`,
                            '& .MuiChip-icon': { color: LOGIN_COLORS.secondary }
                          }}
                        />
                      </Box>
                    </motion.div>
                  </Box>
                </motion.div>

                {/* System Initialization Section - Compact */}
                {!isSystemInitialized && (
                  <motion.div
                    variants={itemVariants}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5 }}
                  >
                    <Paper sx={{ 
                      p: 2, // Reduced padding
                      mb: 2, // Reduced margin
                      background: `linear-gradient(135deg, ${LOGIN_COLORS.warning}20 0%, ${LOGIN_COLORS.warning}10 100%)`,
                      border: `1px solid ${LOGIN_COLORS.warning}40`,
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: LOGIN_COLORS.warning, fontSize: '0.9rem' }}> {/* Smaller text */}
                        🚀 System Setup Required
                      </Typography>
                      <Typography variant="caption" sx={{ mb: 1.5, color: LOGIN_COLORS.text, fontSize: '0.8rem' }}> {/* Smaller text */}
                        First time access - Initialize to create admin account.
                      </Typography>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          size="small" // Smaller button
                          onClick={initializeSystem}
                          disabled={initializingSystem}
                          startIcon={<AdminIcon />}
                          sx={{
                            background: `linear-gradient(135deg, ${LOGIN_COLORS.warning} 0%, #E65100 100%)`,
                            borderRadius: 2,
                            fontWeight: 600,
                            fontSize: '0.85rem', // Smaller font
                            '&:hover': { 
                              background: `linear-gradient(135deg, #E65100 0%, ${LOGIN_COLORS.warning} 100%)`,
                              boxShadow: `0 8px 25px ${LOGIN_COLORS.warning}40`
                            }
                          }}
                        >
                          {initializingSystem ? 'Initializing...' : 'Initialize System'}
                        </Button>
                      </motion.div>
                    </Paper>
                  </motion.div>
                )}

                {/* Loading Progress */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress 
                          sx={{ 
                            borderRadius: 1,
                            height: 6,
                            backgroundColor: LOGIN_COLORS.border,
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${LOGIN_COLORS.primary} 0%, ${LOGIN_COLORS.secondary} 100%)`
                            }
                          }} 
                        />
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Alert */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 3, 
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${LOGIN_COLORS.error}15 0%, ${LOGIN_COLORS.error}05 100%)`,
                          border: `1px solid ${LOGIN_COLORS.error}30`,
                          color: LOGIN_COLORS.error,
                          '& .MuiAlert-icon': { color: LOGIN_COLORS.error }
                        }}
                      >
                        <pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {error}
                        </pre>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Alert */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <Alert 
                        severity="success" 
                        sx={{ 
                          mb: 3, 
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${LOGIN_COLORS.success}15 0%, ${LOGIN_COLORS.success}05 100%)`,
                          border: `1px solid ${LOGIN_COLORS.success}30`,
                          color: LOGIN_COLORS.success,
                          '& .MuiAlert-icon': { color: LOGIN_COLORS.success }
                        }}
                      >
                        <pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {success}
                        </pre>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Form */}
                <motion.div variants={itemVariants}>
                  <Box component="form" onSubmit={handleSubmit}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        fullWidth
                        name="username"
                        label="Username or Email"
                        value={formData.username}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        disabled={loading}
                        autoComplete="off"
                        inputProps={{
                          autoComplete: 'new-password',
                          style: {
                            WebkitBoxShadow: '0 0 0 1000px #1A1A1A inset !important',
                            WebkitTextFillColor: '#FFFFFF !important',
                            backgroundColor: '#1A1A1A !important',
                            backgroundImage: 'none !important',
                            background: '#1A1A1A !important',
                            color: '#FFFFFF !important',
                            caretColor: '#00D4AA',
                            transition: 'background-color 5000s ease-in-out 0s !important',
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: LOGIN_COLORS.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: 'transparent !important',
                            backdropFilter: 'none !important',
                            background: 'transparent !important',
                            '&::before': {
                              background: 'transparent !important',
                            },
                            '&::after': {
                              background: 'transparent !important',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              backgroundColor: 'transparent !important',
                            },
                            '& fieldset': {
                              borderColor: 'transparent',
                              borderWidth: '1px',
                              backgroundColor: 'transparent !important',
                            },
                            '&:hover': {
                              backgroundColor: 'transparent !important',
                              '& fieldset': {
                                borderColor: `${LOGIN_COLORS.primary}40`,
                                backgroundColor: 'transparent !important',
                              }
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'transparent !important',
                              '& fieldset': {
                                borderColor: `${LOGIN_COLORS.primary}80`,
                                borderWidth: '1px',
                                boxShadow: `0 0 0 1px ${LOGIN_COLORS.primary}30`,
                                backgroundColor: 'transparent !important',
                              }
                            }
                          },
                          '& .MuiOutlinedInput-input': {
                            color: LOGIN_COLORS.text,
                            fontSize: '1rem',
                            backgroundColor: 'transparent !important',
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            },
                            '&:-webkit-autofill:hover': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            },
                            '&:-webkit-autofill:focus': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            },
                            '&:-webkit-autofill:active': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: LOGIN_COLORS.textSecondary,
                            '&.Mui-focused': {
                              color: LOGIN_COLORS.primary
                            }
                          }
                        }}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <TextField
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        disabled={loading}
                        autoComplete="off"
                        inputProps={{
                          autoComplete: 'new-password',
                          style: {
                            WebkitBoxShadow: '0 0 0 1000px #1A1A1A inset !important',
                            WebkitTextFillColor: '#FFFFFF !important',
                            backgroundColor: '#1A1A1A !important',
                            backgroundImage: 'none !important',
                            background: '#1A1A1A !important',
                            color: '#FFFFFF !important',
                            caretColor: '#00B894',
                            transition: 'background-color 5000s ease-in-out 0s !important',
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: LOGIN_COLORS.secondary }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <IconButton
                                  onClick={togglePasswordVisibility}
                                  edge="end"
                                  disabled={loading}
                                  sx={{ color: LOGIN_COLORS.textSecondary }}
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </motion.div>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: 'transparent !important',
                            backdropFilter: 'none !important',
                            background: 'transparent !important',
                            '&::before': {
                              background: 'transparent !important',
                            },
                            '&::after': {
                              background: 'transparent !important',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              backgroundColor: 'transparent !important',
                            },
                            '& fieldset': {
                              borderColor: 'transparent',
                              borderWidth: '1px',
                              backgroundColor: 'transparent !important',
                            },
                            '&:hover': {
                              backgroundColor: 'transparent !important',
                              '& fieldset': {
                                borderColor: `${LOGIN_COLORS.secondary}40`,
                                backgroundColor: 'transparent !important',
                              }
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'transparent !important',
                              '& fieldset': {
                                borderColor: `${LOGIN_COLORS.secondary}80`,
                                borderWidth: '1px',
                                boxShadow: `0 0 0 1px ${LOGIN_COLORS.secondary}30`,
                                backgroundColor: 'transparent !important',
                              }
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: LOGIN_COLORS.textSecondary,
                            '&.Mui-focused': {
                              color: LOGIN_COLORS.secondary
                            }
                          },
                          '& .MuiOutlinedInput-input': {
                            color: LOGIN_COLORS.text,
                            fontSize: '1rem',
                            backgroundColor: 'transparent !important',
                            // Hide browser's default password reveal button
                            '&::-ms-reveal': {
                              display: 'none'
                            },
                            '&::-webkit-credentials-auto-fill-button': {
                              display: 'none !important'
                            },
                            '&::-webkit-strong-password-auto-fill-button': {
                              display: 'none !important'
                            },
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            },
                            '&:-webkit-autofill:hover': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            },
                            '&:-webkit-autofill:focus': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            },
                            '&:-webkit-autofill:active': {
                              WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                              WebkitTextFillColor: `${LOGIN_COLORS.text} !important`,
                              backgroundColor: 'transparent !important',
                            }
                          }
                        }}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            disabled={loading}
                            sx={{
                              color: LOGIN_COLORS.textSecondary,
                              '&.Mui-checked': {
                                color: LOGIN_COLORS.primary,
                              }
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ color: LOGIN_COLORS.textSecondary }}>
                            Keep me signed in
                          </Typography>
                        }
                        sx={{ mt: 1, mb: 1 }} // Reduced margins
                      />
                    </motion.div>

                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || !formData.username || !formData.password}
                        startIcon={<LoginIcon />}
                        sx={{
                          mt: 1.5, // Reduced from 2
                          mb: 2, // Reduced from 3
                          py: 1.5, // Reduced from 1.8
                          borderRadius: 3,
                          fontSize: '1rem', // Slightly reduced
                          fontWeight: 600,
                          background: `linear-gradient(135deg, ${LOGIN_COLORS.primary} 0%, ${LOGIN_COLORS.secondary} 100%)`,
                          boxShadow: `0 8px 32px ${LOGIN_COLORS.glow}`,
                          border: `1px solid ${LOGIN_COLORS.primary}30`,
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${LOGIN_COLORS.secondary} 0%, ${LOGIN_COLORS.primary} 100%)`,
                            boxShadow: `0 12px 40px ${LOGIN_COLORS.glow}`,
                            transform: 'translateY(-2px)'
                          },
                          '&:disabled': {
                            background: LOGIN_COLORS.border,
                            color: LOGIN_COLORS.textSecondary
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'left 0.5s'
                          },
                          '&:hover::before': {
                            left: '100%'
                          }
                        }}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>

              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>

      {/* Enhanced CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px ${LOGIN_COLORS.primary}40;
          }
          50% { 
            box-shadow: 0 0 40px ${LOGIN_COLORS.primary}60, 0 0 60px ${LOGIN_COLORS.primary}40;
          }
        }
      `}</style>
    </Box>
  );
}

export default LoginPage;
